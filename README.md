
## Development & Deployment

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

### Vercel Deployment Tips
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: Configure the following optional environment variables in your Vercel project settings under Settings -> Environment Variables:
  - `VITE_DEFAULT_HOSTNAME`: The fallback hostname displayed in the Turnstile widget (e.g., `example.com`).
  - `VITE_DEFAULT_REDIRECT_URL`: The URL to redirect the user to after successful Turnstile verification (e.g., `https://cloudflare.com`).

---

## IP Geolocation Lookup Example
To lookup geolocation details for a public IP address, you can run:

```bash
curl http://ip-api.com/json/<IP_ADDRESS>
```
