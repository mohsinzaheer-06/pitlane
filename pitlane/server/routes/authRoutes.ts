import crypto from 'node:crypto';
import express from 'express';
import {z} from 'zod';
import {db} from '../db.ts';
import {
  clearSession,
  createRateLimiter,
  createSession,
  hashPassword,
  hashToken,
  logAudit,
  requireAuth,
  verifyPassword,
} from '../auth.ts';

export const authRouter = express.Router();
const authLimiter = createRateLimiter(15, 60_000);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  phone: z.string().trim().min(7).max(25),
  password: z.string().min(8, 'Password must be at least 8 characters').max(120),
  marketingOptIn: z.boolean().optional().default(false),
  whatsappOptIn: z.boolean().optional().default(true),
});

authRouter.post('/auth/register', authLimiter, (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({error: 'Invalid registration details.', details: parsed.error.flatten().fieldErrors});
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (existing) {
    res.status(409).json({error: 'An account with this email already exists.'});
    return;
  }

  const info = db
    .prepare(
      `INSERT INTO users (name, email, phone, password_hash, role, email_verified, preferred_currency, marketing_opt_in, whatsapp_opt_in)
       VALUES (?, ?, ?, ?, 'CUSTOMER', 1, 'PKR', ?, ?)`
    )
    .run(
      parsed.data.name,
      email,
      parsed.data.phone,
      hashPassword(parsed.data.password),
      parsed.data.marketingOptIn ? 1 : 0,
      parsed.data.whatsappOptIn ? 1 : 0
    );

  const userId = Number(info.lastInsertRowid);
  if (parsed.data.whatsappOptIn) {
    db.prepare(
      `INSERT INTO consent_records (user_id, phone, email, channel, consent_type, granted, source)
       VALUES (?, ?, ?, 'WHATSAPP', 'ORDER_AND_DROP_UPDATES', 1, 'REGISTRATION')`
    ).run(userId, parsed.data.phone, email);
  }

  createSession(userId, res);
  const user = db
    .prepare(
      `SELECT id, name, email, phone, role, email_verified, preferred_currency, marketing_opt_in, whatsapp_opt_in
       FROM users WHERE id = ?`
    )
    .get(userId);

  logAudit({
    actorId: userId,
    actorEmail: email,
    action: 'USER_REGISTERED',
    entityType: 'USER',
    entityId: userId,
    ipAddress: req.ip,
  });

  res.status(201).json({user});
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

authRouter.post('/auth/login', authLimiter, (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({error: 'Valid email and password are required.'});
    return;
  }

  const email = parsed.data.email.toLowerCase();
  const userRow = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any;

  if (!userRow || !verifyPassword(parsed.data.password, userRow.password_hash)) {
    res.status(401).json({error: 'Invalid email or password.'});
    return;
  }

  createSession(userRow.id, res);
  logAudit({
    actorId: userRow.id,
    actorEmail: userRow.email,
    action: 'USER_LOGIN',
    entityType: 'USER',
    entityId: userRow.id,
    ipAddress: req.ip,
  });

  res.json({
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      phone: userRow.phone,
      role: userRow.role,
      email_verified: userRow.email_verified,
      preferred_currency: userRow.preferred_currency,
      marketing_opt_in: userRow.marketing_opt_in,
      whatsapp_opt_in: userRow.whatsapp_opt_in,
    },
  });
});

authRouter.post('/auth/logout', (req, res) => {
  clearSession(req, res);
  res.json({ok: true});
});

authRouter.get('/auth/me', (req, res) => {
  res.json({user: req.user ?? null});
});

