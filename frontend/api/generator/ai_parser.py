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
Available component types and when to use them:

- text_lines: Generic open-ended explanation, discussion, or description. Use as the fallback.
  params: { "lines": 6 }   (increase lines for longer/multi-part answers)

- checklist: A list of discrete named items the user must check off one by one.
  Use when the requirement lists specific named things (injuries, foods, methods, etc.).
  params: { "items": ["Item 1", "Item 2", ...] }

- structured_table: Comparing N items across the SAME set of attributes/columns.
  Use when requirement says "for each of the following X, describe/explain A, B, C".
  params: { "row_header": "Method", "columns": ["Col A", "Col B", "Col C"], "rows": ["Row 1", ...] }

- tracking_grid: Logging or tracking something over multiple time periods (days, weeks).
  Use when the requirement involves tracking/recording over N days or weeks.
  params: { "columns": ["Day 1", "Day 2", ...], "row_labels": ["Activity", "Calories", ...] }

- meal_planner: Planning multiple meals across multiple days.
  Use when the requirement involves planning breakfast/lunch/dinner across days.
  params: { "days": 3, "meal_types": ["Breakfast", "Lunch", "Dinner", "Dessert"] }

- shopping_list_table: A list of ingredients/items with quantity and cost columns.
  Use when the requirement asks to "create a shopping list" or "list ingredients with cost".
  params: { "meal_sections": ["Meal 1", "Meal 2", ...] }

- food_groups_table: MyPlate food group breakdown with examples, servings, serving sizes.
  Use when the requirement references MyPlate and asks for examples per food group.
  params: { "groups": ["Fruits", "Vegetables", "Grains", "Proteins", "Dairy"] }

- evaluation_form: Structured self/peer evaluation of an activity or product.
  Use when the requirement asks to "evaluate" something on specific criteria after doing it.
  params: { "meals": ["Breakfast", "Lunch", "Dinner"], "criteria": ["Presentation", "Taste"] }

- career_research_form: Structured research for a career or hobby.
  Use when the requirement asks to research a career including training, salary, goals, etc.
  params: {}

- comparison_table: Side-by-side comparison of two or more distinct named things.
  Use when the requirement says "explain the differences between X, Y, and Z".
  params: { "items": ["Item A", "Item B", "Item C"], "attributes": ["Attribute 1", "Attribute 2", ...] }
"""

SYSTEM_PROMPT = f"""
You are a formatter for educational workbooks (like Boy Scouts merit badge workbooks).

Your job is to read raw requirements text and return a structured JSON object describing the workbook.
Each requirement item must have the most appropriate "component" type chosen from the list below.

{COMPONENT_DOCS}

Rules:
1. Parse the top-level numbered requirements (1., 2., etc.) and their lettered sub-items (a., b., etc.).
2. For sub-items that have their own numbered sub-items ((1), (2), etc.), nest them under "subitems".
3. If the text contains "Resource:" or "Resources:" lines, put them in the "note" field (not in "text").
4. Return ONLY valid JSON — no markdown fences, no explanation outside the JSON.
5. The component must reflect the nature of the question, not just default to text_lines.
6. For "discuss" or "explain" with NO specific list of items → text_lines.
7. When in doubt between two types, choose the more structured one.

Output JSON structure:
{{
  "meta": {{
    "title": "<Badge/Subject Name>",
    "subtitle": "Merit Badge Workbook",
    "description": "<any preamble/notes before requirement 1>",
    "revision_note": "<any revision/date note, or empty string>",
    "participant_fields": [
      {{"label": "Scout's Name", "width": "large"}},
      {{"label": "Unit", "width": "large"}},
      {{"label": "Date Started", "width": "medium"}},
      {{"label": "Counselor's Name", "width": "large"}},
      {{"label": "Phone No.", "width": "large"}},
      {{"label": "Email", "width": "large"}}
    ],
    "footer_contact": "",
    "copyright": ""
  }},
  "requirements": [
    {{
      "id": "1",
      "text": "...",
      "note": "...",
      "component": "text_lines",
      "component_params": {{"lines": 6}},
      "subitems": [
        {{
          "id": "a",
          "text": "...",
          "note": "Resource: ...",
          "component": "checklist",
          "component_params": {{"items": ["Burns", "Cuts", "Choking"]}},
          "subitems": []
        }}
      ]
    }}
  ],
  "appendices": []
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
