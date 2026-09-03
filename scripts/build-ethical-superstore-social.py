from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public/images/social/ethical-superstore"
OUT.mkdir(parents=True, exist_ok=True)

BG = ROOT / "public/images/social/ethical-superstore/ethical-shopping-background.png"
VM_LOGO = ROOT / "public/brand/logo-primary.png"
ES_LOGO = ROOT / "public/images/affiliates/ethical-superstore-logo.png"
FONT_REG = ROOT / "public/fonts/Rajdhani-Regular.ttf"
FONT_SEMI = ROOT / "public/fonts/Rajdhani-SemiBold.ttf"
FONT_BOLD = ROOT / "public/fonts/Rajdhani-Bold.ttf"

W, H = 1080, 1350
GOLD = "#dfb93f"
CREAM = "#fff8e7"
MUTED = "#d8d3c6"
INK = "#081114"
BLUE = "#27a9df"


def font(path, size):
    return ImageFont.truetype(str(path), size)


def contain(image, box):
    x, y, w, h = box
    copy = image.copy()
    copy.thumbnail((w, h), Image.Resampling.LANCZOS)
    return copy, (x + (w - copy.width) // 2, y + (h - copy.height) // 2)


def cover(image, size):
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def rounded_panel(canvas, box, fill, outline=None, width=2, radius=28):
    ImageDraw.Draw(canvas).rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def paste_contained(canvas, image, box):
    sized, pos = contain(image, box)
    canvas.alpha_composite(sized, pos)


def line(draw, xy, text, fnt, fill, anchor="la"):
    draw.text(xy, text, font=fnt, fill=fill, anchor=anchor)


bg = cover(Image.open(BG).convert("RGB"), (W, H))
bg = ImageEnhance.Brightness(bg).enhance(0.70).convert("RGBA")
vm = Image.open(VM_LOGO).convert("RGBA")
es = Image.open(ES_LOGO).convert("RGBA")

# Slide 1: announcement cover
s1 = bg.copy()
d = ImageDraw.Draw(s1)
d.rectangle((0, 0, W, 650), fill=(5, 12, 14, 185))
d.rectangle((42, 42, W - 42, H - 42), outline=GOLD, width=3)
paste_contained(s1, vm, (70, 72, 250, 220))
rounded_panel(s1, (696, 78, 985, 238), (255, 255, 255, 246), radius=22)
paste_contained(s1, es, (725, 104, 230, 110))
line(d, (72, 336), "A MORE THOUGHTFUL WAY", font(FONT_BOLD, 48), GOLD)
line(d, (72, 392), "TO STOCK YOUR", font(FONT_BOLD, 48), CREAM)
line(d, (72, 448), "VEGAN INDIAN KITCHEN", font(FONT_BOLD, 48), CREAM)
line(d, (74, 545), "Vegan Masala is now affiliated with Ethical Superstore", font(FONT_REG, 28), MUTED)
rounded_panel(s1, (72, 1166, 415, 1224), (5, 12, 14, 220), outline=GOLD, radius=29)
line(d, (243, 1196), "AD · AFFILIATE PARTNERSHIP", font(FONT_SEMI, 22), CREAM, "mm")
line(d, (72, 1265), "vegan-masala.com", font(FONT_SEMI, 26), CREAM)
s1.convert("RGB").save(OUT / "ethical-superstore-carousel-01.jpg", quality=94, subsampling=0)

# Slide 2: benefit-led explainer
s2 = Image.new("RGBA", (W, H), INK)
d = ImageDraw.Draw(s2)
d.rectangle((42, 42, W - 42, H - 42), outline=GOLD, width=3)
paste_contained(s2, vm, (72, 72, 190, 165))
line(d, (74, 286), "SHOP WITH YOUR VALUES", font(FONT_BOLD, 58), GOLD)
line(d, (74, 358), "IN MIND", font(FONT_BOLD, 58), CREAM)

cards = [
    ("01", "PANTRY", "Plant-based cupboard staples\nfor everyday Indian cooking"),
    ("02", "HOUSEHOLD", "More ethical choices beyond\nthe ingredients list"),
    ("03", "PURPOSE", "Your purchase can support\nindependent Vegan Masala content"),
]
for i, (num, title, body) in enumerate(cards):
    y = 490 + i * 220
    rounded_panel(s2, (72, y, 1008, y + 176), (16, 28, 31, 255), outline="#5b512f", radius=22)
    line(d, (112, y + 56), num, font(FONT_BOLD, 42), BLUE, "lm")
    line(d, (210, y + 46), title, font(FONT_BOLD, 31), GOLD)
    line(d, (210, y + 91), body, font(FONT_REG, 27), CREAM)

line(d, (74, 1200), "Recommendations stay relevant to our recipes and guides.", font(FONT_REG, 26), MUTED)
line(d, (74, 1255), "Ad · Affiliate partnership", font(FONT_SEMI, 22), CREAM)
s2.convert("RGB").save(OUT / "ethical-superstore-carousel-02.jpg", quality=94, subsampling=0)

# Slide 3: clear action and disclosure
s3 = bg.copy()
d = ImageDraw.Draw(s3)
d.rectangle((0, 0, W, H), fill=(4, 11, 13, 160))
d.rectangle((42, 42, W - 42, H - 42), outline=GOLD, width=3)
rounded_panel(s3, (105, 156, 975, 1045), (5, 13, 15, 235), outline="#6a5a29", radius=34)
paste_contained(s3, vm, (180, 205, 260, 225))
rounded_panel(s3, (590, 230, 885, 395), (255, 255, 255, 248), radius=24)
paste_contained(s3, es, (620, 260, 235, 110))
line(d, (540, 510), "FIND OUR ETHICAL", font(FONT_BOLD, 50), CREAM, "ma")
line(d, (540, 572), "SHOPPING PICKS", font(FONT_BOLD, 50), GOLD, "ma")
line(d, (540, 668), "Look for Ethical Superstore recommendations", font(FONT_REG, 29), MUTED, "ma")
line(d, (540, 708), "inside selected Vegan Masala guides and plans.", font(FONT_REG, 29), MUTED, "ma")
rounded_panel(s3, (265, 792, 815, 884), "#a92d2c", radius=18)
line(d, (540, 840), "VISIT VEGAN-MASALA.COM", font(FONT_BOLD, 31), "white", "mm")
line(d, (540, 952), "We may earn a commission at no extra cost to you.", font(FONT_REG, 24), MUTED, "ma")
line(d, (72, 1215), "AD · AFFILIATE PARTNERSHIP", font(FONT_SEMI, 22), CREAM)
line(d, (72, 1265), "Thoughtful shopping. Authentic vegan Indian cooking.", font(FONT_REG, 25), CREAM)
s3.convert("RGB").save(OUT / "ethical-superstore-carousel-03.jpg", quality=94, subsampling=0)

print("\n".join(str(OUT / f"ethical-superstore-carousel-0{i}.jpg") for i in range(1, 4)))
