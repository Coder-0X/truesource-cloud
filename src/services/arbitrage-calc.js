/**
 * TrueSource Cloud - Landed Cost & Arbitrage Margin Engine
 * Computes exact commercial landed costs, air freight, customs tariffs, and net arbitrage margins.
 */

const CNY_TO_USD_RATE = 7.23;

const FREIGHT_RATES_PER_KG = {
  air_standard: 6.50, // ePacket / YunExpress air line (10-15 business days)
  air_express: 12.00,  // DHL / FedEx Express line (3-5 business days)
  sea_economy: 2.20    // Ocean consolidated container (25-35 days)
};

/**
 * Calculates landed cost breakdown and arbitrage profitability metrics.
 */
function calculateArbitrage(params) {
  const retailPrice = parseFloat(params.retailPriceUsd);
  if (isNaN(retailPrice) || retailPrice <= 0) {
    throw new Error('retailPriceUsd must be a positive number');
  }

  // Factory price resolution
  let factoryPriceUsd = 0;
  let factoryPriceCny = 0;

  if (params.factoryPriceCny !== undefined) {
    factoryPriceCny = parseFloat(params.factoryPriceCny);
    factoryPriceUsd = +(factoryPriceCny / CNY_TO_USD_RATE).toFixed(2);
  } else if (params.factoryPriceUsd !== undefined) {
    factoryPriceUsd = parseFloat(params.factoryPriceUsd);
    factoryPriceCny = +(factoryPriceUsd * CNY_TO_USD_RATE).toFixed(2);
  } else {
    throw new Error('Must provide either factoryPriceCny or factoryPriceUsd');
  }

  // Weight in kilograms
  const weightGrams = parseFloat(params.weightGrams) || 450;
  const weightKg = Math.max(0.05, weightGrams / 1000);

  // Shipping Method
  const method = params.shippingMethod || 'air_standard';
  const ratePerKg = FREIGHT_RATES_PER_KG[method] || FREIGHT_RATES_PER_KG.air_standard;

  // 1. Domestic China Courier (Factory to coastal export port, e.g. Yiwu/Shenzhen)
  const domesticChinaFreight = +(0.85).toFixed(2);

  // 2. International Air/Ocean Freight
  const minFreight = method === 'air_express' ? 8.00 : method === 'sea_economy' ? 1.50 : 2.50;
  const internationalFreight = +(Math.max(minFreight, weightKg * ratePerKg)).toFixed(2);

  // 3. Estimated Customs Tariff (Section 301 / HS baseline)
  const tariffRate = parseFloat(params.tariffRate) || 0.05; // 5% standard
  const estimatedCustomsDuty = +(factoryPriceUsd * tariffRate).toFixed(2);

  // 4. Foreign Exchange & Payment Processing (Stripe/PayPal standard 2.9% + $0.30)
  const paymentProcessing = +((retailPrice * 0.029) + 0.30).toFixed(2);

  // 5. Total Landed Cost
  const totalLandedCost = +(
    factoryPriceUsd +
    domesticChinaFreight +
    internationalFreight +
    estimatedCustomsDuty +
    paymentProcessing
  ).toFixed(2);

  // Profitability Metrics
  const netProfit = +(retailPrice - totalLandedCost).toFixed(2);
  const grossMarginPct = +((netProfit / retailPrice) * 100).toFixed(2);
  const markupRatio = factoryPriceUsd > 0 ? (retailPrice / factoryPriceUsd).toFixed(1) + 'x' : 'N/A';

  let viabilityRating = 'Moderate Margin';
  if (grossMarginPct >= 65) {
    viabilityRating = 'High Arbitrage Potential';
  } else if (grossMarginPct >= 45) {
    viabilityRating = 'Healthy Commercial Margin';
  } else if (grossMarginPct >= 25) {
    viabilityRating = 'Low Margin / Thin Spread';
  } else {
    viabilityRating = 'Unviable / Freight Overhead Exceeds Margin';
  }

  return {
    currency: 'USD',
    exchangeRate: {
      cnyToUsd: CNY_TO_USD_RATE
    },
    retailPrice,
    factoryPriceCny,
    factoryPriceUsd,
    shippingDetails: {
      method,
      weightGrams,
      ratePerKg
    },
    breakdown: {
      factoryCostUsd: factoryPriceUsd,
      domesticChinaFreight,
      internationalFreight,
      estimatedCustomsDuty,
      paymentProcessing,
      totalLandedCost
    },
    metrics: {
      netProfit,
      grossMarginPct,
      markupRatio,
      viabilityRating
    }
  };
}

module.exports = {
  CNY_TO_USD_RATE,
  FREIGHT_RATES_PER_KG,
  calculateArbitrage
};
