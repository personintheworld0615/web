#!/usr/bin/env python3
"""Workbook PDF Generator with Smart Components. Usage: python3 generate.py <parsed.json> [output.pdf]"""
import json, sys, os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
    Spacer, Table, TableStyle, HRFlowable, PageBreak, Image, Flowable)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

W, H = letter
MARGIN = 0.65 * inch
BL = colors.HexColor("#e8eef8"); BB = colors.HexColor("#a0b0cc")
GH = colors.HexColor("#c0c8d8"); GS = colors.HexColor("#dde3ef")
GX = colors.HexColor("#b0b8c8"); GR = colors.HexColor("#f5f5f5")
GT = colors.HexColor("#eaeef5")

def S(name, **kw):
    fontSize = kw.get("fontSize", 10)
    defaults = dict(fontName="Helvetica", fontSize=fontSize, leading=fontSize*1.25, spaceAfter=2)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)

STYLES = {
    "title":    S("title",    fontName="Helvetica-Bold", fontSize=42, alignment=TA_CENTER, spaceAfter=4),
    "subtitle": S("subtitle", fontSize=20, alignment=TA_CENTER, spaceAfter=12),
    "desc":     S("desc",     fontSize=9, leading=13, alignment=TA_CENTER),
    "desc_bold":S("desc_bold",fontName="Helvetica-Bold", fontSize=9, leading=13, alignment=TA_CENTER),
    "revision": S("revision", fontSize=9, alignment=TA_CENTER),
    "field_lbl":S("field_lbl",fontSize=9, leading=13),
    "footer_c": S("footer_c", fontSize=8.5, leading=12, alignment=TA_CENTER),
    "req":      S("req",      fontName="Helvetica-Bold", fontSize=10.5, leading=14, spaceAfter=3),
    "sub":      S("sub",      fontSize=10, leading=13, leftIndent=18),
    "subsub":   S("subsub",   fontSize=10, leading=13, leftIndent=36),
    "note":     S("note",     fontSize=8.5, leading=11, leftIndent=22, textColor=colors.HexColor("#555")),
    "small":    S("small",    fontSize=8.5, leading=11),
    "apxtitle": S("apxtitle", fontName="Helvetica-Bold", fontSize=12, spaceAfter=4),
    "apxnote":  S("apxnote",  fontSize=8.5, leading=11, textColor=colors.HexColor("#555")),
}

def usable_width(indent=0): return W - 2*MARGIN - indent

# ── Interactive Form Support ──────────────────────────────────────────────────
class FillableField(Flowable):
    _count = 0
    def __init__(self, width, height, name=None, fillColor=colors.HexColor("#e8eef8")):
        Flowable.__init__(self)
        self.width = width
        self.height = height
        self.fillColor = fillColor
        FillableField._count += 1
        self.name = name or f"field_{FillableField._count}"

    def draw(self):
        # Coordinates (0,0) are relative to the cell's origin in Platypus
        self.canv.acroForm.textfield(
            name=self.name,
            tooltip=self.name,
            x=0, y=0,
            width=self.width, height=self.height,
            borderWidth=0, 
            fillColor=self.fillColor,
            fontSize=9
        )

# ── Theme Management ──────────────────────────────────────────────────────────
class Theme:
    def __init__(self, design):
        self.primary = colors.HexColor(design.get("theme_color", "#a0b0cc"))
        self.light = colors.HexColor(self._adjust_hex(design.get("theme_color", "#a0b0cc"), 0.9))
        self.grid = colors.HexColor(self._adjust_hex(design.get("theme_color", "#a0b0cc"), 0.7))
        self.mood = design.get("mood", "standard")
        
    def _adjust_hex(self, hex_color, factor):
        # Very basic hex tinting for backgrounds
        hex_color = hex_color.lstrip('#')
        rgb = [int(hex_color[i:i+2], 16) for i in (0, 2, 4)]
        new_rgb = [int(min(255, val + (255 - val) * factor)) for val in rgb]
        return '#%02x%02x%02x' % tuple(new_rgb)

