import crypto from 'node:crypto';
import express from 'express';
import {z} from 'zod';
import {db} from '../db.ts';
import {createRateLimiter, logAudit} from '../auth.ts';
import {
  calculateOrderTotals,
  calculateUnitPricePkr,
  DEFAULT_CURRENCIES,
  DEFAULT_SHIPPING_ZONES,
  getSiteSetting,
} from '../pricing.ts';
import {
  getWhatsAppConfig,
  notifyAdminAlert,
  notifyOrderLifecycle,
} from '../whatsapp.ts';

export const storefrontRouter = express.Router();

const checkoutLimiter = createRateLimiter(20, 60_000);
const publicWriteLimiter = createRateLimiter(15, 60_000);

function enrichProducts(rows: any[]) {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const placeholders = ids.map(() => '?').join(',');

  const images = db
    .prepare(`SELECT * FROM product_images WHERE product_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`)
    .all(...ids) as any[];
  const variants = db
    .prepare(`SELECT * FROM product_variants WHERE product_id IN (${placeholders}) ORDER BY id ASC`)
    .all(...ids) as any[];
  const reviewAgg = db
    .prepare(
      `SELECT product_id, COUNT(*) as review_count, ROUND(AVG(rating), 1) as avg_rating
       FROM reviews WHERE product_id IN (${placeholders}) GROUP BY product_id`
    )
    .all(...ids) as Array<{product_id: number; review_count: number; avg_rating: number}>;

  const imgMap = new Map<number, any[]>();
  for (const img of images) {
    const arr = imgMap.get(img.product_id) || [];
    arr.push(img);
    imgMap.set(img.product_id, arr);
  }
  const varMap = new Map<number, any[]>();
  for (const v of variants) {
    const arr = varMap.get(v.product_id) || [];
    arr.push(v);
    varMap.set(v.product_id, arr);
  }
  const revMap = new Map<number, {review_count: number; avg_rating: number}>();
  for (const r of reviewAgg) {
    revMap.set(r.product_id, {review_count: r.review_count, avg_rating: r.avg_rating});
  }

  return rows.map((p) => {
    const pVars = varMap.get(p.id) || [];
    const totalStock = pVars.reduce((acc, v) => acc + Number(v.stock_qty || 0), 0);
    const effectivePricePkr = calculateUnitPricePkr(p.base_price_pkr, p.discount_percent, null);
    const rev = revMap.get(p.id) || {review_count: 0, avg_rating: 0};
    return {
      ...p,
      effective_price_pkr: effectivePricePkr,
      total_stock: totalStock,
      images: imgMap.get(p.id) || [],
      variants: pVars,
      review_count: rev.review_count,
      avg_rating: rev.avg_rating,
    };
  });
}

