# Axe

Axe is a minimal production-ready 3D WebGL website builder built with Next.js, Three.js, React Three Fiber, Zustand, GSAP, Framer Motion, Express, MongoDB-compatible persistence, and JWT auth.

## Getting Started

Install dependencies, copy the local environment template, and run the web app plus API:

```bash
npm install
cp .env.example .env.local
npm run dev:full
```

Open [http://localhost:3000](http://localhost:3000).

The API runs on [http://localhost:4200](http://localhost:4200) by default.

## Environment

MongoDB is optional for local development. Without it, the Express API stores projects and users in `.axe-data/db.json`.

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4200
MONGODB_URI=mongodb://localhost:27017/axe
MONGODB_DB=axe
JWT_SECRET=replace-with-a-long-secret
API_PORT=4200
WEB_ORIGIN=http://localhost:3000
```

## Core Commands

```bash
npm run dev
npm run api
npm run dev:full
npm run local
npm run lint
npm run build
npm run check
npm run start:full
```

For a production-style local run, build first, then start both the Express API and the Next.js app:

```bash
npm run build
npm run start:full
```

## API

- `POST /auth/register`
- `POST /auth/login`
- `POST /project`
- `GET /project/:id`

Project routes accept a bearer token when available and also support guest saves for local-first editing.

## Local Persistence

When `MONGODB_URI` is omitted, the API uses `.axe-data/db.json`. That folder is ignored by git, so local test users and projects stay on your machine.
