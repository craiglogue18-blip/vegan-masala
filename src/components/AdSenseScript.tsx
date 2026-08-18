import Script from "next/script";

const ADSENSE_CLIENT = "ca-pub-8611934119496722";

export default function AdSenseScript() {
  if (process.env.NEXT_PUBLIC_ADSENSE_ENABLED !== "true") return null;

  return (
    <Script
      id="google-adsense"
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}
