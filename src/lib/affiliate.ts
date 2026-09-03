export const AMAZON_ASSOCIATES_TAG = "veganmasala21-21";
export const AWIN_PUBLISHER_ID = "3062927";
export const ETHICAL_SUPERSTORE_ADVERTISER_ID = "3651";
export const ETHICAL_SUPERSTORE_URL = "https://www.ethicalsuperstore.com/";

export function amazonUkSearchUrl(query: string) {
  return `https://www.amazon.co.uk/s?k=${encodeURIComponent(query)}&tag=${AMAZON_ASSOCIATES_TAG}`;
}

export function awinDeepLinkUrl({
  advertiserId,
  destinationUrl,
  clickReference,
}: {
  advertiserId: string;
  destinationUrl: string;
  clickReference?: string;
}) {
  const url = new URL("https://www.awin1.com/cread.php");
  url.searchParams.set("awinmid", advertiserId);
  url.searchParams.set("awinaffid", AWIN_PUBLISHER_ID);
  if (clickReference) url.searchParams.set("clickref", clickReference);
  url.searchParams.set("ued", destinationUrl);
  return url.toString();
}

export function ethicalSuperstoreAffiliateUrl(clickReference: string) {
  return awinDeepLinkUrl({
    advertiserId: ETHICAL_SUPERSTORE_ADVERTISER_ID,
    destinationUrl: ETHICAL_SUPERSTORE_URL,
    clickReference,
  });
}
