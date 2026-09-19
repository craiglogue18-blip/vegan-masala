#!/usr/bin/env python3
"""Build the staged Vegan Masala Indian breads lead magnet."""

from pathlib import Path
import hashlib
from xml.sax.saxutils import escape

from reportlab.lib.colors import Color, HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Frame, Paragraph, Table, TableStyle
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/pdf/vegan-masala-authentic-indian-vegan-breads-guide.pdf"
ASSETS = ROOT / "tmp/pdfs/indian-breads-assets"
W, H = 595.28, 841.89  # A4

BG = HexColor("#061417")
PANEL = HexColor("#0b2022")
PANEL_2 = HexColor("#10292a")
GOLD = HexColor("#d8b648")
GOLD_LIGHT = HexColor("#f0d06c")
CREAM = HexColor("#fff7e3")
MUTED = HexColor("#d0c5aa")
RED = HexColor("#aa292b")
TEAL = HexColor("#50b9c7")

pdfmetrics.registerFont(TTFont("Rajdhani", str(ROOT / "public/fonts/Rajdhani-Regular.ttf")))
pdfmetrics.registerFont(TTFont("RajdhaniMed", str(ROOT / "public/fonts/Rajdhani-Medium.ttf")))
pdfmetrics.registerFont(TTFont("RajdhaniSemi", str(ROOT / "public/fonts/Rajdhani-SemiBold.ttf")))
pdfmetrics.registerFont(TTFont("RajdhaniBold", str(ROOT / "public/fonts/Rajdhani-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Shivaraja", str(ROOT / "public/fonts/Shivaraja.ttf")))

BODY = ParagraphStyle("body", fontName="RajdhaniMed", fontSize=12.0, leading=16.0, textColor=CREAM, spaceAfter=9)
BODY_SMALL = ParagraphStyle("body-small", parent=BODY, fontSize=10.3, leading=13.4, spaceAfter=6)
BODY_TINY = ParagraphStyle("body-tiny", parent=BODY, fontSize=8.2, leading=10.7, spaceAfter=4)
INTRO = ParagraphStyle("intro", parent=BODY, fontSize=14, leading=19, textColor=CREAM)
H2 = ParagraphStyle("h2", fontName="RajdhaniBold", fontSize=18, leading=21, textColor=GOLD_LIGHT, spaceBefore=4, spaceAfter=7)
H3 = ParagraphStyle("h3", fontName="RajdhaniBold", fontSize=13, leading=15, textColor=GOLD_LIGHT, spaceBefore=3, spaceAfter=4)
LABEL = ParagraphStyle("label", fontName="RajdhaniBold", fontSize=8.5, leading=10, textColor=GOLD, tracking=1.2)
CENTRE = ParagraphStyle("centre", parent=BODY, alignment=TA_CENTER)
BULLET = ParagraphStyle("bullet", parent=BODY_SMALL, leftIndent=12, firstLineIndent=-8, bulletIndent=0, spaceAfter=4)


def P(text, style=BODY):
    return Paragraph(text, style)


def link(url, label):
    return f'<link href="{escape(url)}" color="#f0d06c"><u>{escape(label)}</u></link>'


def bullets(lines, style=BULLET):
    return [P("• " + line, style) for line in lines]


def draw_crop(c, path, x, y, w, h, radius=10, valign="center", align="center"):
    source = Path(path)
    cache_dir = ASSETS / ".optimised"
    cache_dir.mkdir(parents=True, exist_ok=True)
    cache_name = hashlib.sha1(str(source.resolve()).encode()).hexdigest()[:16] + ".jpg"
    cached = cache_dir / cache_name
    if not cached.exists() or cached.stat().st_mtime < source.stat().st_mtime:
        with Image.open(source) as original:
            prepared = original.convert("RGB")
            prepared.thumbnail((1800, 1800), Image.Resampling.LANCZOS)
            prepared.save(cached, "JPEG", quality=88, optimize=True, progressive=True)
    im = ImageReader(str(cached))
    iw, ih = im.getSize()
    scale = max(w / iw, h / ih)
    dw, dh = iw * scale, ih * scale
    dx = x + (w - dw) / 2 if align == "center" else (x if align == "left" else x + w - dw)
    dy = y + (h - dh) / 2 if valign == "center" else (y if valign == "bottom" else y + h - dh)
    c.saveState()
    pth = c.beginPath()
    pth.roundRect(x, y, w, h, radius)
    c.clipPath(pth, stroke=0, fill=0)
    c.drawImage(im, dx, dy, dw, dh, mask="auto")
    c.restoreState()


def background(c, page_no=None, section=None):
    c.setFillColor(BG)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.saveState()
    c.setStrokeColor(Color(.84, .71, .28, alpha=.07))
    c.setLineWidth(.45)
    for y in range(32, int(H), 46):
        for x in range(28, int(W), 46):
            c.circle(x, y, 7, stroke=1, fill=0)
            c.line(x - 10, y, x + 10, y)
            c.line(x, y - 10, x, y + 10)
    c.restoreState()
    c.setStrokeColor(GOLD)
    c.setLineWidth(1.4)
    c.roundRect(13, 13, W - 26, H - 26, 13, stroke=1, fill=0)
    if page_no:
        c.setFont("RajdhaniSemi", 8)
        c.setFillColor(GOLD)
        c.drawString(27, 25, "VEGAN MASALA  •  AUTHENTIC INDIAN VEGAN BREADS")
        c.drawRightString(W - 27, 25, str(page_no))
    if section:
        c.setFont("RajdhaniBold", 8)
        c.setFillColor(GOLD)
        c.drawString(34, H - 37, section.upper())


def logo(c, x=34, y=H - 93, width=74):
    p = ROOT / "public/brand/logo-flat.png"
    im = ImageReader(str(p))
    iw, ih = im.getSize()
    c.drawImage(im, x, y, width, width * ih / iw, mask="auto")


def page_title(c, kicker, heading, sub=None):
    c.setFont("RajdhaniBold", 9)
    c.setFillColor(GOLD)
    c.drawString(34, H - 64, kicker.upper())
    c.setFont("Shivaraja", 29)
    c.setFillColor(GOLD_LIGHT)
    c.drawString(34, H - 101, heading)
    if sub:
        c.setFont("RajdhaniMed", 11)
        c.setFillColor(MUTED)
        c.drawString(35, H - 121, sub)


def panel(c, x, y, w, h, items, pad=14, fill=PANEL, border=Color(.84, .71, .28, alpha=.55)):
    c.setFillColor(fill)
    c.setStrokeColor(border)
    c.setLineWidth(.8)
    c.roundRect(x, y, w, h, 10, stroke=1, fill=1)
    flow = Frame(x + pad, y + pad, w - 2 * pad, h - 2 * pad, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, showBoundary=0)
    flow.addFromList(items, c)


def image_card(c, path, x, y, w, h, caption=None, valign="center"):
    draw_crop(c, path, x, y, w, h, 11, valign=valign)
    c.setStrokeColor(GOLD)
    c.setLineWidth(1)
    c.roundRect(x, y, w, h, 11, stroke=1, fill=0)
    if caption:
        c.setFillColor(Color(0, 0, 0, alpha=.82))
        c.roundRect(x + 9, y + 9, w - 18, 29, 7, stroke=0, fill=1)
        c.setFont("RajdhaniSemi", 9)
        c.setFillColor(CREAM)
        c.drawString(x + 18, y + 19, caption)


def cover(c):
    background(c)
    draw_crop(c, ASSETS / "rolling-chapati.png", 13, 13, W - 26, H - 26, 13, align="right")
    c.setFillColor(Color(0, 0, 0, alpha=.60))
    c.rect(13, 13, W - 26, H - 26, stroke=0, fill=1)
    c.saveState()
    c.linearGradient(13, 13, 420, 13, [Color(0, 0, 0, .98), Color(0, 0, 0, .12)], extend=True)
    c.restoreState()
    logo(c, 43, H - 147, 98)
    c.setFont("RajdhaniBold", 10)
    c.setFillColor(GOLD)
    c.drawString(44, H - 192, "THE VEGAN MASALA GUIDE")
    c.setFont("Shivaraja", 44)
    c.setFillColor(GOLD_LIGHT)
    c.drawString(42, H - 250, "Authentic Indian")
    c.drawString(42, H - 299, "Vegan Breads")
    c.setStrokeColor(GOLD); c.setLineWidth(1.2); c.line(44, H - 323, 302, H - 323)
    c.setFont("RajdhaniSemi", 15)
    c.setFillColor(CREAM)
    c.drawString(44, H - 354, "Roti, naan, poori and regional breads")
    c.setFont("RajdhaniMed", 11.2)
    c.setFillColor(MUTED)
    c.drawString(44, H - 378, "Culture • flour • ovens • hand-forming • home technique")
    c.setFillColor(Color(0, 0, 0, alpha=.82)); c.roundRect(42, 52, 312, 73, 10, stroke=0, fill=1)
    c.setFont("RajdhaniSemi", 11); c.setFillColor(CREAM)
    c.drawString(58, 98, "A practical, illustrated introduction for curious home cooks")
    c.setFont("Rajdhani", 9.5); c.setFillColor(GOLD_LIGHT)
    c.drawString(58, 76, "VEGAN-MASALA.COM")
    c.setStrokeColor(GOLD); c.setLineWidth(1.4); c.roundRect(13, 13, W - 26, H - 26, 13, stroke=1, fill=0)


def why_bread(c):
    background(c, 2); page_title(c, "At the Indian table", "Why bread matters", "An everyday food, an edible utensil and a carrier of flavour")
    image_card(c, ASSETS / "bread-at-table.png", 34, 459, 527, 239, "Fresh roti moves straight from the tawa to the table")
    panel(c, 34, 252, 255, 185, [P("THE EVERYDAY LOGIC", H2), P("For many wheat-eating households, a basic roti begins with atta, water and heat. That economy matters: it turns an inexpensive grain into a fresh, filling companion for dal, sabzi and curry."), P("India is not one bread culture. Rice is central across much of the south and east, while millet, maize and wheat breads reflect local crops, seasons and histories.", BODY_SMALL)])
    panel(c, 306, 252, 255, 185, [P("BREAD AS CUTLERY", H2), P("A piece of roti can be torn, folded into a small pocket and used to gather a bite of sabzi or thicker dal. It is both food and utensil — tactile, efficient and designed for the meal around it."), P("Eating practices vary. Many people use the right hand; others use cutlery, or both. Clean hands and respect for the host matter more than performing a single ‘correct’ ritual.", BODY_SMALL)])
    panel(c, 34, 61, 527, 167, [P("A small cultural lens", H2), P("The pleasure is rhythmic: tear, fold, scoop, eat. Bread is often cooked in batches but served one by one, which means the cook’s work and the diners’ meal overlap. A cloth-lined dabba or basket keeps each roti soft, while the next one balloons on the tawa."), P("That sequence is one reason fresh bread feels hospitable. It is not just beside the food; it changes how the meal is handled, shared and tasted.", BODY_SMALL)])


def bread_families(c):
    background(c, 3); page_title(c, "A regional lens", "One country, many breads", "Think in families of grain and technique, not a single national loaf")
    cards = [
        ("ROTI & PHULKA", "North and central India", "Whole-wheat atta; unleavened. Cooked on a tawa, then sometimes puffed over flame."),
        ("NAAN & KULCHA", "Tandoor traditions", "Usually refined wheat flour and leavening. Restaurant versions may contain dairy or egg — always ask."),
        ("PARATHA & PAROTTA", "Layered and griddled", "Folded or laminated dough gives flaky layers; fillings range from potato to radish or fenugreek."),
        ("POORI & BHATURA", "Fried breads", "Poori is unleavened and whole-wheat; bhatura is leavened and often made with refined flour."),
        ("BHAKRI, ROTLA, MAKKI ROTI", "Millet and maize belts", "Jowar, bajra or maize create earthy, often gluten-free breads that need patient hand-forming."),
        ("APPAM & NEER DOSA", "Southern and coastal traditions", "Rice-based batter breads show why ‘Indian bread’ is wider than wheat and wider than the tandoor."),
    ]
    positions = [(34, 545), (306, 545), (34, 367), (306, 367), (34, 189), (306, 189)]
    for (title, region, copy), (x, y) in zip(cards, positions):
        panel(c, x, y, 255, 154, [P(title, H2), P(region.upper(), LABEL), P(copy, BODY_SMALL)], pad=14)
    panel(c, 34, 58, 527, 105, [P("Cultural reference: Kashmir’s kandur", H3), P("In Kashmir, neighbourhood kandurs traditionally bake breads for daily life in clay ovens. The bakery is both food infrastructure and a social place — a reminder that Indian bread-making can belong to a community, not only a domestic kitchen.", BODY_SMALL)])


def foundations(c):
    background(c, 4); page_title(c, "Flour and dough", "Four foundations", "Good bread starts before the heat")
    image_card(c, ROOT / "public/images/editorial/home-kitchen-chapati.jpg", 34, 476, 250, 228, "Atta, water, rest and repetition", valign="center")
    panel(c, 306, 476, 255, 228, [P("1  CHOOSE THE FLOUR", H2), P("Chakki atta is finely milled whole wheat and behaves differently from coarse Western wholemeal flour. For soft roti, use chapati atta when you can."), P("Refined maida gives naan and kulcha their softer, stretchier structure. Millet and maize doughs contain no gluten, so they are patted or pressed rather than stretched.", BODY_SMALL)])
    panel(c, 34, 286, 255, 166, [P("2  HYDRATE GRADUALLY", H2), P("Add water in stages. The dough should feel soft and supple, not wet. Flour age, brand and room humidity change how much water it absorbs."), P("A rigid formula is less useful than learning the feel.", BODY_SMALL)])
    panel(c, 306, 286, 255, 166, [P("3  REST THE DOUGH", H2), P("A 20–30 minute rest lets flour hydrate and makes atta dough easier to roll. Keep it covered so the surface does not dry."), P("For naan, fermentation or chemical leavening builds tenderness and bubbles.", BODY_SMALL)])
    panel(c, 34, 94, 255, 166, [P("4  MATCH THE HEAT", H2), P("Roti needs a properly preheated dry tawa. Too cool and it dries before it colours; too hot and the outside scorches before the inside sets."), P("Poori needs steady oil heat; naan needs fierce top heat or a tandoor wall.", BODY_SMALL)])
    panel(c, 306, 94, 255, 166, [P("THE VEGAN CHECK", H2), *bullets(["Atta roti is commonly vegan: flour and water.", "Ask about ghee brushed on top.", "Naan dough may contain yoghurt, milk or egg.", "Use unsweetened plant yoghurt and neutral oil at home."], BODY_SMALL)])


def chapati(c):
    background(c, 5); page_title(c, "Technique one", "Chapati: roll, turn, puff", "The everyday bread that teaches dough feel and heat control")
    image_card(c, ASSETS / "rolling-chapati.png", 34, 466, 527, 238, "Roundness comes from even pressure and frequent quarter-turns")
    steps = [
        ("1", "MIX", "Combine 250 g chapati atta with about 160–175 ml warm water, added gradually. Knead 7–10 minutes until smooth."),
        ("2", "REST", "Cover and rest 20–30 minutes. Divide into 8 equal balls; keep them covered."),
        ("3", "ROLL", "Flatten, dust lightly and roll from the centre. Turn the disc often rather than forcing the edges."),
        ("4", "TAWA", "Cook on a hot dry tawa until small bubbles form. Flip; cook until brown spots appear."),
        ("5", "PUFF", "Flip once more and press gently at the edges, or finish briefly over a gas flame with tongs if you are confident."),
        ("6", "HOLD", "Stack in a clean cloth. Steam trapped between warm rotis keeps them flexible."),
    ]
    y = 371
    for i, label, copy in steps:
        c.setFillColor(GOLD); c.circle(53, y + 22, 17, stroke=0, fill=1)
        c.setFillColor(BG); c.setFont("RajdhaniBold", 13); c.drawCentredString(53, y + 17, i)
        panel(c, 79, y, 482, 57, [P(f"{label}  <font color='#fff7e3'>{copy}</font>", BODY_SMALL)], pad=11)
        y -= 61
    c.setFont("RajdhaniSemi", 8.5); c.setFillColor(MUTED); c.drawString(35, 53, "SAFETY  Keep sleeves, cloths and loose hair away from an open gas flame. Use tongs, never fingers.")


def tandoor(c):
    background(c, 6); page_title(c, "Technique two", "Inside the tandoor", "Why oven shape, clay and fierce radiant heat change the bread")
    image_card(c, ASSETS / "tandoor-baker.png", 34, 430, 527, 274, "A baker uses a padded gaddi to place naan against the hot clay wall")
    panel(c, 34, 239, 255, 168, [P("HOW IT WORKS", H2), P("A tandoor is a deep cylindrical clay oven. Fuel burns below; the hot wall cooks one side of the bread by contact while radiant heat colours and blisters the other."), P("Long metal tools remove the bread. The technique is fast, skilled and commercial tandoors can be extremely hot.", BODY_SMALL)])
    panel(c, 306, 239, 255, 168, [P("WHY NAAN IS DIFFERENT", H2), P("A hydrated, leavened dough stretches into an oval and clings to the oven wall. The intense heat creates a tender centre, charred bubbles and a flavour a low oven cannot exactly copy."), P("Naan is not automatically vegan: check yoghurt, milk, egg and butter.", BODY_SMALL)])
    panel(c, 34, 61, 527, 154, [P("A safer home approximation", H2), P("Preheat a cast-iron pan until very hot. Lay on the shaped naan; when bubbles rise and the base chars, move the pan beneath a fierce overhead grill to blister the top. Use an oven-safe pan and protect the handle."), P("Do not build or improvise a tandoor indoors. A true tandoor needs specialist installation, ventilation and fire-safe operation.", BODY_SMALL)])


def shaping(c):
    background(c, 7); page_title(c, "Technique three", "Beyond the rolling pin", "Different grains demand different hands")
    image_card(c, ROOT / "public/images/recipes/poori.png", 34, 468, 255, 234, "Poori: rolled evenly, then fried to puff")
    image_card(c, ROOT / "public/images/recipes/vegan-garlic-naan.png", 306, 468, 255, 234, "Naan: stretched, not rolled paper-thin")
    panel(c, 34, 282, 255, 162, [P("PAT & TURN", H2), P("Bajra, jowar and maize doughs have little or no gluten. Pat them between damp palms or on a lined surface, repairing cracks as you turn."), P("Warm water often improves cohesion; work while the dough is fresh.", BODY_SMALL)])
    panel(c, 306, 282, 255, 162, [P("FOLD & LAYER", H2), P("Paratha gets its flake from fat and folds. Roll, brush lightly with oil, fold or coil, rest, then roll again without crushing every layer."), P("Cook with a little oil until crisp and mottled.", BODY_SMALL)])
    panel(c, 34, 93, 255, 165, [P("FRY & PUFF", H2), P("Poori puffs when evenly rolled dough enters sufficiently hot oil and steam expands inside. Slide it away from you, press gently with a slotted spoon, turn once and drain."), P("Never leave hot oil unattended.", BODY_SMALL)])
    panel(c, 306, 93, 255, 165, [P("STRETCH & SLAP", H2), P("Naan is left thicker than roti and stretched into a teardrop or oval. In a tandoor it is slapped onto the wall with a padded tool; at home, lay it smoothly into a hot pan."), P("Keep toppings sparse so they do not burn.", BODY_SMALL)])


def field_guide(c):
    background(c, 8); page_title(c, "Bread field guide", "Ten breads worth knowing", "Names overlap across languages and regions; technique is the useful compass")
    rows = [
        ("Chapati / roti", "Atta", "Tawa", "Soft, everyday, unleavened"),
        ("Phulka", "Atta", "Tawa + flame", "Thin roti finished until fully puffed"),
        ("Tandoori roti", "Atta", "Tandoor", "Chewier, smoky, blistered"),
        ("Naan", "Maida", "Tandoor", "Leavened, tender; check dairy/egg"),
        ("Kulcha", "Maida", "Tandoor / oven", "Leavened or stuffed"),
        ("Paratha", "Atta", "Tawa + oil", "Layered or stuffed, crisp-edged"),
        ("Poori", "Atta", "Deep-fried", "Small, crisp-tender and puffed"),
        ("Bhatura", "Maida", "Deep-fried", "Leavened, large and pillowy"),
        ("Bhakri / rotla", "Millet / sorghum", "Tawa", "Rustic, hand-patted, earthy"),
        ("Makki di roti", "Maize", "Tawa", "Punjabi winter bread; fragile dough"),
    ]
    data = [[P("BREAD", LABEL), P("FLOUR", LABEL), P("HEAT", LABEL), P("WHAT TO EXPECT", LABEL)]]
    for row in rows:
        data.append([P(row[0], BODY_SMALL), P(row[1], BODY_SMALL), P(row[2], BODY_SMALL), P(row[3], BODY_SMALL)])
    t = Table(data, colWidths=[127, 94, 100, 190], rowHeights=[34] + [48] * len(rows))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PANEL_2), ("TEXTCOLOR", (0, 0), (-1, -1), CREAM),
        ("GRID", (0, 0), (-1, -1), .45, Color(.84, .71, .28, alpha=.45)),
        ("BACKGROUND", (0, 1), (-1, -1), PANEL), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    t.wrapOn(c, 527, 600); t.drawOn(c, 34, 200)
    panel(c, 34, 61, 527, 113, [P("A pairing to remember", H3), P("Punjab’s makki di roti with sarson da saag links a maize bread with winter mustard greens. It is a seasonal partnership, not just a generic ‘bread and curry’ combination.", BODY_SMALL)])


