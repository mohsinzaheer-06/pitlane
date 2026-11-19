import crypto from 'node:crypto';
import {db} from './db.ts';

export interface WhatsAppConfigRow {
  id: number;
  business_phone: string;
  waba_id: string;
  phone_number_id: string;
  access_token: string;
  webhook_verify_token: string;
  admin_notify_phone: string;
  notify_new_order: number;
  notify_payment: number;
  notify_high_value_pkr: number;
  notify_low_stock: number;
  updated_at: string;
}

export function getWhatsAppConfig(): WhatsAppConfigRow {
  const row = db.prepare(`SELECT * FROM whatsapp_config WHERE id = 1`).get() as WhatsAppConfigRow | undefined;
  return {
    id: 1,
    business_phone: row?.business_phone || process.env.WHATSAPP_BUSINESS_PHONE || '+923001234567',
    waba_id: row?.waba_id || process.env.WHATSAPP_WABA_ID || '',
    phone_number_id: row?.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    access_token: row?.access_token || process.env.WHATSAPP_ACCESS_TOKEN || '',
    webhook_verify_token: row?.webhook_verify_token || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
    admin_notify_phone: row?.admin_notify_phone || '',
    notify_new_order: row?.notify_new_order ?? 1,
    notify_payment: row?.notify_payment ?? 1,
    notify_high_value_pkr: row?.notify_high_value_pkr ?? 25000,
    notify_low_stock: row?.notify_low_stock ?? 1,
    updated_at: row?.updated_at || new Date().toISOString(),
  };
}

export function maskSecret(value: string): string {
  if (!value) return '';
  if (value.length <= 6) return '••••••';
  return `${'•'.repeat(Math.min(14, value.length - 4))}${value.slice(-4)}`;
}

export function isCloudApiConfigured(cfg = getWhatsAppConfig()): boolean {
  return Boolean(cfg.phone_number_id.trim() && cfg.access_token.trim());
}

export function normalizePhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('03') && cleaned.length === 11) {
    return `92${cleaned.slice(1)}`;
  }
  return cleaned.replace(/^\+/, '');
}

export function buildClickToChatUrl(businessPhone: string, message: string): string {
  const digits = normalizePhoneForWhatsApp(businessPhone);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET || '';
  if (!appSecret) return true; // Skip HMAC check only if app secret is not provisioned
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const provided = signatureHeader.slice('sha256='.length);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(provided, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

interface DispatchParams {
  recipientPhone: string;
  eventKey: string;
  templateName?: string;
  messageBody: string;
  orderId?: number | null;
  templateParams?: string[];
  languageCode?: string;
}

export async function dispatchWhatsAppMessage(params: DispatchParams): Promise<{
  status: 'SENT' | 'FAILED' | 'NOT_CONFIGURED';
  providerMessageId: string;
  errorMessage: string;
}> {
  const cfg = getWhatsAppConfig();
  const normalizedRecipient = normalizePhoneForWhatsApp(params.recipientPhone);

  if (!normalizedRecipient) {
    return {
      status: 'FAILED',
      providerMessageId: '',
      errorMessage: 'Missing recipient phone number',
    };
  }

  if (!isCloudApiConfigured(cfg)) {
    const note =
      'WhatsApp Cloud API credentials not configured. Use click-to-chat fallback for customer-initiated conversations.';
    db.prepare(
      `INSERT INTO whatsapp_messages
        (direction, recipient_phone, event_key, template_name, message_body, provider_message_id, delivery_status, error_message, order_id)
       VALUES ('OUTBOUND', ?, ?, ?, ?, '', 'NOT_CONFIGURED', ?, ?)`
    ).run(
      normalizedRecipient,
      params.eventKey,
      params.templateName || '',
      params.messageBody,
      note,
      params.orderId ?? null
    );
    return {status: 'NOT_CONFIGURED', providerMessageId: '', errorMessage: note};
  }

  const endpoint = `https://graph.facebook.com/v21.0/${cfg.phone_number_id.trim()}/messages`;
  const payload = params.templateName
    ? {
        messaging_product: 'whatsapp',
        to: normalizedRecipient,
        type: 'template',
        template: {
          name: params.templateName,
          language: {code: params.languageCode || 'en'},
          ...(params.templateParams && params.templateParams.length > 0
            ? {
                components: [
                  {
                    type: 'body',
                    parameters: params.templateParams.map((text) => ({type: 'text', text})),
                  },
                ],
              }
            : {}),
        },
      }
    : {
        messaging_product: 'whatsapp',
        to: normalizedRecipient,
        type: 'text',
        text: {body: params.messageBody},
      };

  let lastErr = '';
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfg.access_token.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        messages?: Array<{id?: string}>;
        error?: {message?: string};
      };

      if (response.ok && data.messages?.[0]?.id) {
        const wamid = data.messages[0].id;
        db.prepare(
          `INSERT INTO whatsapp_messages
            (direction, recipient_phone, event_key, template_name, message_body, provider_message_id, delivery_status, error_message, order_id)
           VALUES ('OUTBOUND', ?, ?, ?, ?, ?, 'SENT', '', ?)`
        ).run(
          normalizedRecipient,
          params.eventKey,
          params.templateName || '',
          params.messageBody,
          wamid,
          params.orderId ?? null
        );
        return {status: 'SENT', providerMessageId: wamid, errorMessage: ''};
      }

      lastErr = data?.error?.message || `HTTP ${response.status} from WhatsApp Cloud API`;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : 'Network error reaching WhatsApp Graph API';
    }
  }

  db.prepare(
    `INSERT INTO whatsapp_messages
      (direction, recipient_phone, event_key, template_name, message_body, provider_message_id, delivery_status, error_message, order_id)
     VALUES ('OUTBOUND', ?, ?, ?, ?, '', 'FAILED', ?, ?)`
  ).run(
    normalizedRecipient,
    params.eventKey,
    params.templateName || '',
    params.messageBody,
    lastErr,
    params.orderId ?? null
  );

  return {status: 'FAILED', providerMessageId: '', errorMessage: lastErr};
}

