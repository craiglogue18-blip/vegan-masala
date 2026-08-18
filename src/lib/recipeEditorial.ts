export type RecipeEditorialCopy = {
  description: string;
  introNote?: string;
};

// Hand-edited copy for recipes whose imported frontmatter was repetitive or too generic.
// Keeping these overrides together makes the public voice easy to review without changing
// ingredients, quantities or cooking instructions.
export const recipeEditorialCopy: Record<string, RecipeEditorialCopy> = {
  "aloo-baingan-recipe": {
    description: "Aloo baingan is one of those quietly brilliant curries: silky aubergine, tender potato and a tomato masala that clings to every piece. It is simple home cooking with a great deal of flavour.",
    introNote: "I love the way aubergine softens into the masala while the potato keeps its shape. Let both vegetables colour properly before adding the tomato; that small bit of patience gives this everyday curry its lovely depth.",
  },
  "aloo-methi-potato-and-fenugreek-leaves-curry": {
    description: "Earthy potatoes and fragrant fenugreek leaves make aloo methi a wonderfully savoury dry curry. It is gently spiced, comforting and especially good scooped up with a warm chapati.",
    introNote: "Fresh methi has a distinctive, slightly bitter fragrance that I find irresistible with potatoes. Cook the leaves until their moisture has evaporated and the flavour turns mellow, savoury and beautifully concentrated.",
  },
  "aloo-muttar": {
    description: "Aloo matar brings soft potatoes and sweet peas together in a warmly spiced tomato gravy. This dependable North Indian-style curry is colourful, comforting and made for tearing into with fresh roti.",
    introNote: "The pleasure of aloo matar is in the contrast between floury potato and little bursts of sweet pea. I cook the tomato masala until glossy before adding either, so the finished gravy tastes rounded rather than raw.",
  },
  "aloo-pakora": {
    description: "Thin slices of potato are wrapped in a cumin-and-chilli gram-flour batter and fried until crisp. These aloo pakoras are exactly the sort of hot, savoury snack that calls for chutney and a cup of chai.",
    introNote: "Pakoras should arrive at the table audibly crisp. Slice the potatoes evenly, keep the batter thick enough to cling and fry in small batches so the oil stays hot and the centres cook through.",
  },
  "aloo-tofu-recipe": {
    description: "Aloo tofu masala pairs golden tofu with tender potatoes in a lively onion-and-tomato sauce. It is a satisfying plant-based curry with enough spice and texture to make a proper centrepiece.",
    introNote: "Tofu and potato both reward a little browning before they meet the sauce. That golden crust gives the masala something to hold on to and makes every mouthful taste far more considered.",
  },
  "bengali-phulkopir-aloo-dalna": {
    description: "Phulkopir aloo dalna is a Bengali cauliflower and potato curry scented with cumin, ginger and garam masala. The light tomato gravy lets the sweet, browned vegetables remain the stars.",
    introNote: "This is not a lentil dal but a Bengali-style dalna: vegetables in a gently spiced gravy. Browning the cauliflower and potatoes first is worth the extra pan time because it brings out their sweetness and helps them hold together.",
  },
  "bombay-aloo": {
    description: "Bombay aloo coats fluffy potatoes in a punchy tomato masala with mustard seed, cumin and chilli. It is bold, tangy and just as welcome beside dal as it is tucked into a chapati.",
    introNote: "The best Bombay potatoes have crisp, craggy edges beneath the masala. Give the boiled potatoes space in the pan, then fold them through the spices gently so they stay chunky while soaking up all that flavour.",
  },
  "chana-masala": {
    description: "Chana masala is a deeply savoury chickpea curry built on browned onion, tomato and warming spices. A squeeze of lemon and fresh coriander lift the rich gravy just before it reaches the table.",
    introNote: "Chana masala is a recipe I never tire of cooking. Crush a few chickpeas into the sauce as it simmers: they thicken the gravy naturally and help that carefully cooked masala cling to every spoonful.",
  },
  "chapati-recipe": {
    description: "These soft whole-wheat chapatis puff on a hot pan and stay tender enough to fold around curry or dal. A short ingredient list and a well-rested dough are all you need.",
    introNote: "Making chapatis becomes wonderfully instinctive after a few rounds. Aim for a soft, supple dough, let it rest, and roll with a light hand; the little puff on the pan is always a satisfying moment.",
  },
  "chickpea-curry-recipe": {
    description: "This chickpea coconut curry combines a warmly spiced tomato base with creamy coconut milk and hearty chickpeas. It is generous, soothing and particularly good when the gravy is mopped up with rice.",
    introNote: "Coconut milk should soften the spices, not hide them. I let the onion, tomato and ground spices cook down first, then add the coconut so the finished curry keeps both its fragrance and its creamy character.",
  },
  "creamy-tofu-korma-curry": {
    description: "Golden tofu sits in a silky korma sauce enriched with nuts, coconut and gentle aromatic spices. This is a mellow, luxurious curry that proves vegan comfort food need never be short of character.",
    introNote: "Korma is about fragrance and texture rather than fierce heat. Blend the sauce until genuinely smooth and taste for balance at the end; the sweetness, spice and richness should support one another.",
  },
  "dum-aloo-recipe-mughlai-style": {
    description: "Mughlai-style dum aloo nestles little potatoes in a rich, aromatic gravy with cashew, tomato and warming spice. Slow simmering turns humble ingredients into a wonderfully celebratory curry.",
    introNote: "Dum cooking asks you to slow down, which is part of its charm. Prick and brown the potatoes before simmering them gently so the creamy gravy works its way in rather than merely coating the outside.",
  },
  "dum-tofu-recipe": {
    description: "Dum tofu layers golden tofu with a concentrated onion-and-tomato masala, then cooks it gently so the spices settle into the sauce. The result is aromatic, rich and deeply comforting.",
    introNote: "The final covered simmer is where this curry comes together. Keep the heat low and resist the urge to hurry; the tofu absorbs more flavour and the masala loses any sharp edges.",
  },
  "easy-butter-bean-curry": {
    description: "Plump butter beans make this tomato-based curry especially creamy and satisfying. Cumin, coriander and garam masala bring warmth while the beans turn an easy supper into something substantial.",
    introNote: "Butter beans are excellent at carrying a masala because their centres stay soft and buttery. Simmer them long enough for a few to break down into the sauce, but keep most whole for texture.",
  },
  "eggplant-curry-south-indian-brinjal-curry": {
    description: "This South Indian brinjal curry balances melting aubergine with mustard seeds, curry leaves, tomato and tamarind. It is tangy, aromatic and full of the flavours that make a bowl of rice disappear quickly.",
    introNote: "Aubergine drinks in spice and sourness beautifully. Let it soften without collapsing completely, and add the tamarind with care—the finished curry should feel bright and rounded, never sharply sour.",
  },
  "gobi-65-recipe-cauliflower-65-fry": {
    description: "Cauliflower 65 is crisp, fiery and fragrant with curry leaves, chilli and ginger. These craggy little florets make an irresistible South Indian-inspired snack or starter served straight from the pan.",
    introNote: "This is all about a light, crisp coating and a bold final tempering. Dry the cauliflower well, avoid crowding the oil and toss it with the curry leaves only when you are ready to serve.",
  },
  "indian-red-lentil-dahl": {
    description: "Red lentils melt into a creamy dal brightened with tomato, ginger and a fragrant spiced tempering. It is economical, nourishing and one of the most comforting bowls I know how to make.",
    introNote: "I like red lentils cooked until they lose their edges and become almost velvety. The tempering added at the end provides contrast: sizzling spice and garlic against the calm, creamy dal beneath.",
  },
  "indian-style-cauliflower": {
    description: "Roasted cauliflower takes beautifully to cumin, coriander, turmeric and chilli, emerging caramelised at the edges and tender inside. Lime and fresh coriander keep every bite lively.",
    introNote: "A hot tray and plenty of space are the secrets here. When cauliflower roasts rather than steams, its nutty sweetness deepens and the ground spices form a delicious crust around each floret.",
  },
  "instant-pot-chana-masala": {
    description: "Instant Pot chana masala delivers tender chickpeas and a full-bodied onion-tomato gravy with very little tending. The pressure cooker draws the spices together while keeping this family favourite practical.",
    introNote: "The pressure cooker saves time, but the sauté stage still matters. Cook the aromatics and tomatoes until the masala looks glossy before sealing the pot; that foundation gives the quick method a slow-cooked taste.",
  },
  "instant-pot-chickpea-coconut-curry": {
    description: "This Instant Pot chickpea curry is creamy with coconut, warmly spiced and easy enough for a busy evening. The chickpeas become tender while the tomato-rich gravy develops under pressure.",
    introNote: "Add the coconut with enough seasoning to keep the curry bright and savoury. Once the pressure drops, a short uncovered simmer will tighten the sauce and let you adjust the balance properly.",
  },
  "instant-pot-vegan-methi-chicken-curry-with-creamy-fenugreek-onion-sauce": {
    description: "Soy curls soak up a creamy fenugreek-and-onion sauce in this Instant Pot methi curry. Kasuri methi gives the gravy its unmistakable savoury perfume and a lovely restaurant-style finish.",
    introNote: "Dried fenugreek is powerful, so rub it between your palms and add it with intention. Its bittersweet aroma should linger around the creamy sauce without overwhelming the warm spices underneath.",
  },
  "jeera-aloo": {
    description: "Jeera aloo tosses tender potatoes with toasted cumin, ginger, chilli and a squeeze of lemon. It is a dry, fragrant dish whose simplicity makes every spice count.",
    introNote: "Wait for the cumin seeds to sizzle and darken slightly before the potatoes go in. That first bloom of spice perfumes the oil and gives this modest dish the unmistakable flavour it deserves.",
  },
  "kala-chana-recipe": {
    description: "Kala chana curry has a wonderfully earthy flavour, with black chickpeas simmered in a robust onion-and-tomato masala. It is hearty, protein-rich and even better after the spices have had time to settle.",
    introNote: "Black chickpeas are firmer and nuttier than their pale cousins, so soak and cook them until fully tender. Their cooking liquid is useful too; it gives the gravy body without muting the spices.",
  },
  "kashmiri-dum-aloo": {
    description: "Kashmiri dum aloo cooks browned baby potatoes in a fragrant fennel, ginger and chilli gravy. The sauce is vivid and aromatic, with warmth rather than one-dimensional heat.",
    introNote: "Fennel and Kashmiri chilli give this dish its distinctive personality. Cook the potatoes gently under a lid so they absorb the gravy, then uncover at the end if the sauce needs concentrating.",
  },
  "madra-recipe-himachali-rajma-madra-recipe": {
    description: "Rajma madra is a Himachali kidney bean curry with a tangy, spiced yogurt-style gravy. It is rich with cardamom, cumin and clove, yet the beans keep it grounded and deeply comforting.",
    introNote: "The gravy needs calm, steady heat so the yogurt alternative stays smooth. Keep stirring as it warms, then allow the whole spices to perfume the beans during a patient simmer.",
  },
  "madras-curry-tofu-casserole": {
    description: "This Madras tofu casserole bakes tofu and vegetables in a bold, coconut-laced curry sauce. It has lively chilli heat, toasted spice and the easy generosity of a dish made for sharing.",
    introNote: "Baking gives the tofu time to take on the sauce while the top develops tempting roasted edges. Taste the gravy before it goes into the oven, remembering that the flavours will concentrate as it cooks.",
  },
  "matar-tofu-recipe": {
    description: "Matar tofu brings golden cubes of tofu and sweet green peas together in a classic onion-tomato masala. It is colourful, homely and a lovely vegan answer to matar paneer.",
    introNote: "Peas bring sweetness to a savoury masala, while browned tofu supplies the satisfying bite. Add the peas late enough to keep their colour and give the tofu a few minutes to settle into the gravy.",
  },
  "mushroom-masala-recipe-punjabi-mushroom-curry": {
    description: "Mushroom masala folds browned mushrooms into a Punjabi-style tomato gravy fragrant with cumin, coriander and garam masala. The mushrooms keep it juicy and intensely savoury.",
    introNote: "Cook the mushrooms over a lively heat first so they colour instead of releasing all their water into the sauce. Once browned, they take on the masala beautifully without losing their texture.",
  },
  "onion-bhaji": {
    description: "These onion bhajis are all crisp edges, sweet onion and fragrant gram-flour batter. Cumin, coriander and chilli make them deeply savoury—the perfect excuse to open the chutney jars.",
    introNote: "Salt draws moisture from the onions, and that moisture helps form the batter. Mix with your hands, add water sparingly and keep the shapes loose; the stray onion strands become the crunchiest bits.",
  },
  "oriya-ghanta-tarkari": {
    description: "Odia ghanta tarkari is a generous mixed-vegetable curry in which pumpkin, potato and pulses share a gently spiced gravy. Every spoonful is different, yet the dish feels beautifully unified.",
    introNote: "Ghanta tarkari celebrates variety, so cut the vegetables to suit their cooking times rather than making every piece identical. Add the firmer ones first and stir gently as the softer vegetables join them.",
  },
  "palak-chole": {
    description: "Palak chole combines hearty chickpeas with a vivid spinach masala, balancing earthy greens, tomato and warming spice. It is nourishing, full-flavoured and excellent with rice or roti.",
    introNote: "Spinach gives this curry freshness as well as body. Cook it just enough to lose its rawness, then blend to the texture you enjoy before letting the chickpeas simmer in the green gravy.",
  },
  "palak-tofu-recipe": {
    description: "Palak tofu pairs crisp-edged tofu with a smooth, garlicky spinach sauce. The deep green gravy is fresh and earthy, making this a vibrant plant-based take on a much-loved classic.",
    introNote: "Keep the spinach bright by cooking it briefly, and brown the tofu separately for contrast. I like the sauce mostly smooth but not overworked, so it still tastes unmistakably of fresh greens.",
  },
  "paneer-tikka-masala-recipe-restaurant-style": {
    description: "Charred tofu tikka meets a silky tomato, cashew and spice sauce in this restaurant-style vegan curry. Smoky edges and a rich gravy make it feel properly special.",
    introNote: "The char on the tofu is not merely decorative—it gives the creamy sauce contrast and savoury depth. Let the marinade cling, cook the pieces until bronzed and fold them into the gravy near the end.",
  },
  "poori": {
    description: "Poori is a small whole-wheat bread that balloons in hot oil, becoming crisp outside and soft within. Served straight away with curry or pickle, it turns a meal into an occasion.",
    introNote: "A firm dough and properly hot oil are what make poori puff. Roll each round evenly and slide it in carefully; a gentle press with the spoon encourages that magical balloon shape.",
  },
  "pressure-cooker-indian-moong-dal": {
    description: "Whole green moong becomes creamy and deeply savoury in the pressure cooker while keeping just enough texture. A fragrant tadka turns this humble dal into a satisfying meal.",
    introNote: "Whole moong needs more time than split lentils, but the pressure cooker handles that beautifully. Cook the beans until yielding, then add the sizzling tempering at the end so its aroma stays vivid.",
  },
  "rajma-recipe": {
    description: "Punjabi rajma masala simmers kidney beans in a thick onion-and-tomato gravy until everything tastes rich and settled. This is unhurried comfort food, best spooned over steaming basmati rice.",
    introNote: "Rajma should be creamy enough that a few beans collapse into the gravy. Give it a patient final simmer after adding the beans; this is where separate ingredients become one deeply comforting curry.",
  },
  "saag-aloo": {
    description: "Saag aloo folds tender potatoes through warmly spiced greens with garlic, tomato and garam masala. It is earthy, nourishing and just as happy beside dal as it is filling a warm roti.",
    introNote: "Potato softens the mineral character of the greens, while the greens keep the dish from feeling heavy. Let the masala cook properly before folding them together and adjust the seasoning only at the end.",
  },
  "samosa-recipe": {
    description: "These samosas hide a fragrant potato-and-pea filling inside crisp, flaky pastry. Cumin, coriander and amchur make every bite savoury, tangy and worthy of a generous spoonful of chutney.",
    introNote: "Good samosa pastry should blister and shatter, not turn hard. Keep the dough firm, rest it well and fry slowly enough for the layers to crisp before the outside takes on too much colour.",
  },
  "sweet-potato-chickpea-spinach-curry": {
    description: "Sweet potato, chickpeas and spinach make a colourful curry with creamy coconut, warming spice and plenty of texture. The natural sweetness is balanced by tomato, chilli and fresh herbs.",
    introNote: "Sweet potato can make a curry taste flat if it is not balanced, so be generous with savoury spice and finish with acidity. Add the spinach last to keep its colour and freshness.",
  },
  "tofu-butter-masala-recipe": {
    description: "Tofu butter masala places golden tofu in a velvety tomato-cashew gravy, finished with aromatic garam masala. It is lush, gently spiced and every bit as comforting as the classic inspiration.",
    introNote: "A good butter masala sauce needs both brightness and richness. Cook the tomato thoroughly, blend until silky and add the final garam masala late so its fragrance does not disappear into the simmer.",
  },
  "veg-biryani-vegetable-biryani-recipe": {
    description: "This vegetable biryani layers fragrant basmati rice with spiced vegetables, herbs and saffron. Each forkful should hold separate grains, tender vegetables and a new little burst of aroma.",
    introNote: "Biryani rewards organisation: prepare the vegetables, herbs and spices before you begin. Part-cook the rice, layer with a light hand and let the sealed pot rest after cooking so the grains finish gently.",
  },
  "veg-kurma-recipe-hotel-style-vegetable-korma": {
    description: "South Indian vegetable kurma brings a colourful mix of vegetables into a creamy coconut, cashew and spice gravy. It is aromatic and mellow, with enough texture to keep every spoonful interesting.",
    introNote: "The ground coconut mixture gives kurma its body and characteristic fragrance. Cook it until the raw edge disappears, but keep the vegetables just tender so they remain distinct in the creamy sauce.",
  },
  "veg-makhanwala": {
    description: "Veg makhanwala bathes tender vegetables in a glossy tomato-cashew gravy scented with fenugreek and garam masala. It is rich, colourful and ideal when you want a vegan curry with restaurant flair.",
    introNote: "The sauce should be smooth enough to feel luxurious but lively enough to let the vegetables shine. Kasuri methi added near the end supplies the familiar, irresistible makhani aroma.",
  },
  "vegan-garlic-naan": {
    description: "Soft vegan naan bubbles and chars in a hot pan before being brushed with garlicky melted butter and fresh coriander. It is pillowy, fragrant and almost impossible not to tear into immediately.",
    introNote: "Naan loves fierce heat. Roll the dough without knocking out every bubble, use the hottest heavy pan you have and brush on the garlic butter the moment each bread comes off.",
  },
  "vegan-peshwari-naan-recipe": {
    description: "Peshwari naan encloses a sweet, fragrant filling of coconut, nuts and dried fruit inside soft, blistered bread. It is a lovely foil for a hot curry and a treat in its own right.",
    introNote: "Keep the filling fine enough to roll without tearing the dough, but not so smooth that it loses texture. Seal the edges carefully and cook over high heat for those characteristic dark bubbles.",
  },
  "vegan-roti-chapati": {
    description: "These everyday vegan rotis are soft, supple and made with whole-wheat flour, water and a little practice. Cooked on a hot tawa, they are the natural companion to dal, sabzi and curry.",
    introNote: "Roti is simple food that teaches you by touch. The dough should feel soft without sticking, and each round needs only enough time on the pan to spot, puff and stay pliable.",
  },
  "vegan-samosa-pie": {
    description: "Samosa pie turns the familiar spiced potato-and-pea filling into a generous family bake beneath crisp pastry. It keeps the cumin, coriander and tang of the snack while making supper wonderfully easy.",
    introNote: "Let the filling cool before adding the pastry so the top stays crisp. The potatoes should be partly crushed, partly chunky—exactly the texture that makes a good samosa filling so satisfying.",
  },
  "vegetable-pakora": {
    description: "Mixed vegetable pakoras bundle onion and vegetables into a crisp gram-flour coating fragrant with cumin, chilli and coriander. They are rustic, crunchy and at their best passed around while hot.",
    introNote: "Pakora batter should cling to the vegetables rather than pool around them. Mix thoroughly, add water a spoon at a time and fry small, irregular clusters for the greatest number of crisp edges.",
  },
  "vegetable-vindaloo": {
    description: "Vegetable vindaloo balances chilli heat with vinegar, garlic and a deeply toasted spice paste. The vegetables bring sweetness and substance to this bright, unapologetically bold Goan-inspired curry.",
    introNote: "Vindaloo should be hot, but its sourness and spice matter just as much. Toast the whole spices carefully, cook the paste until fragrant and taste at the end for that lively sweet-sour balance.",
  },
  "aloo-tikki": {
    description: "These golden aloo tikki hide a soft, warmly spiced potato centre beneath a crisp crust. Pile them with chickpeas and chutneys for proper chaat, or enjoy them hot from the pan.",
  },
  "bread-pakora-recipe-bread-pakoda": {
    description: "Bread pakora sandwiches a lively potato-and-pea filling between bread, then wraps it in gram-flour batter and fries it crisp. It is joyful North Indian snack food, especially with green chutney.",
  },
  "chettinad-pepper-chicken-curry-tofu-in-fennel-cardamom-black-pepper-sauce": {
    description: "This Chettinad-inspired tofu curry is fragrant with fennel, cardamom and plenty of freshly cracked black pepper. The sauce is dark, aromatic and thrillingly warm rather than simply hot.",
  },
  "coconut-chutney-recipe": {
    description: "Fresh coconut, roasted chana dal and green chilli blend into a cool, creamy chutney, finished with sizzling mustard seeds and curry leaves. It is the classic partner for dosa, idli and vada.",
  },
  "coconut-dal-with-kidney-beans": {
    description: "Earthy lentils and kidney beans simmer with coconut and warm spice in this substantial dal. It is creamy without feeling heavy and robust enough to anchor a simple supper.",
  },
  "coconut-rice-south-indian-style": {
    description: "South Indian coconut rice tosses separate grains of basmati with coconut, mustard seeds, curry leaves and crisp lentils. Cashews add richness and a welcome crunch.",
  },
  "curried-root-vegetable-soup": {
    description: "Swede, carrot, parsnip and potato make this gently curried soup naturally sweet and velvety. Toasted spices give the bowl warmth and character without overpowering the vegetables.",
  },
  "dhal-with-caraway-aubergine": {
    description: "Creamy red lentil dal meets caramelised aubergine scented with caraway in this richly textured bowl. Lemon cuts through the softness and keeps the final spoonful as lively as the first.",
  },
  "dosa-recipe": {
    description: "A properly fermented rice-and-lentil batter makes dosas crisp at the edges, lacy across the centre and faintly tangy. Serve them straight from the pan with sambar and fresh chutney.",
  },
  "easy-vegan-indian-butter-chickpeas": {
    description: "Chickpeas simmer in a silky tomato, cashew and spice sauce in this easy vegan take on a butter masala. It is weeknight-friendly but still rich enough to feel like a treat.",
  },
  "homemade-cilantro-chutney": {
    description: "Coriander, mint, green chilli and lime make a chutney that is grassy, sharp and wonderfully fresh. A spoonful wakes up pakoras, wraps, roasted vegetables and almost anything from the grill.",
  },
  "jalebi-recipe-traditional-method": {
    description: "Traditional jalebi coils fermented batter into hot oil before soaking the crisp spirals in cardamom-scented syrup. The contrast between crackly shell and juicy centre is pure celebration.",
  },
  "jeera-rice-recipe": {
    description: "Jeera rice perfumes fluffy basmati with cumin seeds, whole spices and a little ghee-style richness. Its restraint is precisely why it sits so beautifully beside a bold curry or dal.",
  },
  "kachumber-easy-10-minute-indian-salad": {
    description: "Kachumber tumbles cucumber, tomato and red onion with lemon, herbs and a pinch of spice. This ten-minute salad brings the cool crunch every rich Indian meal needs.",
  },
  "kashmiri-lal-tofu-tofu-in-kashmiri-chili-tomato-curry-sauce": {
    description: "Pan-seared tofu simmers in a vivid tomato gravy coloured by Kashmiri chilli and warmed with aromatic spice. It looks fiery, but the flavour is rounded, fragrant and gently smoky.",
  },
  "keema-curry-vegan": {
    description: "Vegan keema cooks soya mince with peas, tomato and deeply browned aromatics until every crumb carries the masala. It is savoury, comforting and superb piled onto rice or scooped up with naan.",
  },
  "masala-fried-rice-with-turmeric-onion-raita": {
    description: "Masala fried rice gives leftover grains new life with vegetables, toasted spices and plenty of colour. A cool turmeric-onion raita makes a bright, creamy counterpoint.",
  },
  "mushroom-matar-masala-mushroom-pea-curry": {
    description: "Browned mushrooms and sweet peas simmer in a smooth tomato-cashew masala in this homely mushroom matar. The gravy is creamy, the vegetables stay distinct and every bite is deeply savoury.",
  },
  "peanut-and-coconut-balls": {
    description: "Roasted peanuts, dates, seeds and coconut make these no-bake balls chewy, nutty and naturally sweet. They are small enough for a quick bite but full of proper texture.",
  },
  "peanut-chutney-recipe-groundnut-chutney": {
    description: "Roasted peanuts, chana dal and chilli blend into a creamy South Indian chutney with real savoury depth. Spoon it beside dosa or idli, then add a fragrant mustard-seed tempering.",
  },
  "punjabi-kadhi-pakora-onion-fritters-with-spiced-yogurt-sauce": {
    description: "Punjabi kadhi pakora nestles onion fritters in a tangy, turmeric-gold yogurt-style gravy. The dumpling-soft pakoras, sharp sauce and fragrant tadka make a beautifully comforting combination.",
  },
  "rasgulla-recipe-soft-amp-spongy": {
    description: "Bengali rasgulla are soft chenna dumplings cooked until springy in a light rose-scented syrup. Served chilled, they are delicate, juicy and far more refreshing than their sweetness suggests.",
  },
  "restaurant-style-vegan-malai-kofta": {
    description: "Tender tofu-and-potato kofta sit in a smooth tomato-cashew gravy in this vegan malai kofta. Crisp dumplings against the fragrant, creamy sauce make it a true special-occasion curry.",
  },
  "saag-butter-beans": {
    description: "Creamy butter beans give earthy saag a wonderfully generous texture, while a crisp garlic-chilli oil brings heat and contrast. It is green, hearty and full of savoury comfort.",
  },
  "slow-cooker-dal": {
    description: "Yellow split peas, tomato and warm spices cook slowly into a thick, soothing dal. The hands-off method gives the lentils time to soften and the seasoning time to become beautifully settled.",
  },
  "spicy-lentil-bean-stew": {
    description: "Red lentils and white beans thicken this coconut-rich stew, while North Indian spices and chilli bring warmth. It sits somewhere between dal and soup—and is deeply comforting either way.",
  },
  "tamarind-chutney-recipe-meethi-imli-chutney": {
    description: "Meethi imli chutney cooks tamarind, jaggery and toasted spices into a glossy sweet-sour sauce. Its dark, fruity tang is essential over chaat and irresistible beside crisp fried snacks.",
  },
  "tandoori-gobi-gobi-tikka-tandoori-cauliflower": {
    description: "Tandoori gobi coats cauliflower in a spiced yogurt-style marinade, then roasts it until smoky at the edges and tender within. Mint chutney and lemon make the flavours sing.",
  },
  "the-best-jackfruit-curry": {
    description: "Tender jackfruit and sweet potato simmer in a coconut curry fragrant with ginger, cumin and garam masala. The sauce is rich, the texture substantial and the leftovers particularly good.",
  },
  "tofu-kondattam-south-indian-spicy-crispy-tofu": {
    description: "Tofu kondattam tosses crisp tofu with chilli, curry leaves, ginger and garlic in a glossy South Indian-style sauce. It is hot, aromatic and made for eating while the edges still crackle.",
  },
  "tofu-pasanda-tofu-with-velvety-pepita-poppy-seed-sauce": {
    description: "Tofu pasanda bathes golden tofu in a velvety pumpkin-seed, poppy-seed and coconut sauce. The gravy is nut-free, gently spiced and luxuriously smooth.",
  },
  "tomato-chutney-recipe-for-idli-amp-dosa": {
    description: "This South Indian tomato chutney cooks ripe tomatoes with chilli, lentils and aromatics until jammy and bright. A mustard-seed tempering makes it especially good beside idli or dosa.",
  },
  "vada-pav-recipe-mumbai-style": {
    description: "Mumbai-style vada pav tucks a hot, spiced potato fritter into a soft roll with punchy green and dry garlic chutneys. It is messy, fiery and magnificent street food.",
  },
  "vegan-badam-katli-almond-barfi": {
    description: "Vegan badam katli turns finely ground almonds, saffron, cardamom and rose into delicate diamond-shaped sweets. Their soft bite and fragrant nuttiness make them lovely for gifting and sharing.",
  },
  "vegan-blackeye-bean-curry": {
    description: "Black-eyed beans simmer with roasted spices, tomato and fresh herbs in this west-coast Indian-inspired curry. The beans stay creamy inside while the gravy remains lively and aromatic.",
  },
  "vegan-cauliflower-tikka-masala": {
    description: "Roasted cauliflower tikka folds into a rich tomato masala with smoky spice and creamy body. Charred florets keep this vegan curry full of texture rather than disappearing into the sauce.",
  },
  "vegan-gulab-jamun": {
    description: "These vegan gulab jamun are tender little dumplings soaked in warm cardamom syrup and enriched with cashew cream. Serve them warm for a soft, fragrant finish to a special meal.",
  },
  "vegan-kheer-indian-rice-pudding": {
    description: "Vegan kheer slowly cooks rice with oat milk, cardamom and saffron until creamy and fragrant. Nuts add texture to this quiet, comforting pudding, which is lovely warm or chilled.",
  },
  "veg-pulao-recipe-mix-vegetable-pulav": {
    description: "Vegetable pulao cooks basmati, colourful vegetables and whole spices together in one fragrant pot. The grains stay fluffy, the vegetables tender and the flavour gently aromatic.",
  },
  "vegetable-bhuna-north-indian-vegetable-curry": {
    description: "Vegetable bhuna cooks cauliflower and mixed vegetables in a concentrated North Indian tomato masala, finished with a cumin-scented tadka. It is rich, textured and unapologetically full of spice.",
  },
  "vegetable-pilau-rice": {
    description: "Vegetable pilau folds sweet vegetables and aromatic whole spices through fluffy basmati. It is colourful enough to take centre stage yet balanced enough to sit beside a rich curry.",
  },
  "walnut-chutney": {
    description: "Roasted walnuts give this chilli-spiked chutney an earthy richness and creamy body. It is an unusual but compelling partner for idli, dosa, fritters or a generously filled wrap.",
  },
};
