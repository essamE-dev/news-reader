import { useEffect, useMemo, useRef, useState } from "react";
import HeadlinesList from "./components/HeadlinesList";
import { CATEGORIES, type Category, fetchNews, type NewsArticle } from "./lib/newsapi";

type FavoritesMap = Record<string, NewsArticle>;
type PageCache = Map<number, NewsArticle[]>;
type ViewMode = "live" | "favorites";

const FAVORITES_KEY = "news-reader-favorites";

function getArticleKey(article: NewsArticle): string {
  return article.uuid || article.url;
}

function readFavorites(): FavoritesMap {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as FavoritesMap;
  } catch {
    return {};
  }
}

export default function App() {
  const [category, setCategory] = useState<Category>("tech");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [indexInPage, setIndexInPage] = useState(0);
  const [items, setItems] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("live");
  const [favorites, setFavorites] = useState<FavoritesMap>(() => readFavorites());

  const cacheRef = useRef<PageCache>(new Map());
  const inFlightRef = useRef<Set<number>>(new Set());
  const activeQueryRef = useRef("");

  const favoritesList = useMemo(() => Object.values(favorites), [favorites]);
  const currentList = viewMode === "favorites" ? favoritesList : items;
  const currentArticle = currentList[indexInPage] || null;

  const queryKey = useMemo(
    () =>
      JSON.stringify({
        category,
        search: search.trim()
      }),
    [category, search]
  );

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const loadPage = async (nextPage: number, opts?: { useSkeleton?: boolean }) => {
    if (viewMode === "favorites") return;
    const useSkeleton = opts?.useSkeleton ?? false;
    const cached = cacheRef.current.get(nextPage);

    if (cached) {
      setItems(cached);
      setPage(nextPage);
      setError("");
      return;
    }

    if (inFlightRef.current.has(nextPage)) return;
    inFlightRef.current.add(nextPage);
    if (useSkeleton) {
      setLoading(true);
    }

    try {
      const payload = await fetchNews({
        page: nextPage,
        category,
        search
      });
      if (activeQueryRef.current !== queryKey) return;

      const list = payload.data || [];
      cacheRef.current.set(nextPage, list);
      setItems(list);
      setPage(nextPage);
      setError("");
    } catch (err) {
      if (activeQueryRef.current !== queryKey) return;
      setError(err instanceof Error ? err.message : "Unexpected error.");
      setItems([]);
    } finally {
      inFlightRef.current.delete(nextPage);
      if (useSkeleton) {
        setLoading(false);
      }
    }
  };

  const prefetchPage = async (targetPage: number) => {
    if (viewMode === "favorites") return;
    if (targetPage < 1) return;
    if (cacheRef.current.has(targetPage)) return;
    if (inFlightRef.current.has(targetPage)) return;

    inFlightRef.current.add(targetPage);
    try {
      const payload = await fetchNews({
        page: targetPage,
        category,
        search
      });
      if (activeQueryRef.current !== queryKey) return;
      cacheRef.current.set(targetPage, payload.data || []);
    } catch {
      // Prefetch failures should not interrupt interaction.
    } finally {
      inFlightRef.current.delete(targetPage);
    }
  };

  useEffect(() => {
    if (viewMode === "favorites") return;
    cacheRef.current.clear();
    inFlightRef.current.clear();
    setItems([]);
    setError("");
    setPage(1);
    setIndexInPage(0);
    setLoading(true);

    activeQueryRef.current = queryKey;
    void loadPage(1, { useSkeleton: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, viewMode]);

  useEffect(() => {
    if (viewMode === "favorites") return;
    if (indexInPage === 1) {
      void prefetchPage(page + 1);
    }
    if (indexInPage === 0 && page > 1) {
      void prefetchPage(page - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexInPage, page, viewMode]);

  useEffect(() => {
    if (indexInPage > currentList.length - 1) {
      setIndexInPage(0);
    }
  }, [currentList, indexInPage]);

  const goToFirstPage = async () => {
    setIndexInPage(0);
    await loadPage(1, { useSkeleton: true });
  };

  const goPrev = async () => {
    if (indexInPage > 0) {
      setIndexInPage((value) => value - 1);
      return;
    }
    if (page > 1) {
      const prevPage = page - 1;
      const cached = cacheRef.current.get(prevPage);
      if (cached) {
        setItems(cached);
        setPage(prevPage);
        setIndexInPage(Math.max(cached.length - 1, 0));
      } else {
        await loadPage(prevPage, { useSkeleton: true });
        const loaded = cacheRef.current.get(prevPage) || [];
        setIndexInPage(Math.max(loaded.length - 1, 0));
      }
    }
  };

  const goNext = async () => {
    if (indexInPage < currentList.length - 1) {
      setIndexInPage((value) => value + 1);
      return;
    }
    if (viewMode === "favorites") return;

    const nextPage = page + 1;
    const cached = cacheRef.current.get(nextPage);
    if (cached) {
      setItems(cached);
      setPage(nextPage);
      setIndexInPage(0);
      return;
    }
    setIndexInPage(0);
    await loadPage(nextPage, { useSkeleton: true });
  };

  const goToIndex = (idx: number) => {
    if (idx >= 0 && idx < currentList.length) {
      setIndexInPage(idx);
    }
  };

  const onCategoryChange = (next: Category) => {
    setViewMode("live");
    setSearchInput("");
    setSearch("");
    setCategory(next);
  };

  const onSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setViewMode("live");
    setSearch(searchInput.trim());
  };

  const onExitFavorites = () => {
    setViewMode("live");
  };

  const toggleFavorite = (article: NewsArticle) => {
    const key = getArticleKey(article);
    setFavorites((previous) => {
      const next = { ...previous };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = article;
      }
      return next;
    });
  };

  const absoluteNumbers = useMemo(() => {
    if (viewMode === "favorites") {
      return [1, 2, 3].map((n) => ({ label: n, index: n - 1 }));
    }
    const start = (page - 1) * 3 + 1;
    return [0, 1, 2].map((offset) => ({
      label: start + offset,
      index: offset
    }));
  }, [page, viewMode]);

  const selectedArticleKey = currentArticle ? getArticleKey(currentArticle) : "";
  const noContent = !loading && !error && currentList.length === 0;

  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1>News Reader</h1>
      </header>

      <div className="mobile-filter-toggle">
        <button type="button" className="btn secondary" onClick={() => setShowFilters((s) => !s)}>
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
      </div>

      <div className="layout">
        <aside className={`sidebar ${showFilters ? "open" : ""}`} aria-label="Filters">
          <form onSubmit={onSearchSubmit} className="search-form">
            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="search"
              placeholder="Search all news"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit" className="btn primary">
              Apply Search
            </button>
          </form>

          <div className="category-list" role="tablist" aria-label="Categories">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                className={`category-item ${category === item && !search ? "active" : ""}`}
                onClick={() => onCategoryChange(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="sidebar-footer">
            {viewMode === "favorites" ? (
              <button className="btn secondary" onClick={onExitFavorites} type="button">
                Back to Live Feed
              </button>
            ) : (
              <button className="btn secondary" onClick={() => setViewMode("favorites")} type="button">
                Favorites ({favoritesList.length})
              </button>
            )}
          </div>
        </aside>

        <main className="content-panel" role="main">
          {loading && (
            <section className="loading-state" aria-live="polite">
              <div className="spinner" />
              <p>Loading headlines...</p>
            </section>
          )}

          {!loading && error && (
            <section className="status-card" role="alert">
              <p>{error}</p>
            </section>
          )}

          {noContent && (
            <section className="status-card">
              <p>{viewMode === "favorites" ? "No favorites yet." : "No articles found for this filter."}</p>
            </section>
          )}

          {!loading && !error && currentArticle && (
            <>
              <HeadlinesList
                article={currentArticle}
                absoluteIndex={viewMode === "favorites" ? indexInPage + 1 : (page - 1) * 3 + indexInPage + 1}
                isFavorite={Boolean(favorites[selectedArticleKey])}
                onToggleFavorite={toggleFavorite}
              />

              <nav className="pager" aria-label="Article pagination">
                <button className="pager-btn" onClick={goToFirstPage} disabled={viewMode === "favorites"}>
                  «
                </button>
                <button className="pager-btn" onClick={goPrev}>
                  ‹
                </button>

                {absoluteNumbers.map((dot) => (
                  <button
                    key={dot.label}
                    className={`pager-dot ${dot.index === indexInPage ? "active" : ""}`}
                    onClick={() => goToIndex(dot.index)}
                  >
                    {dot.label}
                  </button>
                ))}

                <button className="pager-btn" onClick={goNext}>
                  ›
                </button>
              </nav>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
