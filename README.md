<p align="center">
  <strong style="font-size: 2.3em;">loc-phish</strong>
</p>
<p align="center">
  Private-use location phishing utility.<br>
  Cloudflare Turnstile verification page as redirect template.
</p>



## Setup

```bash
cp .env.example .env.local
npm install && npm run dev
```

Set `AUTH_PASSWORD` in `.env.local`, then visit `/login`.

## Pages

| URL | |
|-----|-|
| `/dashboard` | Campaigns + telemetry |
| `/verify?s=<id>` or `/v/<slug>` | Turnstile redirect page |

## Data

Mock mode by default (`localStorage`). To persist, add to `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
```

## Scripts

```
dev       npm run dev
build     npm run build
start     npm start
check     npm run check
```

## How it works

Visitor hits the verify page → IP, rayId, UA, referrer logged immediately. Geolocation captures lat/lon/accuracy on interaction.

Look up IP details:

```bash
curl http://ip-api.com/json/<IP>
```
