from __future__ import annotations

import re
import json
import subprocess
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "vegan-masala-first-10-filming-pack.pdf"
GOLD = colors.HexColor("#DDB548")
INK = colors.HexColor("#09141B")
RED = colors.HexColor("#B72D31")
PALE = colors.HexColor("#F5F0E5")
MID = colors.HexColor("#D8D0C1")

PRIORITIES = [
    ("chana-masala", "Consistent recipe interest and a recognisable curry with strong search potential."),
    ("chapati-recipe", "Evergreen bread technique that supports the free bread guide and paid masterclass."),
    ("instant-oats-idli-quick-easy-indian-breakfast-lunch-recipe", "Existing visitor interest and a distinctive steaming method."),
    ("aloo-tofu-recipe", "A useful plant-based adaptation with accessible ingredients."),
    ("vegetable-upma-indian-savory-breakfast", "Broadens the video library beyond curries into practical breakfasts."),
    ("vegan-cauliflower-tikka-masala", "A familiar high-intent dish with visually strong roasting and sauce stages."),
    ("tofu-bhurji-indian-style-tofu-scramble", "Fast, approachable and well suited to short-form discovery."),
    ("the-best-jackfruit-curry", "Popular on-site recipe with a valuable texture-focused technique."),
    ("aloo-baingan-recipe", "The completed prototype recipe and the best first end-to-end system test."),
    ("vegetable-balti", "Shows the importance of building a curry base and cooking onions properly."),
]


def clean(value: object) -> str:
    text = str(value)
    replacements = {
        "\u2013": "-", "\u2014": "-", "\u2011": "-", "\u2018": "'", "\u2019": "'",
        "\u201c": '"', "\u201d": '"', "\u00bd": "1/2", "\u00bc": "1/4", "\u00be": "3/4",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return re.sub(r"\s+", " ", text).strip()


def load_recipe_data() -> dict:
    slugs = [slug for slug, _ in PRIORITIES]
    command = ["node", str(ROOT / "scripts" / "export-filming-pack-data.mjs"), *slugs]
    return json.loads(subprocess.check_output(command, cwd=ROOT, text=True))


def prep_instruction(ingredient: str) -> str | None:
    ingredient = clean(ingredient)
    comma = ingredient.find(",")
    parenthetical = re.search(r"\(([^)]*(?:chopp|grat|minc|slic|dic|crush|peel|rins|drain|press|juice)[^)]*)\)", ingredient, re.I)
    subject = ingredient[:comma].strip() if comma >= 0 else ingredient.replace(parenthetical.group(0), "").strip() if parenthetical else ingredient
    descriptor = ingredient[comma + 1:].strip() if comma >= 0 else parenthetical.group(1).strip() if parenthetical else ""
    lower = descriptor.lower()
    note_match = re.search(r"\(([^)]+)\)", descriptor)
    note = f" ({note_match.group(1)})" if note_match else ""
    descriptor = re.sub(r"\s*\([^)]*\)\s*", " ", descriptor).strip()
    lower = descriptor.lower()
    if not descriptor:
        return None
    if re.search(r"drained.*pressed.*crumbled", lower): return f"Drain, press and crumble {subject}."
    if re.search(r"drained.*rinsed", lower): return f"Drain and rinse {subject}."
    if re.search(r"peeled.*roughly chopped", lower): return f"Peel and roughly chop {subject}."
    if re.search(r"peeled.*chopped", lower): return f"Peel and chop {subject}."
    match = re.search(r"peeled.*cut into (.+)", descriptor, re.I)
    if match: return f"Peel {subject}, then cut it into {match.group(1)}."
    match = re.search(r"seeds removed.*cut into (.+)", descriptor, re.I)
    if match: return f"Remove the seeds from {subject}, then cut into {match.group(1)}."
    match = re.search(r"cut into (.+)", descriptor, re.I)
    if match: return f"Cut {subject} into {match.group(1)}."
    if re.search(r"finely grated zest.*juice", lower): return f"Finely grate the zest of {subject}, then juice it."
    if re.search(r"chopped.*divided", lower): return f"Chop {subject}, keeping the portions separate."
    if re.search(r"minced.*or grated", lower): return f"Mince or grate {subject}."
    actions = [
        ("finely chopped", "Finely chop"), ("roughly chopped", "Roughly chop"), ("chopped", "Chop"),
        ("minced", "Mince"), ("finely grated", "Finely grate"), ("grated", "Grate"),
        ("cubed", "Cut", " into even cubes"), ("diced", "Dice", " evenly"),
        ("thinly sliced", "Thinly slice"), ("sliced lengthwise", "Slice", " lengthwise"),
        ("sliced", "Slice"), ("crushed", "Crush"), ("peeled", "Peel"),
        ("rinsed", "Rinse"), ("drained", "Drain"),
    ]
    for item in actions:
        marker, verb, *ending = item
        if marker in lower:
            return f"{verb} {subject}{ending[0] if ending else ''}{note}."
    return None


def method_fragments(instruction: str) -> list[str]:
    instruction = clean(instruction)
    sentences = [part for part in re.split(r"(?<=[.!?])\s+", instruction) if part]
    output: list[str] = []
    for sentence in sentences:
        if len(sentence) > 260 and ";" in sentence:
            output.extend(part[:1].upper() + part[1:] for part in sentence.split("; ") if part)
        else:
            output.append(sentence)
    return output


def safe_name(value: str) -> str:
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9]+", "-", value.lower()))