def get_styles(theme):
    base_color = theme.primary
    return {
        "title":    S("title",    fontName="Helvetica-Bold", fontSize=38, alignment=TA_CENTER, spaceAfter=4, textColor=base_color),
        "subtitle": S("subtitle", fontSize=18, alignment=TA_CENTER, spaceAfter=12, textColor=colors.gray),
        "desc":     S("desc",     fontSize=9, leading=13, alignment=TA_CENTER),
        "desc_bold":S("desc_bold",fontName="Helvetica-Bold", fontSize=9, leading=13, alignment=TA_CENTER),
        "req":      S("req",      fontName="Helvetica-Bold", fontSize=11, leading=14, spaceAfter=4, textColor=base_color),
        "sub":      S("sub",      fontSize=10, leading=13, leftIndent=18),
        "subsub":   S("subsub",   fontSize=10, leading=13, leftIndent=36),
        "note":     S("note",     fontSize=8.5, leading=11, leftIndent=22, textColor=colors.gray),
        "resource": S("resource", fontSize=8.5, leading=11, leftIndent=22, textColor=colors.blue),
        "field_lbl":S("field_lbl",fontSize=9, leading=13),
    }

# ── Universal Components ───────────────────────────────────────────────────────
def render_smart_table(params, theme):
    headers = params.get("headers", ["Response"])
    rows = params.get("rows", ["Item 1"])
    col_types = params.get("col_types", ["text"] * len(headers))
    
    # Smart column balancing: Give labels 35% and split remaining 65% among headers
    total_w = usable_width()
    label_w = total_w * 0.35
    data_col_w = (total_w - label_w) / len(headers)
    col_widths = [label_w] + [data_col_w] * len(headers)
    
    data = [[""] + headers]
    
    for r in rows:
        # Use a style with proper leading to prevent overlap when wrapping
        label_style = S("cell_label", fontSize=8.5, leading=10)
        row_cells = [Paragraph(f"<b>{r}</b>", label_style)]
        for i, ct in enumerate(col_types):
            if ct == "checkbox":
                row_cells.append("☐")
            elif ct == "rating":
                row_cells.append("◯ ◯ ◯ ◯ ◯")
            else:
                # Calculate height based on rows or default to a reasonable minimum
                h = params.get("row_height", 28)
                row_cells.append(FillableField(data_col_w, h, fillColor=theme.light))
        data.append(row_cells)
        
    # rowHeights=None allows dynamic height calculation based on content
    t = Table(data, colWidths=col_widths, rowHeights=None)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), theme.primary),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, theme.grid),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return [t, Spacer(1, 6)]

def render_drawing_area(params, theme):
    label = params.get("label", "Drawing/Sketch Area")
    h = params.get("height_inches", 2.5) * inch
    w = usable_width()
    
    data = [[Paragraph(f"<i>{label}</i>", S("draw_lbl", fontSize=8, textColor=colors.gray))]]
    t = Table(data, colWidths=[w], rowHeights=[h])
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, theme.grid),
        ("BACKGROUND", (0, 0), (-1, -1), theme.light),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return [t, Spacer(1, 8)]

def render_checklist(params, theme):
    items = params.get("items", [])
    if not items: return [answer_box(4, theme)]
    data = [["☐", Paragraph(item, S("chk", fontSize=9.5))] for item in items]
    t = Table(data, colWidths=[0.25*inch, usable_width(0.3*inch)])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LINEBELOW", (0, 1), (-1, -1), 0.4, theme.grid),
    ]))
    return [t, Spacer(1, 6)]

def answer_box(lines, theme, indent=18):
    w = usable_width(indent/72*inch + 0.05*inch)
    data = [[FillableField(w, 18, fillColor=theme.light)] for _ in range(lines)]
    t = Table(data, colWidths=[w], rowHeights=[18]*lines)
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.8, theme.grid),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, theme.grid),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return t

# ── Dispatcher ───────────────────────────────────────────────────────────────
def build_item(item, theme, styles, level=0):
    indent = [0, 18, 36]
    st = [styles["req"], styles["sub"], styles["subsub"]][min(level, 2)]
    label = item["id"]
    if level == 2: label = f"({label})"
    
    text = item["text"]
    # Hyperlink processing
    import re
    urls = re.findall(r'(https?://\S+)', text)
    for url in urls:
        clean_url = url.strip('.,()')
        text = text.replace(url, f'<a href="{clean_url}" color="blue">{clean_url}</a>')

    out = [Paragraph(f"<b>{label}.</b> {text}", st)]
    
    if item.get("note"):
        note_text = item["note"]
        if "http" in note_text:
            note_urls = re.findall(r'(https?://\S+)', note_text)
            for url in note_urls:
                clean_url = url.strip('.,()')
                note_text = note_text.replace(url, f'<a href="{clean_url}" color="blue">{clean_url}</a>')
        out.append(Paragraph(note_text, styles["note"]))
        
    comp = item.get("component", "text_lines")
    params = item.get("component_params", {"lines": 6})
    
    if comp == "smart_table":
        out += render_smart_table(params, theme)
    elif comp == "drawing_area":
        out += render_drawing_area(params, theme)
    elif comp == "checklist":
        out += render_checklist(params, theme)
    elif comp == "career_form":
        # Simplified universal career form
        out += render_smart_table({
            "headers": ["Details"],
            "rows": ["Career Title", "Education", "Salary", "Prospects", "Why this?"],
            "row_height": 32
        }, theme)
    else:
        lines = params.get("lines", 6)
        out += [answer_box(lines, theme), Spacer(1, 6)]
        
    for sub in item.get("subitems", []):
        out += build_item(sub, theme, styles, level+1)
    return out

