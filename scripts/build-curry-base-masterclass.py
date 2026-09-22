#!/usr/bin/env python3
from __future__ import annotations

from io import BytesIO
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps
from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "vegan-masala-curry-base-masterclass.pdf"
TMP = ROOT / "tmp" / "pdfs" / "curry-base-masterclass"

W, H = A4
GOLD = HexColor("#E8B629")
GOLD_SOFT = HexColor("#F2D47A")
RED = HexColor("#B83232")
INK = HexColor("#071719")
SURFACE = HexColor("#102427")
SOFT = HexColor("#D7DEDC")
MUTED = HexColor("#9AA8A6")
CREAM = HexColor("#FFF8E7")


def register_fonts() -> None:
    font_dir = ROOT / "public" / "fonts"
    pdfmetrics.registerFont(TTFont("Rajdhani", str(font_dir / "Rajdhani-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("RajdhaniMedium", str(font_dir / "Rajdhani-Medium.ttf")))
    pdfmetrics.registerFont(TTFont("RajdhaniSemiBold", str(font_dir / "Rajdhani-SemiBold.ttf")))
    pdfmetrics.registerFont(TTFont("RajdhaniBold", str(font_dir / "Rajdhani-Bold.ttf")))


def fitted_image(path: Path, width: int, height: int, darken: float = 1.0) -> ImageReader:
    im = Image.open(path).convert("RGB")
    im = ImageOps.fit(im, (width, height), method=Image.Resampling.LANCZOS)
    if darken != 1.0:
        im = ImageEnhance.Brightness(im).enhance(darken)
    stream = BytesIO()
    im.save(stream, format="JPEG", quality=92, optimize=True)
    stream.seek(0)
    return ImageReader(stream)


def draw_fitted(c: canvas.Canvas, path: Path, x: float, y: float, w: float, h: float, darken: float = 1.0) -> None:
    c.drawImage(fitted_image(path, max(1, int(w * 2)), max(1, int(h * 2)), darken), x, y, w, h, mask="auto")


def set_fill_alpha(c: canvas.Canvas, value: float) -> None:
    try:
        c.setFillAlpha(value)
    except Exception:
        pass


def wrap(text: str, font: str, size: float, max_width: float) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        if not words:
            lines.append("")
            continue
        line = words[0]
        for word in words[1:]:
            trial = f"{line} {word}"
            if pdfmetrics.stringWidth(trial, font, size) <= max_width:
                line = trial
            else:
                lines.append(line)
                line = word
        lines.append(line)
    return lines


def paragraph(c: canvas.Canvas, text: str, x: float, y: float, width: float, size: float = 11.5,
              leading: float | None = None, color=SOFT, font: str = "Rajdhani", max_lines: int | None = None) -> float:
    leading = leading or size * 1.35
    lines = wrap(text, font, size, width)
    if max_lines:
        lines = lines[:max_lines]
    c.setFont(font, size)
    c.setFillColor(color)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def heading(c: canvas.Canvas, text: str, x: float, y: float, width: float, size: float = 28,
            color=GOLD, max_lines: int = 3) -> float:
    lines = wrap(text, "RajdhaniBold", size, width)[:max_lines]
    c.setFont("RajdhaniBold", size)
    c.setFillColor(color)
    for line in lines:
        c.drawString(x, y, line)
        y -= size * 1.02
    return y


def page_base(c: canvas.Canvas, number: int, label: str = "CURRY BASE MASTERCLASS") -> None:
    c.setFillColor(INK)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setStrokeColor(Color(232 / 255, 182 / 255, 41 / 255, alpha=0.22))
    c.setLineWidth(0.8)
    c.roundRect(24, 24, W - 48, H - 48, 18, stroke=1, fill=0)
    c.setFillColor(GOLD)
    c.setFont("RajdhaniSemiBold", 7.7)
    c.drawString(38, H - 40, label)
    c.setFillColor(MUTED)
    c.drawRightString(W - 38, 35, f"VEGAN MASALA  |  {number:02d}")


def pill(c: canvas.Canvas, text: str, x: float, y: float, fill=RED, text_color=white, width: float | None = None) -> None:
    size = 8.5
    width = width or pdfmetrics.stringWidth(text, "RajdhaniBold", size) + 24
    c.setFillColor(fill)
    c.roundRect(x, y - 10, width, 23, 11.5, stroke=0, fill=1)
    c.setFillColor(text_color)
    c.setFont("RajdhaniBold", size)
    c.drawCentredString(x + width / 2, y - 2.2, text)


def info_card(c: canvas.Canvas, title: str, body: str, x: float, y: float, w: float, h: float,
              accent=GOLD, icon: str | None = None) -> None:
    c.setFillColor(SURFACE)
    c.setStrokeColor(Color(accent.red, accent.green, accent.blue, alpha=0.42))
    c.setLineWidth(0.8)
    c.roundRect(x, y, w, h, 14, stroke=1, fill=1)
    tx = x + 16
    if icon:
        c.setFont("RajdhaniBold", 19)
        c.setFillColor(accent)
        c.drawString(tx, y + h - 28, icon)
        tx += 24
    c.setFillColor(accent)
    c.setFont("RajdhaniBold", 13)
    c.drawString(tx, y + h - 26, title)
    paragraph(c, body, x + 16, y + h - 49, w - 32, 9.5, 12.3, SOFT, "RajdhaniMedium")


def photo_page(c: canvas.Canvas, number: int, eyebrow: str, title: str, body: str, image: Path,
               bullets: list[str], note: str | None = None) -> None:
    page_base(c, number)
    draw_fitted(c, image, 38, 395, W - 76, 355, 0.88)
    set_fill_alpha(c, 0.55)
    c.setFillColor(INK)
    c.rect(38, 395, W - 76, 94, stroke=0, fill=1)
    set_fill_alpha(c, 1)
    pill(c, eyebrow.upper(), 55, 718, fill=GOLD, text_color=INK)
    y = heading(c, title, 55, 468, W - 110, 28, white)
    y = paragraph(c, body, 55, 360, W - 110, 11.5, 15.3, SOFT, "RajdhaniMedium")
    y -= 10
    for item in bullets:
        c.setFillColor(GOLD)
        c.circle(61, y + 4, 2.5, stroke=0, fill=1)
        y = paragraph(c, item, 72, y + 8, W - 127, 10.5, 13.5, CREAM, "RajdhaniMedium") - 5
    if note:
        c.setFillColor(Color(184 / 255, 50 / 255, 50 / 255, alpha=0.16))
        c.setStrokeColor(Color(232 / 255, 182 / 255, 41 / 255, alpha=0.38))
        c.roundRect(55, 62, W - 110, 62, 13, stroke=1, fill=1)
        c.setFillColor(GOLD)
        c.setFont("RajdhaniBold", 9)
        c.drawString(71, 102, "THE USEFUL TEST")
        paragraph(c, note, 71, 84, W - 142, 9.5, 12, SOFT, "RajdhaniMedium")
    c.showPage()


def build() -> None:
    register_fonts()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    c.setTitle("Vegan Masala Curry Base Masterclass")
    c.setAuthor("Vegan Masala")
    c.setSubject("A practical masterclass in building adaptable vegan Indian curry bases")

    # 1 - Cover
    cover = ROOT / "public" / "images" / "guides" / "how-to-build-a-curry-base.png"
    draw_fitted(c, cover, 0, 0, W, H, 0.48)
    c.setFillColor(Color(7 / 255, 23 / 255, 25 / 255, alpha=0.45))
    c.rect(0, 0, W, H, stroke=0, fill=1)
    logo = ROOT / "public" / "brand" / "logo-primary.png"
    c.drawImage(str(logo), 54, H - 166, 150, 100, preserveAspectRatio=True, mask="auto")
    pill(c, "20-PAGE PRACTICAL EDITION", 54, 610, fill=GOLD, text_color=INK)
    y = heading(c, "Curry Base Masterclass", 54, 560, W - 108, 46, GOLD)
    paragraph(c, "Build deeper flavour, recognise every cooking stage and turn one dependable masala base into confident weeknight curries.", 57, y - 22, W - 114, 16, 20, white, "RajdhaniSemiBold")
    c.setStrokeColor(GOLD)
    c.setLineWidth(2)
    c.roundRect(34, 34, W - 68, H - 68, 24, stroke=1, fill=0)
    c.setFillColor(white)
    c.setFont("RajdhaniBold", 10)
    c.drawString(56, 61, "VEGAN-MASALA.COM")
    c.showPage()

    # 2 - Welcome
    page_base(c, 2)
    pill(c, "START HERE", 48, 752, fill=RED)
    y = heading(c, "A base is a method, not a jar of sauce", 48, 708, W - 96, 32)
    y = paragraph(c, "In many Indian home kitchens, a curry is built in stages: fat, aromatics, tomatoes or another souring element, spices, then the main ingredient. The exact order and ingredients vary by region, family and dish. The useful skill is learning what each stage should look, smell and feel like.", 48, y - 18, W - 96, 12.2, 16.2, SOFT, "RajdhaniMedium")
    info_card(c, "Cook with your senses", "Times are a guide. Pan width, onion moisture and heat output change every batch. Watch colour, listen for sizzling and smell the shift from raw to rounded.", 48, 350, 240, 130, GOLD, "01")
    info_card(c, "Build, then adapt", "Use the master formula once. Then follow the four variation maps to make chickpea, tofu, vegetable or dal-based dinners without beginning from zero.", 307, 350, 240, 130, GOLD, "02")
    info_card(c, "Record one adjustment", "The practice log at the back turns each curry into useful evidence: heat, cooking time, liquid and the single change to make next time.", 48, 190, 499, 120, RED, "03")
    c.setFillColor(MUTED)
    c.setFont("RajdhaniMedium", 9.5)
    c.drawString(48, 143, "This guide uses metric measurements and UK ingredient names.")
    c.showPage()

    # 3 - Formula
    page_base(c, 3)
    pill(c, "THE MASTER FLOW", 48, 752, fill=GOLD, text_color=INK)
    heading(c, "Seven decisions behind a satisfying curry", 48, 708, W - 96, 31)
    steps = [
        ("1", "FAT", "Carry aroma and manage heat"),
        ("2", "WHOLE SPICES", "Bloom until fragrant, never blackened"),
        ("3", "ONION", "Soften, sweeten or brown for the style"),
        ("4", "GINGER + GARLIC", "Cook away the sharp raw edge"),
        ("5", "TOMATO", "Reduce until glossy and concentrated"),
        ("6", "GROUND SPICES", "Briefly fry with enough moisture"),
        ("7", "MAIN + LIQUID", "Simmer to the texture the dish needs"),
    ]
    y = 610
    for idx, title, body in steps:
        c.setFillColor(GOLD if int(idx) % 2 else RED)
        c.circle(72, y + 5, 17, stroke=0, fill=1)
        c.setFillColor(INK if int(idx) % 2 else white)
        c.setFont("RajdhaniBold", 12)
        c.drawCentredString(72, y + 1, idx)
        c.setFillColor(white)
        c.setFont("RajdhaniBold", 13.5)
        c.drawString(104, y + 8, title)
        c.setFillColor(SOFT)
        c.setFont("RajdhaniMedium", 10.5)
        c.drawString(230, y + 8, body)
        if idx != "7":
            c.setStrokeColor(Color(232 / 255, 182 / 255, 41 / 255, alpha=0.25))
            c.line(72, y - 14, 72, y - 43)
        y -= 70
    paragraph(c, "Not every curry uses every stage. Coconut-based, yoghurt-style, mustard-led and no-onion/no-garlic dishes follow different logics. This framework is a reliable North Indian-style starting point, not a claim that all Indian curries are the same.", 48, 92, W - 96, 9.8, 12.5, MUTED, "RajdhaniMedium")
    c.showPage()

    # 4 - Ingredient board
    page_base(c, 4)
    pill(c, "MISE EN PLACE", 48, 752, fill=RED)
    heading(c, "Know what each ingredient is doing", 48, 708, W - 96, 30)
    ingredient_dir = ROOT / "public" / "images" / "guides" / "how-to-build-a-curry-base"
    ingredients = [
        ("Oil", "Transfers heat and dissolves aromatic compounds.", "oil.png"),
        ("Onion", "Body, savouriness and sweetness when patiently cooked.", "onions.png"),
        ("Garlic", "Deep savoury character; burns quickly once minced.", "garlic.png"),
        ("Ginger", "Fresh heat and brightness that keeps a rich base lively.", "ginger.png"),
        ("Tomato", "Acidity, colour and sauce body after water cooks away.", "tomatoes.png"),
        ("Ground spices", "Define direction; they need fat, heat and moisture.", "ground-spices.png"),
    ]
    card_w, card_h = 238, 195
    for i, (name, body, filename) in enumerate(ingredients):
        col, row = i % 2, i // 2
        x = 48 + col * 259
        y = 447 - row * 212
        c.setFillColor(SURFACE)
        c.setStrokeColor(Color(232 / 255, 182 / 255, 41 / 255, alpha=0.32))
        c.roundRect(x, y, card_w, card_h, 14, stroke=1, fill=1)
        draw_fitted(c, ingredient_dir / filename, x, y + 78, card_w, 117, 0.96)
        c.setFillColor(GOLD)
        c.setFont("RajdhaniBold", 14)
        c.drawString(x + 14, y + 57, name)
        paragraph(c, body, x + 14, y + 38, card_w - 28, 9.2, 11.2, SOFT, "RajdhaniMedium")
    c.showPage()

    # 5 - Equipment
    page_base(c, 5)
    pill(c, "TOOLS", 48, 752, fill=GOLD, text_color=INK)
    heading(c, "Useful equipment, without filling the cupboard", 48, 708, W - 96, 29)
    draw_fitted(c, ROOT / "public" / "images" / "equipment" / "spice_grinder.jpg", 48, 382, 214, 245, 0.88)
    tool_cards = [
        ("Wide saute pan", "A wider base evaporates tomato moisture faster and makes visual cues easier to read."),
        ("Heavy kadai or casserole", "Stable heat helps onions colour evenly and reduces scorching during a long bhunao."),
        ("Flat-edged spoon", "Scrape the base of the pan and expose whether moisture is still pooling."),
        ("Small grinder", "Freshly ground cumin and coriander have more fragrance; a dedicated grinder avoids coffee flavours."),
    ]
    y = 580
    for title, body in tool_cards:
        info_card(c, title, body, 286, y - 70, 261, 90, GOLD)
        y -= 104
    c.setFillColor(Color(232 / 255, 182 / 255, 41 / 255, alpha=0.10))
    c.roundRect(48, 92, W - 96, 104, 16, stroke=0, fill=1)
    c.setFillColor(GOLD)
    c.setFont("RajdhaniBold", 12)
    c.drawString(66, 166, "BUY ONLY WHAT SOLVES A REAL PROBLEM")
    paragraph(c, "The Vegan Masala equipment pages may contain clearly disclosed affiliate links. If you choose to buy through one, Vegan Masala may earn a small commission at no extra cost to you. Technique matters more than owning a particular brand.", 66, 143, W - 132, 9.8, 12.5, SOFT, "RajdhaniMedium")
    c.showPage()

    # 6-10 - technique pages
    photo_page(c, 6, "STAGE 1", "Start with controlled heat", "Oil should be fluid and shimmering, not smoking. Whole spices need enough heat to release aroma but only seconds can separate fragrant from bitter.", ROOT / "public" / "images" / "guides" / "how-to-temper-spices.png", ["Add larger, tougher whole spices before delicate leaves or minced garlic.", "Cumin should darken slightly and smell nutty; mustard seeds should begin to pop.", "If spices blacken instantly, remove the pan from the heat and begin again."], "Fragrance should rise clearly from the pan before the next ingredient goes in.")
    photo_page(c, 7, "STAGE 2", "Onions decide the depth", "For this master base, finely chop 250 g onion and cook it patiently. Pale softened onions give a lighter sauce; deeper golden onions bring sweetness, body and roasted notes.", ingredient_dir / "onions.png", ["Use medium heat and stir more often as the onion loses water.", "A pinch of salt helps draw moisture, but too much early salt can slow browning.", "Add one tablespoon of water if the pan catches before the onion is evenly coloured."], "Press a piece with the spoon: it should be soft throughout, not crisp-edged with a raw centre.")
    photo_page(c, 8, "STAGE 3", "Cook out raw ginger and garlic", "Add 15 g grated ginger and 15 g grated garlic after the onions are ready. The mixture will smell sharp at first, then become rounded and savoury.", ingredient_dir / "ginger.png", ["Keep the mixture moving because finely grated garlic catches quickly.", "Cook for 60-90 seconds rather than relying only on the clock.", "If the pan is very dry, loosen it with a teaspoon of water before the garlic burns."], "The eye-watering raw smell should soften; the paste should no longer look wet and chalky.")
    photo_page(c, 9, "STAGE 4", "Bhunao: reduce, concentrate, observe", "Add 300 g finely chopped or crushed tomatoes. Bhunao describes cooking and working a mixture down so moisture evaporates and flavours concentrate; terminology and technique vary across homes and regions.", ingredient_dir / "tomatoes.png", ["At first the mixture looks loose and separate. Keep cooking uncovered.", "Scrape the pan regularly so the concentrated edges return to the sauce.", "The colour deepens, sizzling becomes sharper and small beads of oil may appear."], "Drag the spoon across the pan. The path should remain visible for a moment before the masala closes over it.")
    photo_page(c, 10, "STAGE 5", "Ground spices need protection", "Stir in turmeric, ground cumin, ground coriander and chilli only when the tomato mixture has reduced. Fry briefly, then add a splash of water if the masala tightens too fast.", ingredient_dir / "ground-spices.png", ["Ground spices release flavour quickly and can become bitter when scorched.", "Keep garam masala for the later stages if you want its perfume to remain distinct.", "Blooming in a moist, oily masala gives a deeper result than tipping spices into thin liquid."], "The spices should smell integrated with the onion and tomato, not dusty or raw.")

    # 11 - readiness cues
    page_base(c, 11)
    pill(c, "READ THE PAN", 48, 752, fill=RED)
    heading(c, "Five signals that the masala is ready", 48, 708, W - 96, 30)
    cues = [
        ("COLOUR", "Orange-red has deepened towards brick or russet, depending on the spices."),
        ("TEXTURE", "The mixture is cohesive and spoonable rather than watery or granular."),
        ("SOUND", "A soft wet simmer becomes a clearer, sharper sizzle as moisture leaves."),
        ("AROMA", "Raw onion, garlic and powdered spice notes have become rounded and savoury."),
        ("OIL", "Tiny beads may appear at the edge. You do not need a large slick of oil."),
    ]
    y = 590
    for i, (title, body) in enumerate(cues):
        info_card(c, title, body, 48, y, W - 96, 86, GOLD if i % 2 == 0 else RED, f"0{i+1}")
        y -= 101
    paragraph(c, "Oil separation is one clue, not the only proof. Very lean cooking may show little visible oil, while excess oil can separate before onions and tomatoes are properly cooked.", 48, 72, W - 96, 9.6, 12, MUTED, "RajdhaniMedium")
    c.showPage()

    # 12 - master batch
    page_base(c, 12)
    pill(c, "CORE RECIPE", 48, 752, fill=GOLD, text_color=INK)
    heading(c, "Master masala base - 4 generous portions", 48, 708, W - 96, 29)
    left = ["2 tbsp neutral oil", "1 tsp cumin seeds", "250 g onion, finely chopped", "15 g ginger, grated", "15 g garlic, grated", "300 g tomatoes, crushed", "1 tsp ground coriander", "1 tsp ground cumin", "1/2 tsp turmeric", "1/4-1 tsp chilli powder", "1 tsp fine salt, then adjust"]
    c.setFillColor(SURFACE)
    c.roundRect(48, 325, 220, 330, 16, stroke=0, fill=1)
    c.setFillColor(GOLD)
    c.setFont("RajdhaniBold", 15)
    c.drawString(66, 625, "INGREDIENTS")
    y = 596
    for item in left:
        c.setFillColor(GOLD)
        c.circle(70, y + 3, 2, stroke=0, fill=1)
        c.setFillColor(CREAM)
        c.setFont("RajdhaniMedium", 10.2)
        c.drawString(80, y, item)
        y -= 23
    method = [
        "Heat oil over medium heat. Add cumin and cook until fragrant.",
        "Add onion and cook 10-15 minutes until evenly golden and completely soft.",
        "Add ginger and garlic; cook 60-90 seconds until the raw aroma fades.",
        "Add tomato and salt. Cook uncovered 10-15 minutes, scraping often, until concentrated.",
        "Add ground spices. Fry 30-45 seconds, loosening with 1-2 tbsp water if needed.",
        "Choose a variation, add its main ingredient and liquid, then simmer to the required texture.",
    ]
    c.setFillColor(white)
    c.setFont("RajdhaniBold", 15)
    c.drawString(297, 625, "METHOD")
    y = 586
    for i, item in enumerate(method, 1):
        c.setFillColor(RED)
        c.circle(311, y + 3, 11, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("RajdhaniBold", 9)
        c.drawCentredString(311, y, str(i))
        y = paragraph(c, item, 332, y + 5, 215, 10.2, 13, SOFT, "RajdhaniMedium") - 14
    info_card(c, "MAKE IT YOURS", "For a smoother sauce, cool slightly and blend before adding the main ingredient. For a homestyle texture, leave it rustic. Both are valid choices.", 48, 135, W - 96, 125, GOLD)
    c.showPage()

    # 13-16 - variations
    variations = [
        (13, "CHICKPEA PATH", "Chana masala from the master base", ROOT / "public" / "images" / "recipes" / "chana-masala.png", ["Add 480 g drained cooked chickpeas.", "Add 250-350 ml water and simmer 15 minutes.", "Crush a spoonful of chickpeas to thicken naturally.", "Finish with 1 tsp garam masala, lemon and coriander."], "For a darker, tangier profile add amchur or a little tamarind, not both at once."),
        (14, "TOFU PATH", "A rich tofu masala without dairy", ROOT / "public" / "images" / "recipes" / "tofu-butter-masala-recipe.png", ["Brown 400 g firm tofu separately for better texture.", "Blend the base if you want a restaurant-style sauce.", "Add 250 ml water or unsweetened plant milk.", "Finish with kasuri methi and a spoon of cashew cream."], "Add plant milk after the fierce frying stage and keep the simmer gentle to prevent splitting."),
        (15, "VEGETABLE PATH", "A flexible seasonal vegetable curry", ROOT / "public" / "images" / "recipes" / "vegetable-bhuna-north-indian-vegetable-curry.png", ["Use 600-700 g mixed vegetables with similar cooking times.", "Add firm vegetables first; peas and spinach go in near the end.", "Use 200-300 ml water for a clingy bhuna-style finish.", "Finish with coriander and a squeeze of lemon."], "Salt draws water from vegetables. Add liquid cautiously, then adjust once they begin to soften."),
        (16, "DAL PATH", "Turn the base into comforting dal", ROOT / "public" / "images" / "recipes" / "indian-red-lentil-dahl.png", ["Add 200 g rinsed red lentils and 700 ml water.", "Simmer gently until the lentils collapse, adding water as needed.", "Adjust salt and acidity only after the lentils are tender.", "Finish with a separate cumin, chilli and garlic tadka."], "A final tadka creates contrast: creamy lentils underneath, fresh spice aroma on top."),
    ]
    for number, eyebrow, title, image, bullets, note in variations:
        photo_page(c, number, eyebrow, title, "Begin with one full batch of the master masala, then follow this route. Quantities make roughly four portions and are designed to be adjusted to your preferred sauce consistency.", image, bullets, note)

    # 17 - batch
    page_base(c, 17)
    pill(c, "BATCH COOK", 48, 752, fill=GOLD, text_color=INK)
    heading(c, "Cook once, make three future dinners easier", 48, 708, W - 96, 29)
    timeline = [
        ("0-10 MIN", "Chop onions; grate ginger and garlic; measure spices."),
        ("10-25 MIN", "Cook onions while crushing tomatoes and preparing containers."),
        ("25-40 MIN", "Cook aromatics, tomatoes and ground spices to the ready stage."),
        ("40-50 MIN", "Cool quickly in a shallow tray, then divide into three labelled portions."),
    ]
    y = 585
    for i, (time, body) in enumerate(timeline):
        c.setFillColor(GOLD if i % 2 == 0 else RED)
        c.roundRect(48, y, 104, 42, 12, stroke=0, fill=1)
        c.setFillColor(INK if i % 2 == 0 else white)
        c.setFont("RajdhaniBold", 10)
        c.drawCentredString(100, y + 15, time)
        paragraph(c, body, 174, y + 27, 373, 11, 14, CREAM, "RajdhaniMedium")
        y -= 88
    info_card(c, "FRIDGE", "Cool promptly, cover and refrigerate for up to 3 days. Reheat until piping hot before adding the remaining ingredients.", 48, 168, 240, 120, GOLD)
    info_card(c, "FREEZER", "Freeze flat in labelled portions for up to 3 months. Defrost in the fridge or reheat gently from frozen with a splash of water.", 307, 168, 240, 120, GOLD)
    paragraph(c, "Food-safety guidance is deliberately conservative. If a batch has been left warm for an extended period, do not rely on reheating to make it safe.", 48, 102, W - 96, 9.5, 12, MUTED, "RajdhaniMedium")
    c.showPage()

    # 18 - troubleshoot
    page_base(c, 18)
    pill(c, "TROUBLESHOOT", 48, 752, fill=RED)
    heading(c, "Fix the cause, not only the symptom", 48, 708, W - 96, 29)
    rows = [
        ("Tastes raw or harsh", "Onions, garlic or tomato needed longer.", "Return to a gentle uncovered cook; add water only if catching."),
        ("Bitter", "Spices or garlic scorched.", "Dilute with more tomato/base; next time lower heat and add water sooner."),
        ("Thin and watery", "Too much liquid or insufficient reduction.", "Simmer uncovered; crush chickpeas or lentils where appropriate."),
        ("Flat", "Salt, acidity or finishing aroma is missing.", "Adjust salt first, then lemon/amchur, then a little garam masala."),
        ("Too hot", "Chilli quantity exceeds the sauce volume.", "Add more unsalted base, tomato, coconut milk or main ingredient."),
        ("Oily", "Too much fat or insufficient emulsification.", "Skim excess, then simmer with a splash of water while stirring."),
    ]
    x0, y0 = 48, 615
    widths = [132, 170, 245]
    headers = ["PROBLEM", "LIKELY CAUSE", "BEST RESPONSE"]
    for i, label in enumerate(headers):
        c.setFillColor(GOLD)
        c.rect(x0 + sum(widths[:i]), y0, widths[i], 34, stroke=0, fill=1)
        c.setFillColor(INK)
        c.setFont("RajdhaniBold", 9)
        c.drawString(x0 + sum(widths[:i]) + 10, y0 + 12, label)
    y = y0 - 71
    for r, row in enumerate(rows):
        fill = SURFACE if r % 2 == 0 else HexColor("#0B1D1F")
        c.setFillColor(fill)
        c.rect(x0, y, sum(widths), 66, stroke=0, fill=1)
        for i, text in enumerate(row):
            paragraph(c, text, x0 + sum(widths[:i]) + 10, y + 47, widths[i] - 20, 9.1, 11.2, CREAM if i == 0 else SOFT, "RajdhaniSemiBold" if i == 0 else "RajdhaniMedium")
        y -= 71
    info_card(c, "SEASON IN ORDER", "Salt changes flavour most dramatically. Acidity brings definition. Sweetness should be a final, small correction - not the first response to an undercooked base.", 48, 92, W - 96, 105, GOLD)
    c.showPage()

    # 19 - spice matrix
    page_base(c, 19)
    pill(c, "SPICE TIMING", 48, 752, fill=GOLD, text_color=INK)
    heading(c, "When a spice enters changes what you taste", 48, 708, W - 96, 29)
    stages = [
        ("HOT FAT", "Cumin seed, mustard seed, cinnamon, clove, cardamom", "Whole spices bloom and perfume the oil."),
        ("WITH TOMATO", "Turmeric, ground cumin, ground coriander, chilli powder", "Powders disperse through a moist, concentrated masala."),
        ("DURING SIMMER", "Bay leaf, black cardamom, mild whole chillies", "Longer extraction gives depth without a raw powdery finish."),
        ("AT THE FINISH", "Garam masala, kasuri methi, fresh coriander", "Volatile aromas remain bright and recognisable."),
        ("FINAL TADKA", "Cumin, mustard, curry leaves, garlic, dried chilli", "A fresh layer of aroma and texture sits above the dish."),
    ]
    y = 605
    for i, (stage, examples, why) in enumerate(stages):
        c.setFillColor(SURFACE)
        c.setStrokeColor(Color(232 / 255, 182 / 255, 41 / 255, alpha=0.28))
        c.roundRect(48, y - 88, W - 96, 96, 14, stroke=1, fill=1)
        c.setFillColor(GOLD if i % 2 == 0 else RED)
        c.setFont("RajdhaniBold", 12)
        c.drawString(64, y - 16, stage)
        c.setFillColor(CREAM)
        c.setFont("RajdhaniSemiBold", 10)
        c.drawString(176, y - 16, examples)
        paragraph(c, why, 64, y - 42, W - 128, 9.8, 12, SOFT, "RajdhaniMedium")
        y -= 110
    paragraph(c, "These are practical patterns, not rigid laws. A dish may use the same spice at more than one stage to create depth.", 48, 58, W - 96, 8.8, 10.5, MUTED, "RajdhaniMedium")
    c.showPage()

    # 20 - practice log / close
    page_base(c, 20, "YOUR PRACTICE LOG")
    pill(c, "COOK · NOTICE · ADJUST", 48, 752, fill=RED)
    heading(c, "Record one batch in enough detail to improve the next", 48, 708, W - 96, 27)
    fields = [
        ("DATE + DISH", 68), ("PAN + HEAT LEVEL", 68), ("ONION COLOUR + TIME", 80),
        ("TOMATO REDUCTION CUE", 80), ("SPICES + WHEN ADDED", 92), ("LIQUID ADDED", 68),
        ("WHAT WORKED", 82), ("ONE CHANGE NEXT TIME", 82),
    ]
    y = 620
    for i, (label, height) in enumerate(fields):
        col = i % 2
        if col == 0 and i:
            y -= fields[i - 2][1] + 18
        x = 48 + col * 259
        c.setFillColor(SURFACE)
        c.setStrokeColor(Color(232 / 255, 182 / 255, 41 / 255, alpha=0.3))
        c.roundRect(x, y - height, 240, height, 12, stroke=1, fill=1)
        c.setFillColor(GOLD)
        c.setFont("RajdhaniBold", 8.5)
        c.drawString(x + 12, y - 18, label)
        c.setStrokeColor(Color(215 / 255, 222 / 255, 220 / 255, alpha=0.18))
        line_y = y - 38
        while line_y > y - height + 12:
            c.line(x + 12, line_y, x + 228, line_y)
            line_y -= 18
    c.setFillColor(GOLD)
    c.setFont("RajdhaniBold", 18)
    c.drawString(48, 122, "Keep learning with Vegan Masala")
    paragraph(c, "Find the full recipes, free guides and clearly disclosed equipment recommendations at vegan-masala.com. Thank you for supporting practical, plant-based Indian cooking.", 48, 96, W - 96, 10.5, 13.5, SOFT, "RajdhaniMedium")
    c.save()


if __name__ == "__main__":
    build()
    print(OUTPUT)
