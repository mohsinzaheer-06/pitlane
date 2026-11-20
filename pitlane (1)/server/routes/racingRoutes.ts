import express from 'express';
import {db} from '../db.ts';
import {logAudit, requireAdmin} from '../auth.ts';
import {getRacingOverview, syncF1DataFromProvider} from '../f1Adapter.ts';

export const racingRouter = express.Router();

racingRouter.get('/racing/overview', async (_req, res) => {
  const racing = await getRacingOverview(30);
  const articles = db
    .prepare(`SELECT * FROM news_articles ORDER BY is_featured DESC, published_at DESC LIMIT 12`)
    .all();
  const syncLogs = db
    .prepare(`SELECT * FROM data_sync_logs ORDER BY id DESC LIMIT 8`)
    .all();

  res.json({
    racing,
    articles,
    syncLogs,
  });
});

racingRouter.post('/racing/sync', requireAdmin, async (req, res) => {
  const racing = await syncF1DataFromProvider();
  logAudit({
    actorId: req.user!.id,
    actorEmail: req.user!.email,
    action: 'F1_DATA_SYNC',
    entityType: 'RACING_CENTRE',
    details: {status: racing.syncStatus, season: racing.season},
    ipAddress: req.ip,
  });
  res.json({racing});
});
