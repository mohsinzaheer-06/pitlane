import crypto from 'node:crypto';
import type {NextFunction, Request, Response} from 'express';
import {db} from './db.ts';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN';
  email_verified: number;
  preferred_currency: string;
  marketing_opt_in: number;
  whatsapp_opt_in: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser | null;
    }
  }
}

const SESSION_COOKIE = 'pitlane_session';
const SESSION_DAYS = 14;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export function hashToken(rawToken: string): string {
  const secret = process.env.AUTH_SECRET || 'pitlane-dev-session-secret-change-in-prod';
  return crypto.createHmac('sha256', secret).update(rawToken).digest('hex');
}

export function createSession(userId: number, res: Response): void {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400 * 1000).toISOString();

  db.prepare(`INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)`).run(
    userId,
    tokenHash,
    expiresAt
  );

  res.cookie(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 86400 * 1000,
  });
}

export function clearSession(req: Request, res: Response): void {
  const rawToken = req.cookies?.[SESSION_COOKIE];
  if (typeof rawToken === 'string' && rawToken.length > 0) {
    db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(hashToken(rawToken));
  }
  res.clearCookie(SESSION_COOKIE, {path: '/'});
}

export function attachUser(req: Request, _res: Response, next: NextFunction): void {
  const rawToken = req.cookies?.[SESSION_COOKIE];
  if (typeof rawToken !== 'string' || !rawToken) {
    req.user = null;
    next();
    return;
  }

  const tokenHash = hashToken(rawToken);
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.email_verified, u.preferred_currency, u.marketing_opt_in, u.whatsapp_opt_in, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as (AuthUser & {expires_at: string}) | undefined;

  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    if (row) {
      db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(tokenHash);
    }
    req.user = null;
    next();
    return;
  }

  req.user = {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    email_verified: row.email_verified,
    preferred_currency: row.preferred_currency,
    marketing_opt_in: row.marketing_opt_in,
    whatsapp_opt_in: row.whatsapp_opt_in,
  };
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({error: 'Authentication required.'});
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({error: 'Authentication required.'});
    return;
  }
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({error: 'Administrator privileges required.'});
    return;
  }
  next();
}

export function logAudit(params: {
  actorId?: number | null;
  actorEmail?: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): void {
  try {
    db.prepare(
      `INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, details_json, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      params.actorId ?? null,
      params.actorEmail ?? 'system',
      params.action,
      params.entityType,
      String(params.entityId ?? ''),
      JSON.stringify(params.details ?? {}),
      params.ipAddress ?? ''
    );
  } catch {
    // Non-blocking audit write
  }
}

const rateBuckets = new Map<string, {count: number; resetAt: number}>();

export function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      rateBuckets.set(key, {count: 1, resetAt: now + windowMs});
      next();
      return;
    }
    if (bucket.count >= maxRequests) {
      res.status(429).json({error: 'Too many requests. Please wait a moment and try again.'});
      return;
    }
    bucket.count += 1;
    next();
  };
}