def shared_category(text: str) -> str | None:
    value = text.lower()
    if "onion" in value and re.search(r"chop|slice|dice", value): return "Prepare onions"
    if "onion" in value and re.search(r"golden|brown|soften|caramel", value): return "Cook onions"
    if "garlic" in value and re.search(r"mince|chop|crush|grate", value): return "Prepare garlic"
    if "ginger" in value and re.search(r"mince|chop|crush|grate", value): return "Prepare ginger"
    if "chilli" in value and re.search(r"chop|slice|dice", value): return "Prepare chillies"
    if "tomato" in value and re.search(r"chop|slice|dice", value): return "Prepare tomatoes"
    if "coriander" in value and re.search(r"chop|garnish|finish", value): return "Coriander garnish"
    if re.search(r"cumin|mustard seeds|whole spices", value) and re.search(r"sizzle|temper|crackle|fry", value): return "Temper whole spices"
    if re.search(r"turmeric|garam masala|coriander powder|ground spices", value) and re.search(r"add|sprinkle|stir|mix", value): return "Add ground spices"
    if re.search(r"cover|simmer", value) and re.search(r"tender|soft|cook", value): return "Covered simmer"
    return None


def make_packs() -> list[dict]:
    source_data = load_recipe_data()
    packs = []
    for priority, (slug, reason) in enumerate(PRIORITIES, 1):
        data = source_data[slug]
        ingredients = [clean(item) for item in data.get("ingredients", [])]
        prep = [instruction for item in ingredients if (instruction := prep_instruction(item))]
        method = [fragment for item in data.get("instructions", []) for fragment in method_fragments(item)]
        packs.append({"priority": priority, "slug": slug, "title": clean(data.get("title", slug)), "reason": reason, "prep": prep, "method": method})
    return packs


def header_footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(INK)
    canvas.rect(0, height - 16 * mm, width, 16 * mm, fill=1, stroke=0)
    canvas.setFont("RajdhaniBold", 10)
    canvas.setFillColor(GOLD)
    canvas.drawString(16 * mm, height - 10.5 * mm, "VEGAN MASALA - FILMING PACK")
    canvas.setFillColor(colors.HexColor("#555555"))
    canvas.drawRightString(width - 16 * mm, 10 * mm, f"Page {doc.page}")
    canvas.setStrokeColor(GOLD)
    canvas.line(16 * mm, 14 * mm, width - 16 * mm, 14 * mm)
    canvas.restoreState()


