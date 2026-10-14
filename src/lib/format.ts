export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString("id-ID");
}

export function formatDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString("id-ID");
}