storefrontRouter.get('/bootstrap', (_req, res) => {
  const categories = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.active = 1) as product_count
       FROM categories c
       ORDER BY c.sort_order ASC, c.id ASC`
    )
    .all();
  const collections = db
    .prepare(`SELECT * FROM collections ORDER BY sort_order ASC, id ASC`)
    .all();
  const currencies = getSiteSetting('currencies', DEFAULT_CURRENCIES);
  const shippingZones = getSiteSetting('shipping_zones', DEFAULT_SHIPPING_ZONES);
  const announcementBar = getSiteSetting('announcement_bar', {
    enabled: true,
    text: 'FREE NATIONWIDE SHIPPING IN PAKISTAN OVER PKR 15,000 · WORLDWIDE DHL EXPRESS',
  });
  const heroBanner = getSiteSetting('hero_banner', {
    kicker: 'DROP 04 // INDEPENDENT MOTORSPORT ATELIER',
    headline: 'BUILT FOR THE RACING CULTURE.',
    subheadline:
      'Technical paddock outerwear, 480gsm heavyweight streetwear, and 1:18 scale collector pieces.',
    imageUrl: '',
  });
  const waCfg = getWhatsAppConfig();
  const reviews = db
    .prepare(
      `SELECT r.*, p.name as product_name, p.slug as product_slug
       FROM reviews r
       JOIN products p ON p.id = r.product_id
       ORDER BY r.created_at DESC, r.id DESC
       LIMIT 6`
    )
    .all();

  res.json({
    categories,
    collections,
    currencies,
    shippingZones,
    announcementBar,
    heroBanner,
    whatsappBusinessPhone: waCfg.business_phone,
    featuredReviews: reviews,
  });
});

storefrontRouter.get('/products', (req, res) => {
  const {
    search = '',
    category = '',
    group = '',
    collection = '',
    gender = '',
    size = '',
    color = '',
    minPrice = '',
    maxPrice = '',
    inStock = '',
    featured = '',
    newArrival = '',
    bestseller = '',
    limited = '',
    sort = 'featured',
  } = req.query as Record<string, string>;

  const where: string[] = ['p.active = 1'];
  const params: any[] = [];

  if (search.trim()) {
    const q = `%${search.trim()}%`;
    where.push(`(p.name LIKE ? OR p.description LIKE ? OR p.sku_prefix LIKE ? OR c.name LIKE ?)`);
    params.push(q, q, q, q);
  }
  if (category.trim()) {
    where.push(`c.slug = ?`);
    params.push(category.trim());
  }
  if (group.trim()) {
    where.push(`c.group_name = ?`);
    params.push(group.trim().toUpperCase());
  }
  if (collection.trim()) {
    where.push(`col.slug = ?`);
    params.push(collection.trim());
  }
  if (gender.trim()) {
    where.push(`p.gender = ?`);
    params.push(gender.trim().toUpperCase());
  }
  if (featured === '1' || featured === 'true') where.push(`p.is_featured = 1`);
  if (newArrival === '1' || newArrival === 'true') where.push(`p.is_new_arrival = 1`);
  if (bestseller === '1' || bestseller === 'true') where.push(`p.is_bestseller = 1`);
  if (limited === '1' || limited === 'true') where.push(`p.is_limited_edition = 1`);

  const minP = Number(minPrice);
  if (minPrice !== '' && Number.isFinite(minP) && minP >= 0) {
    where.push(`ROUND(p.base_price_pkr * (100 - p.discount_percent) / 100.0) >= ?`);
    params.push(minP);
  }
  const maxP = Number(maxPrice);
  if (maxPrice !== '' && Number.isFinite(maxP) && maxP >= 0) {
    where.push(`ROUND(p.base_price_pkr * (100 - p.discount_percent) / 100.0) <= ?`);
    params.push(maxP);
  }
  if (size.trim()) {
    where.push(
      `EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.size = ? AND pv.stock_qty > 0)`
    );
    params.push(size.trim());
  }
  if (color.trim()) {
    where.push(
      `EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND LOWER(pv.color_name) LIKE LOWER(?))`
    );
    params.push(`%${color.trim()}%`);
  }
  if (inStock === '1' || inStock === 'true') {
    where.push(
      `EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.stock_qty > 0)`
    );
  }

  let orderBy = `p.is_featured DESC, p.id ASC`;
  if (sort === 'price_asc') orderBy = `ROUND(p.base_price_pkr * (100 - p.discount_percent) / 100.0) ASC`;
  else if (sort === 'price_desc') orderBy = `ROUND(p.base_price_pkr * (100 - p.discount_percent) / 100.0) DESC`;
  else if (sort === 'newest') orderBy = `p.is_new_arrival DESC, p.created_at DESC, p.id DESC`;
  else if (sort === 'bestseller') orderBy = `p.is_bestseller DESC, p.id ASC`;

  const rows = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug, c.group_name as category_group,
              col.name as collection_name, col.slug as collection_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN collections col ON col.id = p.collection_id
       WHERE ${where.join(' AND ')}
       ORDER BY ${orderBy}`
    )
    .all(...params);

  res.json({products: enrichProducts(rows)});
});

