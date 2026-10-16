export function getSupplierDetailUrl(id: string): string {
  return `/fornecedores/homologacao/${encodeURIComponent(id)}`;
}
