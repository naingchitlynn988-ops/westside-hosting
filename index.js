import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import db from "./db.js";
import { requireAuth } from "./auth.js";
import { provisioner } from "./provisioner.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Set JWT_SECRET to a random value at least 32 characters long.");
}

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5500",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "20kb" }));
app.use(rateLimit({ windowMs: 60_000, limit: 100, standardHeaders: "draft-7", legacyHeaders: false }));

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(10).max(72)
});
const createServerSchema = z.object({
  name: z.string().trim().min(3).max(32),
  edition: z.enum(["java", "bedrock"]).default("java"),
  software: z.enum(["vanilla", "paper", "fabric", "forge"]).default("vanilla")
});

const userByEmail = db.prepare("SELECT id, email, password_hash FROM users WHERE email = ?");
const insertUser = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
const insertServer = db.prepare(`
  INSERT INTO servers (id, user_id, name, edition, software, memory_mb, status)
  VALUES (@id, @user_id, @name, @edition, @software, 4096, 'stopped')
`);
const listServers = db.prepare(`
  SELECT id, name, edition, software, memory_mb, status, created_at
  FROM servers WHERE user_id = ? ORDER BY created_at DESC
`);
const getServer = db.prepare(`
  SELECT id, user_id, name, edition, software, memory_mb, status
  FROM servers WHERE id = ? AND user_id = ?
`);
const updateStatus = db.prepare("UPDATE servers SET status = ? WHERE id = ? AND user_id = ?");

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "westside-api", mode: "starter", hostingConnected: false });
});

app.post("/api/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid registration details" });
  const email = parsed.data.email.toLowerCase();
  if (userByEmail.get(email)) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    const result = insertUser.run(email, passwordHash);
    const token = jwt.sign({ sub: String(result.lastInsertRowid), email }, process.env.JWT_SECRET, { expiresIn: "12h" });
    return res.status(201).json({ token, user: { id: result.lastInsertRowid, email } });
  } catch {
    return res.status(500).json({ error: "Could not create account" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid email or password" });
  const user = userByEmail.get(parsed.data.email.toLowerCase());
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = jwt.sign({ sub: String(user.id), email: user.email }, process.env.JWT_SECRET, { expiresIn: "12h" });
  return res.json({ token, user: { id: user.id, email: user.email } });
});

app.get("/api/servers", requireAuth, (req, res) => {
  res.json({ servers: listServers.all(Number(req.user.sub)) });
});

app.post("/api/servers", requireAuth, async (req, res) => {
  const parsed = createServerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid server configuration" });

  const userId = Number(req.user.sub);
  const ownedCount = db.prepare("SELECT COUNT(*) AS count FROM servers WHERE user_id = ?").get(userId).count;
  if (ownedCount >= 1) return res.status(403).json({ error: "Free starter limit: one server per account" });

  const server = {
    id: randomUUID(),
    user_id: userId,
    name: parsed.data.name,
    edition: parsed.data.edition,
    software: parsed.data.software,
    memory_mb: 4096,
    status: "stopped"
  };
  insertServer.run(server);
  const result = await provisioner.createServer(server);
  return res.status(201).json({
    server: { id: result.id, name: result.name, edition: result.edition, software: result.software,
      memory_mb: result.memory_mb, status: result.status },
    hostingConnected: false,
    note: "Server record created. Connect the private hosting orchestrator to provision a real Minecraft server."
  });
});

app.get("/api/servers/:id/status", requireAuth, async (req, res) => {
  const server = getServer.get(req.params.id, Number(req.user.sub));
  if (!server) return res.status(404).json({ error: "Server not found" });
  res.json(await provisioner.getStatus(server));
});

app.post("/api/servers/:id/power", requireAuth, async (req, res) => {
  const action = z.object({ action: z.enum(["start", "stop"]) }).safeParse(req.body);
  if (!action.success) return res.status(400).json({ error: "Action must be start or stop" });
  const server = getServer.get(req.params.id, Number(req.user.sub));
  if (!server) return res.status(404).json({ error: "Server not found" });

  // Do not mark a server as running until a real orchestrator confirms it.
  const result = await provisioner.setPower(server, action.data.action);
  res.json({ ...result, hostingConnected: false, note: "Demo response only; no real power action was performed." });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled API error:", err?.message || "unknown");
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`WESTSIDE API listening on http://localhost:${port}`));