def recipes(c):
    background(c, 9); page_title(c, "Cook from Vegan Masala", "Four breads to practise", "Start with atta, then move into leavening, filling and frying")
    recipes = [
        ("Chapati", ROOT / "public/images/recipes/chapati-recipe.png", "The best first lesson in hydration, even rolling and tawa heat.", "https://www.vegan-masala.com/recipes/chapati-recipe"),
        ("Vegan garlic naan", ROOT / "public/images/recipes/vegan-garlic-naan.png", "Soft leavened bread with garlic, cooked with a hot-pan method.", "https://www.vegan-masala.com/recipes/vegan-garlic-naan"),
        ("Vegan peshwari naan", ROOT / "public/images/recipes/vegan-peshwari-naan-recipe.png", "A filled, gently sweet naan for practising sealed edges.", "https://www.vegan-masala.com/recipes/vegan-peshwari-naan-recipe"),
        ("Poori", ROOT / "public/images/recipes/poori.png", "A lesson in even thickness, oil temperature and steam.", "https://www.vegan-masala.com/recipes/poori"),
    ]
    positions = [(34, 429), (306, 429), (34, 78), (306, 78)]
    for (name, image, copy, url), (x, y) in zip(recipes, positions):
        image_card(c, image, x, y + 112, 255, 200, valign="center")
        panel(c, x, y, 255, 101, [P(name, H3), P(copy, BODY_TINY), P(link(url, "Open the full recipe →"), BODY_TINY)], pad=11)


