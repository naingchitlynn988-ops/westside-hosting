# WESTSIDE Hosting — free deployment guide

## What is included
- `westside-hosting/`: responsive red/black frontend preview.
- `westside-backend-starter/`: Node.js API starter with registration/login and server records.

## Important status
The frontend is a demo: Start/Stop are simulated. The backend currently stores server records only; its provisioner is a stub. The displayed 4 GB is plan metadata, not reserved physical RAM. This package does not yet run real Minecraft servers or guarantee 24/7 uptime.

## Publish the website for free
1. Create a GitHub account and a new repository named `westside-hosting`.
2. Upload the contents of the `westside-hosting` folder to the repository root (so `index.html` is at the root).
3. In Cloudflare, open Workers & Pages → Create → Pages → Connect to Git.
4. Select the repository. For a plain static site, leave the build command blank and set the output directory to `/` (or `.` if requested by the UI).
5. Deploy. Cloudflare will provide a free `*.pages.dev` address.

## Backend
The backend is a separate Node.js service and is not deployable as a static Pages site. It requires a Node.js host, persistent database storage, environment variables, and a real private Minecraft orchestration host before server power controls can work. Set `JWT_SECRET` to a random secret of at least 32 characters and configure `FRONTEND_ORIGIN` to the deployed Pages URL. Do not publish `.env` or API secrets.

## Real Minecraft hosting
A website host does not provide Minecraft server CPU/RAM. To provide real servers, connect a secured Linux host and a private orchestration panel/API, then implement `westside-backend-starter/src/provisioner.js`. Do not advertise 4 GB or 24/7 until actual capacity and uptime are tested.
