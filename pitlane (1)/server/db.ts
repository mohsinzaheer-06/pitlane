import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), 'pitlane.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
      email_verified INTEGER NOT NULL DEFAULT 0,
      preferred_currency TEXT NOT NULL DEFAULT 'PKR',
      marketing_opt_in INTEGER NOT NULL DEFAULT 0,
      whatsapp_opt_in INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT NOT NULL DEFAULT 'Home',
      recipient_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'Pakistan',
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL DEFAULT '',
      street_address TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      group_name TEXT NOT NULL CHECK (group_name IN ('APPAREL', 'ACCESSORIES', 'COLLECTIBLES')),
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      hero_image TEXT NOT NULL DEFAULT '',
      is_featured INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sku_prefix TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      material_info TEXT NOT NULL DEFAULT '',
      washing_instructions TEXT NOT NULL DEFAULT '',
      fit_notes TEXT NOT NULL DEFAULT '',
      base_price_pkr INTEGER NOT NULL CHECK (base_price_pkr >= 0),
      discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 90),
      category_id INTEGER NOT NULL REFERENCES categories(id),
      collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
      is_featured INTEGER NOT NULL DEFAULT 0,
      is_new_arrival INTEGER NOT NULL DEFAULT 0,
      is_bestseller INTEGER NOT NULL DEFAULT 0,
      is_limited_edition INTEGER NOT NULL DEFAULT 0,
      edition_run TEXT NOT NULL DEFAULT '',
      gender TEXT NOT NULL DEFAULT 'UNISEX' CHECK (gender IN ('MALE', 'FEMALE', 'UNISEX')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id);

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      alt_text TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      sku TEXT NOT NULL UNIQUE,
      size TEXT NOT NULL,
      color_name TEXT NOT NULL,
      color_hex TEXT NOT NULL DEFAULT '#111315',
      stock_qty INTEGER NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
      price_override_pkr INTEGER,
      UNIQUE(product_id, size, color_name)
    );
    CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL,
      author_city TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      title TEXT NOT NULL,
      comment TEXT NOT NULL,
      verified_purchase INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED_PKR')),
      discount_value INTEGER NOT NULL CHECK (discount_value > 0),
      min_order_pkr INTEGER NOT NULL DEFAULT 0,
      max_uses INTEGER NOT NULL DEFAULT 1000,
      used_count INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      guest_email TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT NOT NULL DEFAULT '',
      street_address TEXT NOT NULL,
      order_notes TEXT NOT NULL DEFAULT '',
      currency TEXT NOT NULL DEFAULT 'PKR',
      exchange_rate REAL NOT NULL DEFAULT 1.0,
      subtotal_pkr INTEGER NOT NULL,
      shipping_pkr INTEGER NOT NULL,
      discount_pkr INTEGER NOT NULL DEFAULT 0,
      tax_pkr INTEGER NOT NULL DEFAULT 0,
      total_pkr INTEGER NOT NULL,
      total_display_amount REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK (payment_method IN ('COD', 'JAZZCASH', 'EASYPAISA', 'BANK_TRANSFER', 'CARD')),
      payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'AWAITING_VERIFICATION', 'PAID', 'FAILED', 'REFUNDED')),
      order_status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (order_status IN ('RECEIVED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')),
      tracking_code TEXT NOT NULL DEFAULT '',
      courier_name TEXT NOT NULL DEFAULT '',
      coupon_code TEXT NOT NULL DEFAULT '',
      whatsapp_opt_in INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      variant_id INTEGER NOT NULL REFERENCES product_variants(id),
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      size TEXT NOT NULL,
      color_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price_pkr INTEGER NOT NULL,
      line_total_pkr INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      provider TEXT NOT NULL,
      reference_id TEXT NOT NULL DEFAULT '',
      idempotency_key TEXT UNIQUE,
      amount_pkr INTEGER NOT NULL,
      currency TEXT NOT NULL,
      status TEXT NOT NULL,
      webhook_verified INTEGER NOT NULL DEFAULT 0,
      raw_payload TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS abandoned_carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_key TEXT NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_email TEXT NOT NULL DEFAULT '',
      customer_phone TEXT NOT NULL DEFAULT '',
      customer_name TEXT NOT NULL DEFAULT '',
      whatsapp_opt_in INTEGER NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL,
      subtotal_pkr INTEGER NOT NULL DEFAULT 0,
      recovery_sent_at TEXT,
      recovered INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      whatsapp_opt_in INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS whatsapp_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      business_phone TEXT NOT NULL DEFAULT '+923001234567',
      waba_id TEXT NOT NULL DEFAULT '',
      phone_number_id TEXT NOT NULL DEFAULT '',
      access_token TEXT NOT NULL DEFAULT '',
      webhook_verify_token TEXT NOT NULL DEFAULT '',
      admin_notify_phone TEXT NOT NULL DEFAULT '',
      notify_new_order INTEGER NOT NULL DEFAULT 1,
      notify_payment INTEGER NOT NULL DEFAULT 1,
      notify_high_value_pkr INTEGER NOT NULL DEFAULT 25000,
      notify_low_stock INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS whatsapp_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      event_key TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'UTILITY',
      language TEXT NOT NULL DEFAULT 'en',
      body_text TEXT NOT NULL,
      approval_status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (approval_status IN ('APPROVED', 'PENDING', 'DRAFT'))
    );

    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      direction TEXT NOT NULL DEFAULT 'OUTBOUND' CHECK (direction IN ('OUTBOUND', 'INBOUND')),
      recipient_phone TEXT NOT NULL,
      event_key TEXT NOT NULL,
      template_name TEXT NOT NULL DEFAULT '',
      message_body TEXT NOT NULL,
      provider_message_id TEXT NOT NULL DEFAULT '',
      delivery_status TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
      error_message TEXT NOT NULL DEFAULT '',
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS consent_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      channel TEXT NOT NULL,
      consent_type TEXT NOT NULL,
      granted INTEGER NOT NULL,
      source TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS f1_cache (
      cache_key TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      source_provider TEXT NOT NULL,
      last_synced_at TEXT NOT NULL,
      status TEXT NOT NULL,
      error_message TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS data_sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      sync_type TEXT NOT NULL,
      status TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS news_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      source_name TEXT NOT NULL,
      source_url TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL,
      published_at TEXT NOT NULL,
      is_featured INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      actor_email TEXT NOT NULL DEFAULT 'system',
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL DEFAULT '',
      details_json TEXT NOT NULL DEFAULT '{}',
      ip_address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const cols = db.prepare(`PRAGMA table_info(products)`).all() as Array<{name: string}>;
  if (!cols.some((c) => c.name === 'gender')) {
    db.exec(`ALTER TABLE products ADD COLUMN gender TEXT NOT NULL DEFAULT 'UNISEX'`);
  }
}
