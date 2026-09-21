import {
  amazonUkSearchUrl,
  ethicalSuperstoreAffiliateUrl,
  SPICE_KITCHEN_INDIAN_TIN_URL,
  spiceKitchenAffiliateUrl,
} from "@/lib/affiliate";

export type IngredientAffiliateRecommendation = {
  title: string;
  href: string;
  network: "Awin" | "Amazon UK";
  destinationLabel: string;
};

const ethicalProducts = {
  garamMasala: "https://www.ethicalsuperstore.com/products/suma/suma-garam-masala-50g/",
  basmatiRice: "https://www.ethicalsuperstore.com/products/suma/suma-prepacks-organic-white-basmati-rice-1000g/",
  coconutMilk: "https://www.ethicalsuperstore.com/products/suma/suma-organic-coconut-milk---400ml/",
  chickpeas: "https://www.ethicalsuperstore.com/products/suma/suma-organic-chickpeas-400g/",
  driedPulses: "https://www.ethicalsuperstore.com/category/groceries-and-everyday/pasta-rice-and-pulses/beans-and-pulses-dried/",
  tinnedPulses: "https://www.ethicalsuperstore.com/category/groceries-and-everyday/pasta-rice-and-pulses/pulses/",
} as const;

function ethical(
  title: string,
  key: string,
  destinationUrl: string,
  recipeSlug: string,
): IngredientAffiliateRecommendation {
  return {
    title,
    href: ethicalSuperstoreAffiliateUrl(`recipe-${recipeSlug}-ingredient-${key}`, destinationUrl),
    network: "Awin",
    destinationLabel: "Ethical Superstore",
  };
}

function amazon(title: string, query: string): IngredientAffiliateRecommendation {
  return {
    title,
    href: amazonUkSearchUrl(query),
    network: "Amazon UK",
    destinationLabel: "Amazon UK",
  };
}

export function getIngredientAffiliateRecommendation(
  ingredient: string,
  recipeSlug: string,
): IngredientAffiliateRecommendation | null {
  const text = ingredient.toLowerCase();

  if (/\b(garlic|fresh coriander|coriander leaves|fresh chilli|fresh chili)\b/.test(text)) {
    return null;
  }

  if (/\bgaram masala\b/.test(text)) {
    return ethical("Suma Garam Masala", "garam-masala", ethicalProducts.garamMasala, recipeSlug);
  }

  if (/\b(coconut milk|coconut cream)\b/.test(text)) {
    return ethical("Suma Organic Coconut Milk", "coconut-milk", ethicalProducts.coconutMilk, recipeSlug);
  }

  if (/\b(basmati|basmati rice)\b/.test(text)) {
    return ethical("Organic White Basmati Rice", "basmati-rice", ethicalProducts.basmatiRice, recipeSlug);
  }

  if (/\b(chickpeas?|chana)\b/.test(text)) {
    return ethical("Organic Chickpeas", "chickpeas", ethicalProducts.chickpeas, recipeSlug);
  }

  if (/\b(red lentils?|green lentils?|brown lentils?|urad dal|moong dal|masoor dal|toor dal|split peas?)\b/.test(text)) {
    return ethical("Dried Lentils and Pulses", "dried-pulses", ethicalProducts.driedPulses, recipeSlug);
  }

  if (/\b(kidney beans?|black beans?|butter beans?|cannellini beans?|rajma)\b/.test(text)) {
    return ethical("Tinned Beans and Pulses", "tinned-pulses", ethicalProducts.tinnedPulses, recipeSlug);
  }

  if (/\b(asafoetida|hing)\b/.test(text)) {
    return amazon("Asafoetida (Hing)", "Suma asafoetida hing 15g");
  }

  if (/\b(gram flour|chickpea flour|besan)\b/.test(text)) {
    return amazon("Gram Flour (Besan)", "gram flour besan Indian cooking");
  }

  if (/\b(chapati flour|atta|wholemeal flour|whole wheat flour)\b/.test(text)) {
    return amazon("Chapati Flour (Atta)", "chapati flour atta wholemeal");
  }

  if (/\b(amchur|mango powder|kasuri methi|dried fenugreek|black salt|kala namak|curry leaves)\b/.test(text)) {
    return amazon("Specialist Indian Pantry Ingredient", ingredient.replace(/^[-*\d.\s]+/, "").slice(0, 80));
  }

  if (/\b(cumin|coriander|turmeric|cardamom|fenugreek|mustard seeds?|chilli powder|chili powder|cayenne|cinnamon|clove|fennel seeds?|nigella|kalonji)\b/.test(text)) {
    return {
      title: "Spice Kitchen Indian Spice Tin",
      href: spiceKitchenAffiliateUrl(`recipe-${recipeSlug}-ingredient-spice-tin`, SPICE_KITCHEN_INDIAN_TIN_URL),
      network: "Awin",
      destinationLabel: "Spice Kitchen",
    };
  }

  return null;
}
