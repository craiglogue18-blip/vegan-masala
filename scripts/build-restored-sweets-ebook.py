#!/usr/bin/env python3
from pathlib import Path
import math

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import Color, HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Frame, KeepTogether, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/pdf/vegan-masala-vegan-indian-sweets-restored-design.pdf"
ASSETS = ROOT / "tmp/pdfs/ebook-assets"
W, H = 384, 614.4
BG = HexColor("#071719")
PANEL = HexColor("#0b2021")
GOLD = HexColor("#d6b44c")
GOLD2 = HexColor("#f0ce67")
CREAM = HexColor("#f5ead0")
MUTED = HexColor("#cbbf9b")

pdfmetrics.registerFont(TTFont("Rajdhani", str(ROOT / "public/fonts/Rajdhani-Regular.ttf")))
pdfmetrics.registerFont(TTFont("RajdhaniMed", str(ROOT / "public/fonts/Rajdhani-Medium.ttf")))
pdfmetrics.registerFont(TTFont("RajdhaniBold", str(ROOT / "public/fonts/Rajdhani-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Shivaraja", str(ROOT / "public/fonts/Shivaraja.ttf")))

BODY = ParagraphStyle("body", fontName="RajdhaniMed", fontSize=9.3, leading=12.1, textColor=CREAM, spaceAfter=7)
BODY_CENTER = ParagraphStyle("body-center", parent=BODY, alignment=TA_CENTER)
SMALL = ParagraphStyle("small", parent=BODY, fontSize=8.2, leading=10.2)
H2 = ParagraphStyle("h2", fontName="RajdhaniBold", fontSize=11, leading=13, textColor=GOLD2, spaceBefore=4, spaceAfter=4)
BULLET = ParagraphStyle("bullet", parent=BODY, leftIndent=9, firstLineIndent=-7, bulletIndent=0, spaceAfter=3)

RECIPES = [
    dict(name="Jalebi", image="jalebi.png", desc="Crisp spirals dipped briefly in fragrant saffron syrup. The long fermentation develops flavour and helps create the characteristic texture.", stats=[("PREP","20 minutes"),("COOK","45 minutes"),("FERMENT","12-15 hours"),("YIELD","4-6 servings"),("DIFFICULTY","Confident cook")], ingredients=[("Batter",["125 g (1 cup) plain flour","2 tbsp gram flour (besan)","1/4 tsp turmeric","A pinch of baking soda, or 1/2 tsp baking powder","Up to 240 ml (1 cup) water","1-2 tbsp plain flour, only if needed after fermenting"]),("Syrup",["150 g (3/4 cup) sugar","120 ml (1/2 cup) water","A small pinch of saffron strands"]),("For frying",["Neutral oil, as needed"])], method=["Whisk the flours, turmeric and raising agent together.","Add water gradually, whisking to a smooth, thick but pourable batter; you may not need it all.","Whisk briskly for 4 minutes, cover and ferment in a warm place for 12-15 hours until lightly bubbly.","Stir gently. If it no longer holds a ribbon, add 1-2 tbsp flour, then transfer to a squeeze bottle.","Heat sugar, water and saffron until dissolved. Simmer to a light one-thread syrup and keep warm.","Heat 4-5 cm oil to about 170°C. Pipe small spirals and fry until crisp and lightly golden.","Drain briefly, soak in warm syrup for 30-60 seconds per side, then serve warm."], tips=["Keep both oil and syrup warm and steady.","A ribbon of batter should hold briefly when piped.","Do not overcrowd the pan.","A short syrup soak preserves crispness."], serving="Serve warm with masala chai and chopped pistachios.", storage="Best on the day it is made. Refrigerate leftovers for up to 2 days and re-crisp briefly in a low oven."),
    dict(name="Vegan Gulab Jamun", image="gulab.png", desc="Tender cashew-and-breadcrumb jamuns soaked in cardamom syrup. Gentle frying is the key to an evenly cooked centre.", stats=[("PREP","20 minutes"),("COOK","20 minutes"),("SOAK","At least 3 hours"),("YIELD","14 jamuns"),("DIFFICULTY","Intermediate")], ingredients=[("Syrup",["300 ml (1 1/4 cups) water","300 g (1 1/2 cups) sugar","8 green cardamom pods, lightly crushed","1 tbsp lemon juice"]),("Jamuns",["2 1/2 cups fine white breadcrumbs","1/2 cup raw cashews, blended with 1/2 cup water until smooth","Neutral oil, for deep frying"]),("To finish",["2 tbsp chopped pistachios, almonds or cashews (optional)"])], method=["Combine the syrup ingredients, bring to a boil and simmer for 5 minutes. Keep warm.","Add cashew cream gradually to the breadcrumbs, mixing to a soft, pliable dough.","Divide into 14 pieces and roll into completely smooth balls with no cracks.","Heat oil to about 150°C and fry in small batches, moving the jamuns so they colour evenly.","Lift onto kitchen paper for one minute, prick each warm jamun once, then submerge in warm syrup.","Soak for at least 3 hours before serving."], tips=["A dry dough cracks; an overly wet dough can collapse.","Low, steady oil temperature cooks the centres.","Make every ball completely smooth.","Keep the syrup warm, not boiling."], serving="Serve warm with syrup and pistachios; vegan vanilla ice cream is optional.", storage="Cool, cover and refrigerate in syrup for up to 3 days. Reheat gently; do not boil."),
    dict(name="Coconut Ladoo", image="ladoo.png", desc="Soft coconut sweets scented with cardamom. This is the quickest recipe in the collection and an excellent place to begin.", stats=[("PREP","10 minutes"),("COOK","10-15 minutes"),("SET","20 minutes"),("YIELD","10-12 ladoos"),("DIFFICULTY","Beginner")], ingredients=[("Ingredients",["2 cups desiccated coconut, plus extra for rolling","1 cup sweetened condensed coconut milk","1/2 tsp ground cardamom","1 tbsp finely chopped pistachios or almonds","1 tsp coconut oil, only if needed for shaping"])], method=["Combine coconut and condensed coconut milk in a saucepan over low heat.","Stir often until the mixture thickens and begins to pull away from the pan.","Add cardamom and chopped nuts; cook 1-2 minutes until a spoonful holds together.","Cool until safe to handle but still warm.","Lightly grease your hands if needed and roll into 10-12 balls.","Coat in extra coconut and rest for 20 minutes."], tips=["Do not overcook or the ladoos will be dry.","Shape while the mixture is slightly warm.","If too loose, return to low heat for 1-2 minutes.","Use a small scoop for even portions."], serving="Arrange in mini paper cases and finish with pistachio crumbs or saffron.", storage="Refrigerate airtight for up to 5 days. Bring to room temperature for 15 minutes before serving."),
    dict(name="Vegan Kheer", image="kheer.png", desc="Slow-simmered rice pudding with cardamom, nuts and optional rose water. Serve it warm or chilled.", stats=[("PREP","10 minutes"),("COOK","35-45 minutes"),("CHILL","Optional: 2 hours"),("YIELD","4-6 servings"),("DIFFICULTY","Beginner")], ingredients=[("Ingredients",["100 g (1/2 cup) basmati rice","1 litre (4 cups) full-fat plant milk","65-100 g (1/3-1/2 cup) sugar, to taste","4 green cardamom pods, lightly crushed","1 tbsp chopped pistachios or almonds","1 tbsp raisins (optional)","A few saffron strands (optional)","1 tsp rose water (optional)"])], method=["Rinse rice until the water runs mostly clear; drain.","Bring plant milk to a gentle simmer in a heavy saucepan.","Add rice and cardamom. Cook over low heat, stirring frequently.","When the rice is tender and the mixture thickens, add sugar.","Stir in saffron, raisins and most of the nuts, if using.","Cook until creamy but slightly looser than your final preference.","Remove from heat, add rose water if using, and serve warm or chill promptly."], tips=["Stir more frequently as the kheer thickens.","It thickens further as it cools.","Use creamy, neutral-flavoured plant milk.","Add sugar only after the rice is tender."], serving="Serve in small bowls with pistachios, saffron or culinary rose petals.", storage="Cool promptly and refrigerate airtight for up to 3 days. Loosen with plant milk when reheating."),
    dict(name="Carrot Halwa", image="halwa.png", desc="Grated carrots cooked slowly with plant milk, cardamom and nuts until glossy, soft and rich.", stats=[("PREP","15 minutes"),("COOK","40-50 minutes"),("YIELD","4-6 servings"),("BEST SERVED","Warm"),("DIFFICULTY","Beginner")], ingredients=[("Ingredients",["500 g carrots, peeled and evenly grated","2 tbsp vegan butter or coconut oil","500 ml (2 cups) full-fat plant milk","65-100 g (1/3-1/2 cup) sugar, to taste","1/2 tsp ground cardamom","2 tbsp chopped pistachios or almonds","1 tbsp raisins (optional)","A few saffron strands (optional)"])], method=["Heat vegan butter or coconut oil in a wide pan over medium heat.","Add carrots and cook for 4-5 minutes, stirring often.","Pour in plant milk and bring to a gentle simmer.","Cook over medium-low heat until carrots are tender and most milk has reduced.","Add sugar and cardamom; continue until thick, glossy and spoonable, but not dry.","Stir in nuts, raisins and saffron if using; cook 2 minutes more."], tips=["Evenly grated carrots cook at the same rate.","Stir frequently once the liquid reduces.","Do not rush reduction over high heat.","Stop while the halwa is moist and glossy."], serving="Serve warm with nuts, saffron or a spoonful of plant-based cream.", storage="Cool promptly and refrigerate airtight for up to 3 days. Reheat with a splash of plant milk."),
    dict(name="Mango Lassi", image="lassi.png", desc="A cool, creamy vegan mango drink with cardamom. Use fragrant ripe mangoes or good-quality frozen mango.", stats=[("PREP","10 minutes"),("CHILL","Optional: 20 minutes"),("YIELD","4 small glasses"),("BEST SERVED","Cold"),("DIFFICULTY","Beginner")], ingredients=[("Ingredients",["330 g (2 cups) ripe mango, chopped","360 g (1 1/2 cups) unsweetened vegan yogurt","120 ml (1/2 cup) plant milk, plus more if needed","2-3 tbsp sugar or maple syrup, to taste","1/4 tsp ground cardamom","A few ice cubes (optional)","Pistachios or saffron, to garnish (optional)"])], method=["Add mango, yogurt, plant milk, sweetener and cardamom to a blender.","Blend until completely smooth.","Taste and adjust sweetness.","For a thinner lassi, add plant milk one tablespoon at a time.","Add ice and blend briefly if serving immediately.","Pour into four small glasses, garnish if desired and serve cold."], tips=["Ripe, fragrant mango gives the best flavour.","Chill ingredients before blending for a thicker drink.","Add liquid gradually.","Blend thoroughly for a silky finish."], serving="Serve alongside a festive meal or as a cooling afternoon drink with pistachios.", storage="Best freshly blended. Refrigerate no more than 24 hours and stir before serving."),
]

def hex_path(c, cx, cy, r):
    p = c.beginPath()
    pts = [(cx + r*math.cos(math.radians(60*i)), cy + r*math.sin(math.radians(60*i))) for i in range(6)]
    p.moveTo(*pts[0])
    for pt in pts[1:]: p.lineTo(*pt)
    p.close()
    return p

def draw_crop(c, path, x, y, w, h, clip=None):
    im = ImageReader(str(path)); iw, ih = im.getSize()
    scale = max(w/iw, h/ih); dw, dh = iw*scale, ih*scale
    c.saveState()
    if clip is not None: c.clipPath(clip, stroke=0, fill=0)
    else:
        p=c.beginPath(); p.roundRect(x,y,w,h,8); c.clipPath(p,stroke=0,fill=0)
    c.drawImage(im, x+(w-dw)/2, y+(h-dh)/2, dw, dh, mask="auto")
    c.restoreState()

def background(c, page_no=None):
    c.setFillColor(BG); c.rect(0,0,W,H,stroke=0,fill=1)
    c.saveState(); c.setStrokeColor(Color(.32,.48,.40,alpha=.16)); c.setLineWidth(.35)
    for y in range(18, int(H), 44):
        for x in range(18, int(W), 44):
            c.circle(x,y,7,stroke=1,fill=0); c.line(x-10,y,x+10,y); c.line(x,y-10,x,y+10)
    c.restoreState()
    c.setStrokeColor(GOLD); c.setLineWidth(1.2); c.roundRect(7,7,W-14,H-14,9,stroke=1,fill=0)
    c.setLineWidth(.35); c.roundRect(11,11,W-22,H-22,7,stroke=1,fill=0)
    if page_no:
        c.setFillColor(GOLD); c.setFont("RajdhaniMed",6.8); c.drawCentredString(W/2,16,"WWW.VEGAN-MASALA.COM")
        c.drawRightString(W-17,16,str(page_no))

def logo(c, y=570, width=58):
    p=ROOT/"public/brand/logo-flat.png"
    im=ImageReader(str(p)); iw,ih=im.getSize(); c.drawImage(im,W/2-width/2,y-width*ih/iw,width,width*ih/iw,mask="auto")

def title(c, text, y, size=27, align="center"):
    c.setFillColor(GOLD2); c.setFont("Shivaraja",size)
    if align=="center": c.drawCentredString(W/2,y,text)
    else: c.drawString(28,y,text)

def framed_flow(c, x,y,w,h, items, pad=12):
    c.setFillColor(Color(.03,.11,.11,alpha=.78)); c.setStrokeColor(GOLD); c.setLineWidth(.85); c.roundRect(x,y,w,h,9,stroke=1,fill=1)
    f=Frame(x+pad,y+pad,w-2*pad,h-2*pad,showBoundary=0,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0)
    f.addFromList(items,c)

def p(text, style=BODY): return Paragraph(text, style)
def bullets(lines): return [Paragraph("• "+s, BULLET) for s in lines]

def cover(c):
    background(c); logo(c,548,72); title(c,"Vegan Indian Sweets",485,31)
    c.setFillColor(CREAM); c.setFont("RajdhaniMed",10); c.drawCentredString(W/2,461,"A Mini Ebook of Comforting Desserts")
    imgs=[ASSETS/"cover-1.png",ASSETS/"cover-2.png",ASSETS/"cover-3.png"]
    specs=[(94,345,55),(192,319,79),(293,350,50)]
    for im,(cx,cy,r) in zip(imgs,specs):
        hp=hex_path(c,cx,cy,r); draw_crop(c,im,cx-r,cy-r,r*2,r*2,hp); c.setStrokeColor(GOLD2); c.setLineWidth(1.8); c.drawPath(hp,stroke=1,fill=0)
    c.setFillColor(MUTED); c.setFont("RajdhaniMed",8.4); c.drawCentredString(W/2,226,"Six classic-inspired recipes, practical guidance")
    c.drawCentredString(W/2,214,"and a beautifully planned celebration menu")
    c.setFillColor(GOLD); c.setFont("RajdhaniBold",8); c.drawCentredString(W/2,28,"WWW.VEGAN-MASALA.COM")

def simple_page(c,no,heading,paras,art=None):
    background(c,no); logo(c,592,32); title(c,heading,523,22)
    y=62; h=440
    if art:
        hp=hex_path(c,305,454,45); draw_crop(c,ASSETS/art,260,409,90,90,hp); c.setStrokeColor(GOLD2); c.setLineWidth(1.3); c.drawPath(hp,stroke=1,fill=0)
        h=330
    framed_flow(c,25,y,334,h,[p(x) for x in paras])

def recipe_intro(c,no,r):
    background(c,no); logo(c,592,32); c.setFillColor(GOLD); c.setFont("RajdhaniBold",8); c.drawString(27,540,"RECIPE")
    title(c,r["name"],508,25,"left")
    img=ASSETS/r["image"]
    for cx,cy,rad,dx in [(112,392,74,-12),(257,408,58,22),(298,323,38,-28)]:
        hp=hex_path(c,cx,cy,rad); draw_crop(c,img,cx-rad+dx,cy-rad,2*rad,2*rad,hp); c.setStrokeColor(GOLD2); c.setLineWidth(1.35); c.drawPath(hp,stroke=1,fill=0)
    framed_flow(c,27,236,330,66,[p(r["desc"],BODY_CENTER)],10)
    data=[]
    for k,v in r["stats"]: data.append([Paragraph(k,ParagraphStyle("k",parent=SMALL,textColor=GOLD2,fontName="RajdhaniBold")),Paragraph(v,SMALL)])
    t=Table(data,colWidths=[72,205],rowHeights=26)
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(0,-1),Color(.11,.20,.17,alpha=.85)),("BOX",(0,0),(-1,-1),.7,GOLD),("INNERGRID",(0,0),(-1,-1),.3,GOLD),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("LEFTPADDING",(0,0),(-1,-1),8)]))
    framed_flow(c,43,67,298,149,[t],8)

