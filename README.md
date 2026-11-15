# WESTSIDE Backend Starter (0.1)

This is the first backend foundation for the WESTSIDE Minecraft hosting project.

## Requirements
- Node.js 20 or newer
- npm

## Run
```bash
npm install
cp .env.example .env
```
Edit `.env` and set `JWT_SECRET` to a long random secret (at least 32 characters), then:
```bash
npm run dev
```
Health check: `http://localhost:4000/api/health`

## Included API
- `POST /api/auth/register` — create an account
- `POST /api/auth/login` — login and receive a 12-hour JWT
- `GET /api/servers` — list the signed-in user's server records
- `POST /api/servers` — create a server record (4,096 MB allocation metadata)
- `GET /api/servers/:id/status` — request status
- `POST /api/servers/:id/power` — request start/stop

Send `Authorization: Bearer <token>` to protected endpoints.

## Honest current status
This is an API starter, **not a live hosting service**. The provisioner is deliberately a stub. It does not allocate physical RAM, launch Minecraft, or guarantee 24/7 uptime. The 4 GB value is currently a plan allocation field only.

## Before public launch
1. Choose and provision a Linux dedicated server or VPS with enough physical RAM/CPU/storage/network capacity.
2. Install and secure a Minecraft orchestration panel/daemon (for example, Pterodactyl) on private infrastructure.
3. Implement `src/provisioner.js` using that panel's authenticated API. Keep API keys server-side only.
4. Add email verification, password reset, stronger abuse/rate limits, audit logs, backups, monitoring and admin controls.
5. Configure HTTPS, firewall rules, DNS for `royyhosting.com`, and production database backups.
6. Load-test and verify that actual concurrent server allocations fit the host's capacity before advertising 4 GB per user.

Never expose Docker sockets, SSH credentials, orchestration daemon ports, or panel admin keys to browser JavaScript.
