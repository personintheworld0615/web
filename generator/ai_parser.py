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

# ── Component type descriptions for the prompt ────────────────────────────────
COMPONENT_DOCS = """
Available component types:

- text_lines: Generic open-ended area. AI determines 'lines' (2-20) based on verb (List=3, Explain=6, Discuss=10).
  params: { "lines": int }

- checklist: A list of items to check off.
  params: { "items": ["Item 1", ...] }

- smart_table: A universal table component.
  Use for comparisons, tracking, logs, or multi-column data.
  params: { 
    "headers": ["Col 1", "Col 2", ...], 
    "rows": ["Row 1", ...], 
    "col_types": ["text", "checkbox", "rating"], // default "text"
    "row_height": 24 
  }

- drawing_area: A boxed space for sketches, maps, or diagrams.
  params: { "label": "Sketch your plan here", "height_inches": 3.0 }

- career_form: Structured research form for careers.
  params: {}
"""

SYSTEM_PROMPT = f"""
You are a master educational designer. Your goal is to transform merit badge requirements into a high-end, structured, and visually logical workbook.

Rules:
1. DESIGN SENSE: Analyze the badge's subject and define a 'design' block:
   - theme_color: A hex code representing the subject (e.g., #D32F2F for Safety, #2E7D32 for Nature, #0277BD for Tech).
   - mood: One of ['standard', 'nature', 'safety', 'tech', 'academic'].
2. COMPONENT SELECTION:
   - Don't just use text_lines. If a requirement mentions "compare", "list features of", "track for X days", or "for each of the following", use a `smart_table`.
   - If it mentions "draw", "sketch", "floor plan", or "map", use a `drawing_area`.
3. RESOURCE EXTRACTION:
   - Extract "Resource:" lines. Keep the text and the URL separate if possible.
4. STRUCTURE:
   - Maintain the numbering (1., a., (1)). Nest (1) under subitems.
5. AUTO-POPULATE:
   - If a requirement lists options (like 21 emergency situations), include all of them in the `rows` or `items` of the chosen component.

Output JSON structure:
{{
  "meta": {{
    "title": "Badge Name",
    "subtitle": "Merit Badge Workbook",
    "design": {{
      "theme_color": "#hex",
      "mood": "mood_name",
      "icon": "icon_name" 
    }},
    "description": "Preamble text...",
    "participant_fields": [...]
  }},
  "requirements": [
    {{
      "id": "1",
      "text": "...",
      "note": "...",
      "component": "smart_table",
      "component_params": {{ ... }},
      "subitems": []
    }}
  ]
}}
"""


def parse_requirements(raw_text: str) -> dict:
    api_key = os.environ["GEMINI_API_KEY"]
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": SYSTEM_PROMPT + "\n\n---\nRAW REQUIREMENTS TEXT:\n\n" + raw_text}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 8192}
    }
    import requests as req_lib
    resp = req_lib.post(url, json=payload)
    resp.raise_for_status()
    result = resp.json()
    raw = result["candidates"][0]["content"]["parts"][0]["text"].strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
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
