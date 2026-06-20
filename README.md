## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Firebase credentials for production mode. Without credentials, the app runs in **Mock Mode** using `localStorage`.

### 3. Run Development Server

```bash
npm run dev
```

- Dashboard: `http://localhost:3000/dashboard`
- Login: `http://localhost:3000/login`
- Turnstile page: `http://localhost:3000/verify?s=<sessionId>`

> In mock mode, click "Sign in with Google" to auto-login as `developer@gmail.com`.

### 4. Build & Start Production

```bash
npm run build    # Build for production
npm start        # Start production server
```

> Production mode uses real Firebase credentials from `.env.local`.

---

## Scripts Reference

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run dev` | Start Next.js dev server with Turbopack | Development |
| `npm run build` | Production build | Before deploying |
| `npm start` | Start production server | Production |
| `npm run typecheck` | Run TypeScript type checking | CI / Pre-commit |
| `npm run lint` | Run ESLint on source files | CI / Pre-commit |
| `npm run lint:fix` | Auto-fix ESLint issues | Before committing |
| `npm run format` | Format all files with Prettier | Before committing |
| `npm run format:check` | Check formatting without fixing | CI / Pre-commit |
| `npm run check` | Run typecheck + lint + format check | CI / Pre-commit |
| `npm run check:fix` | Auto-fix lint + format issues | Before committing |


---

## Database & Auth Modes

The app automatically switches between modes:

| Mode | Trigger | Auth | Database |
|------|---------|------|----------|
| **Mock** | No Firebase env vars / `npm run dev` | Mock Google sign-in | `localStorage` |
| **Production** | Firebase env vars set | Real Google OAuth | Cloud Firestore |


---

## IP Geolocation Lookup

To query geolocation details for a recorded IP:

```bash
curl http://ip-api.com/json/<IP_ADDRESS>
```
