"use client";

import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Circle, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import InstallAppButton from "./InstallAppButton";
import { PROFILE_SKIPPED_KEY, readPlannerProfile } from "./profile";

type Meal = "Breakfast" | "Lunch" | "Dinner";
type Preference = "Any" | "Quick" | "Low cost" | "High protein" | "Family friendly";
type ShoppingStatus = "need" | "have" | "skip";
type ShoppingCategory = "Vegetables & fruit" | "Fridge" | "Freezer" | "Cupboard";
export type PlannerView = "dashboard" | "build" | "shopping";

type PlannerRecipe = {
  slug: string;
  title: string;
  description?: string;
  image?: string;
  prepMinutes?: number;
  cookMinutes?: number;
  tags: string[];
  mealTypes: string[];
  plannerTags: string[];
  ingredients: string[];
  servings?: number;
  spiceLevel?: string;
};

type PlannedMeal = {
  day: string;
  dayName: string;
  dateKey: string;
  meal: Meal;
  recipe: PlannerRecipe;
};

type ShoppingItem = {
  key: string;
  ingredient: string;
  recipeTitles: string[];
  category: ShoppingCategory;
};

type ParsedIngredient = {
  name: string;
  quantity: number | null;
  unit: string;
  approximate: boolean;
};

const MEALS: Meal[] = ["Breakfast", "Lunch", "Dinner"];
const PREFERENCES: Preference[] = ["Any", "Quick", "Low cost", "High protein", "Family friendly"];
const SAVED_PLAN_KEY = "vegan-masala-meal-plan-v1";
const BREAKFAST_FALLBACK_SLUGS = new Set([
  "aloo-tikki",
  "bread-pakora-recipe-bread-pakoda",
  "coconut-rice-south-indian-style",
  "dosa-recipe",
  "poori",
  "vada-pav-recipe-mumbai-style",
]);

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function planDate(startDate: string, offset: number) {
  const [year, month, day] = startDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offset);
  return {
    key: localDateKey(date),
    name: new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(date),
    label: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(date),
  };
}

function nextMondayKey() {
  const date = new Date();
  const daysUntilMonday = (8 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + daysUntilMonday);
  return localDateKey(date);
}

function shoppingCategory(ingredient: string): ShoppingCategory {
  const text = ingredient.toLowerCase();
  if (/\bfrozen\b/.test(text)) return "Freezer";
  if (/powder|ground |seeds?|masala|turmeric|paprika|asafoetida|hing|fenugreek|methi|salt|sugar|flour|oil|purée|puree|tinned|tin |canned|coconut milk/.test(text)) return "Cupboard";
  if (/tofu|tempeh|yogurt|yoghurt|milk|cream|butter|margarine|refrigerated/.test(text)) return "Fridge";
  if (/onion|garlic|ginger|tomato|potato|spinach|coriander|cilantro|mint|lime|lemon|pepper|chilli|chili|courgette|zucchini|cauliflower|aubergine|eggplant|carrot|cabbage|mushroom|okra|peas|fenugreek leaves|curry leaves|cucumber|avocado|banana|apple|berries/.test(text)) {
    return "Vegetables & fruit";
  }
  return "Cupboard";
}

const FRACTIONS: Record<string, number> = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125 };
const UNIT_ALIASES: Record<string, string> = {
  g: "g", gram: "g", grams: "g", kg: "kg", kilogram: "kg", kilograms: "kg",
  ml: "ml", millilitre: "ml", millilitres: "ml", l: "l", litre: "l", litres: "l",
  tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp", tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
  cup: "cup", cups: "cup", tin: "tin", tins: "tin", can: "tin", cans: "tin",
  packet: "packet", packets: "packet", pack: "packet", packs: "packet",
};

function numericQuantity(value: string) {
  const text = value.trim();
  if (FRACTIONS[text]) return FRACTIONS[text];
  const mixed = text.match(/^(\d+)\s*([¼½¾⅓⅔⅛])$/);
  if (mixed) return Number(mixed[1]) + FRACTIONS[mixed[2]];
  const slash = text.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (slash) return Number(slash[1]) / Number(slash[2]);
  return Number(text);
}

