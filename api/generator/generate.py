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
    def __init__(self, width, height, name=None):
        Flowable.__init__(self)
        self.width = width
        self.height = height
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
            fillColor=colors.HexColor("#e8eef8"),
            fontSize=9
        )

# ── Base components ────────────────────────────────────────────────────────────
def answer_box(lines, indent=18):
    w = usable_width(indent/72*inch + 0.05*inch)
    # We use FillableField inside the table cells
    data = [[FillableField(w, 18)] for _ in range(lines)]
    t = Table(data, colWidths=[w], rowHeights=[18]*lines)
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),BL),("BOX",(0,0),(-1,-1),0.8,BB),
        ("LINEBELOW",(0,0),(-1,-2),0.5,BB), ("LEFTPADDING",(0,0),(-1,-1),0), ("BOTTOMPADDING",(0,0),(-1,-1),0)]))
    return t

# ── Smart Components ───────────────────────────────────────────────────────────
def render_checklist(params):
    items = params.get("items", [])
    if not items: return [answer_box(4)]
    data = [["☐", item] for item in items]
    t = Table(data, colWidths=[0.25*inch, usable_width(0.3*inch)], rowHeights=[20]*len(data))
    t.setStyle(TableStyle([("FONTSIZE",(0,0),(-1,-1),9.5),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LINEBELOW",(0,0),(-1,-1),0.4,colors.HexColor("#cccccc")),
        ("LEFTPADDING",(0,0),(-1,-1),4),("RIGHTPADDING",(0,0),(-1,-1),4)]))
    return [t, Spacer(1,4)]

def render_structured_table(params):
    cols = params.get("columns", ["Response"])
    rows = params.get("rows", [])
    row_header = params.get("row_header", "Item")
    if not rows: rows = [f"Item {i+1}" for i in range(params.get("num_rows", 5))]
    col_w = (usable_width()) / (len(cols)+1)
    data = [[row_header] + cols]
    for r in rows:
        data.append([r] + [FillableField(col_w, 28) for _ in cols])
    heights = [18] + [28]*len(rows)
    t = Table(data, colWidths=[col_w]*(len(cols)+1), rowHeights=heights)
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),GH),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,-1),8.5),("GRID",(0,0),(-1,-1),0.8,colors.black),
        ("BACKGROUND",(0,1),(0,-1),GR),("FONTNAME",(0,1),(0,-1),"Helvetica-Bold"),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),("ALIGN",(0,0),(0,-1),"LEFT"),
        ("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,1),(-1,-1),0), ("BOTTOMPADDING",(0,1),(-1,-1),0)]))
    return [t, Spacer(1,4)]

def render_tracking_grid(params):
    cols = params.get("columns", [f"Day {i+1}" for i in range(5)])
    row_labels = params.get("row_labels", ["Activity", "Calories"])
    label_w = 1.3*inch
    col_w = (usable_width() - label_w) / len(cols)
    data = [[""] + cols]
    for r in row_labels:
        data.append([r] + [FillableField(col_w, 24) for _ in cols])
    heights = [18] + [24]*len(row_labels)
    t = Table(data, colWidths=[label_w]+[col_w]*len(cols), rowHeights=heights)
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),GH),("BACKGROUND",(0,1),(0,-1),GS),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTNAME",(0,1),(0,-1),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,-1),8.5),("GRID",(0,0),(-1,-1),0.8,colors.black),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),("ALIGN",(0,0),(0,-1),"LEFT"),
        ("LEFTPADDING",(1,1),(-1,-1),0), ("BOTTOMPADDING",(1,1),(-1,-1),0)]))
    return [t, Spacer(1,4)]

def render_meal_planner(params):
    days = params.get("days", 3)
    meal_types = params.get("meal_types", ["Breakfast","Lunch","Dinner"])
    day_w = usable_width() / (days+1)
    data = [["Meal"] + [f"Day {i+1}" for i in range(days)]]
    for m in meal_types:
        data.append([m] + [FillableField(day_w, 40) for _ in range(days)])
    heights = [18]+[40]*len(meal_types)
    t = Table(data, colWidths=[day_w]*(days+1), rowHeights=heights)
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),GH),("BACKGROUND",(0,1),(0,-1),GS),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTNAME",(0,1),(0,-1),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,-1),8.5),("GRID",(0,0),(-1,-1),0.8,colors.black),
        ("ALIGN",(1,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"TOP"),
        ("LEFTPADDING",(1,1),(-1,-1),0), ("BOTTOMPADDING",(1,1),(-1,-1),0)]))
    return [t, Spacer(1,4)]

