import { db } from '../models/db.js';

export const DEFAULT_PRICING = {
  costPerKw: 50000,
  customKwPricing: {
    '3': 180000,
    '5': 230000
  }
};

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const normalizePricingSettings = (rawPricing = {}) => {
  const costPerKw = toPositiveNumber(rawPricing.costPerKw, DEFAULT_PRICING.costPerKw);
  const sourceCustom = rawPricing.customKwPricing || {};
  const customKwPricing = {};

  Object.entries(sourceCustom).forEach(([kw, amount]) => {
    const normalizedKw = Number(kw);
    const normalizedAmount = Number(amount);
    if (Number.isFinite(normalizedKw) && normalizedKw > 0 && Number.isFinite(normalizedAmount) && normalizedAmount > 0) {
      customKwPricing[String(normalizedKw)] = Math.round(normalizedAmount);
    }
  });

  return { costPerKw, customKwPricing };
};

export const getPricingSettings = async () => {
  const settingsDoc = await db.findOne('settings', { key: 'pricing' });
  if (!settingsDoc?.value) {
    return { ...DEFAULT_PRICING };
  }
  const normalized = normalizePricingSettings(settingsDoc.value);
  return {
    costPerKw: normalized.costPerKw,
    customKwPricing: {
      ...DEFAULT_PRICING.customKwPricing,
      ...normalized.customKwPricing
    }
  };
};

export const savePricingSettings = async (pricing, userId = null) => {
  const normalized = normalizePricingSettings(pricing);
  const settingsDoc = await db.findOne('settings', { key: 'pricing' });

  if (settingsDoc) {
    return db.update('settings', settingsDoc.id, {
      value: normalized,
      updatedBy: userId || settingsDoc.updatedBy || null
    });
  }

  return db.insert('settings', {
    key: 'pricing',
    value: normalized,
    updatedBy: userId || null
  });
};

export const estimateProjectCost = (loadKw, pricingSettings) => {
  const kw = Number(loadKw);
  if (!Number.isFinite(kw) || kw <= 0) return 0;

  const normalizedKwKey = String(Number.isInteger(kw) ? kw : kw);
  const customPrice = pricingSettings?.customKwPricing?.[normalizedKwKey];
  if (Number.isFinite(Number(customPrice)) && Number(customPrice) > 0) {
    return Math.round(Number(customPrice));
  }

  const costPerKw = toPositiveNumber(pricingSettings?.costPerKw, DEFAULT_PRICING.costPerKw);
  return Math.round(kw * costPerKw);
};
