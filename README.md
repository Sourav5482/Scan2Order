# Scan2Order Web Frontend

Customer-facing restaurant ordering frontend built with React + Vite.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create local env from template:

```bash
cp .env.example .env
```

3. Start dev server:

```bash
npm run dev
```

## Production Build

```bash
npm run build
```

Build output is generated in `dist/`.

## Environment Variable

- `VITE_API_BASE_URL`: backend base URL used by the customer web app.

Example:

```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

## Deployment

### Vercel

This repo includes `vercel.json` with SPA rewrite support.

1. Import project in Vercel.
2. Set `VITE_API_BASE_URL` in Project Settings -> Environment Variables.
3. Deploy.

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Set `VITE_API_BASE_URL` in Site settings -> Environment variables.

## GitHub Push (first-time from local folder)

If your local folder is not yet a git repo:

```bash
git init
git add .
git commit -m "Prepare web frontend for deployment"
git branch -M main
git remote add origin https://github.com/Sourav5482/Scan2Order.git
git push -u origin main
```