def render_shopping_list(params):
    sections = params.get("meal_sections", ["Meal"])
    items = []
    for sec in sections:
        header_data = [[sec, "", "", ""]]
        ht = Table(header_data, colWidths=[usable_width()], rowHeights=[18])
        ht.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),GX),("FONTNAME",(0,0),(-1,-1),"Helvetica-Bold"),
            ("FONTSIZE",(0,0),(-1,-1),9),("BOX",(0,0),(-1,-1),0.8,colors.black)]))
        items.append(ht)
        col_w = [2.5*inch, 1.2*inch, 0.8*inch, 0.8*inch]
        row_data = [["Ingredient", "Amount", "Unit", "Cost"]]
        for _ in range(6):
            row_data.append([FillableField(col_w[i], 20) for i in range(4)])
        t = Table(row_data, colWidths=col_w, rowHeights=[18]+[20]*6)
        t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),GH),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
            ("FONTSIZE",(0,0),(-1,-1),8.5),("GRID",(0,0),(-1,-1),0.8,colors.black),
            ("ALIGN",(1,0),(-1,-1),"CENTER"), ("LEFTPADDING",(0,1),(-1,-1),0), ("BOTTOMPADDING",(0,1),(-1,-1),0)]))
        items.append(t)
        items.append(Spacer(1,4))
    return items

def render_food_groups_table(params):
    groups = params.get("groups", ["Fruits","Vegetables","Grains","Proteins","Dairy"])
    cols = ["Food Group","Example 1","Example 2","Example 3","Example 4","Example 5","Daily Servings","Serving Size"]
    col_w = [1.0*inch] + [0.7*inch]*5 + [0.75*inch,0.75*inch]
    data = [cols]
    for g in groups:
        data.append([g] + [FillableField(col_w[i+1], 28) for i in range(7)])
    heights = [20] + [28]*len(groups)
    t = Table(data, colWidths=col_w, rowHeights=heights)
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),GH),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
        ("BACKGROUND",(0,1),(0,-1),GS),("FONTNAME",(0,1),(0,-1),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,-1),7.5),("GRID",(0,0),(-1,-1),0.8,colors.black),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),("ALIGN",(0,0),(0,-1),"LEFT"),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LEFTPADDING",(1,1),(-1,-1),0), ("BOTTOMPADDING",(1,1),(-1,-1),0)]))
    return [t, Spacer(1,4)]

def render_evaluation_form(params):
    meals = params.get("meals", ["Meal 1","Meal 2"])
    criteria = params.get("criteria", ["Presentation","Taste","Overall"])
    items = []
    for meal in meals:
        label_w = 1.2*inch; rating_w = 0.9*inch; notes_w = usable_width()-label_w-rating_w*2
        header = [[meal,"Peer Rating","Self Rating","Notes/Adjustments"]]
        rows = []
        for c in criteria:
            rows.append([c, FillableField(rating_w, 24), FillableField(rating_w, 24), FillableField(notes_w, 24)])
        data = header + rows
        heights = [18]+[24]*len(criteria)
        t = Table(data, colWidths=[label_w,rating_w,rating_w,notes_w], rowHeights=heights)
        t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),GX),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
            ("BACKGROUND",(0,1),(0,-1),GS),("FONTNAME",(0,1),(0,-1),"Helvetica-Bold"),
            ("FONTSIZE",(0,0),(-1,-1),8.5),("GRID",(0,0),(-1,-1),0.8,colors.black),
            ("ALIGN",(1,0),(-1,-1),"CENTER"), ("LEFTPADDING",(1,1),(-1,-1),0), ("BOTTOMPADDING",(1,1),(-1,-1),0)]))
        items += [t, Spacer(1,4)]
    items.append(Paragraph("Counselor Discussion Notes:", STYLES["note"]))
    items.append(answer_box(4))
    return items