# ── Header / Footer ────────────────────────────────────────────────────────────
def header_footer(title):
    def _hf(canvas, doc):
        if doc.page == 1: return
        canvas.saveState()
        canvas.setFont("Helvetica-Bold", 9)
        canvas.drawString(MARGIN, H-0.42*inch, title)
        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(W-MARGIN, H-0.42*inch, "Scout's Name: _______________________________")
        canvas.setFont("Helvetica", 8.5)
        canvas.drawString(MARGIN, 0.45*inch, f"{title} - Merit Badge Workbook")
        canvas.drawRightString(W-MARGIN, 0.45*inch, f"Page {doc.page}")
        canvas.restoreState()
    return _hf

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    if len(sys.argv)<2: 
        print("Usage: python3 generate.py <parsed.json> [out.pdf]")
        sys.exit(1)
        
    data = json.load(open(sys.argv[1]))
    meta = data["meta"]
    title = meta["title"]
    design = meta.get("design", {})
    
    # Initialize dynamic theme and styles
    theme = Theme(design)
    styles = get_styles(theme)
    
    out = sys.argv[2] if len(sys.argv)>=3 else str(Path(sys.argv[1]).parent/f"{title.lower().replace(' ','-')}-workbook.pdf")

    hf = header_footer(title)
    frame = Frame(MARGIN, 0.6*inch, W-2*MARGIN, H-1.15*inch, id="main")
    doc = BaseDocTemplate(out, pagesize=letter, leftMargin=MARGIN, rightMargin=MARGIN, topMargin=0.6*inch, bottomMargin=0.6*inch)
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=hf)])

    story = []
    # ── Cover page ──────────────────────────────────────────────────────────────
    story += [Spacer(1, 12), Paragraph(title, styles["title"]),
              Paragraph(meta["subtitle"], styles["subtitle"]),
              HRFlowable(width="100%", thickness=2, color=theme.primary), Spacer(1, 12)]

    desc_lines = [l.strip() for l in meta["description"].split("\n") if l.strip()]
    BOLD_TRIGGERS = ["counselors may not require", "no one may add", "NOTE:"]
    for line in desc_lines:
        is_bold = any(t in line.lower() for t in BOLD_TRIGGERS)
        story.append(Paragraph(line, styles["desc_bold"] if is_bold else styles["desc"]))

    story += [Spacer(1, 12), HRFlowable(width="100%", thickness=2, color=theme.primary)]
    
    # Participant fields
    fields = meta["participant_fields"]
    def field_row(f_list):
        col_w = (W - 2*MARGIN) / len(f_list)
        row_data = []
        for f in f_list:
            label = f["label"] if isinstance(f, dict) else f
            row_data.append(Paragraph(f"<b>{label}:</b>", styles["field_lbl"]))
        t = Table([row_data], colWidths=[col_w]*len(f_list), rowHeights=[14])
        t.setStyle(TableStyle([("LEFTPADDING",(0,0),(-1,-1),0)]))
        return t
        
    def underline_row(f_list):
        col_w = (W - 2*MARGIN) / len(f_list)
        data = [[""]*len(f_list)]
        t = Table(data, colWidths=[col_w]*len(f_list), rowHeights=[16])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), theme.light),
            ("LINEBELOW", (0, 0), (-1, -1), 1, theme.grid),
            ("LEFTPADDING", (0, 0), (-1, -1), 4)
        ]))
        return t

    story += [Spacer(1, 12), field_row(fields[:3]), underline_row(fields[:3]),
              Spacer(1, 8), field_row(fields[3:6]), underline_row(fields[3:6])]
              
    if len(fields) > 6:
        story += [Spacer(1, 8), field_row(fields[6:]), underline_row(fields[6:])]

    story += [Spacer(1, 12), HRFlowable(width="100%", thickness=2, color=theme.primary)]

    # Requirements
    story.append(PageBreak())
    for req in data["requirements"]:
        story += build_item(req, theme, styles, level=0)

    doc.build(story)
    print(f"✅ Workbook generated: {out}")

if __name__ == "__main__":
    main()
