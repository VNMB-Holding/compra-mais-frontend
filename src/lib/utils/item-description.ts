export interface ParsedItemDescription {
  cleanDescription: string;
  referenceUrl?: string;
}

export interface MarketplaceSource {
  id:
    | "mercadolivre"
    | "amazon"
    | "shopee"
    | "magalu"
    | "kalunga"
    | "kabum"
    | "aliexpress"
    | "americanas"
    | "whatsapp"
    | "ecommerce";
  label: string;
  shortLabel: string;
  isMercadoLivre: boolean;
  logoPath?: string;
}

export function detectMarketplaceFromUrl(url?: string | null): MarketplaceSource | null {
  if (!url) return null;
  const lower = String(url).trim().toLowerCase();
  if (!lower) return null;

  if (
    lower.includes("mercadolivre.com") ||
    lower.includes("mercadolibre.com") ||
    lower.includes("produto.mercadolivre") ||
    lower.includes("meli.la") ||
    lower === "mercadolivre" ||
    lower.includes("mercado livre")
  ) {
    return {
      id: "mercadolivre",
      label: "Mercado Livre",
      shortLabel: "Mercado Livre",
      isMercadoLivre: true,
      logoPath: "/logos/marketplaces/mercadolivre.svg",
    };
  }
  if (
    lower.includes("amazon.com") ||
    lower.includes("amzn.to") ||
    lower.includes("a.co/") ||
    lower.includes("amazon")
  ) {
    return {
      id: "amazon",
      label: "Amazon",
      shortLabel: "Amazon",
      isMercadoLivre: false,
      logoPath: "/logos/marketplaces/amazon.svg",
    };
  }
  if (lower.includes("shopee.com") || lower.includes("shp.ee") || lower.includes("shopee")) {
    return {
      id: "shopee",
      label: "Shopee",
      shortLabel: "Shopee",
      isMercadoLivre: false,
      logoPath: "/logos/marketplaces/shopee.svg",
    };
  }
  if (
    lower.includes("magazineluiza.com") ||
    lower.includes("magalu.com") ||
    lower.includes("magalu") ||
    lower.includes("magazine luiza")
  ) {
    return {
      id: "magalu",
      label: "Magazine Luiza",
      shortLabel: "Magalu",
      isMercadoLivre: false,
      logoPath: "/logos/marketplaces/magalu.svg",
    };
  }
  if (
    lower.includes("wa.me") ||
    lower.includes("whatsapp.com") ||
    lower.includes("whatsapp") ||
    lower.includes("comércio local") ||
    lower.includes("comercio local")
  ) {
    return {
      id: "whatsapp",
      label: "WhatsApp / Local",
      shortLabel: "WhatsApp",
      isMercadoLivre: false,
      logoPath: "/logos/marketplaces/whatsapp.svg",
    };
  }
  if (lower.includes("kalunga.com")) {
    return {
      id: "kalunga",
      label: "Kalunga",
      shortLabel: "Kalunga",
      isMercadoLivre: false,
    };
  }
  if (lower.includes("kabum.com")) {
    return {
      id: "kabum",
      label: "KaBuM!",
      shortLabel: "KaBuM!",
      isMercadoLivre: false,
    };
  }
  if (lower.includes("aliexpress.com")) {
    return {
      id: "aliexpress",
      label: "AliExpress",
      shortLabel: "AliExpress",
      isMercadoLivre: false,
    };
  }
  if (lower.includes("americanas.com")) {
    return {
      id: "americanas",
      label: "Americanas",
      shortLabel: "Americanas",
      isMercadoLivre: false,
    };
  }

  if (/^https?:\/\//i.test(lower) || /^www\./i.test(lower)) {
    try {
      const full = lower.startsWith("http") ? lower : `https://${lower}`;
      const host = new URL(full).hostname.replace(/^www\./i, "");
      return {
        id: "ecommerce",
        label: `Link (${host})`,
        shortLabel: host,
        isMercadoLivre: false,
      };
    } catch {
      return {
        id: "ecommerce",
        label: "Link Externo",
        shortLabel: "Link Web",
        isMercadoLivre: false,
      };
    }
  }

  return null;
}

export function isMarketplaceOrLocalSupplier(name?: string | null): boolean {
  if (!name) return false;
  return /mercado\s*livre|amazon|shopee|magalu|magazine\s*luiza|com[eé]rcio\s*local|loja\s*local|balc[aã]o|aliexpress|americanas/i.test(
    name,
  );
}

export function extractProposalOfferUrl(notes?: string | null, brandModel?: string | null): string | undefined {
  const fromBrand = sanitizeUrl(brandModel);
  if (fromBrand) return fromBrand;
  if (!notes) return undefined;
  const match = notes.match(/(https?:\/\/[^\s,;\)\]]+|www\.[a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.[a-z]{2,}[^\s,;\)\]]*)/i);
  if (match && match[1]) {
    return sanitizeUrl(match[1]);
  }
  return undefined;
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
