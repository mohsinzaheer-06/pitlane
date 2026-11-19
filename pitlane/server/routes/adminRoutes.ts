import express from 'express';
import {z} from 'zod';
import {db} from '../db.ts';
import {logAudit, requireAdmin} from '../auth.ts';
import {
  dispatchWhatsAppMessage,
  getWhatsAppConfig,
  isCloudApiConfigured,
  maskSecret,
  notifyOrderLifecycle,
} from '../whatsapp.ts';

export const adminRouter = express.Router();
adminRouter.use('/admin', requireAdmin);

adminRouter.get('/admin/overview', (_req, res) => {
  const sales = db
    .prepare(
      `SELECT COUNT(*) as total_orders,
              COALESCE(SUM(CASE WHEN order_status != 'CANCELLED' THEN total_pkr ELSE 0 END), 0) as total_revenue_pkr,
              COALESCE(AVG(CASE WHEN order_status != 'CANCELLED' THEN total_pkr END), 0) as avg_order_value_pkr,
              SUM(CASE WHEN order_status IN ('RECEIVED', 'CONFIRMED', 'PROCESSING') THEN 1 ELSE 0 END) as pending_fulfilment
       FROM orders`
    )
    .get() as any;

  const customerCount = (
    db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'CUSTOMER'`).get() as {c: number}
  ).c;

  const lowStock = db
    .prepare(
      `SELECT pv.*, p.name as product_name, p.slug as product_slug
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.stock_qty <= 5 AND p.active = 1
       ORDER BY pv.stock_qty ASC
       LIMIT 12`
    )
    .all();

  const bestsellers = db
    .prepare(
      `SELECT oi.product_id, oi.product_name, SUM(oi.quantity) as units_sold, SUM(oi.line_total_pkr) as revenue_pkr
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.order_status != 'CANCELLED'
       GROUP BY oi.product_id, oi.product_name
       ORDER BY units_sold DESC
       LIMIT 6`
    )
    .all();

  const waStats = db
    .prepare(
      `SELECT delivery_status, COUNT(*) as count FROM whatsapp_messages GROUP BY delivery_status`
    )
    .all();

  res.json({
    sales,
    customerCount,
    lowStock,
    bestsellers,
    waStats,
  });
});

// --- Products & Variants & Collections ---
adminRouter.get('/admin/products', (_req, res) => {
  const products = db
    .prepare(
      `SELECT p.*, c.name as category_name, col.name as collection_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN collections col ON col.id = p.collection_id
       ORDER BY p.id DESC`
    )
    .all() as any[];

  const enriched = products.map((p) => ({
    ...p,
    images: db.prepare(`SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`).all(p.id),
    variants: db.prepare(`SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC`).all(p.id),
  }));
  res.json({products: enriched});
});

const productCreateSchema = z.object({
  name: z.string().trim().min(3).max(140),
  skuPrefix: z.string().trim().min(3).max(30),
  description: z.string().trim().min(10),
  materialInfo: z.string().trim().default(''),
  washingInstructions: z.string().trim().default(''),
  fitNotes: z.string().trim().default(''),
  basePricePkr: z.number().int().positive(),
  discountPercent: z.number().int().min(0).max(90).default(0),
  categoryId: z.number().int().positive(),
  collectionId: z.number().int().positive().nullable().optional(),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(true),
  isBestseller: z.boolean().default(false),
  isLimitedEdition: z.boolean().default(false),
  editionRun: z.string().trim().default(''),
  gender: z.enum(['MALE', 'FEMALE', 'UNISEX']).default('UNISEX'),
  imageUrl: z.string().trim().min(1),
  variants: z
    .array(
      z.object({
        size: z.string().trim().min(1),
        colorName: z.string().trim().min(1),
        colorHex: z.string().trim().default('#111315'),
        stockQty: z.number().int().min(0),
      })
    )
    .min(1),
});

adminRouter.post('/admin/products', (req, res) => {
  const parsed = productCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({error: 'Invalid product fields.', details: parsed.error.flatten()});
    return;
  }
  const d = parsed.data;
  const slug = `${d.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}-${Date.now().toString().slice(-4)}`;

  try {
    const productId = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO products (
            name, slug, sku_prefix, description, material_info, washing_instructions, fit_notes,
            base_price_pkr, discount_percent, category_id, collection_id,
            is_featured, is_new_arrival, is_bestseller, is_limited_edition, edition_run, gender
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          d.name,
          slug,
          d.skuPrefix.toUpperCase(),
          d.description,
          d.materialInfo,
          d.washingInstructions,
          d.fitNotes,
          d.basePricePkr,
          d.discountPercent,
          d.categoryId,
          d.collectionId ?? null,
          d.isFeatured ? 1 : 0,
          d.isNewArrival ? 1 : 0,
          d.isBestseller ? 1 : 0,
          d.isLimitedEdition ? 1 : 0,
          d.editionRun,
          d.gender
        );
      const pid = Number(info.lastInsertRowid);
      db.prepare(`INSERT INTO product_images (product_id, url, alt_text, sort_order) VALUES (?, ?, ?, 0)`).run(
        pid,
        d.imageUrl,
        `${d.name} studio photograph`
      );
      const insertVar = db.prepare(
        `INSERT INTO product_variants (product_id, sku, size, color_name, color_hex, stock_qty) VALUES (?, ?, ?, ?, ?, ?)`
      );
      d.variants.forEach((v, idx) => {
        const sku = `${d.skuPrefix.toUpperCase()}-${v.size.toUpperCase()}-${String(idx + 1).padStart(2, '0')}`;
        insertVar.run(pid, sku, v.size, v.colorName, v.colorHex, v.stockQty);
      });
      return pid;
    })();

    logAudit({
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: productId,
      details: {name: d.name},
      ipAddress: req.ip,
    });

    res.status(201).json({productId, slug});
  } catch (err) {
    res.status(400).json({error: err instanceof Error ? err.message : 'Unable to create product.'});
  }
});

adminRouter.patch('/admin/variants/:id/stock', (req, res) => {
  const stockQty = Number(req.body?.stockQty);
  if (!Number.isInteger(stockQty) || stockQty < 0) {
    res.status(400).json({error: 'Stock quantity must be a non-negative integer.'});
    return;
  }
  db.prepare(`UPDATE product_variants SET stock_qty = ? WHERE id = ?`).run(
    stockQty,
    Number(req.params.id)
  );
  logAudit({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    action: 'VARIANT_STOCK_UPDATED',
    entityType: 'VARIANT',
    entityId: req.params.id,
    details: {stockQty},
    ipAddress: req.ip,
  });
  res.json({ok: true});
});

adminRouter.patch('/admin/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const {basePricePkr, discountPercent, active, isFeatured} = req.body as any;
  db.prepare(
    `UPDATE products SET
       base_price_pkr = COALESCE(?, base_price_pkr),
       discount_percent = COALESCE(?, discount_percent),
       active = COALESCE(?, active),
       is_featured = COALESCE(?, is_featured),
       updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    basePricePkr !== undefined ? Number(basePricePkr) : null,
    discountPercent !== undefined ? Number(discountPercent) : null,
    active !== undefined ? (active ? 1 : 0) : null,
    isFeatured !== undefined ? (isFeatured ? 1 : 0) : null,
    id
  );
  res.json({ok: true});
});

