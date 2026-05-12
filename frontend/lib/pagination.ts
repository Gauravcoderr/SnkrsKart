export interface PaginatedResponse<T> {
  blogs: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export async function fetchPaginated<T>(
  url: string,
  options?: RequestInit,
): Promise<PaginatedResponse<T>> {
  const empty: PaginatedResponse<T> = { blogs: [], total: 0, page: 1, pages: 0, limit: 12 };
  try {
    const res = await fetch(url, options);
    if (!res.ok) return empty;
    return res.json();
  } catch {
    return empty;
  }
}
