export function pageRequest(page: number, size: number) {
  return {
    page: String(page),
    size: String(size),
  };
}

export function pageNumber(value: string | number | undefined, fallback = 1): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
