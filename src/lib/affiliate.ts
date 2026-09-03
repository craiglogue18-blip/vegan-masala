export const AMAZON_ASSOCIATES_TAG = "veganmasala21-21";
export const AWIN_PUBLISHER_ID = "3062927";
export const ETHICAL_SUPERSTORE_ADVERTISER_ID = "3651";
export const ETHICAL_SUPERSTORE_URL = "https://www.ethicalsuperstore.com/";

export const AMAZON_PRODUCTS = {
  pressureCooker: {
    asin: "B0DMTG27DD",
    name: "Instant Pot Plus 9-in-1 Multi-Cooker, 5.7L",
  },
  spiceGrinder: {
    asin: "B00004SPEU",
    name: "KRUPS Coffee Grinder and Spice Mill, 200W",
  },
  tawa: {
    asin: "B0D2P2934H",
    name: "La Cuisine Pre-Seasoned Cast-Iron Tawa, 28cm",
  },
  idliSteamer: {
    asin: "B0BZSJVTZ1",
    name: "Vinod Stainless-Steel Idli Maker, 16 Idlis",
  },
  handBlender: {
    asin: "B07H86FKK2",
    name: "Kenwood Triblade Hand Blender, 700W",
  },
  heavyPot: {
    asin: "B071ZN3TXM",
    name: "MasterClass Cast-Aluminium Casserole Dish, 2.5L",
  },
  sieve: {
    asin: "B000YJB8TY",
    name: "KitchenCraft Fine-Mesh Sieve, 25cm",
  },
  kadai: {
    asin: "B0F6MWLCY1",
    name: "Vinod Nutri-Tech Triply Non-Stick Kadai, 24cm",
  },
  miniChopper: {
    asin: "B01B81R34U",
    name: "Ninja Express Chop Mini Chopper",
  },
} as const;

export function amazonUkSearchUrl(query: string) {
  return `https://www.amazon.co.uk/s?k=${encodeURIComponent(query)}&tag=${AMAZON_ASSOCIATES_TAG}`;
}

export function amazonUkProductUrl(asin: string) {
  return `https://www.amazon.co.uk/dp/${encodeURIComponent(asin)}?tag=${AMAZON_ASSOCIATES_TAG}`;
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

export function ethicalSuperstoreAffiliateUrl(
  clickReference: string,
  destinationUrl = ETHICAL_SUPERSTORE_URL,
) {
  return awinDeepLinkUrl({
    advertiserId: ETHICAL_SUPERSTORE_ADVERTISER_ID,
    destinationUrl,
    clickReference,
  });
}
