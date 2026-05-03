#!/usr/bin/env python3
"""
AI Parser — uses Gemini to convert raw requirements text into structured workbook JSON.
"""

import os, json, re, sys
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv(Path(__file__).parent / ".env")
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# ── Component type descriptions (Condensed) ───────────────────────────────────
COMPONENT_DOCS = """
- text_lines: params { "lines": 6 }
- checklist: params { "items": ["A", "B", ...] }
- structured_table: params { "row_header": "X", "columns": ["A", "B"], "rows": ["1", "2"] }
- comparison_table: params { "items": ["A", "B"], "attributes": ["X", "Y"] }
- career_research_form: params {}
"""

SYSTEM_PROMPT = f"""
You are a workbook formatter. Convert requirements text to JSON.
{COMPONENT_DOCS}
JSON structure: {{
  "meta": {{
    "title": "...",
    "subtitle": "Merit Badge Workbook",
    "participant_fields": [
      {{"label": "Scout's Name", "width": "large"}},
      {{"label": "Unit", "width": "large"}},
      {{"label": "Counselor", "width": "large"}}
    ]
  }},
  "requirements": [ {{ "id": "...", "text": "...", "note": "...", "component": "...", "component_params": {{...}}, "subitems": [...] }} ]
}}
Rules: Use IDs like 1, a, (1). Put resource URLs in 'note'. 
CRITICAL: Be concise. Omit resource URLs in 'note' if more than 2. 
NO extra whitespace in JSON.
"""


def parse_requirements(raw_text: str) -> dict:
    api_key = os.environ["GEMINI_API_KEY"]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    
    # Instruct Gemini to be concise to stay within token limits
    optimized_prompt = SYSTEM_PROMPT + "\n\nCRITICAL: The output must be valid JSON and NOT truncated. For long merit badges, follow these rules to save tokens:\n1. Be extremely brief in the 'text' fields. Summarize if needed.\n2. In the 'note' field, only include the most important resource URL, not all of them.\n3. DO NOT include any extra whitespace or newlines in the JSON output."

    payload = {
        "contents": [{"parts": [{"text": optimized_prompt + "\n\n---\nRAW REQUIREMENTS TEXT:\n\n" + raw_text}]}],
        "generationConfig": {
            "temperature": 0.1, 
            "maxOutputTokens": 8192,
            "response_mime_type": "application/json"
        }
    }
    import requests as req_lib
    resp = req_lib.post(url, json=payload, timeout=120)
    resp.raise_for_status()
    result = resp.json()
    raw = result["candidates"][0]["content"]["parts"][0]["text"].strip()
    return json.loads(raw)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 ai_parser.py <requirements.txt> [output.json]")
        sys.exit(1)
    text = Path(sys.argv[1]).read_text()
    print("🤖  Sending to Gemini for analysis...")
    result = parse_requirements(text)
    out = sys.argv[2] if len(sys.argv) >= 3 else sys.argv[1].replace(".txt", "-parsed.json")
    Path(out).write_text(json.dumps(result, indent=2))
    print(f"✅  Parsed JSON saved to: {out}")