storefrontRouter.get('/products/:slug', (req, res) => {
  const row = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug, c.group_name as category_group,
              col.name as collection_name, col.slug as collection_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN collections col ON col.id = p.collection_id
       WHERE p.slug = ? AND p.active = 1`
    )
    .get(req.params.slug) as any;

  if (!row) {
    res.status(404).json({error: 'Product not found.'});
    return;
  }

  const [product] = enrichProducts([row]);
  const reviews = db
    .prepare(`SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC, id DESC`)
    .all(row.id);

  const relatedRows = db
    .prepare(
      `SELECT p.*, c.name as category_name, c.slug as category_slug, c.group_name as category_group,
              col.name as collection_name, col.slug as collection_slug
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN collections col ON col.id = p.collection_id
       WHERE p.active = 1 AND p.id != ? AND (p.category_id = ? OR p.collection_id = ?)
       ORDER BY p.is_featured DESC, p.id ASC
       LIMIT 4`
    )
    .all(row.id, row.category_id, row.collection_id);

  res.json({
    product,
    reviews,
    related: enrichProducts(relatedRows),
  });
});

const reviewSchema = z.object({
  authorName: z.string().trim().min(2).max(80),
  authorCity: z.string().trim().max(60).optional().default(''),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(3).max(120),
  comment: z.string().trim().min(8).max(1000),
});

storefrontRouter.post('/products/:id/reviews', publicWriteLimiter, (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({error: 'Invalid review submission.', details: parsed.error.flatten()});
    return;
  }
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    res.status(400).json({error: 'Invalid product ID.'});
    return;
  }
  const exists = db.prepare(`SELECT id FROM products WHERE id = ?`).get(productId);
  if (!exists) {
    res.status(404).json({error: 'Product not found.'});
    return;
  }

  let verifiedPurchase = 0;
  if (req.user) {
    const purchased = db
      .prepare(
        `SELECT 1 FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status != 'CANCELLED'
         LIMIT 1`
      )
      .get(req.user.id, productId);
    if (purchased) verifiedPurchase = 1;
  }

  const info = db
    .prepare(
      `INSERT INTO reviews (product_id, user_id, author_name, author_city, rating, title, comment, verified_purchase)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      productId,
      req.user?.id ?? null,
      parsed.data.authorName,
      parsed.data.authorCity,
      parsed.data.rating,
      parsed.data.title,
      parsed.data.comment,
      verifiedPurchase
    );

  const created = db.prepare(`SELECT * FROM reviews WHERE id = ?`).get(info.lastInsertRowid);
  res.status(201).json({review: created});
});

const quoteSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1),
  country: z.string().trim().min(2).default('Pakistan'),
  couponCode: z.string().trim().optional().default(''),
  currency: z.string().trim().default('PKR'),
});

storefrontRouter.post('/checkout/quote', (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({error: 'Invalid quote payload.'});
    return;
  }

  let subtotalPkr = 0;
  for (const item of parsed.data.items) {
    const row = db
      .prepare(
        `SELECT pv.id, pv.stock_qty, pv.price_override_pkr, p.base_price_pkr, p.discount_percent, p.name
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE pv.id = ? AND p.active = 1`
      )
      .get(item.variantId) as any;

    if (!row) {
      res.status(400).json({error: `Variant #${item.variantId} is no longer available.`});
      return;
    }
    const unitPrice = calculateUnitPricePkr(
      row.base_price_pkr,
      row.discount_percent,
      row.price_override_pkr
    );
    subtotalPkr += unitPrice * item.quantity;
  }

  const totals = calculateOrderTotals({
    subtotalPkr,
    country: parsed.data.country,
    couponCode: parsed.data.couponCode,
    currency: parsed.data.currency,
  });

  res.json(totals);
});

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, 'Full name is required').max(100),
  email: z.string().trim().email('Valid email address is required'),
  phone: z.string().trim().min(7, 'Valid phone number is required').max(25),
  country: z.string().trim().min(2, 'Country is required').max(60),
  city: z.string().trim().min(2, 'City is required').max(80),
  postalCode: z.string().trim().max(20).optional().default(''),
  streetAddress: z.string().trim().min(5, 'Complete delivery address is required').max(250),
  orderNotes: z.string().trim().max(400).optional().default(''),
  paymentMethod: z.enum(['COD', 'JAZZCASH', 'EASYPAISA', 'BANK_TRANSFER', 'CARD']),
  currency: z.string().trim().default('PKR'),
  couponCode: z.string().trim().optional().default(''),
  whatsappOptIn: z.boolean().optional().default(true),
  items: z
    .array(
      z.object({
        variantId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, 'Your cart is empty'),
});