adminRouter.delete('/admin/products/:id', (req, res) => {
  const id = Number(req.params.id);
  db.prepare(`UPDATE products SET active = 0, updated_at = datetime('now') WHERE id = ?`).run(id);
  logAudit({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    action: 'PRODUCT_ARCHIVED',
    entityType: 'PRODUCT',
    entityId: id,
    ipAddress: req.ip,
  });
  res.json({ok: true});
});

adminRouter.post('/admin/collections', (req, res) => {
  const {name, description, heroImage, isFeatured} = req.body as any;
  if (!name || String(name).trim().length < 2) {
    res.status(400).json({error: 'Collection name is required.'});
    return;
  }
  const slug = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const info = db
    .prepare(
      `INSERT INTO collections (name, slug, description, hero_image, is_featured) VALUES (?, ?, ?, ?, ?)`
    )
    .run(String(name).trim(), slug, String(description || ''), String(heroImage || ''), isFeatured ? 1 : 0);
  res.status(201).json({collection: db.prepare(`SELECT * FROM collections WHERE id = ?`).get(info.lastInsertRowid)});
});

// --- Orders Management ---
adminRouter.get('/admin/orders', (_req, res) => {
  const orders = db.prepare(`SELECT * FROM orders ORDER BY id DESC LIMIT 100`).all() as any[];
  const enriched = orders.map((o) => ({
    ...o,
    items: db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(o.id),
  }));
  res.json({orders: enriched});
});

