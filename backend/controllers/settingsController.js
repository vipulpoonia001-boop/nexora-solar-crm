import { getPricingSettings } from '../utils/pricing.js';

export const getPublicPricingSettings = async (req, res) => {
  try {
    const pricing = await getPricingSettings();
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