def cover(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(INK)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(2)
    canvas.roundRect(14 * mm, 14 * mm, width - 28 * mm, height - 28 * mm, 7 * mm, fill=0, stroke=1)
    canvas.restoreState()


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("Rajdhani", str(ROOT / "public" / "fonts" / "Rajdhani-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("RajdhaniBold", str(ROOT / "public" / "fonts" / "Rajdhani-Bold.ttf")))
    styles = getSampleStyleSheet()
    title = ParagraphStyle("TitleBrand", parent=styles["Title"], fontName="RajdhaniBold", fontSize=34, leading=38, textColor=GOLD, alignment=TA_CENTER, spaceAfter=10)
    subtitle = ParagraphStyle("Subtitle", parent=styles["BodyText"], fontName="Rajdhani", fontSize=14, leading=19, textColor=colors.white, alignment=TA_CENTER)
    h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="RajdhaniBold", fontSize=25, leading=29, textColor=INK, spaceAfter=8)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="RajdhaniBold", fontSize=16, leading=19, textColor=RED, spaceBefore=8, spaceAfter=5)
    body = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Rajdhani", fontSize=10.5, leading=14, textColor=INK)
    small = ParagraphStyle("Small", parent=body, fontSize=8.5, leading=11, textColor=colors.HexColor("#555555"))
    step = ParagraphStyle("Step", parent=body, fontSize=9.5, leading=12.5)
    metric = ParagraphStyle("Metric", parent=body, fontName="RajdhaniBold", fontSize=16, leading=18, alignment=TA_CENTER)

    packs = make_packs()
    prep_total = sum(len(pack["prep"]) for pack in packs)
    method_total = sum(len(pack["method"]) for pack in packs)
    story = [Spacer(1, 42 * mm)]
    logo = ROOT / "public" / "brand" / "logo-mark.png"
    if logo.exists():
        image = Image(str(logo), width=35 * mm, height=35 * mm)
        image.hAlign = "CENTER"
        story.extend([image, Spacer(1, 8 * mm)])
    story.extend([
        Paragraph("FIRST 10 RECIPE<br/>FILMING PACK", title),
        Paragraph("A complete production checklist for genuine Vegan Masala cooking footage", subtitle),
        Spacer(1, 20 * mm),
        Table([[Paragraph("10<br/><font size='9'>RECIPES</font>", metric), Paragraph(f"{prep_total}<br/><font size='9'>PREP SHOTS</font>", metric), Paragraph(f"{method_total}<br/><font size='9'>METHOD SHOTS</font>", metric), Paragraph(f"{10 + prep_total + method_total}<br/><font size='9'>MINIMUM CLIPS</font>", metric)]], colWidths=[41 * mm] * 4, style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), PALE), ("BOX", (0, 0), (-1, -1), 1, GOLD),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, GOLD), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])),
        Spacer(1, 24 * mm),
        Paragraph("Vegan food, cooked with love.", subtitle),
        PageBreak(),
        Paragraph("Consistent capture guide", h1),
    ])

    guides = [
        ("Camera", "Film vertically in 4K or 1080p at 30 fps. Lock the phone on a tripod and clean the lens."),
        ("Light", "Use bright, soft light from the front or side. Start on a clear, well-exposed frame - never black."),
        ("Clips", "Record preparation for 6-10 seconds, active cooking for 10-15 seconds and slow transformations for 20-30 seconds."),
        ("Framing", "Keep hands, utensils and food inside the central safe area. Leave the lower quarter clear for captions."),
        ("Continuity", "Keep the same pan, surface and lighting through a recipe. Capture a clean before and after shot."),
        ("Audio", "Natural cooking sound is useful. Avoid radio, television and copyrighted music in the room."),
        ("File names", "Use the exact filename beside every shot so the studio can match footage quickly."),
        ("Safety", "Never compromise safe knife handling or move hot cookware for the camera. Reframe the camera instead."),
    ]
    story.append(Table([[Paragraph(f"<b>{name}</b><br/>{copy}", body) for name, copy in guides[:2]], [Paragraph(f"<b>{name}</b><br/>{copy}", body) for name, copy in guides[2:4]], [Paragraph(f"<b>{name}</b><br/>{copy}", body) for name, copy in guides[4:6]], [Paragraph(f"<b>{name}</b><br/>{copy}", body) for name, copy in guides[6:8]]], colWidths=[82 * mm, 82 * mm], style=TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, MID), ("INNERGRID", (0, 0), (-1, -1), 0.5, MID),
        ("BACKGROUND", (0, 0), (-1, -1), PALE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ])))

    groups: dict[str, list[str]] = {}
    for pack in packs:
        for text in pack["prep"] + pack["method"]:
            category = shared_category(text)
            if category:
                groups.setdefault(category, []).append(pack["title"])
    story.extend([Spacer(1, 8 * mm), Paragraph("Shared batch shots", h1), Paragraph("Film each action during the genuine recipe session. These groups help maintain a consistent camera position without substituting food between recipes.", body), Spacer(1, 4 * mm)])
    group_rows = []
    for category, titles in sorted(groups.items(), key=lambda item: len(item[1]), reverse=True):
        unique = list(dict.fromkeys(titles))
        if len(unique) >= 2:
            group_rows.append([Paragraph(f"<b>{category}</b>", body), Paragraph("[ ] " + "<br/>[ ] ".join(unique), small)])
    story.append(Table(group_rows, colWidths=[45 * mm, 119 * mm], repeatRows=0, style=TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, MID), ("INNERGRID", (0, 0), (-1, -1), 0.5, MID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ])))

    for pack in packs:
        slug = safe_name(pack["slug"])
        story.extend([
            PageBreak(),
            Paragraph(f"Priority {pack['priority']}", h2),
            Paragraph(pack["title"], h1),
            Paragraph(pack["reason"], body),
            Spacer(1, 3 * mm),
            Table([[Paragraph(f"{len(pack['prep'])}<br/><font size='8'>PREP</font>", metric), Paragraph(f"{len(pack['method'])}<br/><font size='8'>METHOD</font>", metric), Paragraph(f"{1 + len(pack['prep']) + len(pack['method'])}<br/><font size='8'>MINIMUM CLIPS</font>", metric)]], colWidths=[54.5 * mm] * 3, style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), PALE), ("BOX", (0, 0), (-1, -1), 0.75, GOLD),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, GOLD), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ])),
            Spacer(1, 5 * mm),
            KeepTogether([Paragraph("Opening shot", h2), Paragraph(f"[ ] Bright completed dish<br/><font color='#666666'>{slug}_opening.mp4</font>", body)]),
        ])
        if pack["prep"]:
            story.append(Paragraph("Ingredient preparation", h2))
            rows = [[Paragraph("SHOT", small), Paragraph("ACTION AND FILE NAME", small)]]
            for index, instruction in enumerate(pack["prep"], 1):
                rows.append([Paragraph(f"[ ] P{index}", step), Paragraph(f"{instruction}<br/><font color='#666666'>{slug}_prep-{index:02d}.mp4</font>", step)])
            story.append(Table(rows, colWidths=[20 * mm, 144 * mm], repeatRows=1, style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), INK), ("TEXTCOLOR", (0, 0), (-1, 0), GOLD),
                ("BOX", (0, 0), (-1, -1), 0.75, MID), ("INNERGRID", (0, 0), (-1, -1), 0.35, MID),
                ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ])))
        story.append(Paragraph("Cooking method", h2))
        rows = [[Paragraph("SHOT", small), Paragraph("ACTION AND FILE NAME", small)]]
        for index, instruction in enumerate(pack["method"], 1):
            rows.append([Paragraph(f"[ ] {index}", step), Paragraph(f"{instruction}<br/><font color='#666666'>{slug}_method-{index:02d}.mp4</font>", step)])
        story.append(Table(rows, colWidths=[20 * mm, 144 * mm], repeatRows=1, style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), INK), ("TEXTCOLOR", (0, 0), (-1, 0), GOLD),
            ("BOX", (0, 0), (-1, -1), 0.75, MID), ("INNERGRID", (0, 0), (-1, -1), 0.35, MID),
            ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ])))
        story.extend([Spacer(1, 5 * mm), Paragraph("[ ] Presenter introduction &nbsp;&nbsp; [ ] Finished-dish close-up &nbsp;&nbsp; [ ] Taste reaction", body)])

    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, rightMargin=16 * mm, leftMargin=16 * mm, topMargin=22 * mm, bottomMargin=19 * mm, title="Vegan Masala First 10 Recipe Filming Pack", author="Vegan Masala")
    doc.build(story, onFirstPage=cover, onLaterPages=header_footer)
    print(OUTPUT)


if __name__ == "__main__":
    build_pdf()
