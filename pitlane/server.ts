import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import fs from 'node:fs';
import {createServer as createViteServer} from 'vite';
import {seedDatabaseIfEmpty} from './server/seed.ts';
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

  app.get('/robots.txt', (_req, res) => {
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${process.env.APP_URL || 'http://localhost:3000'}/sitemap.xml\n`
    );
  });

  app.get('/sitemap.xml', (_req, res) => {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    const urls = ['/', '/shop', '/collections', '/racing-centre', '/track-order'];
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

  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  if (!isProd) {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PITLANE platform running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PITLANE server:', err);
  process.exit(1);
});