def recipe_ingredients(c,no,r):
    background(c,no); logo(c,592,32); title(c,r["name"],524,22,"left")
    img=ASSETS/r["image"]; hp=hex_path(c,307,475,48); draw_crop(c,img,259,427,96,96,hp); c.setStrokeColor(GOLD2); c.drawPath(hp,stroke=1,fill=0)
    items=[]
    for head,lines in r["ingredients"]:
        items.append(p(head,H2)); items.extend(bullets(lines))
    framed_flow(c,24,48,336,414,items,14)

def recipe_method(c,no,r):
    background(c,no); logo(c,592,32); title(c,r["name"]+": Method",524,20,"left")
    img=ASSETS/r["image"]
    hp=hex_path(c,300,468,46); draw_crop(c,img,254,422,92,92,hp); c.setStrokeColor(GOLD2); c.drawPath(hp,stroke=1,fill=0)
    items=[]
    for i,s in enumerate(r["method"],1): items.append(p(f"<font color='#f0ce67'><b>{i}.</b></font> {s}",SMALL))
    framed_flow(c,23,48,338,410,items,14)

def recipe_tips(c,no,r):
    background(c,no); logo(c,592,32); title(c,r["name"]+": Make It Well",524,19,"left")
    img=ASSETS/r["image"]
    for cx,cy,rad,off in [(99,449,54,-18),(282,452,50,15)]:
        hp=hex_path(c,cx,cy,rad); draw_crop(c,img,cx-rad+off,cy-rad,2*rad,2*rad,hp); c.setStrokeColor(GOLD2); c.drawPath(hp,stroke=1,fill=0)
    items=[p("Success tips",H2),*bullets(r["tips"]),p("Serving ideas",H2),p(r["serving"]),p("Storage",H2),p(r["storage"])]
    framed_flow(c,25,55,334,329,items,14)

