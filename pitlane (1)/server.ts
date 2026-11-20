import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import {createServer as createViteServer} from 'vite';
import {seedDatabaseIfEmpty} from './server/seed.ts';
import {db} from './server/db.ts';
import {attachUser} from './server/auth.ts';
import {storefrontRouter} from './server/routes/storefront.ts';
import {authRouter} from './server/routes/authRoutes.ts';
import {racingRouter} from './server/routes/racingRoutes.ts';
import {whatsappRouter} from './server/routes/whatsappRoutes.ts';
import {adminRouter} from './server/routes/adminRoutes.ts';

async function startServer() {
  seedDatabaseIfEmpty();

  const app = express();
  app.set('trust proxy', 1);

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Mount WhatsApp raw-body webhook route before JSON parser
  app.use('/api', whatsappRouter);

  app.use(express.json({limit: '2mb'}));
  app.use(cookieParser());
  app.use(attachUser);

  // Health & SEO endpoints
  app.get('/api/health', (_req, res) => {
    res.json({status: 'ok', timestamp: new Date().toISOString()});
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl =
      process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL
        : `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${baseUrl}/sitemap.xml\n`
    );
  });

  app.get('/sitemap.xml', (req, res) => {
    const baseUrl =
      process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL
        : `${req.protocol}://${req.get('host')}`;
    const staticUrls = ['/', '/shop', '/collections', '/racing-centre', '/track-order'];
    const dynamicUrls: string[] = [];
    try {
      const cats = db.prepare(`SELECT slug FROM categories`).all() as Array<{slug: string}>;
      const prods = db.prepare(`SELECT slug FROM products WHERE active = 1`).all() as Array<{slug: string}>;
      cats.forEach((c) => dynamicUrls.push(`/category/${c.slug}`));
      prods.forEach((p) => dynamicUrls.push(`/product/${p.slug}`));
    } catch {
      // Fallback to static routes if query unavailable
    }
    const urls = [...staticUrls, ...dynamicUrls];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${baseUrl}${u}</loc></url>`)
      .join('\n')}\n</urlset>`;
    res.type('application/xml').send(xml);
  });

  // API routers
  app.use('/api', storefrontRouter);
  app.use('/api', authRouter);
  app.use('/api', racingRouter);
  app.use('/api', adminRouter);

  // Explicit 404 for unknown API routes so SPA fallback never returns HTML for API calls
  app.use('/api', (_req, res) => {
    res.status(404).json({error: 'API endpoint not found.'});
  });

  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  if (!isProd) {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(
      express.static(distDir, {
        maxAge: '7d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  // Global error handler (prevents raw stack trace leakage on malformed JSON or runtime errors)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err?.type === 'entity.parse.failed') {
      res.status(400).json({error: 'Malformed JSON request body.'});
      return;
    }
    res.status(err?.status || 500).json({error: 'Internal server error.'});
  });

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PITLANE platform running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PITLANE server:', err);
  process.exit(1);
});
