# loc-phish | Secure Simulation Campaign Dashboard

A high-fidelity dashboard and turnstile logging portal designed for secure simulation campaigns. It supports a dual-mode database engine (local mock mode & cloud Firebase mode) with unified Google Sign-In authentication.

---

## Setup & Configuration

### 1. Configure Environment Variables
Copy the template variables file and fill in your details if configuring real Firebase credentials:
```bash
cp .env.example .env
```

---

## Commands & Scripts Reference

### 1. Local Development (Forces Mock Mode)
Runs the application on a local development server. 
> [!IMPORTANT]
> This command forces **Mock Local DB Mode** (using `localStorage`), bypassing real Firebase credentials. This allows instant testing without adding credential keys.
```bash
npm install
npm run dev
```
- Local dashboard endpoint: `http://localhost:5173/pages/dashboard.html`
- Local mock credentials: Click "Sign in with Google" to automatically login as `developer@gmail.com`.

### 2. Run Production Locally (Uses Real Firebase)
Builds the production client bundle and serves it via Vite's preview server.
> [!IMPORTANT]
> This command runs the application in **Production Mode**, utilizing the real Firebase configuration parameters set in your `.env` file.
```bash
npm start
```

### 3. Build for Production
Compiles the application assets for production deployment. The output files are written to the `dist/` directory.
```bash
npm run build
```

### 4. Preview Build
Serves the built production assets in the `dist/` directory for local inspection.
```bash
npm run preview
```

### 5. Code Quality Linting
Runs the ESLint static code analyzer to ensure Javascript style compliance.
```bash
npm run lint
```

---

## Technical Details

### Database & Auth Mode Switching
The application includes a unified driver in `src/firebase-config.js` that automatically switches modes based on the environment:
- **Development Mode (`npm run dev`)**: Mock DB and Mock Auth are enabled. Sessions and visitor logs are stored directly in the browser's `localStorage`.
- **Production Mode (`npm start` / deployment)**: Relies on cloud Firestore and Firebase Authentication. Google authentication utilizes popup sign-in.

### IP Geolocation Lookup Example
To query geolocation details for a logged public IP address recorded in your dashboard session, run:
```bash
curl http://ip-api.com/json/<IP_ADDRESS>
```
