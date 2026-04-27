# News Reader

A responsive news reader app built with React + Vite that fetches data from TheNewsAPI through a backend proxy.

## Overview

- Browse news by category with one featured article view
- Search articles with pagination
- Save/remove favorites in local storage
- Uses a proxy API route so the token is never exposed in the browser

## Project Structure

```text
news-reader/
├── api/                   # Vercel serverless API routes (production)
│   ├── health.js
│   └── news/all.js
├── server/                # Express server (local development)
│   ├── server.js
│   └── .env.example
├── web/                   # React + Vite frontend
├── vercel.json            # Vercel build/output config
└── .env.example           # Root env template
```

## Prerequisites

- Node.js 18+
- npm
- A TheNewsAPI token from [TheNewsAPI](https://www.thenewsapi.com/)

## Local Development

1) Install dependencies:

```bash
npm run server:install
```

2) Create local server env file:

```bash
cp server/.env.example server/.env
```

3) Set your token in `server/.env`:

```env
THENEWSAPI_TOKEN=your_thenewsapi_token_here
PORT=5177
```

4) Start app (server + web):

```bash
npm run dev
```

5) Open:

- Frontend: `http://localhost:5176`
- API health: `http://localhost:5177/api/health`

## Scripts

### Root

- `npm run server:install` - install `server` and `web` dependencies
- `npm run server:dev` - run Express API
- `npm run web:dev` - run Vite frontend
- `npm run dev` - run server and web together

### Web (`web/`)

- `npm run dev` - run Vite dev server on port `5176`
- `npm run build` - type-check and build production bundle
- `npm run preview` - preview production build

### Server (`server/`)

- `npm run dev` - run local Express proxy

## Deploy to Vercel

This repository is ready for Vercel:

- Frontend build is configured via `vercel.json`
- Production API is served by `api/news/all.js` and `api/health.js`

### Steps

1) Import this repo into Vercel
2) Set environment variable in Vercel project:

```env
THENEWSAPI_TOKEN=your_thenewsapi_token_here
```

3) Deploy

After deploy, the frontend will call `/api/news/all` on the same domain.

## Security Notes

- Never commit real tokens to Git
- Keep secrets only in `server/.env` (local) or Vercel env vars (production)
- If a token is leaked, rotate it immediately in your TheNewsAPI dashboard
