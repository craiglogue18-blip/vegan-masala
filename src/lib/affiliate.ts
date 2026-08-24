export const AMAZON_ASSOCIATES_TAG = "veganmasala21-21";

export function amazonUkSearchUrl(query: string) {
  return `https://www.amazon.co.uk/s?k=${encodeURIComponent(query)}&tag=${AMAZON_ASSOCIATES_TAG}`;
}