storefrontRouter.post('/checkout', checkoutLimiter, async (req, res) => {
  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Please check your checkout details.',
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const data = parsed.data;
  const isPakistan = ['pakistan', 'pk'].includes(data.country.trim().toLowerCase());
  if (data.paymentMethod === 'COD' && !isPakistan) {
    res.status(400).json({error: 'Cash on Delivery (COD) is available within Pakistan only.'});
    return;
  }

  // Merge duplicate variantId entries in payload cleanly
  const mergedItemsMap = new Map<number, number>();
  for (const it of data.items) {
    mergedItemsMap.set(it.variantId, (mergedItemsMap.get(it.variantId) || 0) + it.quantity);
  }
  const normalizedItems = Array.from(mergedItemsMap.entries()).map(([variantId, quantity]) => ({
    variantId,
    quantity,
  }));

  const orderNumber = `PTL-${new Date().getFullYear().toString().slice(-2)}${String(
    Math.floor(100000 + Math.random() * 900000)
  )}`;
  const idempotencyKey = `chk-${crypto.randomUUID()}`;

  try {
    const created = db.transaction(() => {
      let subtotalPkr = 0;
      const lineItems: Array<{
        productId: number;
        variantId: number;
        productName: string;
        sku: string;
        size: string;
        colorName: string;
        quantity: number;
        unitPricePkr: number;
        lineTotalPkr: number;
        remainingStock: number;
      }> = [];

      for (const reqItem of normalizedItems) {
        const variant = db
          .prepare(
            `SELECT pv.*, p.id as prod_id, p.name as prod_name, p.base_price_pkr, p.discount_percent, p.active
             FROM product_variants pv
             JOIN products p ON p.id = pv.product_id
             WHERE pv.id = ?`
          )
          .get(reqItem.variantId) as any;

        if (!variant || !variant.active) {
          throw new Error(`Item variant #${reqItem.variantId} is no longer available.`);
        }

        // Atomic inventory lock & decrement inside SQLite transaction
        const updateRes = db
          .prepare(
            `UPDATE product_variants
             SET stock_qty = stock_qty - ?
             WHERE id = ? AND stock_qty >= ?`
          )
          .run(reqItem.quantity, reqItem.variantId, reqItem.quantity);

        if (updateRes.changes === 0) {
          throw new Error(
            `Insufficient stock for ${variant.prod_name} (${variant.size} / ${variant.color_name}). Remaining: ${variant.stock_qty}.`
          );
        }

        const unitPricePkr = calculateUnitPricePkr(
          variant.base_price_pkr,
          variant.discount_percent,
          variant.price_override_pkr
        );
        const lineTotalPkr = unitPricePkr * reqItem.quantity;
        subtotalPkr += lineTotalPkr;

        lineItems.push({
          productId: variant.prod_id,
          variantId: variant.id,
          productName: variant.prod_name,
          sku: variant.sku,
          size: variant.size,
          colorName: variant.color_name,
          quantity: reqItem.quantity,
          unitPricePkr,
          lineTotalPkr,
          remainingStock: Number(variant.stock_qty) - reqItem.quantity,
        });
      }

      const totals = calculateOrderTotals({
        subtotalPkr,
        country: data.country,
        couponCode: data.couponCode,
        currency: data.currency,
      });

      if (totals.couponError && data.couponCode) {
        throw new Error(totals.couponError);
      }

      if (totals.appliedCoupon) {
        db.prepare(
          `UPDATE coupons SET used_count = used_count + 1 WHERE code = ? AND used_count < max_uses`
        ).run(totals.appliedCoupon);
      }

      const initialPaymentStatus =
        data.paymentMethod === 'COD' ? 'PENDING' : 'AWAITING_VERIFICATION';
      const initialOrderStatus = 'RECEIVED';

      const orderInfo = db
        .prepare(
          `INSERT INTO orders (
            order_number, user_id, guest_email, customer_name, phone, country, city, postal_code,
            street_address, order_notes, currency, exchange_rate, subtotal_pkr, shipping_pkr,
            discount_pkr, tax_pkr, total_pkr, total_display_amount, payment_method, payment_status,
            order_status, coupon_code, whatsapp_opt_in
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          orderNumber,
          req.user?.id ?? null,
          data.email,
          data.customerName,
          data.phone,
          data.country,
          data.city,
          data.postalCode,
          data.streetAddress,
          data.orderNotes,
          totals.currency,
          totals.exchangeRate,
          totals.subtotalPkr,
          totals.shippingPkr,
          totals.discountPkr,
          totals.taxPkr,
          totals.totalPkr,
          totals.totalDisplayAmount,
          data.paymentMethod,
          initialPaymentStatus,
          initialOrderStatus,
          totals.appliedCoupon,
          data.whatsappOptIn ? 1 : 0
        );

      const orderId = Number(orderInfo.lastInsertRowid);
      const insertOrderItem = db.prepare(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, sku, size, color_name, quantity, unit_price_pkr, line_total_pkr)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const li of lineItems) {
        insertOrderItem.run(
          orderId,
          li.productId,
          li.variantId,
          li.productName,
          li.sku,
          li.size,
          li.colorName,
          li.quantity,
          li.unitPricePkr,
          li.lineTotalPkr
        );
      }

      db.prepare(
        `INSERT INTO payments (order_id, provider, reference_id, idempotency_key, amount_pkr, currency, status, webhook_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
      ).run(
        orderId,
        data.paymentMethod,
        `PAY-${orderNumber}`,
        idempotencyKey,
        totals.totalPkr,
        totals.currency,
        initialPaymentStatus
      );

      if (data.whatsappOptIn) {
        db.prepare(
          `INSERT INTO consent_records (user_id, phone, email, channel, consent_type, granted, source)
           VALUES (?, ?, ?, 'WHATSAPP', 'ORDER_UPDATES', 1, 'CHECKOUT')`
        ).run(req.user?.id ?? null, data.phone, data.email);
      }

      // Mark any abandoned cart for this email/user as recovered
      db.prepare(
        `UPDATE abandoned_carts SET recovered = 1 WHERE customer_email = ? OR (? IS NOT NULL AND user_id = ?)`
      ).run(data.email, req.user?.id ?? null, req.user?.id ?? null);

      return {orderId, totals, lineItems};
    })();

    // Non-blocking WhatsApp notifications
    notifyOrderLifecycle({
      orderId: created.orderId,
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.phone,
      whatsappOptIn: data.whatsappOptIn,
      eventKey: 'ORDER_RECEIVED',
      extraNote: `Total: PKR ${created.totals.totalPkr.toLocaleString()} (${data.paymentMethod})`,
    }).catch(() => {});

    const waCfg = getWhatsAppConfig();
    if (waCfg.notify_new_order) {
      const isHighValue = created.totals.totalPkr >= waCfg.notify_high_value_pkr;
      notifyAdminAlert({
        eventKey: isHighValue ? 'ADMIN_HIGH_VALUE_ORDER' : 'ADMIN_NEW_ORDER',
        messageBody: `${isHighValue ? '[HIGH VALUE] ' : ''}New PITLANE order ${orderNumber} by ${data.customerName} (${data.city}, ${data.country}) — PKR ${created.totals.totalPkr.toLocaleString()} via ${data.paymentMethod}.`,
        orderId: created.orderId,
      }).catch(() => {});
    }

    if (waCfg.notify_low_stock) {
      const lowItems = created.lineItems.filter((l) => l.remainingStock <= 3);
      if (lowItems.length > 0) {
        notifyAdminAlert({
          eventKey: 'ADMIN_LOW_STOCK',
          messageBody: `Low inventory alert after ${orderNumber}: ${lowItems
            .map((l) => `${l.sku} (${l.remainingStock} left)`)
            .join(', ')}`,
          orderId: created.orderId,
        }).catch(() => {});
      }
    }

    logAudit({
      actorId: req.user?.id ?? null,
      actorEmail: data.email,
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: orderNumber,
      details: {totalPkr: created.totals.totalPkr, paymentMethod: data.paymentMethod},
      ipAddress: req.ip,
    });

    const fullOrder = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(created.orderId);
    const items = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(created.orderId);

    res.status(201).json({
      order: fullOrder,
      items,
      paymentInstructions:
        data.paymentMethod === 'COD'
          ? 'Pay cash directly to our courier rider upon delivery.'
          : data.paymentMethod === 'JAZZCASH'
            ? 'Transfer to PITLANE Merchant JazzCash (0300-1234567) quoting your order number. Payment verification webhook or admin check confirms dispatch.'
            : data.paymentMethod === 'EASYPAISA'
              ? 'Transfer to PITLANE Merchant Easypaisa (0345-1234567) quoting your order number.'
              : data.paymentMethod === 'BANK_TRANSFER'
                ? 'IBAN: PK42MEZN0002810104928172 (Meezan Bank Lahore — PITLANE Studio). Reference your order number.'
                : 'International card settlement queued via verified payment gateway.',
    });
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Unable to place order.',
    });
  }
});