def render_career_research(params):
    fields = [("Career Title",""),("Industry / Field",""),("Required Education",""),
              ("Certifications / Licenses",""),("Typical Starting Salary",""),
              ("Advancement Opportunities",""),("Job Outlook / Demand",""),("Interested? Why?","")]
    label_w = 2.0*inch; val_w = usable_width()-label_w
    data = [[f, FillableField(val_w, 28)] for f, _ in fields]
    t = Table(data, colWidths=[label_w, val_w], rowHeights=[28]*len(data))
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(0,-1),GS),("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,-1),9),("GRID",(0,0),(-1,-1),0.8,colors.black),
        ("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(1,0),(-1,-1),0), ("BOTTOMPADDING",(1,0),(-1,-1),0)]))
    return [t, Spacer(1,4), Paragraph("Additional Discussion Notes:", STYLES["note"]), answer_box(4)]

def render_comparison_table(params):
    items_list = params.get("items", ["Option A","Option B"])
    attrs = params.get("attributes", ["Description","Pros","Cons","When to Use"])
    label_w = 1.3*inch
    col_w = (usable_width()-label_w)/len(items_list)
    data = [[""] + items_list]
    for a in attrs:
        data.append([a] + [FillableField(col_w, 32) for _ in items_list])
    heights = [18]+[32]*len(attrs)
    t = Table(data, colWidths=[label_w]+[col_w]*len(items_list), rowHeights=heights)
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),GH),("BACKGROUND",(0,1),(0,-1),GS),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTNAME",(0,1),(0,-1),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,-1),8.5),("GRID",(0,0),(-1,-1),0.8,colors.black),
        ("ALIGN",(1,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"TOP"),
        ("LEFTPADDING",(1,1),(-1,-1),0), ("BOTTOMPADDING",(1,1),(-1,-1),0)]))
    return [t, Spacer(1,4)]

# ── Component dispatcher ───────────────────────────────────────────────────────
def render_component(component, params):
    dispatch = {
        "checklist":        render_checklist,
        "structured_table": render_structured_table,
        "tracking_grid":    render_tracking_grid,
        "meal_planner":     render_meal_planner,
        "shopping_list_table": render_shopping_list,
        "food_groups_table":render_food_groups_table,
        "evaluation_form":  render_evaluation_form,
        "career_research_form": lambda p: render_career_research(p),
        "comparison_table": render_comparison_table,
    }
    if component in dispatch:
        return dispatch[component](params)
    # Default: text_lines
    lines = params.get("lines", 6)
    return [answer_box(lines), Spacer(1,4)]

# ── Requirement builder ────────────────────────────────────────────────────────
def build_item(item, level=0):
    styles = [STYLES["req"], STYLES["sub"], STYLES["subsub"]]
    indent = [0, 18, 36]
    st = styles[min(level, 2)]
    ind = indent[min(level, 2)]
    label = item["id"]
    if level == 2: label = f"({label})"
    cb = "☐ " if item.get("type") == "checkbox" else ""
    out = [Paragraph(f"{cb}<b>{label}.</b> {item['text']}", st)]
    if item.get("note"):
        out.append(Paragraph(f"<i>{item['note']}</i>", STYLES["note"]))
    comp = item.get("component", "text_lines")
    params = item.get("component_params", {"lines": 6})
    out += render_component(comp, params)
    for sub in item.get("subitems", []):
        out += build_item(sub, level+1)
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

# ── Budget & Appendix helpers (kept from original) ─────────────────────────────
def budget_table(app):
    months=app["months"]; ir=app["income_rows"]; er=app["expense_rows"]
    lw=1.55*inch; cw=(W-2*MARGIN-lw)/(months*3)
    h1=["Income Sources"]+[f"Month {m}" for m in range(1,months+1) for _ in range(3)]
    h2=[""] +["Budget","Actual","Over/Under"]*months
    data=[h1,h2]+[[r]+[""]*months*3 for r in ir]+[["Income Totals"]+[""]*months*3]
    data+=[["Expenses"]+[""]*months*3]+[[r]+[""]*months*3 for r in er]
    data+=[["Expense Totals"]+[""]*months*3,["Income − Expenses"]+[""]*months*3]
    ie=2+len(ir); es=ie+2; ee=es+len(er)
    t=Table(data,colWidths=[lw]+[cw]*months*3,rowHeights=[16,14]+[16]*(len(data)-2))
    style=[("FONTSIZE",(0,0),(-1,-1),8.5),("GRID",(0,0),(-1,-1),0.8,colors.black),
        *[("SPAN",(1+i*3,0),(3+i*3,0)) for i in range(months)],
        ("BACKGROUND",(0,0),(-1,0),GH),("BACKGROUND",(0,1),(-1,1),GS),
        ("FONTNAME",(0,0),(-1,1),"Helvetica-Bold"),("ALIGN",(0,0),(-1,-1),"CENTER"),
        ("ALIGN",(0,0),(0,-1),"LEFT"),("BACKGROUND",(0,0),(0,-1),GR),
        ("BACKGROUND",(0,ie),(-1,ie),GT),("FONTNAME",(0,ie),(-1,ie),"Helvetica-Bold"),
        ("BACKGROUND",(0,ie+1),(-1,ie+1),GX),("FONTNAME",(0,ie+1),(-1,ie+1),"Helvetica-Bold"),
        ("SPAN",(0,ie+1),(-1,ie+1)),
        ("BACKGROUND",(0,ee),(-1,ee),GT),("FONTNAME",(0,ee),(-1,ee),"Helvetica-Bold"),
        ("BACKGROUND",(0,ee+1),(-1,ee+1),GT),("FONTNAME",(0,ee+1),(-1,ee+1),"Helvetica-Bold")]
    t.setStyle(TableStyle(style))
    return t

