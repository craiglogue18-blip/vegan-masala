export function cleanPromoText(text?: string) {
  return String(text || "")
    .replace(/\bpacked with flavour\b/gi, "")
    .replace(/\bperfect weeknight meal\b/gi, "")
    .replace(/\brestaurant-quality\b/gi, "")
    .replace(/\bcomes together beautifully\b/gi, "")
    .replace(/\bwritten in the style of\b/gi, "")
    .replace(/\bflavour-packed\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstSentence(text?: string) {
  const clean = cleanPromoText(text);
  return clean.split(/[.!?]/)[0].trim();
}

export function limitWords(text: string, maxWords: number) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

export function wrapWords(text: string, maxChars: number) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function clampLines(lines: string[], maxLines: number) {
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[.,:;!?…-]+$/, "")}…`;
  return kept;
}

export function fitWrappedTextBlock(options: {
  text: string;
  baseChars: number;
  baseFontSize: number;
  baseLineHeight: number;
  maxHeight: number;
  minFontSize?: number;
  step?: number;
  maxLines?: number;
}) {
  const {
    text,
    baseChars,
    baseFontSize,
    baseLineHeight,
    maxHeight,
    minFontSize = 14,
    step = 2,
    maxLines = Number.POSITIVE_INFINITY,
  } = options;

  const cleaned = cleanPromoText(text);
  if (!cleaned) {
    return {
      lines: [],
      fontSize: baseFontSize,
      lineHeight: baseLineHeight,
      truncated: false,
    };
  }

  for (let fontSize = baseFontSize; fontSize >= minFontSize; fontSize -= step) {
    const scale = fontSize / baseFontSize;
    const chars = Math.max(12, Math.floor(baseChars / scale));
    const lineHeight = Math.max(fontSize + 4, Math.round(baseLineHeight * scale));
    const lines = wrapWords(cleaned, chars);

    if (lines.length <= maxLines && lines.length * lineHeight <= maxHeight) {
      return {
        lines,
        fontSize,
        lineHeight,
        truncated: false,
      };
    }
  }

  const fallbackFont = minFontSize;
  const fallbackScale = fallbackFont / baseFontSize;
  const fallbackChars = Math.max(12, Math.floor(baseChars / fallbackScale));
  const fallbackLineHeight = Math.max(
    fallbackFont + 4,
    Math.round(baseLineHeight * fallbackScale)
  );

  return {
    lines: clampLines(wrapWords(cleaned, fallbackChars), Math.max(1, maxLines)),
    fontSize: fallbackFont,
    lineHeight: fallbackLineHeight,
    truncated: true,
  };
}
