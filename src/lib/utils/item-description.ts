export interface ParsedItemDescription {
  cleanDescription: string;
  referenceUrl?: string;
}

export function sanitizeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  let trimmed = String(url).trim();
  if (!trimmed) return undefined;

  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) {
    return undefined;
  }

  trimmed = trimmed.replace(/[.,;:\)\]>]+$/, "");

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^(?:www\.)?[a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return undefined;
}

export function deriveTitleFromUrl(url: string): string {
  try {
    const full = url.startsWith("http") ? url : `https://${url}`;
    const parsed = new URL(full);
    const domain = parsed.hostname.replace(/^www\./i, "");
    const parts = parsed.pathname.split("/").filter(Boolean);

    const candidates = parts
      .map((p) => {
        try {
          return decodeURIComponent(p).replace(/\.(html?|php|aspx?)$/i, "");
        } catch {
          return p;
        }
      })
      .filter(
        (p) =>
          !/^(?:dp|p|item|produto|itm|gp|pd|product|MLB\d*|index)$/i.test(p) &&
          !/^[0-9a-f-]{20,}$/i.test(p) &&
          !/^[A-Z0-9]{10,}$/.test(p) &&
          !/^\d+$/.test(p)
      );

    const longest = candidates.sort((a, b) => b.length - a.length)[0];
    if (longest && longest.length >= 3) {
      const words = longest
        .replace(/[-_+]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (words.length >= 3 && !/^https?:/i.test(words)) {
        return words.charAt(0).toUpperCase() + words.slice(1);
      }
    }

    return domain ? `Item Referenciado (${domain})` : "Item de Referência Externa";
  } catch {
    return "Item de Referência Externa";
  }
}

export function parseItemDescription(
  rawDescription?: string | null,
  explicitUrl?: string | null
): ParsedItemDescription {
  let foundUrl: string | undefined = sanitizeUrl(explicitUrl);

  if (!rawDescription || !rawDescription.trim()) {
    return {
      cleanDescription: foundUrl ? deriveTitleFromUrl(foundUrl) : "Item sem descrição",
      referenceUrl: foundUrl,
    };
  }

  let text = rawDescription.trim();

  const enclosedPrefixPattern =
    /[\(\[]\s*(?:ref(?:er[êe]ncia)?|link|url|fonte)?[:\s]*(https?:\/\/[^\s\)\]]+|www\.[^\s\)\]]+)\s*[\)\]]/gi;
  text = text.replace(enclosedPrefixPattern, (_, url) => {
    if (!foundUrl) foundUrl = sanitizeUrl(url);
    return "";
  });

  const enclosedBarePattern =
    /[\(\[]\s*(https?:\/\/[^\s\)\]]+|www\.[^\s\)\]]+)\s*[\)\]]/gi;
  text = text.replace(enclosedBarePattern, (_, url) => {
    if (!foundUrl) foundUrl = sanitizeUrl(url);
    return "";
  });

  const prefixUrlPattern =
    /(?:ref(?:er[êe]ncia)?|link|url)[:\s]+(https?:\/\/[^\s,;]+|www\.[^\s,;]+)/gi;
  text = text.replace(prefixUrlPattern, (_, url) => {
    if (!foundUrl) foundUrl = sanitizeUrl(url);
    return "";
  });

  const bareUrlPattern =
    /(https?:\/\/[^\s,;\)\]]+|www\.[a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.[a-z]{2,}[^\s,;\)\]]*)/gi;
  text = text.replace(bareUrlPattern, (_, url) => {
    if (!foundUrl) foundUrl = sanitizeUrl(url);
    return "";
  });

  let cleaned = text
    .replace(/[\(\[\{]\s*[\)\]\}]/g, "")
    .replace(/^\s*[-–—:•|/\\]+\s*/, "")
    .replace(/\s*[-–—:•|/\\]+\s*$/, "")
    .replace(/\s*,\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = cleaned.replace(/(?:ref(?:er[êe]ncia)?|link|url)[:\s]*$/i, "").trim();
  cleaned = cleaned.replace(/^\s*(?:ref(?:er[êe]ncia)?|link|url)[:\s]*/i, "").trim();
  cleaned = cleaned.replace(/\s*[-–—:•|/\\]+\s*$/, "").trim();

  if (!cleaned) {
    if (foundUrl) {
      cleaned = deriveTitleFromUrl(foundUrl);
    } else {
      cleaned = "Item sem descrição";
    }
  }

  return {
    cleanDescription: cleaned,
    referenceUrl: foundUrl,
  };
}

export function extractItemReferenceUrlsFromNotes(
  notes?: string | null
): Map<string, string> {
  const map = new Map<string, string>();
  if (!notes) return map;

  const match = notes.match(/Links? de refer[êe]ncia:\s*([\s\S]*?)(?:\n\n|$)/i);
  if (!match) return map;

  const lines = match[1].split(/\r?\n/);
  for (const line of lines) {
    const itemMatch = line.match(
      /^[•\-\*]?\s*(.*?):\s*(https?:\/\/[^\s]+|www\.[^\s]+)/i
    );
    if (itemMatch) {
      const itemDesc = itemMatch[1].trim().toLowerCase();
      const url = sanitizeUrl(itemMatch[2]);
      if (url) map.set(itemDesc, url);
    }
  }
  return map;
}

export function cleanNotesDisplay(notes?: string | null): string {
  if (!notes) return "";
  return notes
    .replace(/Links? de refer[êe]ncia:\s*[\s\S]*?(?:\n\n|$)/gi, "")
    .trim();
}
