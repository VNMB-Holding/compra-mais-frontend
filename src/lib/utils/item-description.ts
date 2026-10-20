
export interface ParsedItemDescription {
  cleanDescription: string;
  referenceUrl?: string;
}

export function parseItemDescription(
  rawDescription?: string | null,
  explicitUrl?: string | null
): ParsedItemDescription {
  if (!rawDescription || !rawDescription.trim()) {
    return {
      cleanDescription: "Item sem descrição",
      referenceUrl: sanitizeUrl(explicitUrl),
    };
  }

  let desc = rawDescription.trim();
  let foundUrl: string | undefined = sanitizeUrl(explicitUrl);

  const refPattern = /\s*\((?:ref(?:er[êe]ncia)?|link|url)?[:\s]*(https?:\/\/[^\s\)]+)\)\s*$/i;
  const match = desc.match(refPattern);

  if (match) {
    if (!foundUrl) {
      foundUrl = sanitizeUrl(match[1]);
    }
    desc = desc.replace(refPattern, "").trim();
  } else {
    const bareUrlPattern = /\s*(?:\((https?:\/\/[^\s\)]+)\)|(https?:\/\/[^\s\)]+))\s*$/i;
    const bareMatch = desc.match(bareUrlPattern);
    if (bareMatch) {
      const extracted = bareMatch[1] || bareMatch[2];
      if (!foundUrl) {
        foundUrl = sanitizeUrl(extracted);
      }
      desc = desc.replace(bareUrlPattern, "").trim();
    }
  }

  return {
    cleanDescription: desc || rawDescription.trim(),
    referenceUrl: foundUrl,
  };
}

export function sanitizeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (/^(?:www\.)?[a-z0-9][a-z0-9-]{1,61}[a-z0-9]\.[a-z]{2,}/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return undefined;
}