# ── Main ───────────────────────────────────────────────────────────────────────
def build_pdf_to_stream(data, stream):
    meta=data["meta"]; title=meta["title"]
    
    hf=header_footer(title)
    frame=Frame(MARGIN,0.6*inch,W-2*MARGIN,H-1.15*inch,id="main")
    doc=BaseDocTemplate(stream,pagesize=letter,leftMargin=MARGIN,rightMargin=MARGIN,topMargin=0.6*inch,bottomMargin=0.6*inch)
    doc.addPageTemplates([PageTemplate(id="main",frames=[frame],onPage=hf)])

    story=[]
    # ── Cover page ──────────────────────────────────────────────────────────────
    story+=[Spacer(1,12), Paragraph(title, STYLES["title"]),
             Paragraph(meta["subtitle"], STYLES["subtitle"]),
             HRFlowable(width="100%", thickness=2, color=colors.black), Spacer(1,12)]

    # Description block — centred, with one bold line
    desc_lines = [l.strip() for l in meta["description"].split("\n") if l.strip()]
    BOLD_TRIGGERS = ["counselors may not require", "no one may add", "NOTE:"]
    for line in desc_lines:
        is_bold = any(t in line.lower() for t in BOLD_TRIGGERS)
        story.append(Paragraph(line, STYLES["desc_bold"] if is_bold else STYLES["desc"]))

    story+=[Spacer(1,12), HRFlowable(width="100%", thickness=2, color=colors.black)]
    if meta.get("revision_note"):
        rev = meta["revision_note"]
        if "The requirements were last revised" not in rev:
            story.append(Paragraph(rev, STYLES["revision"]))
            story+=[HRFlowable(width="100%", thickness=2, color=colors.black)]
    
    story+=[Spacer(1,12)]

    # Participant fields — inline underline style
    fields = meta["participant_fields"]
    def field_row(f_list):
        col_w = (W - 2*MARGIN) / len(f_list)
        data = [[Paragraph(f"<b>{f['label']}:</b>", STYLES["field_lbl"]) for f in f_list]]
        t = Table(data, colWidths=[col_w]*len(f_list), rowHeights=[14])
        t.setStyle(TableStyle([("FONTSIZE",(0,0),(-1,-1),9),("LEFTPADDING",(0,0),(-1,-1),0)]))
        return t
    def underline_row(f_list):
        col_w = (W - 2*MARGIN) / len(f_list)
        data = [[""]*len(f_list)]
        t = Table(data, colWidths=[col_w]*len(f_list), rowHeights=[16])
        t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),BL),
            ("LINEBELOW",(0,0),(-1,-1),1,colors.HexColor("#888")),
            ("LEFTPADDING",(0,0),(-1,-1),4)]))
        return t

    story += [field_row(fields[:3]), underline_row(fields[:3]),
              Spacer(1,8),
              field_row(fields[3:]), underline_row(fields[3:]),
              Spacer(1,12),
              HRFlowable(width="100%", thickness=2, color=colors.black)]

    # Requirements
    story.append(PageBreak())
    for req in data["requirements"]:
        story+=build_item(req, level=0)

    # Appendices
    for app in data.get("appendices",[]):
        story+=[PageBreak(),Paragraph(app["title"],STYLES["apxtitle"]),
            HRFlowable(width="100%",thickness=1.5,color=colors.black),Spacer(1,4)]
        if app["type"]=="budget_table":
            story.append(budget_table(app))
            if app.get("note"): story.append(Paragraph(f"Note: {app['note']}",STYLES["apxnote"]))

    doc.build(story)


def main():
    if len(sys.argv)<2: print("Usage: python3 generate.py <parsed.json> [out.pdf]"); sys.exit(1)
    data=json.load(open(sys.argv[1]))
    out=sys.argv[2] if len(sys.argv)>=3 else str(Path(sys.argv[1]).parent/f"{data['meta']['title'].lower().replace(' ','-')}-workbook.pdf")
    with open(out, 'wb') as f:
        build_pdf_to_stream(data, f)
    print(f"✅  Workbook generated: {out}")

if __name__=="__main__":
    main()