export async function notifyOrderLifecycle(params: {
  orderId: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  whatsappOptIn: boolean;
  eventKey:
    | 'ORDER_RECEIVED'
    | 'ORDER_CONFIRMED'
    | 'PAYMENT_CONFIRMED'
    | 'ORDER_PROCESSING'
    | 'ORDER_SHIPPED'
    | 'ORDER_OUT_FOR_DELIVERY'
    | 'ORDER_DELIVERED'
    | 'ORDER_CANCELLED'
    | 'ORDER_REFUNDED';
  extraNote?: string;
}): Promise<void> {
  if (!params.whatsappOptIn) return;

  const tpl = db
    .prepare(`SELECT * FROM whatsapp_templates WHERE event_key = ? AND approval_status = 'APPROVED' LIMIT 1`)
    .get(params.eventKey) as {name: string; language: string; body_text: string} | undefined;

  const fallbackText = `PITLANE Update (${params.orderNumber}): ${params.eventKey.replace(/_/g, ' ').toLowerCase()}.${
    params.extraNote ? ` ${params.extraNote}` : ''
  }`;
  const rendered = tpl
    ? tpl.body_text
        .replace('{{1}}', params.customerName)
        .replace('{{2}}', params.orderNumber)
        .replace('{{3}}', params.extraNote || 'Active')
    : fallbackText;

  await dispatchWhatsAppMessage({
    recipientPhone: params.customerPhone,
    eventKey: params.eventKey,
    templateName: tpl?.name,
    languageCode: tpl?.language || 'en',
    templateParams: tpl ? [params.customerName, params.orderNumber, params.extraNote || 'Active'] : undefined,
    messageBody: rendered,
    orderId: params.orderId,
  });
}

export async function notifyAdminAlert(params: {
  eventKey: string;
  messageBody: string;
  orderId?: number | null;
}): Promise<void> {
  const cfg = getWhatsAppConfig();
  if (!cfg.admin_notify_phone.trim()) return;
  await dispatchWhatsAppMessage({
    recipientPhone: cfg.admin_notify_phone.trim(),
    eventKey: params.eventKey,
    messageBody: params.messageBody,
    orderId: params.orderId ?? null,
  });
}
