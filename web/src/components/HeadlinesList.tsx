import type { NewsArticle } from "../lib/newsapi";

type HeadlinesListProps = {
  article: NewsArticle;
  absoluteIndex: number;
  isFavorite: boolean;
  onToggleFavorite: (article: NewsArticle) => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export default function HeadlinesList({
  article,
  absoluteIndex,
  isFavorite,
  onToggleFavorite
}: HeadlinesListProps) {
  const fallback = "/placeholder.png";
  const imageUrl = article.image_url || fallback;

  return (
    <article className="featured-card" role="article" aria-label={article.title}>
      <img
        className="featured-image"
        src={imageUrl}
        alt={article.title || "News article image"}
        onError={(event) => {
          event.currentTarget.src = fallback;
        }}
      />
      <div className="featured-overlay">
        <p className="article-position">Article #{absoluteIndex}</p>
        <h2>{article.title}</h2>
        <p className="meta">
          {article.source} • {formatDate(article.published_at)}
        </p>
        <p>{article.description || article.snippet || "No description available."}</p>
        <div className="card-actions">
          <button className="btn secondary" onClick={() => onToggleFavorite(article)}>
            {isFavorite ? "Remove Favorite" : "Save to Favorites"}
          </button>
          <a className="btn primary" href={article.url} target="_blank" rel="noreferrer">
            View Full Article
          </a>
        </div>
      </div>
    </article>
  );
}
