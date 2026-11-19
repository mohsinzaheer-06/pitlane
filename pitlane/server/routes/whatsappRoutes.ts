import express from 'express';
import {db} from '../db.ts';
import {getWhatsAppConfig, verifyWebhookSignature} from '../whatsapp.ts';

export const whatsappRouter = express.Router();

// Meta WhatsApp Cloud API Webhook Verification
whatsappRouter.get('/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const cfg = getWhatsAppConfig();
  if (mode === 'subscribe' && token && token === cfg.webhook_verify_token) {
    res.status(200).send(String(challenge || ''));
    return;
  }
  res.sendStatus(403);
});

// Meta WhatsApp Cloud API Delivery Status & Inbound Message Webhook
whatsappRouter.post(
  '/whatsapp/webhook',
  express.raw({type: 'application/json'}),
  (req, res) => {
    const rawBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const sig = req.header('x-hub-signature-256');

    if (!verifyWebhookSignature(rawBuf, sig)) {
      res.sendStatus(401);
      return;
    }

    try {
      const payload = Buffer.isBuffer(req.body) ? JSON.parse(rawBuf.toString('utf8')) : req.body;
      const entries = payload?.entry || [];
      for (const entry of entries) {
        for (const change of entry?.changes || []) {
          const val = change?.value;
          for (const statusObj of val?.statuses || []) {
            if (statusObj?.id && statusObj?.status) {
              db.prepare(
                `UPDATE whatsapp_messages SET delivery_status = ? WHERE provider_message_id = ?`
              ).run(String(statusObj.status).toUpperCase(), String(statusObj.id));
            }
          }
          for (const msg of val?.messages || []) {
            const from = String(msg?.from || '');
            const textBody = String(msg?.text?.body || '[Media/Interactive Message]');
            if (from) {
              db.prepare(
                `INSERT INTO whatsapp_messages (direction, recipient_phone, event_key, message_body, provider_message_id, delivery_status)
                 VALUES ('INBOUND', ?, 'CUSTOMER_INBOUND', ?, ?, 'DELIVERED')`
              ).run(from, textBody, String(msg?.id || ''));

              if (/^(stop|unsubscribe|optout)$/i.test(textBody.trim())) {
                db.prepare(`UPDATE users SET whatsapp_opt_in = 0 WHERE REPLACE(phone, '+', '') = ?`).run(
                  from.replace(/^\+/, '')
                );
                db.prepare(
                  `INSERT INTO consent_records (phone, channel, consent_type, granted, source)
                   VALUES (?, 'WHATSAPP', 'OPT_OUT_KEYWORD', 0, 'WHATSAPP_WEBHOOK')`
                ).run(from);
              }
            }
          }
        }
      }
    } catch {
      // Ignore malformed webhook payloads gracefully
    }

    res.sendStatus(200);
  }
);