adminRouter.patch('/admin/orders/:id', async (req, res) => {
  const orderId = Number(req.params.id);
  const {orderStatus, paymentStatus, trackingCode, courierName} = req.body as any;

  const existing = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId) as any;
  if (!existing) {
    res.status(404).json({error: 'Order not found.'});
    return;
  }

  db.transaction(() => {
    // Restore inventory if transitioning to CANCELLED from a non-cancelled state
    if (orderStatus === 'CANCELLED' && existing.order_status !== 'CANCELLED') {
      const items = db.prepare(`SELECT variant_id, quantity FROM order_items WHERE order_id = ?`).all(orderId) as any[];
      const restore = db.prepare(`UPDATE product_variants SET stock_qty = stock_qty + ? WHERE id = ?`);
      for (const item of items) {
        restore.run(item.quantity, item.variant_id);
      }
    }

    db.prepare(
      `UPDATE orders SET
         order_status = COALESCE(?, order_status),
         payment_status = COALESCE(?, payment_status),
         tracking_code = COALESCE(?, tracking_code),
         courier_name = COALESCE(?, courier_name),
         updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      orderStatus || null,
      paymentStatus || null,
      trackingCode !== undefined ? String(trackingCode) : null,
      courierName !== undefined ? String(courierName) : null,
      orderId
    );
  })();

  const updated = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(orderId) as any;

  if (orderStatus && orderStatus !== existing.order_status) {
    const eventMap: Record<string, any> = {
      CONFIRMED: 'ORDER_CONFIRMED',
      PROCESSING: 'ORDER_PROCESSING',
      SHIPPED: 'ORDER_SHIPPED',
      OUT_FOR_DELIVERY: 'ORDER_OUT_FOR_DELIVERY',
      DELIVERED: 'ORDER_DELIVERED',
      CANCELLED: 'ORDER_CANCELLED',
    };
    const ev = eventMap[orderStatus];
    if (ev) {
      notifyOrderLifecycle({
        orderId: updated.id,
        orderNumber: updated.order_number,
        customerName: updated.customer_name,
        customerPhone: updated.phone,
        whatsappOptIn: Boolean(updated.whatsapp_opt_in),
        eventKey: ev,
        extraNote: updated.tracking_code ? `${updated.courier_name || 'Courier'} #${updated.tracking_code}` : '',
      }).catch(() => {});
    }
  }

  if (paymentStatus === 'PAID' && existing.payment_status !== 'PAID') {
    notifyOrderLifecycle({
      orderId: updated.id,
      orderNumber: updated.order_number,
      customerName: updated.customer_name,
      customerPhone: updated.phone,
      whatsappOptIn: Boolean(updated.whatsapp_opt_in),
      eventKey: 'PAYMENT_CONFIRMED',
      extraNote: `${updated.payment_method} Verified`,
    }).catch(() => {});
  }

  if (paymentStatus === 'REFUNDED' && existing.payment_status !== 'REFUNDED') {
    notifyOrderLifecycle({
      orderId: updated.id,
      orderNumber: updated.order_number,
      customerName: updated.customer_name,
      customerPhone: updated.phone,
      whatsappOptIn: Boolean(updated.whatsapp_opt_in),
      eventKey: 'ORDER_REFUNDED',
      extraNote: `PKR ${updated.total_pkr.toLocaleString()} refund initiated`,
    }).catch(() => {});
  }

  logAudit({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    action: 'ORDER_UPDATED',
    entityType: 'ORDER',
    entityId: updated.order_number,
    details: {orderStatus, paymentStatus, trackingCode},
    ipAddress: req.ip,
  });

  res.json({order: updated});
});

