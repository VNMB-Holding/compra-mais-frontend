
export function getPdfFilename(response: Response, fallbackCode: string): string {
  const disposition = response.headers.get("content-disposition") || "";
  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1].replace(/['"]/g, "").trim());
  }

  const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
  if (filenameMatch?.[1]) {
    return filenameMatch[1].trim();
  }

  const safeCode =
    fallbackCode.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "") || "documento";
  return `${safeCode}.pdf`;
}

export async function getPdfErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const data = await response.json();
      return data?.message || data?.error || `Erro ${response.status}`;
    } catch {
      return `Erro ${response.status}`;
    }
  }

  try {
    const text = await response.text();
    return text.trim() || `Erro ${response.status}`;
  } catch {
    return `Erro ${response.status}`;
  }
}

export async function downloadPdfResponse(response: Response, fallbackCode: string): Promise<void> {
  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    throw new Error(await getPdfErrorMessage(response));
  }

  if (!contentType.includes("application/pdf")) {
    throw new Error("O servidor não retornou um documento PDF válido.");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const filename = getPdfFilename(response, fallbackCode);
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