storefrontRouter.get('/orders/track/:orderNumber', (req, res) => {
  const orderNumber = req.params.orderNumber.trim().toUpperCase();
  const emailQuery = String(req.query.email || '').trim().toLowerCase();

  const order = db
    .prepare(`SELECT * FROM orders WHERE order_number = ?`)
    .get(orderNumber) as any;

  if (!order) {
    res.status(404).json({error: 'Order not found. Please verify your order number.'});
    return;
  }

  const isOwner = req.user && (req.user.role === 'ADMIN' || req.user.id === order.user_id);
  const emailMatches = emailQuery && order.guest_email.toLowerCase() === emailQuery;

  if (!isOwner && !emailMatches) {
    res.status(403).json({
      error: 'Please enter the checkout email address associated with this order to view tracking details.',
      requiresVerification: true,
    });
    return;
  }

  const items = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(order.id);
  res.json({order, items});
});

const webhookSchema = z.object({
  orderNumber: z.string().trim().min(3),
  provider: z.string().trim().optional(),
  referenceId: z.string().trim().optional(),
  idempotencyKey: z.string().trim().min(3),
  status: z.enum(['PAID', 'FAILED', 'REFUNDED']),
});

// Idempotent payment provider webhook (never trusts frontend confirmation)
storefrontRouter.post('/payments/webhook', async (req, res) => {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || '';
  if (secret) {
    const sig = req.header('x-pitlane-signature') || '';
    const expected = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      res.status(401).json({error: 'Invalid payment webhook signature.'});
      return;
    }
  }

  const parsed = webhookSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({error: 'Invalid or missing webhook fields.'});
    return;
  }

  const {orderNumber, provider, referenceId, idempotencyKey, status} = parsed.data;

  const existingIdem = db
    .prepare(`SELECT id FROM payments WHERE idempotency_key = ? AND webhook_verified = 1`)
    .get(idempotencyKey);
  if (existingIdem) {
    res.json({ok: true, deduplicated: true});
    return;
  }

  const order = db.prepare(`SELECT * FROM orders WHERE order_number = ?`).get(orderNumber) as any;
  if (!order) {
    res.status(404).json({error: 'Order not found.'});
    return;
  }

  db.transaction(() => {
    db.prepare(
      `INSERT INTO payments (order_id, provider, reference_id, idempotency_key, amount_pkr, currency, status, webhook_verified, raw_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
       ON CONFLICT(idempotency_key) DO UPDATE SET status = excluded.status, webhook_verified = 1`
    ).run(
      order.id,
      provider || order.payment_method,
      referenceId || `WH-${Date.now()}`,
      idempotencyKey,
      order.total_pkr,
      order.currency,
      status,
      JSON.stringify(req.body)
    );

    db.prepare(`UPDATE orders SET payment_status = ?, updated_at = datetime('now') WHERE id = ?`).run(
      status,
      order.id
    );
    if (status === 'PAID' && order.order_status === 'RECEIVED') {
      db.prepare(`UPDATE orders SET order_status = 'CONFIRMED', updated_at = datetime('now') WHERE id = ?`).run(
        order.id
      );
    }
  })();

  if (status === 'PAID') {
    notifyOrderLifecycle({
      orderId: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.phone,
      whatsappOptIn: Boolean(order.whatsapp_opt_in),
      eventKey: 'PAYMENT_CONFIRMED',
      extraNote: `Ref: ${referenceId || 'Verified'}`,
    }).catch(() => {});
  }

  res.json({ok: true});
});