def troubleshoot(c):
    background(c, 10); page_title(c, "Kitchen confidence", "What went wrong?", "Read the bread: texture is feedback")
    rows = [
        ("Roti is tough", "Dough too firm; too much bench flour; cooked too long", "Add water gradually, roll lightly and use a hotter tawa for a shorter cook."),
        ("Roti will not puff", "Uneven thickness; cool tawa; edge did not seal", "Roll evenly, preheat fully and press around the rim after the second flip."),
        ("Roti dries in minutes", "Overcooked or left uncovered", "Cook just until spotted, then stack immediately in a clean cloth."),
        ("Naan is dense", "Under-proofed; dough too dry; heat too gentle", "Allow visible fermentation, keep dough soft and use the fiercest safe top heat."),
        ("Naan tastes cakey", "Too much raising agent", "Measure carefully and favour fermentation for flavour."),
        ("Millet bread cracks", "Dough cooled or lacks moisture", "Use warm water, shape promptly and repair edges with damp fingers."),
        ("Poori stays flat", "Oil too cool or disc uneven", "Test with a scrap: it should rise promptly. Roll to an even 2–3 mm."),
        ("Poori is oily", "Oil too cool; bread sat in oil", "Raise heat moderately, fry one at a time and drain as soon as both sides set."),
    ]
    data = [[P("SYMPTOM", LABEL), P("LIKELY CAUSE", LABEL), P("NEXT TIME", LABEL)]]
    for a, b, d in rows:
        data.append([P(a, BODY_SMALL), P(b, BODY_SMALL), P(d, BODY_SMALL)])
    t = Table(data, colWidths=[116, 174, 221], rowHeights=[34] + [70] * len(rows))
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PANEL_2), ("BACKGROUND", (0, 1), (-1, -1), PANEL),
        ("GRID", (0, 0), (-1, -1), .45, Color(.84, .71, .28, alpha=.45)),
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 8),
    ]))
    t.wrapOn(c, 527, 610); t.drawOn(c, 34, 144)
    c.setFont("RajdhaniMed", 9); c.setFillColor(MUTED)
    c.drawString(35, 110, "A first imperfect roti is useful: it tells you whether the next needs more water, more heat or a lighter hand.")


