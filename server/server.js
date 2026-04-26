const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fetch = require("node-fetch");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = Number(process.env.PORT || 5177);
const TOKEN = process.env.THENEWSAPI_TOKEN;
const ALL_NEWS_URL = "https://api.thenewsapi.com/v1/news/all";
const HEADLINES_URL = "https://api.thenewsapi.com/v1/news/headlines";
const PAGE_CACHE_TTL_MS = 5 * 60 * 1000;
const RESULTS_PER_PAGE = 3;
const SEARCH_BOOTSTRAP_PAGES = 4;
const SEARCH_MAX_FETCHES_PER_REQUEST = 10;

app.use(cors());
app.use(express.json());

const pageCache = new Map();
const searchTimelineCache = new Map();

function buildCacheKey({ page, categories, search }) {
  return JSON.stringify({
    page: Number(page || 1),
    categories: categories || "",
    search: search || ""
  });
}

function getCachedValue(key) {
  const cached = pageCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.createdAt > PAGE_CACHE_TTL_MS) {
    pageCache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedValue(key, value) {
  pageCache.set(key, {
    createdAt: Date.now(),
    data: value
  });
}

function getFreshSearchState(searchKey) {
  const existing = searchTimelineCache.get(searchKey);
  if (existing && Date.now() - existing.createdAt <= PAGE_CACHE_TTL_MS) {
    return existing;
  }

  const fresh = {
    createdAt: Date.now(),
    articles: [],
    nextUpstreamPage: 1,
    exhausted: false
  };
  searchTimelineCache.set(searchKey, fresh);
  return fresh;
}

function sortByNewest(articles) {
  return [...articles].sort((a, b) => {
    const left = new Date(a?.published_at || 0).getTime();
    const right = new Date(b?.published_at || 0).getTime();
    return right - left;
  });
}

function getUtcDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function requestNews(url) {
  const response = await fetch(url);
  const payload = await response.json();
  return { response, payload };
}

async function fetchSearchPage(search, upstreamPage) {
  const headlinesParams = new URLSearchParams({
    api_token: TOKEN,
    language: "en",
    page: String(upstreamPage),
    search,
    headlines_per_category: String(RESULTS_PER_PAGE),
    published_on: getUtcDateString()
  });
  const headlinesUrl = `${HEADLINES_URL}?${headlinesParams.toString()}`;
  let result = await requestNews(headlinesUrl);

  // Some plans do not include /headlines access; fallback to /news/all search.
  if (result.response.status === 401 || result.response.status === 403) {
    const fallbackParams = new URLSearchParams({
      api_token: TOKEN,
      language: "en",
      limit: String(RESULTS_PER_PAGE),
      page: String(upstreamPage),
      search
    });
    const fallbackUrl = `${ALL_NEWS_URL}?${fallbackParams.toString()}`;
    result = await requestNews(fallbackUrl);
  }

  return result;
}

async function resolveSearchPage(search, page) {
  const searchKey = search.toLowerCase();
  const state = getFreshSearchState(searchKey);
  state.createdAt = Date.now();

  const requiredCount = page * RESULTS_PER_PAGE;
  const minimumFetches = page === 1 ? SEARCH_BOOTSTRAP_PAGES : 1;
  let fetches = 0;

  while (
    !state.exhausted &&
    fetches < SEARCH_MAX_FETCHES_PER_REQUEST &&
    (state.articles.length < requiredCount || fetches < minimumFetches)
  ) {
    const { response, payload } = await fetchSearchPage(search, state.nextUpstreamPage);
    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        payload
      };
    }

    const incoming = Array.isArray(payload?.data) ? payload.data : [];
    if (incoming.length === 0) {
      state.exhausted = true;
      break;
    }

    const known = new Set(state.articles.map((article) => article?.uuid || article?.url));
    for (const article of incoming) {
      const key = article?.uuid || article?.url;
      if (!key || known.has(key)) continue;
      known.add(key);
      state.articles.push(article);
    }

    state.articles = sortByNewest(state.articles);
    state.nextUpstreamPage += 1;
    fetches += 1;

    if (incoming.length < RESULTS_PER_PAGE) {
      state.exhausted = true;
    }
  }

  const start = (page - 1) * RESULTS_PER_PAGE;
  const end = start + RESULTS_PER_PAGE;
  const data = state.articles.slice(start, end);

  return {
    ok: true,
    status: 200,
    payload: {
      meta: {
        found: state.articles.length,
        returned: data.length,
        limit: RESULTS_PER_PAGE,
        page
      },
      data
    }
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/news/all", async (req, res) => {
  if (!TOKEN) {
    return res.status(500).json({
      message: "Missing THENEWSAPI_TOKEN on server."
    });
  }

  const page = Number(req.query.page || 1);
  const categories = typeof req.query.categories === "string" ? req.query.categories.trim() : "";
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

  const cacheKey = buildCacheKey({ page, categories, search });
  const cached = getCachedValue(cacheKey);

  if (cached) {
    return res.json(cached);
  }

  const isSearchMode = Boolean(search);

  try {
    let response;
    let payload;

    if (isSearchMode) {
      const resolved = await resolveSearchPage(search, page);
      response = { ok: resolved.ok, status: resolved.status };
      payload = resolved.payload;
    } else {
      const params = new URLSearchParams({
        api_token: TOKEN,
        language: "en",
        limit: String(RESULTS_PER_PAGE),
        page: String(page),
        categories: categories || "tech"
      });
      const targetUrl = `${ALL_NEWS_URL}?${params.toString()}`;
      const result = await requestNews(targetUrl);
      response = result.response;
      payload = result.payload;
    }

    if (!response.ok) {
      return res.status(response.status).json({
        message: payload.message || "Failed to fetch TheNewsApi.",
        status: response.status
      });
    }

    const normalizedPayload = {
      ...payload,
      data: Array.isArray(payload?.data) ? sortByNewest(payload.data) : []
    };

    setCachedValue(cacheKey, normalizedPayload);
    return res.json(normalizedPayload);
  } catch (_error) {
    return res.status(500).json({
      message: "Proxy request failed."
    });
  }
});

app.listen(PORT, () => {
  console.log(`news-reader proxy listening on http://localhost:${PORT}`);
});
