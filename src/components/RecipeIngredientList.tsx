import AffiliateLink from "@/components/AffiliateLink";
import { getIngredientAffiliateRecommendation } from "@/lib/ingredient-affiliates";

export default function RecipeIngredientList({
  ingredients,
  recipeSlug,
}: {
  ingredients: string[];
  recipeSlug: string;
}) {
  const seenDestinations = new Set<string>();
  const recommendations = ingredients.map((ingredient) => {
    const recommendation = getIngredientAffiliateRecommendation(ingredient, recipeSlug);
    if (!recommendation || seenDestinations.has(recommendation.href)) return null;
    seenDestinations.add(recommendation.href);
    return recommendation;
  });
  const hasRecommendations = recommendations.some(Boolean);

  return (
    <>
      {hasRecommendations && (
        <div className="mt-4 rounded-xl border border-[var(--brand-gold)]/25 bg-black/15 px-4 py-3 text-xs leading-5 text-[var(--text-soft)]/85">
          <strong className="text-[var(--brand-gold)]">Affiliate ingredient links:</strong>{" "}
          the clearly labelled shopping links below support Vegan Masala at no extra cost to you.
        </div>
      )}

      <ul className="mt-6 space-y-3 text-[var(--text-soft)]">
        {ingredients.map((item, index) => {
          const recommendation = recommendations[index];
          return (
            <li
              key={`${item}-${index}`}
              className="rounded-xl border border-white/5 bg-black/10 px-4 py-3 leading-7"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span>
                  <span className="mr-2 font-bold text-[var(--brand-gold)]">•</span>
                  {item}
                </span>
                {recommendation && (
                  <AffiliateLink
                    href={recommendation.href}
                    title={recommendation.title}
                    category="Recipe ingredient"
                    network={recommendation.network}
                    destinationLabel={recommendation.destinationLabel}
                    placement={`recipe-${recipeSlug}-ingredient-${index + 1}`}
                    className="inline-flex shrink-0 items-center gap-1 self-start rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 px-3 py-1 text-xs font-extrabold text-[var(--brand-gold)] transition hover:bg-[var(--brand-gold)] hover:text-black sm:self-auto"
                  >
                    Shop ingredient <span aria-hidden="true">↗</span>
                    <span className="sr-only"> (paid affiliate link)</span>
                  </AffiliateLink>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