def toolkit(c):
    background(c, 11); page_title(c, "Optional toolkit", "Buy less. Choose well.", "Useful ingredients and equipment — with transparent affiliate links")
    image_card(c, ROOT / "public/images/equipment/tawa.jpg", 34, 535, 527, 169, "A broad, low-sided tawa makes turning and lifting bread easier")
    amazon = "https://www.amazon.co.uk"
    items = [
        ("CAST-IRON TAWA", "The one specialist tool most likely to improve roti, paratha and home-style naan. Choose a broad, low-sided pan and preheat it properly.", f"{amazon}/dp/B0D2P2934H?tag=veganmasala03-21", "View the 28 cm cast-iron tawa"),
        ("CHAKLA & BELAN", "A compact rolling board and slim Indian-style pin make frequent turning easier than a very heavy Western rolling pin.", f"{amazon}/s?k=Indian+chakla+belan+rolling+board+pin&tag=veganmasala03-21", "Compare chakla-and-belan sets"),
        ("CHAPATI ATTA", "Finely milled whole-wheat chapati flour usually gives softer, more flexible roti than coarse wholemeal bread flour.", f"{amazon}/s?k=chapati+atta+whole+wheat+flour&tag=veganmasala03-21", "Compare chapati atta"),
        ("METAL TONGS", "Long, precise tongs keep fingers away from hot pans and open flames. Avoid silicone tips near direct flame.", f"{amazon}/s?k=stainless+steel+chapati+tongs&tag=veganmasala03-21", "Compare stainless-steel tongs"),
    ]
    y = 425
    for title, copy, url, label in items:
        panel(c, 34, y, 527, 91, [P(title, H3), P(copy, BODY_TINY), P(link(url, label + " →"), BODY_TINY)], pad=10)
        y -= 96
    c.setFillColor(Color(.67, .16, .17, alpha=.45)); c.setStrokeColor(RED); c.roundRect(34, 52, 527, 35, 8, stroke=1, fill=1)
    c.setFont("RajdhaniSemi", 8.8); c.setFillColor(CREAM)
    c.drawCentredString(W / 2, 65, "AFFILIATE DISCLOSURE  We may earn a commission from qualifying purchases, at no extra cost to you.")