def build():
    c=canvas.Canvas(str(OUT),pagesize=(W,H),pageCompression=1)
    c.setTitle("Vegan Indian Sweets - Restored Original Design Edition"); c.setAuthor("Vegan Masala")
    cover(c); c.showPage()
    simple_page(c,2,"Contents",["A practical route from pantry to plate. Every recipe includes timings, yield, difficulty, success tips, serving ideas and safe storage guidance.","<b>Welcome</b> • Pantry essentials • Tools you actually need • Master shopping list","<b>Recipes</b> • Jalebi • Vegan gulab jamun • Coconut ladoo • Vegan kheer • Carrot halwa • Mango lassi","<b>Finishing well</b> • Troubleshooting • A simple celebration menu • Festive serving ideas • About Vegan Masala"],"cover-2.png"); c.showPage()
    simple_page(c,3,"Welcome",["Indian sweets have a way of turning ordinary moments into something memorable. They belong at festivals and family gatherings, but they can also make a quiet afternoon feel special.","This revised collection is designed for real home kitchens. It keeps the warmth and character of familiar Indian sweets while making the process easier to understand.","Read each recipe fully before beginning. Measure carefully, keep the heat steady and allow the stated resting, soaking or chilling time.","I hope these recipes bring confidence, warmth and a little sweetness to your kitchen.<br/><br/><b>Craig<br/>Vegan Masala</b>"],"cover-3.png"); c.showPage()
    simple_page(c,4,"Pantry Essentials",["<b>Cardamom</b><br/>The signature warm fragrance in many Indian desserts. Freshly crush pods when possible.","<b>Saffron</b><br/>Adds aroma, colour and a festive finish. Steep a few strands in warm plant milk or water.","<b>Rose water</b><br/>Use sparingly; too much can overpower a dessert.","<b>Nuts</b><br/>Pistachios, almonds and cashews add richness, texture and colour.","<b>Coconut, rice and semolina</b><br/>Dependable foundations for dairy-free sweets, puddings and halwa.","<b>Full-fat plant milk and vegan yogurt</b><br/>Choose neutral-flavoured, creamy varieties."],"kheer.png"); c.showPage()
    simple_page(c,5,"Tools You Actually Need",["• Heavy-bottomed saucepan for syrups, kheer and halwa","• Wide, deep pan or kadai for frying","• Mixing bowls and a sturdy whisk","• Blender for mango lassi and cashew cream","• Digital kitchen scales plus measuring spoons","• Slotted spoon and a cooking thermometer","• Squeeze bottle or piping bag for jalebi","• Tray lined with baking paper for shaping and draining"],"jalebi.png"); c.showPage()
    simple_page(c,6,"Master Shopping List",["<b>Fresh and chilled</b><br/>500 g carrots; 2 ripe mangoes; lemons; full-fat plant milk; unsweetened vegan yogurt; vegan butter","<b>Baking and dry goods</b><br/>Plain flour; gram flour; basmati rice; white breadcrumbs; desiccated coconut; sugar; raisins","<b>Nuts</b><br/>Raw cashews; pistachios; almonds","<b>Spices and flavourings</b><br/>Green cardamom; ground cardamom; saffron; rose water; turmeric","<b>Cooking</b><br/>Neutral oil; coconut oil; sweetened condensed coconut milk; baking soda or baking powder"],"ladoo.png"); c.showPage()
    no=7
    for r in RECIPES:
        recipe_intro(c,no,r); c.showPage(); recipe_ingredients(c,no+1,r); c.showPage(); recipe_method(c,no+2,r); c.showPage(); recipe_tips(c,no+3,r); c.showPage(); no+=4
    simple_page(c,31,"Troubleshooting",["<b>Syrup is too thin</b><br/>Simmer a little longer, then test again. Syrup thickens slightly as it cools.","<b>Jalebi is soft or spreads</b><br/>The batter may be thin, the oil too cool or the syrup soak too long. Thicken slightly and confirm the oil is near 170°C.","<b>Gulab jamun cracks or feels dense</b><br/>Adjust dry dough with care, roll completely smooth and avoid overworking it.","<b>Ladoo will not hold</b><br/>Cook for another minute, then cool slightly.","<b>Kheer is thin or too thick</b><br/>Simmer gently to thicken, or loosen with plant milk a splash at a time."],"gulab.png"); c.showPage()
    simple_page(c,32,"A Simple Celebration Menu",["For a balanced table, choose one syrup sweet, one creamy dessert and one fresh drink rather than making all six recipes at once.","<b>The day before</b><br/>• Prepare and soak the gulab jamun.<br/>• Cook the kheer and chill it.<br/>• Measure jalebi ingredients and begin fermentation.","<b>On the day</b><br/>• Shape coconut ladoo in the morning.<br/>• Cook carrot halwa and keep it ready to reheat.<br/>• Fry jalebi close to serving.<br/>• Blend mango lassi just before guests arrive.","<b>Suggested trio</b><br/>Warm gulab jamun, chilled mango lassi and coconut ladoo give contrasting temperatures and textures."],"cover-1.png"); c.showPage()
    simple_page(c,33,"Festive Serving Ideas",["• Scatter pistachios or almonds just before serving.","• Steep saffron so a few strands give more aroma and colour.","• Serve warm sweets in small bowls for generous but manageable portions.","• Arrange ladoo and jalebi on one platter with space between each type.","• Use culinary rose petals sparingly.","• Pair sweets with masala chai after a meal.","• Keep chilled desserts cold until serving and refrigerate leftovers promptly."],"jalebi.png"); c.showPage()
    simple_page(c,34,"About Vegan Masala",["Vegan Masala is a home for vegan Indian recipes, cooking guides and flavour-first food rooted in comfort, tradition and real kitchens.","The aim is simple: to make vegan Indian cooking feel approachable, beautiful and worth returning to. Whether it is a weeknight curry, a spice guide or a festive dessert, every recipe is designed to feel warm, practical and full of character.","For more recipes, guides and meal-planning help, visit:<br/><br/><font color='#f0ce67'><b>www.vegan-masala.com</b></font>","<br/><b>Thank you for supporting Vegan Masala.</b>"],"cover-2.png"); c.showPage()
    c.save()
    print(OUT)

if __name__ == "__main__": build()