// --- Customers & Consent ---
adminRouter.get('/admin/customers', (_req, res) => {
  const customers = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.preferred_currency, u.marketing_opt_in, u.whatsapp_opt_in, u.created_at,
              COUNT(o.id) as order_count,
              COALESCE(SUM(CASE WHEN o.order_status != 'CANCELLED' THEN o.total_pkr ELSE 0 END), 0) as lifetime_spend_pkr
       FROM users u
       LEFT JOIN orders o ON o.user_id = u.id
       GROUP BY u.id
       ORDER BY u.id DESC`
    )
    .all();
  const consentRecords = db.prepare(`SELECT * FROM consent_records ORDER BY id DESC LIMIT 50`).all();
  const newsletter = db.prepare(`SELECT * FROM newsletter_subscribers ORDER BY id DESC LIMIT 50`).all();
  res.json({customers, consentRecords, newsletter});
});

// --- Coupons & Site Settings ---
adminRouter.get('/admin/marketing', (_req, res) => {
  const coupons = db.prepare(`SELECT * FROM coupons ORDER BY id DESC`).all();
  const settingsRows = db.prepare(`SELECT * FROM site_settings`).all() as Array<{key: string; value_json: string}>;
  const settings: Record<string, any> = {};
  for (const r of settingsRows) settings[r.key] = JSON.parse(r.value_json);
  res.json({coupons, settings});
});

adminRouter.post('/admin/coupons', (req, res) => {
  const {code, discountType, discountValue, minOrderPkr} = req.body as any;
  if (!code || !discountType || !discountValue) {
    res.status(400).json({error: 'Code, type, and value are required.'});
    return;
  }
  const info = db
    .prepare(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_pkr, active) VALUES (?, ?, ?, ?, 1)`
    )
    .run(String(code).trim().toUpperCase(), discountType, Number(discountValue), Number(minOrderPkr || 0));
  res.status(201).json({coupon: db.prepare(`SELECT * FROM coupons WHERE id = ?`).get(info.lastInsertRowid)});
});

adminRouter.patch('/admin/settings', (req, res) => {
  const {key, value} = req.body as {key: string; value: unknown};
  if (!key) {
    res.status(400).json({error: 'Setting key required.'});
    return;
  }
  db.prepare(
    `INSERT INTO site_settings (key, value_json, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = datetime('now')`
  ).run(key, JSON.stringify(value));
  res.json({ok: true});
});

// --- WhatsApp Business Admin Config, Templates, History, Test & Abandoned Carts ---
adminRouter.get('/admin/whatsapp', (_req, res) => {
  const cfg = getWhatsAppConfig();
  const templates = db.prepare(`SELECT * FROM whatsapp_templates ORDER BY id ASC`).all();
  const messages = db.prepare(`SELECT * FROM whatsapp_messages ORDER BY id DESC LIMIT 60`).all();
  const abandonedCarts = db
    .prepare(`SELECT * FROM abandoned_carts WHERE recovered = 0 ORDER BY updated_at DESC LIMIT 30`)
    .all();

  res.json({
    config: {
      business_phone: cfg.business_phone,
      waba_id: cfg.waba_id,
      phone_number_id: cfg.phone_number_id,
      access_token_masked: maskSecret(cfg.access_token),
      webhook_verify_token_masked: maskSecret(cfg.webhook_verify_token),
      has_access_token: Boolean(cfg.access_token),
      cloud_api_ready: isCloudApiConfigured(cfg),
      admin_notify_phone: cfg.admin_notify_phone,
      notify_new_order: Boolean(cfg.notify_new_order),
      notify_payment: Boolean(cfg.notify_payment),
      notify_high_value_pkr: cfg.notify_high_value_pkr,
      notify_low_stock: Boolean(cfg.notify_low_stock),
    },
    templates,
    messages,
    abandonedCarts,
  });
});