def practice(c):
    background(c, 12); page_title(c, "A gentle learning plan", "Seven days to better bread", "Repeat one movement at a time instead of chasing perfection")
    days = [
        ("DAY 1", "Feel", "Mix atta dough. Notice how it changes from rough to supple as you knead and rest it."),
        ("DAY 2", "Roll", "Roll eight dry practice discs. Focus on even thickness and quarter-turns, not perfect circles."),
        ("DAY 3", "Heat", "Cook chapatis and adjust the tawa between batches. Record which heat gives spots without dryness."),
        ("DAY 4", "Puff", "Try phulka. Look for even rolling and a sealed rim rather than pressing hard."),
        ("DAY 5", "Layer", "Make a simple oil-layered paratha and compare its texture with chapati."),
        ("DAY 6", "Leaven", "Make vegan garlic naan with plant yoghurt. Use cast iron plus an overhead grill."),
        ("DAY 7", "Share", "Serve one bread fresh with dal and sabzi. Practise tearing and folding a bite at the table."),
    ]
    y = 648
    for day, verb, copy in days:
        c.setFillColor(GOLD); c.roundRect(34, y, 78, 64, 9, stroke=0, fill=1)
        c.setFont("RajdhaniBold", 10); c.setFillColor(BG); c.drawCentredString(73, y + 40, day)
        c.setFont("Shivaraja", 16); c.drawCentredString(73, y + 18, verb)
        panel(c, 123, y, 438, 64, [P(copy, BODY_SMALL)], pad=12)
        y -= 75
    panel(c, 34, 75, 527, 58, [P("The goal is not a perfect circle. The goal is bread that is tender, properly cooked and served while it is alive with heat.", CENTRE)], pad=12, fill=Color(.67, .16, .17, alpha=.32), border=RED)


