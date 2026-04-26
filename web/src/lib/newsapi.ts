export type Category =
  | "tech"
  | "general"
  | "science"
  | "sports"
  | "business"
  | "health"
  | "entertainment"
  | "politics"
  | "food"
  | "travel";

export const CATEGORIES: Category[] = [
  "tech",
  "general",
  "science",
  "sports",
  "business",
  "health",
  "entertainment",
  "politics",
  "food",
  "travel"
];

export type NewsArticle = {
  uuid: string;
  title: string;
  description: string | null;
  image_url: string | null;
  snippet: string | null;
  source: string;
  published_at: string;
  url: string;
};

export type NewsResponse = {
  data: NewsArticle[];
  meta?: {
    found?: number;
    returned?: number;
    limit?: number;
    page?: number;
  };
};

type Query = {
  page: number;
  category: Category;
  search: string;
};

export async function fetchNews(query: Query): Promise<NewsResponse> {
  const params = new URLSearchParams({
    page: String(query.page)
  });

  if (query.search.trim()) {
    params.set("search", query.search.trim());
  } else {
    params.set("categories", query.category);
  }

  const proxiedUrl = `/api/news/all?${params.toString()}`;
  console.debug("News proxy request:", proxiedUrl);

  const response = await fetch(proxiedUrl);
  const payload = await response.json();

  if (!response.ok) {
    const status = response.status;
    if (status === 429) {
      throw new Error("Daily request limit reached. Please try again tomorrow.");
    }
    if (status === 401 || status === 403) {
      throw new Error("TheNewsApi authentication failed. Check server token configuration.");
    }
    throw new Error(payload.message || "Failed to load news.");
  }

  return payload as NewsResponse;
}
