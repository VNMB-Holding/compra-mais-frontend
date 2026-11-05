export function getSupplierDetailUrl(id: string): string {
  return `/fornecedores/${encodeURIComponent(id)}`;
}