def sources(c):
    background(c, 13); page_title(c, "Keep exploring", "Sources, language & next steps", "A short reading list for culture and technique")
    panel(c, 34, 504, 255, 200, [P("USEFUL WORDS", H2), *bullets(["Atta — whole-wheat flour used for roti", "Tawa / tava — flat or gently curved griddle", "Belan — rolling pin", "Chakla — rolling board", "Gaddi — padded tool for placing bread in a tandoor", "Kandur — traditional Kashmiri baker / bakery context", "Phulka — roti finished so it balloons"], BODY_SMALL)], pad=14)
    panel(c, 306, 504, 255, 200, [P("READ WITH NUANCE", H2), P("India’s bread traditions cross languages, religions, regions and borders. Names and spellings vary, and household technique is often more authoritative than a rigid definition."), P("This guide uses ‘vegan’ to flag modern ingredient checks. Many everyday breads have always been plant-based, while restaurant finishes and enriched doughs may not be.", BODY_SMALL)])
    refs = [
        ("Traditional wheat flatbreads of India — scientific review", "https://pubmed.ncbi.nlm.nih.gov/24915406/"),
        ("Recent advances in chapatti technology — open research review", "https://pmc.ncbi.nlm.nih.gov/articles/PMC8292536/"),
        ("Kandurs of Srinagar: breadmaking in Kashmir Valley — Sahapedia", "https://www.sahapedia.org/kandurs-srinagar-breadmaking-kashmir-valley"),
        ("Indian Food Heritage — National Council for Hotel Management", "https://nchm.nic.in/sites/default/files/2022-11/Indian_Food_Heritage.pdf"),
        ("Vegan Masala recipes and cooking guides", "https://www.vegan-masala.com/guides"),
    ]
    ref_items = [P("SOURCES & FURTHER READING", H2)] + [P(f"{i}. {link(url, label)}", BODY_SMALL) for i, (label, url) in enumerate(refs, 1)]
    panel(c, 34, 259, 527, 220, ref_items, pad=14)
    panel(c, 34, 73, 527, 162, [P("Cook the next bread", H2), P("Begin with chapati, then let the grain and heat lead you outward: a flaky paratha, a blistered vegan naan, a hand-patted millet bhakri or a festive poori."), P(link("https://www.vegan-masala.com/recipes", "Explore all Vegan Masala recipes →"), H3), P("Share what you make: @veganmasalaonline", BODY_SMALL)])


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
    c.setTitle("The Vegan Masala Guide to Authentic Indian Vegan Breads")
    c.setAuthor("Vegan Masala")
    c.setSubject("Indian vegan breads, techniques, tandoors, culture and home cooking")
    pages = [cover, why_bread, bread_families, foundations, chapati, tandoor, shaping, field_guide, recipes, troubleshoot, toolkit, practice, sources]
    for fn in pages:
        fn(c)
        c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
