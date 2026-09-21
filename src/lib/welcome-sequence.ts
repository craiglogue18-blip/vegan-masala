export type WelcomeEmail = {
  day: number;
  subject: string;
  preview: string;
  purpose: string;
  body: string;
};

export const WELCOME_SEQUENCE_NAME = "Vegan Masala · New subscriber welcome";

export const WELCOME_SEQUENCE: WelcomeEmail[] = [
  {
    day: 0,
    subject: "Your Vegan Masala guides are ready",
    preview: "Your dinner plan and Indian breads guide, plus where to begin.",
    purpose: "Deliver both lead magnets and establish trust immediately.",
    body: `Welcome to Vegan Masala - I am glad you are here.

Your free downloads are ready:

7-Day Vegan Indian Dinner Plan
https://www.vegan-masala.com/downloads/vegan-masala-7-day-dinner-plan.pdf

Authentic Indian Vegan Breads Guide
https://www.vegan-masala.com/downloads/vegan-masala-authentic-indian-vegan-breads-guide.pdf

If you are deciding where to start, choose one bread and one curry rather than trying to cook an entire feast. Chapati with chana masala is a forgiving first combination and teaches you more about heat and dough than a complicated menu ever could.

Over the next few days I will send a handful of practical lessons to help you use the guides. After that, you will receive the regular Vegan Masala newsletter every two weeks.

Craig
Vegan Masala`,
  },
  {
    day: 2,
    subject: "The chapati mistake that makes good dough turn tough",
    preview: "Use less bench flour and more heat for a softer result.",
    purpose: "Provide a specific early win and bring readers back to a recipe.",
    body: `A soft chapati dough can still produce a dry bread if too much flour is added while rolling.

Use only enough bench flour to stop sticking, brush off the excess, and cook on a properly preheated tawa. The bread should colour quickly rather than sitting on gentle heat until its moisture has gone.

The useful signs are small bubbles after the first side, scattered brown spots after the flip, and a bread that remains flexible when stacked under a clean cloth.

Follow the full chapati method:
https://www.vegan-masala.com/recipes/chapati-recipe

Craig
Vegan Masala`,
  },
  {
    day: 4,
    subject: "The small bread toolkit I would buy first",
    preview: "A useful tawa, the right flour and two tools that earn their cupboard space.",
    purpose: "Introduce contextual affiliate recommendations without overwhelming the reader.",
    body: `Indian bread does not require a cupboard full of specialist equipment.

If I were starting again, I would prioritise:

- finely milled chapati atta for softer, more flexible roti
- a broad cast-iron tawa or low-sided pan
- a slim rolling pin that makes frequent quarter-turns easy
- long metal tongs for safe handling near high heat

You can see the equipment explanations and comparisons in the bread guide. Some links are affiliate links, which means Vegan Masala may earn a small commission at no extra cost to you. I only include equipment that has a clear job in the technique.

Open the bread guide page:
https://www.vegan-masala.com/bread-guide

Craig
Vegan Masala`,
  },
  {
    day: 7,
    subject: "Three breads, three different skills",
    preview: "Practise heat, fermentation and frying without repeating the same lesson.",
    purpose: "Drive a second high-intent website visit using a structured recipe path.",
    body: `Not every Indian bread teaches the same thing.

Start with chapati to learn dough feel, even rolling and tawa heat:
https://www.vegan-masala.com/recipes/chapati-recipe

Move to vegan garlic naan to practise a softer leavened dough and fierce top heat:
https://www.vegan-masala.com/recipes/vegan-garlic-naan

Then try poori when you are ready to work on even thickness and oil temperature:
https://www.vegan-masala.com/recipes/poori

Repeating one technique is useful, but changing the cooking method is often what makes the lesson stick.

Craig
Vegan Masala`,
  },
  {
    day: 10,
    subject: "Want to go further with Indian bread?",
    preview: "The expanded masterclass adds ratios, filled breads, batch planning and a workbook.",
    purpose: "Present the paid product only after four value-led emails.",
    body: `The free guide gives you the cultural background, core techniques and four breads to practise. The Indian Bread Masterclass Pack goes further.

The expanded 18-page edition includes:

- dough ratio cards for chapati, paratha, naan and poori
- three savoury filling formulas
- a complete batch-cooking schedule
- bread-and-curry pairing guidance
- a printable practice log for improving each batch

The pack is £9 and delivered as an instant PDF through Payhip.

See the full pack:
https://www.vegan-masala.com/store/indian-bread-masterclass

Craig
Vegan Masala

P.S. If the free guide is enough for you, that is completely fine. Keep cooking from it and tell me which bread you try first.`,
  },
];

