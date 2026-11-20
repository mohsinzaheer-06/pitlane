import {db} from './db.ts';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  rateFromPkr: number;
  decimals: number;
}

export interface ShippingZoneConfig {
  zoneId: string;
  label: string;
  countries: string[];
  baseRatePkr: number;
  freeOverPkr: number | null;
  taxRatePercent: number;
  estimatedDays: string;
}

export const DEFAULT_CURRENCIES: Record<string, CurrencyConfig> = {
  PKR: {code: 'PKR', symbol: 'PKR', rateFromPkr: 1, decimals: 0},
  USD: {code: 'USD', symbol: '$', rateFromPkr: 0.0036, decimals: 2},
  GBP: {code: 'GBP', symbol: '£', rateFromPkr: 0.0028, decimals: 2},
  EUR: {code: 'EUR', symbol: '€', rateFromPkr: 0.0033, decimals: 2},
  AED: {code: 'AED', symbol: 'AED', rateFromPkr: 0.0132, decimals: 2},
};

export const DEFAULT_SHIPPING_ZONES: ShippingZoneConfig[] = [
  {
    zoneId: 'PK_LOCAL',
    label: 'Pakistan Nationwide Express (TCS / Leopards)',
    countries: ['Pakistan', 'PK'],
    baseRatePkr: 350,
    freeOverPkr: 15000,
    taxRatePercent: 0,
    estimatedDays: '2–4 Business Days',
  },
  {
    zoneId: 'GCC_MENA',
    label: 'UAE & GCC Priority Courier (DHL Express)',
    countries: ['United Arab Emirates', 'UAE', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Kuwait', 'Oman'],
    baseRatePkr: 4500,
    freeOverPkr: 45000,
    taxRatePercent: 5,
    estimatedDays: '3–5 Business Days',
  },
  {
    zoneId: 'INTL_GLOBAL',
    label: 'International Worldwide Courier (DHL Express)',
    countries: ['*'],
    baseRatePkr: 8500,
    freeOverPkr: 75000,
    taxRatePercent: 0,
    estimatedDays: '5–8 Business Days',
  },
];

export function getSiteSetting<T>(key: string, fallback: T): T {
  const row = db.prepare(`SELECT value_json FROM site_settings WHERE key = ?`).get(key) as
    | {value_json: string}
    | undefined;
  if (!row) return fallback;
  try {
    return JSON.parse(row.value_json) as T;
  } catch {
    return fallback;
  }
}

export function getShippingZone(country: string): ShippingZoneConfig {
  const zones = getSiteSetting<ShippingZoneConfig[]>('shipping_zones', DEFAULT_SHIPPING_ZONES);
  const normalized = country.trim().toLowerCase();
  const matched = zones.find((z) =>
    z.countries.some((c) => c.toLowerCase() === normalized)
  );
  if (matched) return matched;
  return zones.find((z) => z.countries.includes('*')) || DEFAULT_SHIPPING_ZONES[2];
}

export function getCurrencyConfig(currencyCode: string): CurrencyConfig {
  const currencies = getSiteSetting<Record<string, CurrencyConfig>>('currencies', DEFAULT_CURRENCIES);
  return currencies[currencyCode.toUpperCase()] || DEFAULT_CURRENCIES.PKR;
}

export function calculateUnitPricePkr(
  basePricePkr: number,
  discountPercent: number,
  priceOverridePkr: number | null
): number {
  const raw = priceOverridePkr ?? basePricePkr;
  if (discountPercent > 0 && discountPercent <= 90) {
    return Math.round(raw * (1 - discountPercent / 100));
  }
  return raw;
}

export function convertFromPkr(amountPkr: number, currencyCode: string): {
  currency: string;
  rate: number;
  amount: number;
} {
  const cfg = getCurrencyConfig(currencyCode);
  const converted = Number((amountPkr * cfg.rateFromPkr).toFixed(cfg.decimals));
  return {
    currency: cfg.code,
    rate: cfg.rateFromPkr,
    amount: converted,
  };
}

export function calculateOrderTotals(params: {
  subtotalPkr: number;
  country: string;
  couponCode?: string;
  currency: string;
}): {
  subtotalPkr: number;
  discountPkr: number;
  shippingPkr: number;
  taxPkr: number;
  totalPkr: number;
  appliedCoupon: string;
  couponError?: string;
  shippingZone: ShippingZoneConfig;
  currency: string;
  exchangeRate: number;
  totalDisplayAmount: number;
} {
  const zone = getShippingZone(params.country);
  let discountPkr = 0;
  let appliedCoupon = '';
  let couponError: string | undefined;

  if (params.couponCode && params.couponCode.trim()) {
    const code = params.couponCode.trim().toUpperCase();
    const coupon = db
      .prepare(`SELECT * FROM coupons WHERE code = ? AND active = 1`)
      .get(code) as
      | {
          id: number;
          code: string;
          discount_type: 'PERCENT' | 'FIXED_PKR';
          discount_value: number;
          min_order_pkr: number;
          max_uses: number;
          used_count: number;
          expires_at: string | null;
        }
      | undefined;

    if (!coupon) {
      couponError = 'Invalid or inactive coupon code.';
    } else if (coupon.expires_at && Date.parse(coupon.expires_at) < Date.now()) {
      couponError = 'This coupon code has expired.';
    } else if (coupon.used_count >= coupon.max_uses) {
      couponError = 'This coupon has reached its usage limit.';
    } else if (params.subtotalPkr < coupon.min_order_pkr) {
      couponError = `Minimum order of PKR ${coupon.min_order_pkr.toLocaleString()} required for ${code}.`;
    } else {
      appliedCoupon = coupon.code;
      if (coupon.discount_type === 'PERCENT') {
        discountPkr = Math.round((params.subtotalPkr * coupon.discount_value) / 100);
      } else {
        discountPkr = Math.min(params.subtotalPkr, coupon.discount_value);
      }
    }
  }

  const discountedSubtotal = Math.max(0, params.subtotalPkr - discountPkr);
  const shippingPkr =
    zone.freeOverPkr !== null && discountedSubtotal >= zone.freeOverPkr ? 0 : zone.baseRatePkr;
  const taxPkr = Math.round((discountedSubtotal * zone.taxRatePercent) / 100);
  const totalPkr = discountedSubtotal + shippingPkr + taxPkr;
  const converted = convertFromPkr(totalPkr, params.currency);

  return {
    subtotalPkr: params.subtotalPkr,
    discountPkr,
    shippingPkr,
    taxPkr,
    totalPkr,
    appliedCoupon,
    couponError,
    shippingZone: zone,
    currency: converted.currency,
    exchangeRate: converted.rate,
    totalDisplayAmount: converted.amount,
  };
}