adminRouter.patch('/admin/whatsapp/config', (req, res) => {
  const b = req.body as any;
  const current = getWhatsAppConfig();
  db.prepare(
    `UPDATE whatsapp_config SET
       business_phone = ?,
       waba_id = ?,
       phone_number_id = ?,
       access_token = CASE WHEN ? != '' THEN ? ELSE access_token END,
       webhook_verify_token = CASE WHEN ? != '' THEN ? ELSE webhook_verify_token END,
       admin_notify_phone = ?,
       notify_new_order = ?,
       notify_payment = ?,
       notify_high_value_pkr = ?,
       notify_low_stock = ?,
       updated_at = datetime('now')
     WHERE id = 1`
  ).run(
    String(b.business_phone ?? current.business_phone).trim(),
    String(b.waba_id ?? current.waba_id).trim(),
    String(b.phone_number_id ?? current.phone_number_id).trim(),
    String(b.access_token || '').trim(),
    String(b.access_token || '').trim(),
    String(b.webhook_verify_token || '').trim(),
    String(b.webhook_verify_token || '').trim(),
    String(b.admin_notify_phone ?? current.admin_notify_phone).trim(),
    b.notify_new_order ? 1 : 0,
    b.notify_payment ? 1 : 0,
    Number(b.notify_high_value_pkr ?? current.notify_high_value_pkr),
    b.notify_low_stock ? 1 : 0
  );

  logAudit({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    action: 'WHATSAPP_CONFIG_UPDATED',
    entityType: 'WHATSAPP',
    ipAddress: req.ip,
  });

  res.json({ok: true});
});

adminRouter.post('/admin/whatsapp/test', async (req, res) => {
  const recipient = String(req.body?.phone || getWhatsAppConfig().business_phone);
  const result = await dispatchWhatsAppMessage({
    recipientPhone: recipient,
    eventKey: 'ADMIN_CONNECTION_TEST',
    messageBody: 'PITLANE WhatsApp Business API diagnostic check.',
  });
  res.json(result);
});

adminRouter.post('/admin/whatsapp/abandoned-cart/:id/recover', async (req, res) => {
  const cart = db
    .prepare(`SELECT * FROM abandoned_carts WHERE id = ?`)
    .get(Number(req.params.id)) as any;
  if (!cart) {
    res.status(404).json({error: 'Abandoned cart not found.'});
    return;
  }
  if (!cart.customer_phone || !cart.whatsapp_opt_in) {
    res.status(400).json({
      error: 'Cannot send recovery message: customer identity, phone, and WhatsApp marketing consent are required.',
    });
    return;
  }
  const tpl = db
    .prepare(`SELECT * FROM whatsapp_templates WHERE event_key = 'ABANDONED_CART' AND approval_status = 'APPROVED'`)
    .get() as any;
  if (!tpl) {
    res.status(400).json({error: 'No APPROVED WhatsApp abandoned cart template found.'});
    return;
  }

  const result = await dispatchWhatsAppMessage({
    recipientPhone: cart.customer_phone,
    eventKey: 'ABANDONED_CART',
    templateName: tpl.name,
    languageCode: tpl.language,
    templateParams: [
      cart.customer_name || 'Racer',
      `PKR ${Number(cart.subtotal_pkr).toLocaleString()}`,
      process.env.APP_URL || 'https://pitlane.pk/checkout',
    ],
    messageBody: tpl.body_text
      .replace('{{1}}', cart.customer_name || 'Racer')
      .replace('{{2}}', `PKR ${Number(cart.subtotal_pkr).toLocaleString()}`)
      .replace('{{3}}', process.env.APP_URL || 'https://pitlane.pk/checkout'),
  });

  db.prepare(`UPDATE abandoned_carts SET recovery_sent_at = datetime('now') WHERE id = ?`).run(cart.id);
  res.json(result);
});

// --- News & Editorial Content ---
adminRouter.post('/admin/news', (req, res) => {
  const {title, summary, content, category, sourceName, sourceUrl, imageUrl, isFeatured} = req.body as any;
  if (!title || !summary || !content) {
    res.status(400).json({error: 'Title, summary, and content are required.'});
    return;
  }
  const slug = `${String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}-${Date.now().toString().slice(-4)}`;

  const info = db
    .prepare(
      `INSERT INTO news_articles (title, slug, summary, content, category, source_name, source_url, image_url, published_at, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(title),
      slug,
      String(summary),
      String(content),
      String(category || 'Motorsport Briefing'),
      String(sourceName || 'PITLANE Editorial Desk'),
      String(sourceUrl || ''),
      String(imageUrl || '/src/assets/images/editorial_circuit_night_1795087933791.jpg'),
      new Date().toISOString(),
      isFeatured ? 1 : 0
    );
  res.status(201).json({article: db.prepare(`SELECT * FROM news_articles WHERE id = ?`).get(info.lastInsertRowid)});
});

// --- Audit Logs ---
adminRouter.get('/admin/audit-logs', (_req, res) => {
  const logs = db.prepare(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100`).all();
  res.json({logs});
});
