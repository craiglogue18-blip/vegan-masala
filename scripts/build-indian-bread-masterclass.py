#!/usr/bin/env python3
"""Build the paid Vegan Masala Indian Bread Masterclass Pack."""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

from reportlab.lib.colors import Color
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
SPEC = spec_from_file_location("bread_guide", ROOT / "scripts/build-indian-vegan-breads-guide.py")
guide = module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(guide)

OUT = ROOT / "output/pdf/vegan-masala-indian-bread-masterclass-pack.pdf"


def premium_cover(c):
    guide.cover(c)
    c.setFillColor(guide.GOLD)
    c.roundRect(411, 744, 133, 34, 8, stroke=0, fill=1)
    c.setFillColor(guide.BG)
    c.setFont("RajdhaniBold", 10)
    c.drawCentredString(477.5, 756, "MASTERCLASS PACK")


def ratios(c):
    guide.background(c, 13)
    guide.page_title(c, "Masterclass workbook", "Dough ratios at a glance", "A dependable starting point - then adjust by feel")
    rows = [
        ("SOFT CHAPATI", "250 g atta", "160-175 ml warm water", "20-30 min", "8 breads"),
        ("PLAIN PARATHA", "250 g atta", "150-165 ml water + oil", "30 min", "6 breads"),
        ("VEGAN NAAN", "300 g maida", "170-190 ml liquid", "60-90 min", "6 breads"),
        ("POORI", "250 g atta", "130-145 ml water", "15-20 min", "12 breads"),
    ]
    data = [[guide.P("STYLE", guide.LABEL), guide.P("FLOUR", guide.LABEL), guide.P("LIQUID", guide.LABEL), guide.P("REST", guide.LABEL), guide.P("YIELD", guide.LABEL)]]
    for row in rows:
        data.append([guide.P(cell, guide.BODY_SMALL) for cell in row])
    table = guide.Table(data, colWidths=[111, 102, 132, 91, 75], rowHeights=[36] + [68] * len(rows))
    table.setStyle(guide.TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), guide.PANEL_2),
        ("BACKGROUND", (0, 1), (-1, -1), guide.PANEL),
        ("GRID", (0, 0), (-1, -1), .5, Color(.84, .71, .28, alpha=.5)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    table.wrapOn(c, 527, 340)
    table.drawOn(c, 34, 390)
    guide.panel(c, 34, 212, 255, 150, [guide.P("READ THE DOUGH", guide.H2), guide.P("Hold back a little water, then add it teaspoon by teaspoon. A dough that looks dry in the first minute can soften after kneading and resting."), guide.P("Humidity, flour age and milling all change absorption.", guide.BODY_SMALL)])
    guide.panel(c, 306, 212, 255, 150, [guide.P("SCALE WITH CONFIDENCE", guide.H2), guide.P("Double every ingredient, but divide the finished dough into the original portion size. A larger dough mass usually needs a little more kneading and careful covering."), guide.P("Weighing portions makes cooking more even.", guide.BODY_SMALL)])
    guide.panel(c, 34, 73, 527, 113, [guide.P("Masterclass rule", guide.H2), guide.P("Treat the figures as a starting range, not a promise. The correct final texture is soft, smooth and easy to roll without sticking or cracking."), guide.P("Record the flour brand and exact water used on the practice sheet at the back.", guide.BODY_SMALL)])


def fillings(c):
    guide.background(c, 14)
    guide.page_title(c, "Masterclass workbook", "Fill, fold and seal", "Three savoury fillings that stay inside the bread")
    cards = [
        ("ALOO", "Dry mashed potato, toasted cumin, chilli, coriander and salt.", "Cool completely. Keep the filling smooth and free from wet chunks."),
        ("METHI", "Chopped fenugreek leaves, spices and a little oil worked into atta dough.", "Salt just before mixing so the leaves do not release excess water."),
        ("SPICED TOFU", "Firm pressed tofu crumbled with coriander, chilli and garam masala.", "Cook off moisture first, then cool before enclosing."),
    ]
    y = 535
    for title, ingredients, control in cards:
        guide.panel(c, 34, y, 527, 137, [guide.P(title, guide.H2), guide.P(ingredients), guide.P(f"CONTROL POINT  {control}", guide.BODY_SMALL)], pad=14)
        y -= 153
    guide.panel(c, 34, 71, 527, 132, [guide.P("The sealing sequence", guide.H2), *guide.bullets(["Roll a thick-edged disc and place a compact ball of cool filling in the centre.", "Bring the edges together, pinch firmly and remove any heavy knot of spare dough.", "Rest seam-side down for five minutes, then roll with light, even pressure.", "If filling escapes, dust the tear and cook that bread next rather than repeatedly patching it."], guide.BODY_SMALL)])


def batch_plan(c):
    guide.background(c, 15)
    guide.page_title(c, "Masterclass workbook", "Cook once, eat well", "A practical bread session for a busy week")
    schedule = [
        ("00:00", "Mix", "Make one 500 g flour batch of atta dough. Cover and rest."),
        ("00:15", "Prepare", "Mix a dry potato filling and set up flour, rolling space, tawa and cloth."),
        ("00:30", "Portion", "Divide half the dough for chapatis and half for stuffed parathas."),
        ("00:40", "Cook chapatis", "Roll and cook in a rhythm. Stack under a clean cloth."),
        ("01:05", "Cook parathas", "Fill, roll and cook with a light film of oil."),
        ("01:35", "Cool", "Cool breads in a single layer before packing to prevent condensation."),
    ]
    y = 632
    for time, action, copy in schedule:
        c.setFillColor(guide.GOLD)
        c.roundRect(34, y, 74, 65, 9, stroke=0, fill=1)
        c.setFillColor(guide.BG)
        c.setFont("RajdhaniBold", 13)
        c.drawCentredString(71, y + 25, time)
        guide.panel(c, 120, y, 441, 65, [guide.P(action.upper(), guide.H3), guide.P(copy, guide.BODY_SMALL)], pad=10)
        y -= 79
    guide.panel(c, 34, 74, 255, 76, [guide.P("FRIDGE", guide.H3), guide.P("Refrigerate cooled breads airtight for up to a few days; reheat on a dry tawa.", guide.BODY_SMALL)], pad=11)
    guide.panel(c, 306, 74, 255, 76, [guide.P("FREEZER", guide.H3), guide.P("Separate with parchment, freeze flat and reheat from frozen on a medium-hot tawa.", guide.BODY_SMALL)], pad=11)


def pairings(c):
    guide.background(c, 16)
    guide.page_title(c, "Masterclass workbook", "Build the whole plate", "Match bread texture to the food it needs to carry")
    pairs = [
        ("Soft chapati", "Chana masala or dal", "Flexible enough to fold around a thick spoonful without dominating it."),
        ("Garlic naan", "Rich tomato or cashew curry", "Tender crumb and charred edges suit a sauce with body."),
        ("Aloo paratha", "Pickle and plant yoghurt", "The filled bread is already the centre of the meal; keep sides sharp and simple."),
        ("Poori", "Dry potato sabzi or chickpeas", "A festive crisp-tender bread benefits from a substantial, not watery, accompaniment."),
        ("Bajra roti", "Greens and dal", "Earthy millet works especially well with robust winter vegetables."),
    ]
    y = 594
    for bread, dish, reason in pairs:
        guide.panel(c, 34, y, 527, 103, [guide.P(bread, guide.H2), guide.P(dish.upper(), guide.LABEL), guide.P(reason, guide.BODY_SMALL)], pad=12)
        y -= 115
    guide.panel(c, 34, 61, 527, 79, [guide.P("A useful menu shortcut", guide.H3), guide.P("Choose one bread, one saucy dish, one dry vegetable and something fresh or acidic. Variety comes from contrast, not from making six complicated components.", guide.BODY_SMALL)], pad=11)


def practice_log(c):
    guide.background(c, 17)
    guide.page_title(c, "Printable workbook", "Bread practice log", "One page per batch - progress becomes visible when you write it down")
    fields = [
        ("Bread and date", 673), ("Flour brand and weight", 615), ("Water or liquid used", 557),
        ("Rest time and room temperature", 499), ("Pan / oven and heat setting", 441),
        ("What the dough felt like", 350), ("What happened during cooking", 259),
        ("One change for next time", 168),
    ]
    for label, y in fields:
        c.setFont("RajdhaniBold", 9)
        c.setFillColor(guide.GOLD)
        c.drawString(35, y + 24, label.upper())
        line_count = 1 if y >= 441 else 3
        for idx in range(line_count):
            line_y = y - idx * 22
            c.setStrokeColor(Color(.84, .71, .28, alpha=.45))
            c.line(35, line_y, 560, line_y)
    guide.panel(c, 34, 56, 527, 62, [guide.P("Score the batch: tenderness  __ / 5   |   shape  __ / 5   |   colour  __ / 5   |   flavour  __ / 5", guide.CENTRE)], pad=12)


def premium_sources(c):
    original_background = guide.background
    guide.background = lambda page_canvas, page_no=None, section=None: original_background(page_canvas, 18, section)
    try:
        guide.sources(c)
    finally:
        guide.background = original_background


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(guide.W, guide.H), pageCompression=1)
    c.setTitle("Vegan Masala Indian Bread Masterclass Pack")
    c.setAuthor("Vegan Masala")
    c.setSubject("An expanded Indian vegan bread course and printable workbook")
    pages = [
        premium_cover, guide.why_bread, guide.bread_families, guide.foundations,
        guide.chapati, guide.tandoor, guide.shaping, guide.field_guide,
        guide.recipes, guide.troubleshoot, guide.toolkit, guide.practice,
        ratios, fillings, batch_plan, pairings, practice_log, premium_sources,
    ]
    for page in pages:
        page(c)
        c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