authRouter.patch('/auth/profile', requireAuth, (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(25),
    preferredCurrency: z.enum(['PKR', 'USD', 'GBP', 'EUR', 'AED']),
    marketingOptIn: z.boolean(),
    whatsappOptIn: z.boolean(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({error: 'Invalid profile details.'});
    return;
  }

  const u = req.user!;
  db.prepare(
    `UPDATE users SET name = ?, phone = ?, preferred_currency = ?, marketing_opt_in = ?, whatsapp_opt_in = ? WHERE id = ?`
  ).run(
    parsed.data.name,
    parsed.data.phone,
    parsed.data.preferredCurrency,
    parsed.data.marketingOptIn ? 1 : 0,
    parsed.data.whatsappOptIn ? 1 : 0,
    u.id
  );

  db.prepare(
    `INSERT INTO consent_records (user_id, phone, email, channel, consent_type, granted, source)
     VALUES (?, ?, ?, 'WHATSAPP', 'NOTIFICATION_PREFERENCE', ?, 'ACCOUNT_SETTINGS')`
  ).run(u.id, parsed.data.phone, u.email, parsed.data.whatsappOptIn ? 1 : 0);

  const updated = db
    .prepare(
      `SELECT id, name, email, phone, role, email_verified, preferred_currency, marketing_opt_in, whatsapp_opt_in
       FROM users WHERE id = ?`
    )
    .get(u.id);
  res.json({user: updated});
});

authRouter.post('/auth/password-reset-request', authLimiter, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const user = db.prepare(`SELECT id, email FROM users WHERE email = ?`).get(email) as any;
  if (user) {
    const rawToken = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    db.prepare(
      `INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)`
    ).run(user.id, hashToken(rawToken), expiresAt);
  }
  res.json({
    ok: true,
    message: 'If an account matches that email, a password reset link has been queued.',
  });
});

authRouter.get('/account/addresses', requireAuth, (req, res) => {
  const addresses = db
    .prepare(`SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC`)
    .all(req.user!.id);
  res.json({addresses});
});

authRouter.post('/account/addresses', requireAuth, (req, res) => {
  const schema = z.object({
    label: z.string().trim().min(1).max(40).default('Home'),
    recipientName: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(25),
    country: z.string().trim().min(2).max(60),
    city: z.string().trim().min(2).max(80),
    postalCode: z.string().trim().max(20).optional().default(''),
    streetAddress: z.string().trim().min(5).max(240),
    isDefault: z.boolean().optional().default(false),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({error: 'Invalid address fields.'});
    return;
  }
  if (parsed.data.isDefault) {
    db.prepare(`UPDATE addresses SET is_default = 0 WHERE user_id = ?`).run(req.user!.id);
  }
  const info = db
    .prepare(
      `INSERT INTO addresses (user_id, label, recipient_name, phone, country, city, postal_code, street_address, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user!.id,
      parsed.data.label,
      parsed.data.recipientName,
      parsed.data.phone,
      parsed.data.country,
      parsed.data.city,
      parsed.data.postalCode,
      parsed.data.streetAddress,
      parsed.data.isDefault ? 1 : 0
    );
  const created = db.prepare(`SELECT * FROM addresses WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json({address: created});
});

authRouter.delete('/account/addresses/:id', requireAuth, (req, res) => {
  db.prepare(`DELETE FROM addresses WHERE id = ? AND user_id = ?`).run(
    Number(req.params.id),
    req.user!.id
  );
  res.json({ok: true});
});

authRouter.get('/account/orders', requireAuth, (req, res) => {
  const orders = db
    .prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC`)
    .all(req.user!.id) as any[];
  const enriched = orders.map((o) => ({
    ...o,
    items: db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(o.id),
  }));
  res.json({orders: enriched});
});

authRouter.get('/account/wishlist', requireAuth, (req, res) => {
  const items = db
    .prepare(
      `SELECT p.*, (SELECT url FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order ASC LIMIT 1) as image_url
       FROM wishlists w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`
    )
    .all(req.user!.id);
  res.json({wishlist: items});
});

authRouter.post('/account/wishlist/toggle', requireAuth, (req, res) => {
  const productId = Number(req.body?.productId);
  if (!productId) {
    res.status(400).json({error: 'Product ID required.'});
    return;
  }
  const existing = db
    .prepare(`SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?`)
    .get(req.user!.id, productId) as {id: number} | undefined;
  if (existing) {
    db.prepare(`DELETE FROM wishlists WHERE id = ?`).run(existing.id);
    res.json({wishlisted: false});
  } else {
    db.prepare(`INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)`).run(
      req.user!.id,
      productId
    );
    res.json({wishlisted: true});
  }
});