function canonicalIngredientName(value: string) {
  let name = value
    .replace(/^of\s+/i, "")
    .replace(/^[-–]\s*/, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .split(/,|\s+-\s+/)[0]
    .replace(/\b(?:finely|roughly|thinly|freshly)\s+(?:chopped|sliced|grated|ground)\b/gi, "")
    .replace(/\b(?:chopped|sliced|diced|grated|crushed|peeled|drained|rinsed|divided)\b/gi, "")
    .replace(/^(?:small|medium|large)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const aliases: Array<[RegExp, string]> = [
    [/^(?:red |white |brown )?onions?$/, "onions"],
    [/^(?:fresh )?tomatoes?$/, "tomatoes"],
    [/^(?:fresh )?(?:root )?ginger$/, "fresh ginger"],
    [/^(?:fresh |chopped )?coriander leaves?$|^fresh coriander$|^coriander$/, "fresh coriander"],
    [/^(?:coriander powder|ground coriander)$/, "ground coriander"],
    [/^cumin$|^cumin powder$|^ground cumin$/, "ground cumin"],
    [/^(?:red )?chilli powder$|^chili powder$/, "chilli powder"],
    [/^(?:ground )?turmeric(?: powder)?$/, "ground turmeric"],
    [/^(?:kasuri methi|dried fenugreek leaves?)$/, "dried fenugreek leaves"],
    [/^chickpeas?$/, "chickpeas"],
    [/^(?:garlic cloves?|cloves?(?: of)? garlic)$/, "garlic"],
    [/^chill(?:i|ies)$/, "chillies"],
    [/^potatoes?$|^.*\bpotatoes$/, "potatoes"],
    [/^cauliflowers?$/, "cauliflower"],
    [/^carrots?$/, "carrots"],
    [/^lemons?$|^lemon juice$/, "lemons"],
    [/^(?:finely )?chopped tomatoes?(?: or passata)?$|^tomatoes? or passata$/, "tinned tomatoes or passata"],
    [/^(?:neutral|sunflower|vegetable|rapeseed|cooking) oil$|^oil$/, "cooking oil"],
    [/^tomato (?:purée|puree|paste)$/, "tomato purée"],
  ];
  for (const [pattern, replacement] of aliases) if (pattern.test(name)) name = replacement;
  return name || value.trim().toLowerCase();
}

function parseIngredient(value: string): ParsedIngredient {
  const cleaned = value.replace(/^[•\-]\s*/, "").trim();
  const packaged = cleaned.match(/^(\d+(?:\.\d+)?|[¼½¾])\s*x\s*400\s*g\s*(?:tin|can)\s+(?:of\s+)?(.+)$/i);
  if (packaged) return { name: canonicalIngredientName(packaged[2]), quantity: numericQuantity(packaged[1]), unit: "tin", approximate: false };
  const juice = cleaned.match(/^juice\s+of\s+(\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[¼½¾])\s+lemons?$/i);
  if (juice) return { name: "lemons", quantity: numericQuantity(juice[1]), unit: "each", approximate: false };
  const thumbGinger = cleaned.match(/^(?:a|one)\s+(?:small\s+)?thumb-sized piece of ginger/i);
  if (thumbGinger) return { name: "fresh ginger", quantity: 30, unit: "g", approximate: true };
  const inchGinger = cleaned.match(/^(\d+\s*\/\s*\d+|\d+(?:\.\d+)?|[¼½¾])\s*-?\s*inch(?:es)?(?:\s+piece)?\s+(?:of\s+)?(?:fresh\s+)?ginger/i);
  if (inchGinger) return { name: "fresh ginger", quantity: numericQuantity(inchGinger[1]) * 15, unit: "g", approximate: true };
  if (/\b(?:to taste|as needed|for serving|for frying|for garnish)\b/i.test(cleaned) || /^(?:a\s+)?(?:(?:small|large)\s+)?(?:pinch|handful)\b/i.test(cleaned)) {
    const name = canonicalIngredientName(cleaned
      .replace(/^(?:a|one|\d+)?\s*(?:(?:small|large)\s+)?(?:pinches?|handfuls?)\s+(?:of\s+)?/i, "")
      .replace(/\s*(?:,|\()?(?:to taste|as needed|for serving|for frying|for garnish).*$/i, ""));
    return { name, quantity: null, unit: "", approximate: true };
  }

  const range = cleaned.match(/^\d+(?:\.\d+)?\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(g|grams?|kg|ml|l|tsp|teaspoons?|tbsp|tablespoons?|cups?)?\s*(.*)$/i);
  if (range) {
    let quantity = Number(range[1]);
    let unit = UNIT_ALIASES[(range[2] ?? "").toLowerCase()] ?? "each";
    if (unit === "kg") { quantity *= 1000; unit = "g"; }
    if (unit === "l") { quantity *= 1000; unit = "ml"; }
    if (unit === "tbsp") { quantity *= 3; unit = "tsp"; }
    return { name: canonicalIngredientName(range[3]), quantity, unit, approximate: true };
  }

  const match = cleaned.match(/^(\d+\s*[¼½¾⅓⅔⅛]|[¼½¾⅓⅔⅛]|\d+\s*\/\s*\d+|\d+(?:\.\d+)?)\s*(g|grams?|kg|kilograms?|ml|millilitres?|l|litres?|tsp|teaspoons?|tbsp|tablespoons?|cups?|tins?|cans?|packs?|packets?)?\b\s*(.*)$/i);
  if (!match) return { name: canonicalIngredientName(cleaned), quantity: null, unit: "", approximate: true };

  let quantity = numericQuantity(match[1]);
  let unit = UNIT_ALIASES[(match[2] ?? "").toLowerCase()] ?? "each";
  if (unit === "kg") { quantity *= 1000; unit = "g"; }
  if (unit === "l") { quantity *= 1000; unit = "ml"; }
  if (unit === "tbsp") { quantity *= 3; unit = "tsp"; }
  const name = canonicalIngredientName(match[3]);
  if (/^(?:sea salt|salt|salt and pepper)$/.test(name)) return { name: "salt", quantity: null, unit: "", approximate: true };
  return { name, quantity, unit, approximate: false };
}

function supermarketQuantity(parsed: ParsedIngredient): ParsedIngredient {
  const item = { ...parsed };
  if (item.name === "potatoes" && item.quantity !== null && item.unit === "each") {
    item.quantity *= 200;
    item.unit = "g";
  }
  if (item.name === "garlic" && item.quantity !== null && item.unit === "each") {
    item.quantity /= 10;
    item.unit = "bulb";
  }
  if (/^(?:inch|inches) (?:piece of )?(?:fresh )?ginger$/.test(item.name) && item.quantity !== null) {
    item.name = "fresh ginger";
    item.quantity *= 15;
    item.unit = "g";
  }
  if (item.name === "fresh ginger" && item.quantity !== null && item.unit === "tsp") {
    item.quantity *= 5;
    item.unit = "g";
  }
  if (item.name === "fresh coriander") {
    item.quantity = item.quantity === null ? 1 : item.unit === "cup" ? item.quantity * 2 : item.quantity / 12;
    item.unit = "bunch";
  }
  if (item.unit === "cup" && item.quantity !== null) {
    const gramsPerCup = /(?:rice|lentils?|dal|dahl|flour|besan)/.test(item.name) ? 190 : /sugar|jaggery/.test(item.name) ? 200 : /cashews?/.test(item.name) ? 140 : null;
    if (gramsPerCup) {
      item.quantity *= gramsPerCup;
      item.unit = "g";
    }
  }
  return item;
}

function prettyName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function formatQuantity(quantity: number, unit: string) {
  const rounded = Math.round(quantity * 4) / 4;
  const value = Number.isInteger(rounded) ? String(rounded) : String(Number(rounded.toFixed(2)));
  if (unit === "g" && rounded >= 1000) return `${Number((rounded / 1000).toFixed(2))}kg`;
  if (unit === "ml" && rounded >= 1000) return `${Number((rounded / 1000).toFixed(2))}l`;
  if (unit === "tsp" && rounded >= 3) return `${Number((rounded / 3).toFixed(2))} tbsp`;
  if (unit === "each") return value;
  const plural = rounded === 1 ? unit : unit === "cup" ? "cups" : unit === "tin" ? "tins" : unit === "packet" ? "packets" : unit;
  return `${value} ${plural}`;
}

const JAR_INGREDIENT = /(?:powder|ground |seeds?$|masala|turmeric|paprika|asafoetida|hing|dried fenugreek|garam masala)/;

function formatSupermarketItem(name: string, quantity: number | null, unit: string) {
  if (JAR_INGREDIENT.test(name)) {
    const needed = quantity === null ? "" : ` (${formatQuantity(quantity, unit)} needed)`;
    return `1 jar ${name}${needed}`;
  }
  if (name === "salt") return "1 pack salt";
  if (name === "cooking oil") return `1 bottle cooking oil${quantity === null ? "" : ` (${unit === "tsp" ? `${Math.ceil(quantity * 5)}ml` : formatQuantity(quantity, unit)} needed)`}`;
  if (name === "tomato purée") return `1 tube tomato purée${quantity === null ? "" : ` (${unit === "tsp" ? `${Math.ceil(quantity * 5)}ml` : formatQuantity(quantity, unit)} needed)`}`;
  if (name === "garlic" && unit === "bulb") return `${Math.max(1, Math.ceil(quantity ?? 1))} ${Math.max(1, Math.ceil(quantity ?? 1)) === 1 ? "bulb" : "bulbs"} garlic`;
  if (name === "fresh coriander" && unit === "bunch") return `${Math.max(1, Math.ceil(quantity ?? 1))} ${Math.max(1, Math.ceil(quantity ?? 1)) === 1 ? "bunch" : "bunches"} fresh coriander`;
  if (unit === "tin") return `${Math.max(1, Math.ceil(quantity ?? 1))} × 400g ${Math.max(1, Math.ceil(quantity ?? 1)) === 1 ? "tin" : "tins"} ${name}`;
  if (unit === "each") return `${Math.max(1, Math.ceil(quantity ?? 1))} ${name}`;
  if (unit === "g") {
    const increment = name === "fresh ginger" ? 50 : name === "potatoes" ? 500 : 100;
    const rounded = Math.max(increment, Math.ceil((quantity ?? 0) / increment) * increment);
    return `${formatQuantity(rounded, "g")} ${name}`;
  }
  if (unit === "ml") return `${formatQuantity(Math.max(100, Math.ceil((quantity ?? 0) / 100) * 100), "ml")} ${name}`;
  if (quantity === null) return `${prettyName(name)} · as needed`;
  return `${formatQuantity(quantity, unit)} ${name}`;
}

function recipeText(recipe: PlannerRecipe) {
  return `${recipe.title} ${recipe.description ?? ""} ${recipe.tags.join(" ")}`.toLowerCase();
}

function matchesPreference(recipe: PlannerRecipe, preference: Preference) {
  const text = recipeText(recipe);
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
  const plannerTags = recipe.plannerTags.map((tag) => tag.toLowerCase());

  if (preference === "Any") return true;
  if (plannerTags.length > 0) return plannerTags.includes(preference.toLowerCase().replace(" ", "-"));

  if (preference === "Quick") return totalMinutes > 0 && totalMinutes <= 30;
  if (preference === "Low cost") return /dal|dahl|lentil|chickpea|chana|bean|aloo|potato|rice/.test(text);
  if (preference === "High protein") return /tofu|lentil|dal|dahl|chickpea|chana|bean|rajma|pea/.test(text);
  if (preference === "Family friendly") {
    return !/hot|spicy|vindaloo|chilli|chili/.test(text) && !/hot/i.test(recipe.spiceLevel ?? "");
  }

  return true;
}

function matchesMeal(recipe: PlannerRecipe, meal: Meal) {
  const text = recipeText(recipe);
  const mealTypes = recipe.mealTypes.map((type) => type.toLowerCase());

  if (mealTypes.length > 0) return mealTypes.includes(meal.toLowerCase());

  if (meal === "Breakfast") {
    return BREAKFAST_FALLBACK_SLUGS.has(recipe.slug);
  }

  return !/chutney|naan|chapati|roti|pakora|bhaji|vada pav|kheer|pudding|sweet|dessert|jalebi|gulab jamun|rasgulla|barfi|katli|rice recipe|pilau rice|jeera rice/.test(
    text
  );
}

function seededOrder(recipes: PlannerRecipe[], seed: number) {
  return [...recipes].sort((a, b) => {
    const score = (slug: string) => {
      let value = seed;
      for (const character of slug) value = (value * 31 + character.charCodeAt(0)) >>> 0;
      return value;
    };
    return score(a.slug) - score(b.slug);
  });
}

function MealCard({
  item,
  cooked,
  onSwap,
  onToggleCooked,
}: {
  item: PlannedMeal;
  cooked: boolean;
  onSwap: () => void;
  onToggleCooked: () => void;
}) {
  const { meal, recipe } = item;
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);

  return (
    <div className={`flex gap-3 rounded-2xl border border-[var(--border)] p-3 transition ${cooked ? "bg-green-950/25 opacity-75" : "bg-black/20"}`}>
      <Link href={`/recipes/${recipe.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black/30">
        <Image src={recipe.image || "/brand/logo-mark.png"} alt="" fill sizes="96px" className="object-cover" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-soft)]">{meal}</p>
          <button type="button" onClick={onToggleCooked} aria-label={`Mark ${item.day} ${meal.toLowerCase()} as ${cooked ? "not cooked" : "cooked"}`} className={cooked ? "text-green-300" : "text-[var(--text-soft)] hover:text-green-300"}>
            {cooked ? <CheckCircle2 aria-hidden="true" size={20} /> : <Circle aria-hidden="true" size={20} />}
          </button>
        </div>
        <Link href={`/recipes/${recipe.slug}`} className={`mt-1 line-clamp-2 block text-base font-extrabold leading-tight text-[var(--brand-gold)] hover:underline ${cooked ? "line-through decoration-green-500/60" : ""}`}>{recipe.title}</Link>
        {totalMinutes > 0 && <p className="mt-1 text-xs text-[var(--text-soft)]">{totalMinutes} minutes</p>}
        <button type="button" onClick={onSwap} className="mt-1.5 text-xs font-bold text-[var(--text-soft)] underline decoration-[var(--border)] underline-offset-4 hover:text-white">Swap meal</button>
      </div>
    </div>
  );
}

export default function MealPlanner({ recipes, view }: { recipes: PlannerRecipe[]; view: PlannerView }) {
  const router = useRouter();
  const [people, setPeople] = useState(2);
  const [days, setDays] = useState(3);
  const [startDate, setStartDate] = useState(() => localDateKey(new Date()));
  const [meals, setMeals] = useState<Meal[]>(MEALS);
  const [preference, setPreference] = useState<Preference>("Any");
  const [generation, setGeneration] = useState<number | null>(null);
  const [swaps, setSwaps] = useState<Record<string, number>>({});
  const [storageReady, setStorageReady] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [cookedSlots, setCookedSlots] = useState<string[]>([]);
  const [checkedShoppingItems, setCheckedShoppingItems] = useState<string[]>([]);
  const [shoppingStatuses, setShoppingStatuses] = useState<Record<string, ShoppingStatus>>({});
  const [exportMessage, setExportMessage] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileSummary, setProfileSummary] = useState("");
  const [recipePickerOpen, setRecipePickerOpen] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState("");

  useEffect(() => {
    try {
      const profile = readPlannerProfile();
      const hasSkippedProfile = localStorage.getItem(PROFILE_SKIPPED_KEY) === "true";
      const saved = JSON.parse(localStorage.getItem(SAVED_PLAN_KEY) ?? "null") as Record<string, unknown> | null;
      if (saved) {
        if (typeof saved.people === "number" && saved.people >= 1 && saved.people <= 8) setPeople(saved.people);
        if (saved.days === 3 || saved.days === 5 || saved.days === 7) setDays(saved.days);
        if (typeof saved.startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(saved.startDate)) {
          setStartDate(saved.startDate);
        }
        const savedMeals = saved.meals;
        if (Array.isArray(savedMeals)) {
          const restoredMeals = MEALS.filter((meal) => savedMeals.includes(meal));
          if (restoredMeals.length > 0) setMeals(restoredMeals);
        }
        if (PREFERENCES.includes(saved.preference as Preference)) setPreference(saved.preference as Preference);
        if (typeof saved.generation === "number") {
          setGeneration(saved.generation);
        }
        if (saved.swaps && typeof saved.swaps === "object") setSwaps(saved.swaps as Record<string, number>);
        if (Array.isArray(saved.cookedSlots)) {
          setCookedSlots(saved.cookedSlots.filter((slot): slot is string => typeof slot === "string"));
        }
        if (Array.isArray(saved.checkedShoppingItems)) {
          setCheckedShoppingItems(
            saved.checkedShoppingItems.filter((item): item is string => typeof item === "string")
          );
        }
        if (saved.shoppingStatuses && typeof saved.shoppingStatuses === "object") {
          setShoppingStatuses(saved.shoppingStatuses as Record<string, ShoppingStatus>);
        }
      } else if (profile) {
        setPeople(profile.people);
        setMeals(MEALS.filter((meal) => profile.meals.includes(meal)));
        setPreference(profile.goal);
      } else if (!hasSkippedProfile) {
        router.replace("/meal-planner/welcome");
        return;
      }
      if (profile) {
        setProfileName(profile.name.trim());
        const goal = profile.goal === "Any" ? "varied meals" : profile.goal.toLowerCase();
        setProfileSummary(`${goal} · ${profile.spice.toLowerCase()} spice`);
      }
    } catch {
      localStorage.removeItem(SAVED_PLAN_KEY);
    } finally {
      setStorageReady(true);
    }
  }, [router]);

  useEffect(() => {
    if (!storageReady || generation === null) return;
    localStorage.setItem(
      SAVED_PLAN_KEY,
      JSON.stringify({ people, days, startDate, meals, preference, generation, swaps, cookedSlots, checkedShoppingItems, shoppingStatuses })
    );
  }, [checkedShoppingItems, cookedSlots, days, generation, meals, people, preference, shoppingStatuses, startDate, storageReady, swaps]);

  const planDays = useMemo(
    () => Array.from({ length: days }, (_, index) => planDate(startDate, index)),
    [days, startDate]
  );

  const plan = useMemo<PlannedMeal[]>(() => {
    if (generation === null || meals.length === 0) return [];

    const selectedMeals = MEALS.filter((meal) => meals.includes(meal));
    const usedSlugs = new Set<string>();

    return planDays.flatMap((plannedDay, dayIndex) =>
      selectedMeals.map((meal, mealIndex) => {
        const day = plannedDay.label;
        const slot = `${day}-${meal}`;
        const compatible = recipes.filter((recipe) => matchesMeal(recipe, meal));
        const preferred = compatible.filter((recipe) => matchesPreference(recipe, preference));
        const pool = preferred.length > 0 ? preferred : compatible;
        const slotSeed =
          generation +
          dayIndex * selectedMeals.length +
          mealIndex +
          (swaps[slot] ?? 0) * 997;
        const ordered = seededOrder(pool, slotSeed);
        const recipe = ordered.find((candidate) => !usedSlugs.has(candidate.slug)) ?? ordered[0];

        usedSlugs.add(recipe.slug);
        return { day, dayName: plannedDay.name, dateKey: plannedDay.key, meal, recipe };
      })
    );
  }, [generation, meals, planDays, preference, recipes, swaps]);

  function toggleMeal(meal: Meal) {
    setMeals((current) => {
      const next = current.includes(meal)
        ? current.filter((item) => item !== meal)
        : [...current, meal];
      return MEALS.filter((item) => next.includes(item));
    });
    setGeneration(null);
    setSwaps({});
  }

  function generatePlan() {
    if (generation !== null && !window.confirm("Replace your current saved plan with a new one?")) return;
    const nextGeneration = (generation ?? 0) + 1;
    localStorage.setItem(
      SAVED_PLAN_KEY,
      JSON.stringify({
        people,
        days,
        startDate,
        meals,
        preference,
        generation: nextGeneration,
        swaps: {},
        cookedSlots: [],
        checkedShoppingItems: [],
        shoppingStatuses: {},
      })
    );
    setSwaps({});
    setCookedSlots([]);
    setCheckedShoppingItems([]);
    setShoppingStatuses({});
    setSaveMessage("");
    setGeneration(nextGeneration);
    router.push("/meal-planner");
  }

  function swapMeal(day: string, meal: Meal) {
    const slot = `${day}-${meal}`;
    const previousRecipe = plan.find((item) => item.day === day && item.meal === meal)?.recipe;
    setSaveMessage("");
    setCookedSlots((current) => current.filter((item) => item !== slot));
    if (previousRecipe) {
      setCheckedShoppingItems((current) =>
        current.filter((item) => !item.startsWith(`${previousRecipe.slug}:`))
      );
      setShoppingStatuses((current) =>
        Object.fromEntries(
          Object.entries(current).filter(([key]) => !key.startsWith(`${previousRecipe.slug}:`))
        ) as Record<string, ShoppingStatus>
      );
    }
    setSwaps((current) => ({ ...current, [slot]: (current[slot] ?? 0) + 1 }));
  }

  function toggleCooked(day: string, meal: Meal) {
    const slot = `${day}-${meal}`;
    setCookedSlots((current) =>
      current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot]
    );
  }

  function savePlan() {
    if (generation === null) return;
    localStorage.setItem(
      SAVED_PLAN_KEY,
      JSON.stringify({ people, days, startDate, meals, preference, generation, swaps, cookedSlots, checkedShoppingItems, shoppingStatuses })
    );
    setSaveMessage("Plan saved on this device.");
  }

  function startNewPlan() {
    if (generation !== null && !window.confirm("Clear this plan and start again?")) return;
    localStorage.removeItem(SAVED_PLAN_KEY);
    const profile = readPlannerProfile();
    if (profile) {
      setPeople(profile.people);
      setMeals(MEALS.filter((meal) => profile.meals.includes(meal)));
      setPreference(profile.goal);
    }
    setGeneration(null);
    setSwaps({});
    setCookedSlots([]);
    setCheckedShoppingItems([]);
    setShoppingStatuses({});
    setSaveMessage("");
    router.push("/meal-planner/build");
  }

  const todayKey = localDateKey(new Date());
  const todayMeals = plan.filter((item) => item.dateKey === todayKey);
  const todayName = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(new Date());
  const todaysDinner = todayMeals.find((item) => item.meal === "Dinner");
  const nextDinner = todaysDinner ?? plan.find((item) => item.meal === "Dinner");
  const cookedCount = plan.filter((item) => cookedSlots.includes(`${item.day}-${item.meal}`)).length;
  const shoppingRecipes = Array.from(
    new Map(plan.map((item) => [item.recipe.slug, item.recipe])).values()
  ).filter((recipe) => recipe.ingredients.length > 0);
  const recipeOccurrences = plan.reduce<Record<string, number>>((counts, item) => {
    counts[item.recipe.slug] = (counts[item.recipe.slug] ?? 0) + 1;
    return counts;
  }, {});
  const sourceShoppingItems = shoppingRecipes.flatMap((recipe) =>
    recipe.ingredients.map((ingredient, index) => ({
      key: `${recipe.slug}:${index}`,
      ingredient,
      recipe,
      occurrences: recipeOccurrences[recipe.slug] ?? 1,
    }))
  );
  const neededSources = sourceShoppingItems.filter(
    (item) => (shoppingStatuses[item.key] ?? "need") === "need"
  );
  const aggregated = new Map<string, { parsed: ParsedIngredient; quantity: number | null; recipeTitles: Set<string> }>();
  for (const source of neededSources) {
    const parsed = supermarketQuantity(parseIngredient(source.ingredient));
    if (/^(?:water|hot water|boiling water)$/.test(parsed.name)) continue;
    const scale = source.occurrences * (people / (source.recipe.servings && source.recipe.servings > 0 ? source.recipe.servings : people));
    const quantity = parsed.quantity === null ? null : parsed.quantity * scale;
    const aggregateKey = `${parsed.name}:${parsed.unit || "pantry"}`;
    const existing = aggregated.get(aggregateKey);
    if (existing) {
      if (existing.quantity !== null && quantity !== null) existing.quantity += quantity;
      else existing.quantity = null;
      existing.recipeTitles.add(source.recipe.title);
    } else {
      aggregated.set(aggregateKey, { parsed, quantity, recipeTitles: new Set([source.recipe.title]) });
    }
  }
  const neededShoppingItems: ShoppingItem[] = Array.from(aggregated.entries()).map(([key, item]) => ({
    key,
    ingredient: formatSupermarketItem(item.parsed.name, item.quantity, item.parsed.unit),
    recipeTitles: Array.from(item.recipeTitles),
    category: shoppingCategory(item.parsed.name),
  })).sort((a, b) => a.ingredient.localeCompare(b.ingredient));
  const haveShoppingItemCount = sourceShoppingItems.filter(
    (item) => shoppingStatuses[item.key] === "have"
  ).length;
  const boughtShoppingItemCount = neededShoppingItems.filter((item) =>
    checkedShoppingItems.includes(item.key)
  ).length;
  const shoppingGroups = (["Vegetables & fruit", "Fridge", "Freezer", "Cupboard"] as ShoppingCategory[])
    .map((category) => ({
      category,
      items: neededShoppingItems.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);
  const selectableRecipes = recipes
    .filter((recipe) => {
      const query = recipeSearch.trim().toLowerCase();
      return !query || recipeText(recipe).includes(query);
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  function toggleShoppingItem(key: string) {
    setCheckedShoppingItems((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  }

  function setShoppingStatus(key: string, status: ShoppingStatus) {
    setShoppingStatuses((current) => ({ ...current, [key]: status }));
    setCheckedShoppingItems([]);
  }

  async function exportShoppingList() {
    const text = [
      "Vegan Masala weekly shopping list",
      "",
      ...shoppingGroups.flatMap((group) => [
        group.category.toUpperCase(),
        ...group.items.map((item) => `${checkedShoppingItems.includes(item.key) ? "✓" : "☐"} ${item.ingredient}`),
        "",
      ]),
    ].join("\n");

    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: "Vegan Masala shopping list",
        text,
        dialogTitle: "Share shopping list",
      });
      setExportMessage("Shopping list shared.");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: "Vegan Masala shopping list", text });
        setExportMessage("Shopping list shared.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vegan-masala-shopping-list.txt";
    link.click();
    URL.revokeObjectURL(url);
    setExportMessage("Shopping list downloaded to this device.");
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {!storageReady && <div className="min-h-[40vh]" aria-label="Loading saved meal plan" />}

      {storageReady && (
        <nav aria-label="Meal planner" className="mb-7 hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 md:flex">
          {([
            ["dashboard", "/meal-planner", "This Week"],
            ["build", "/meal-planner/build", "Build Plan"],
            ["shopping", "/meal-planner/shopping", "Shopping"],
          ] as const).map(([itemView, href, label]) => (
            <Link key={itemView} href={href} aria-current={view === itemView ? "page" : undefined} className={`flex-1 rounded-xl px-4 py-3 text-center text-sm font-extrabold ${view === itemView ? "bg-[var(--brand-gold)] text-black" : "text-[var(--text-soft)] hover:bg-white/5 hover:text-white"}`}>{label}</Link>
          ))}
        </nav>
      )}

      {storageReady && view === "build" && <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-9">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Vegan Masala Planner</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">Your vegan week, planned</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--text-soft)]">
          Build a practical week of Vegan Masala recipes, swap any meal and keep your plan ready while you cook.
        </p>
        <div className="mt-5"><InstallAppButton /></div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <fieldset>
            <legend className="text-xl font-extrabold text-[var(--brand-gold)]">How many people?</legend>
            <div className="mt-3 inline-flex items-center rounded-2xl border border-[var(--border)] bg-black/20 p-1">
              <button type="button" onClick={() => setPeople((value) => Math.max(1, value - 1))} className="h-11 w-11 rounded-xl text-xl hover:bg-white/10" aria-label="Remove one person">−</button>
              <span className="w-20 text-center font-bold">{people}</span>
              <button type="button" onClick={() => setPeople((value) => Math.min(8, value + 1))} className="h-11 w-11 rounded-xl text-xl hover:bg-white/10" aria-label="Add one person">+</button>
            </div>
            <p className="mt-2 text-xs text-[var(--text-soft)]">Portion scaling is coming next.</p>
          </fieldset>

          <fieldset>
            <legend className="text-xl font-extrabold text-[var(--brand-gold)]">How many days?</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {[3, 5, 7].map((option) => (
                <button key={option} type="button" onClick={() => { setDays(option); setGeneration(null); setSwaps({}); }} className={`rounded-xl border px-5 py-3 font-bold ${days === option ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-black" : "border-[var(--border)] bg-black/20 hover:bg-white/10"}`}>{option} days</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xl font-extrabold text-[var(--brand-gold)]">When should the plan start?</legend>
            <input type="date" value={startDate} onChange={(event) => { if (!event.target.value) return; setStartDate(event.target.value); setGeneration(null); setSwaps({}); }} className="mt-3 rounded-xl border border-[var(--border)] bg-black/20 px-4 py-3 font-bold text-white outline-none focus:border-[var(--brand-gold)]" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setStartDate(localDateKey(new Date())); setGeneration(null); setSwaps({}); }} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--text-soft)] hover:text-white">Start today</button>
              <button type="button" onClick={() => { setStartDate(nextMondayKey()); setGeneration(null); setSwaps({}); }} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-bold text-[var(--text-soft)] hover:text-white">Next Monday</button>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xl font-extrabold text-[var(--brand-gold)]">Which meals?</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {MEALS.map((meal) => (
                <button key={meal} type="button" aria-pressed={meals.includes(meal)} onClick={() => toggleMeal(meal)} className={`rounded-xl border px-5 py-3 font-bold ${meals.includes(meal) ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-black" : "border-[var(--border)] bg-black/20 hover:bg-white/10"}`}>{meal}</button>
              ))}
            </div>
            {meals.length === 0 && <p className="mt-2 text-sm text-red-300">Choose at least one meal.</p>}
          </fieldset>

          <fieldset>
            <legend className="text-xl font-extrabold text-[var(--brand-gold)]">What matters most?</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {PREFERENCES.map((option) => (
                <button key={option} type="button" aria-pressed={preference === option} onClick={() => { setPreference(option); setGeneration(null); setSwaps({}); }} className={`rounded-xl border px-4 py-3 font-bold ${preference === option ? "border-[var(--brand-gold)] bg-[var(--brand-gold)] text-black" : "border-[var(--border)] bg-black/20 hover:bg-white/10"}`}>{option}</button>
              ))}
            </div>
          </fieldset>
        </div>

        <button type="button" disabled={meals.length === 0} onClick={generatePlan} className="mt-9 rounded-2xl bg-[var(--brand-red)] px-7 py-4 text-lg font-extrabold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
          {generation === null ? "Create my meal plan" : "Make me another plan"}
        </button>
      </section>}

      {storageReady && plan.length === 0 && view !== "build" && (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <h1 className="text-4xl">Start your first plan</h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--text-soft)]">Build a meal plan first, then your weekly dashboard and supermarket list will appear here.</p>
          <Link href="/meal-planner/build" className="mt-6 inline-flex rounded-xl bg-[var(--brand-red)] px-6 py-3 font-extrabold text-white">Build my plan</Link>
        </section>
      )}

      {storageReady && plan.length > 0 && (
        <section aria-live="polite">
          {view === "dashboard" && <>
          <div id="saved-plan" className="scroll-mt-40 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-soft)]">This week · For {people} {people === 1 ? "person" : "people"}</p>
              <h1 className="mt-2 text-4xl">{profileName ? `Hello, ${profileName}` : "Your meal plan"}</h1>
              {profileName && <p className="mt-2 text-sm font-bold text-[var(--brand-gold)]">Your meal plan is ready</p>}
              <p className="mt-2 text-sm text-[var(--text-soft)]">{cookedCount} of {plan.length} meals cooked</p>
              {profileSummary && <p className="mt-1 text-xs capitalize text-[var(--text-soft)]">Set for {profileSummary}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-green-800/70 bg-green-950/40 px-3 py-1.5 text-xs font-bold text-green-300">Saved on this device</span>
              <button type="button" onClick={savePlan} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--brand-gold)] hover:bg-white/10">Save plan</button>
              <Link href="/meal-planner/build" className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-soft)] hover:bg-white/10 hover:text-white">Edit plan</Link>
              <Link href="/meal-planner/welcome" className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-soft)] hover:bg-white/10 hover:text-white">My preferences</Link>
              <button type="button" onClick={startNewPlan} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-soft)] hover:bg-white/10 hover:text-white">New plan</button>
            </div>
          </div>
          {saveMessage && <p className="mt-3 text-sm font-bold text-green-300" role="status">{saveMessage}</p>}

          {nextDinner && <section className="relative mt-6 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
            <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)]">
              <div className="relative min-h-64 md:order-2">
                <Image src={nextDinner.recipe.image || "/brand/logo-mark.png"} alt="" fill sizes="(max-width: 768px) 100vw, 480px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10191e] via-transparent to-transparent md:bg-gradient-to-r md:from-[#10191e] md:via-transparent" />
              </div>
              <div className="relative z-10 -mt-20 p-6 md:order-1 md:mt-0 md:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand-gold)]">{todaysDinner ? "Tonight" : `Next dinner · ${nextDinner.day}`}</p>
                <h2 className="mt-2 text-3xl sm:text-4xl">What&apos;s for dinner?</h2>
                <p className="mt-3 text-xl font-extrabold text-white">{nextDinner.recipe.title}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-[var(--text-soft)]">
                  {(nextDinner.recipe.prepMinutes || nextDinner.recipe.cookMinutes) && <span>{(nextDinner.recipe.prepMinutes ?? 0) + (nextDinner.recipe.cookMinutes ?? 0)} minutes</span>}
                  {nextDinner.recipe.ingredients.length > 0 && <span>{nextDinner.recipe.ingredients.length} ingredients</span>}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href={`/meal-planner/cook/${nextDinner.recipe.slug}`} className="rounded-xl bg-[var(--brand-red)] px-5 py-3 font-extrabold text-white hover:brightness-110">Start cooking</Link>
                  <button type="button" onClick={() => setRecipePickerOpen(true)} className="rounded-xl border border-[var(--brand-gold)] bg-[var(--brand-gold)]/10 px-4 py-3 font-bold text-[var(--brand-gold)] hover:bg-[var(--brand-gold)] hover:text-black">Choose another recipe</button>
                  <button type="button" onClick={() => swapMeal(nextDinner.day, nextDinner.meal)} className="rounded-xl border border-[var(--border)] bg-black/20 px-4 py-3 font-bold text-white hover:bg-white/10">Swap dinner</button>
                </div>
              </div>
            </div>
          </section>}

          <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-soft)]">Today</p>
                <h2 className="mt-1 text-3xl">{todayName}</h2>
              </div>
              {todayMeals.length > 0 && <span className="text-sm text-[var(--text-soft)]">{todayMeals.filter((item) => cookedSlots.includes(`${item.day}-${item.meal}`)).length}/{todayMeals.length} cooked</span>}
            </div>
            {todayMeals.length > 0 ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {todayMeals.map((item) => {
                  const slot = `${item.day}-${item.meal}`;
                  return <MealCard key={slot} item={item} cooked={cookedSlots.includes(slot)} onSwap={() => swapMeal(item.day, item.meal)} onToggleCooked={() => toggleCooked(item.day, item.meal)} />;
                })}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-[var(--border)] bg-black/20 p-4 text-[var(--text-soft)]">No meals are planned for today. Your full plan is ready below.</p>
            )}
          </section>

          <h2 className="mt-10 text-3xl">The full week</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {planDays.map((plannedDay) => (
              <article key={plannedDay.key} className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <div className="border-b border-[var(--border)] bg-black/20 px-5 py-4">
                  <h3 className="text-2xl">{plannedDay.label}</h3>
                </div>
                <div className="space-y-3 p-4">
                  {plan.filter((item) => item.dateKey === plannedDay.key).map((item) => {
                    const slot = `${item.day}-${item.meal}`;
                    return <MealCard key={slot} item={item} cooked={cookedSlots.includes(slot)} onSwap={() => swapMeal(item.day, item.meal)} onToggleCooked={() => toggleCooked(item.day, item.meal)} />;
                  })}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-black/20 p-5 text-[var(--text-soft)]">
            Your shopping list combines matching ingredients across the week and adjusts reliable quantities for your household. Flexible amounts such as salt to taste are shown once as “as needed”.
          </div>
          </>}

          {view === "shopping" && <section id="shopping-list" className="scroll-mt-40 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-soft)]">For this plan</p>
                <h2 className="mt-1 text-3xl">Weekly shopping list</h2>
                <p className="mt-2 text-sm text-[var(--text-soft)]">{boughtShoppingItemCount} of {neededShoppingItems.length} weekly items bought · {haveShoppingItemCount} recipe ingredients already at home</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void exportShoppingList()} disabled={neededShoppingItems.length === 0} className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-extrabold text-white disabled:opacity-50">Export list</button>
                {boughtShoppingItemCount > 0 && (
                  <button type="button" onClick={() => setCheckedShoppingItems([])} className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-bold text-[var(--text-soft)] hover:bg-white/10 hover:text-white">Clear bought</button>
                )}
              </div>
            </div>
            {exportMessage && <p className="mt-3 text-sm font-bold text-green-300" role="status">{exportMessage}</p>}

            {neededShoppingItems.length > 0 ? (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {shoppingGroups.map((group) => (
                  <section key={group.category} className="rounded-2xl border border-[var(--border)] bg-black/20 p-4">
                    <h3 className="text-xl">{group.category}</h3>
                    <ul className="mt-3 divide-y divide-[var(--border)]">
                      {group.items.map((item) => {
                        const bought = checkedShoppingItems.includes(item.key);
                        return (
                          <li key={item.key}>
                            <button type="button" onClick={() => toggleShoppingItem(item.key)} className={`flex w-full items-start gap-3 py-3 text-left transition ${bought ? "text-[var(--text-soft)] line-through" : "text-white"}`}>
                              {bought ? <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0 text-green-300" size={19} /> : <Circle aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--text-soft)]" size={19} />}
                              <span>
                                <span className="block text-sm">{item.ingredient}</span>
                                <span className="mt-0.5 block text-xs text-[var(--text-soft)]">
                                  For {item.recipeTitles.length === 1 ? item.recipeTitles[0] : `${item.recipeTitles.length} recipes`}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border border-[var(--border)] bg-black/20 p-5 text-[var(--text-soft)]">Everything is marked as already at home or not needed.</p>
            )}

            <div className="mt-10 border-t border-[var(--border)] pt-7">
              <h3 className="text-2xl">Choose what goes on the list</h3>
              <p className="mt-2 text-sm text-[var(--text-soft)]">Open a recipe and mark each ingredient as something you need to buy, already have, or want to skip.</p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {shoppingRecipes.map((recipe) => (
                <details key={recipe.slug} className="group rounded-2xl border border-[var(--border)] bg-black/20 p-4">
                  <summary className="cursor-pointer list-none font-extrabold text-[var(--brand-gold)] marker:hidden">
                    <span className="flex items-center justify-between gap-3">
                      <span>{recipe.title}</span>
                      <span className="shrink-0 text-xs font-bold text-[var(--text-soft)] group-open:hidden">{recipe.ingredients.length} items +</span>
                      <span className="hidden shrink-0 text-xs font-bold text-[var(--text-soft)] group-open:inline">Hide −</span>
                    </span>
                  </summary>
                  <Link href={`/recipes/${recipe.slug}`} className="mt-2 inline-block text-xs font-bold text-[var(--text-soft)] underline hover:text-white">View recipe</Link>
                  <ul className="mt-3 space-y-2">
                    {recipe.ingredients.map((ingredient, index) => {
                      const key = `${recipe.slug}:${index}`;
                      const status = shoppingStatuses[key] ?? "need";
                      return (
                        <li key={key} className="rounded-xl border border-[var(--border)]/70 p-3">
                          <p className="text-sm text-white">{ingredient}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {(["need", "have", "skip"] as ShoppingStatus[]).map((option) => (
                              <button key={option} type="button" aria-pressed={status === option} onClick={() => setShoppingStatus(key, option)} className={`rounded-lg px-2.5 py-1 text-xs font-bold capitalize ${status === option ? option === "need" ? "bg-[var(--brand-gold)] text-black" : option === "have" ? "bg-green-800 text-white" : "bg-white/15 text-white" : "border border-[var(--border)] text-[var(--text-soft)] hover:text-white"}`}>{option}</button>
                            ))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              ))}
            </div>
          </section>}
        </section>
      )}

      {storageReady && recipePickerOpen && <div className="fixed inset-0 z-[80] bg-black/75 p-3 backdrop-blur-sm sm:p-6" role="presentation" onClick={() => setRecipePickerOpen(false)}>
        <section role="dialog" aria-modal="true" aria-labelledby="recipe-picker-title" onClick={(event) => event.stopPropagation()} className="mx-auto flex h-full max-h-[800px] max-w-4xl flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[#10191e] shadow-2xl">
          <div className="border-b border-[var(--border)] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-gold)]">Cook anything</p><h2 id="recipe-picker-title" className="mt-1 text-3xl">Choose a recipe</h2><p className="mt-1 text-sm text-[var(--text-soft)]">This opens cooking mode without changing your weekly plan.</p></div>
              <button type="button" onClick={() => setRecipePickerOpen(false)} aria-label="Close recipe selection" className="rounded-xl border border-[var(--border)] p-2 text-[var(--text-soft)] hover:text-white"><X aria-hidden="true" /></button>
            </div>
            <label className="relative mt-5 block">
              <Search aria-hidden="true" size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
              <span className="sr-only">Search recipes</span>
              <input value={recipeSearch} onChange={(event) => setRecipeSearch(event.target.value)} placeholder="Search by recipe or ingredient…" autoFocus className="w-full rounded-xl border border-[var(--border)] bg-black/25 py-3 pl-11 pr-4 text-white outline-none placeholder:text-[var(--text-soft)] focus:border-[var(--brand-gold)]" />
            </label>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {selectableRecipes.length > 0 ? <div className="grid gap-3 sm:grid-cols-2">
              {selectableRecipes.map((recipe) => {
                const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
                return <Link key={recipe.slug} href={`/meal-planner/cook/${recipe.slug}`} className="group flex gap-3 rounded-2xl border border-[var(--border)] bg-black/20 p-3 transition hover:border-[var(--brand-gold)] hover:bg-white/5">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-black/30"><Image src={recipe.image || "/brand/logo-mark.png"} alt="" fill sizes="96px" className="object-cover transition group-hover:scale-105" /></div>
                  <div className="min-w-0 py-1"><h3 className="line-clamp-2 text-base font-extrabold leading-tight text-[var(--brand-gold)]">{recipe.title}</h3>{totalMinutes > 0 && <p className="mt-2 text-xs text-[var(--text-soft)]">{totalMinutes} minutes</p>}<p className="mt-2 text-xs font-bold text-white">Start cooking →</p></div>
                </Link>;
              })}
            </div> : <div className="py-14 text-center"><h3 className="text-2xl">No recipes found</h3><p className="mt-2 text-[var(--text-soft)]">Try a different dish or ingredient.</p></div>}
          </div>
        </section>
      </div>}
    </main>
  );
}
