# News Reader Proxy Server

Express proxy for TheNewsApi. This server keeps `THENEWSAPI_TOKEN` private and exposes safe frontend routes.

## Endpoints

- `GET /api/health`
- `GET /api/news/all?page=1&categories=tech`
- `GET /api/news/all?page=1&search=ai`

## Environment

Copy `.env.example` to `.env` and set:

```
THENEWSAPI_TOKEN=your_real_token
PORT=5177
```

Never commit real tokens.