const abandonedCartSchema = z.object({
  sessionKey: z.string().trim().min(4).max(120),
  email: z.string().trim().max(120).optional().default(''),
  phone: z.string().trim().max(25).optional().default(''),
  name: z.string().trim().max(80).optional().default(''),
  whatsappOptIn: z.boolean().optional().default(false),
  items: z.array(z.any()).min(1).max(50),
  subtotalPkr: z.number().nonnegative().default(0),
});

storefrontRouter.post('/abandoned-cart', publicWriteLimiter, (req, res) => {
  const parsed = abandonedCartSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({error: 'Invalid cart snapshot.'});
    return;
  }
  const {sessionKey, email, phone, name, whatsappOptIn, items, subtotalPkr} = parsed.data;

  db.prepare(
    `INSERT INTO abandoned_carts (session_key, user_id, customer_email, customer_phone, customer_name, whatsapp_opt_in, items_json, subtotal_pkr, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(session_key) DO UPDATE SET
       user_id = COALESCE(excluded.user_id, abandoned_carts.user_id),
       customer_email = COALESCE(NULLIF(excluded.customer_email, ''), abandoned_carts.customer_email),
       customer_phone = COALESCE(NULLIF(excluded.customer_phone, ''), abandoned_carts.customer_phone),
       customer_name = COALESCE(NULLIF(excluded.customer_name, ''), abandoned_carts.customer_name),
       whatsapp_opt_in = excluded.whatsapp_opt_in,
       items_json = excluded.items_json,
       subtotal_pkr = excluded.subtotal_pkr,
       recovered = 0,
       updated_at = datetime('now')`
  ).run(
    sessionKey,
    req.user?.id ?? null,
    email || req.user?.email || '',
    phone || req.user?.phone || '',
    name || req.user?.name || '',
    whatsappOptIn ? 1 : 0,
    JSON.stringify(items),
    Math.round(subtotalPkr)
  );

  res.json({ok: true});
});

const newsletterSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  phone: z.string().trim().max(25).optional().default(''),
  whatsappOptIn: z.boolean().optional().default(false),
});

storefrontRouter.post('/newsletter', publicWriteLimiter, (req, res) => {
  const parsed = newsletterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({error: 'Please enter a valid email address.'});
    return;
  }

  db.prepare(
    `INSERT INTO newsletter_subscribers (email, phone, whatsapp_opt_in)
     VALUES (?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET phone = excluded.phone, whatsapp_opt_in = excluded.whatsapp_opt_in`
  ).run(parsed.data.email.toLowerCase(), parsed.data.phone, parsed.data.whatsappOptIn ? 1 : 0);

  db.prepare(
    `INSERT INTO consent_records (user_id, phone, email, channel, consent_type, granted, source)
     VALUES (?, ?, ?, 'EMAIL', 'MARKETING_NEWSLETTER', 1, 'FOOTER_NEWSLETTER')`
  ).run(req.user?.id ?? null, parsed.data.phone, parsed.data.email.toLowerCase());

  if (parsed.data.whatsappOptIn && parsed.data.phone) {
    db.prepare(
      `INSERT INTO consent_records (user_id, phone, email, channel, consent_type, granted, source)
       VALUES (?, ?, ?, 'WHATSAPP', 'MARKETING_DROPS', 1, 'FOOTER_NEWSLETTER')`
    ).run(req.user?.id ?? null, parsed.data.phone, parsed.data.email.toLowerCase());
  }

  res.status(201).json({ok: true, message: 'Subscribed to PITLANE Drop Alerts.'});
});
