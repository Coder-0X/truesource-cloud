/**
 * TrueSource Cloud - Interactive Playground Controller
 * Connects frontend controls with the local REST API.
 */

document.addEventListener('DOMContentLoaded', () => {
  const imageUrlInput = document.getElementById('image-url-input');
  const searchBtn = document.getElementById('search-btn');
  const matchesList = document.getElementById('matches-list');
  const resultsCount = document.getElementById('results-count');

  const arbitrageForm = document.getElementById('arbitrage-form');
  const retailPriceInput = document.getElementById('retail-price');
  const factoryPriceCnyInput = document.getElementById('factory-price-cny');
  const weightGramsInput = document.getElementById('weight-grams');
  const shippingMethodSelect = document.getElementById('shipping-method');

  const metricProfit = document.getElementById('metric-profit');
  const metricMargin = document.getElementById('metric-margin');
  const metricLanded = document.getElementById('metric-landed');
  const metricMarkup = document.getElementById('metric-markup');
  const metricVerdict = document.getElementById('metric-verdict');

  const breakdownFactory = document.getElementById('breakdown-factory');
  const breakdownDomestic = document.getElementById('breakdown-domestic');
  const breakdownIntl = document.getElementById('breakdown-intl');
  const breakdownTariff = document.getElementById('breakdown-tariff');
  const breakdownProcessing = document.getElementById('breakdown-processing');

  const SAMPLE_QUERIES = {
    candle: 'Nordic Dimmable Candle Warmer Lamp with Timer',
    sunset: 'Rainbow Sunset Projection Atmosphere Night Light',
    cleaner: '45kHz Portable Ultrasonic Jewelry & Eyeglass Cleaner'
  };

  // Sample Buttons
  document.querySelectorAll('.pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sampleKey = btn.dataset.sample;
      if (SAMPLE_QUERIES[sampleKey]) {
        imageUrlInput.value = SAMPLE_QUERIES[sampleKey];
        triggerVisualSearch(SAMPLE_QUERIES[sampleKey]);
      }
    });
  });

  searchBtn.addEventListener('click', () => {
    const val = imageUrlInput.value.trim();
    if (!val) {
      alert('Please enter a product title or image URL to search.');
      return;
    }
    triggerVisualSearch(val);
  });

  async function triggerVisualSearch(query) {
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching Vector Index...';
    matchesList.innerHTML = '<div class="empty-matches">Vectorizing image and scanning 1688 wholesale catalogs...</div>';

    try {
      const res = await fetch('/api/v1/search/visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryText: query, limit: 10, minSimilarity: 0.35 })
      });

      const data = await res.json();
      if (!data.success || !data.matches) {
        matchesList.innerHTML = '<div class="empty-matches">No direct visual matches found.</div>';
        resultsCount.textContent = 'Matches (0)';
        return;
      }

      resultsCount.textContent = `Matches (${data.matches.length})`;
      renderMatches(data.matches);
    } catch (err) {
      matchesList.innerHTML = `<div class="empty-matches">Error querying API: ${err.message}</div>`;
    } finally {
      searchBtn.disabled = false;
      searchBtn.textContent = 'Search Factory Database';
    }
  }

  function renderMatches(matches) {
    if (matches.length === 0) {
      matchesList.innerHTML = '<div class="empty-matches">No matches above threshold.</div>';
      return;
    }

    matchesList.innerHTML = matches.map(item => `
      <div class="match-card">
        <div class="match-info">
          <span class="match-title" title="${item.title}">${item.title}</span>
          <span class="match-supplier">🏭 ${item.supplier} (${item.location})</span>
          <div class="match-pricing">
            <span class="price-cny">¥${item.priceCny.toFixed(2)} CNY</span>
            <span class="price-usd">($${item.priceUsd.toFixed(2)} USD)</span>
            <span class="sim-score">${(item.similarityScore * 100).toFixed(1)}% Match</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
          <a href="${item.directUrl}" target="_blank" class="btn-secondary" style="font-size: 11px;">1688 Portal ↗</a>
          <button class="pill-btn select-match-btn" 
            data-cny="${item.priceCny}" 
            data-weight="${item.weightGrams || 500}">
            Analyze Margins
          </button>
        </div>
      </div>
    `).join('');

    // Attach click listener for "Analyze Margins"
    document.querySelectorAll('.select-match-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        factoryPriceCnyInput.value = btn.dataset.cny;
        weightGramsInput.value = btn.dataset.weight;
        calculateAndRenderArbitrage();
      });
    });
  }

  // Arbitrage Form Submission
  arbitrageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateAndRenderArbitrage();
  });

  async function calculateAndRenderArbitrage() {
    const payload = {
      retailPriceUsd: parseFloat(retailPriceInput.value),
      factoryPriceCny: parseFloat(factoryPriceCnyInput.value),
      weightGrams: parseFloat(weightGramsInput.value),
      shippingMethod: shippingMethodSelect.value
    };

    try {
      const res = await fetch('/api/v1/arbitrage/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) {
        alert(data.error || 'Calculation failed');
        return;
      }

      const { breakdown, metrics } = data;

      metricProfit.textContent = `$${metrics.netProfit.toFixed(2)}`;
      metricMargin.textContent = `${metrics.grossMarginPct}% Margin`;
      metricLanded.textContent = `$${breakdown.totalLandedCost.toFixed(2)}`;
      metricMarkup.textContent = metrics.markupRatio;
      metricVerdict.textContent = metrics.viabilityRating;

      breakdownFactory.textContent = `$${breakdown.factoryCostUsd.toFixed(2)}`;
      breakdownDomestic.textContent = `$${breakdown.domesticChinaFreight.toFixed(2)}`;
      breakdownIntl.textContent = `$${breakdown.internationalFreight.toFixed(2)}`;
      breakdownTariff.textContent = `$${breakdown.estimatedCustomsDuty.toFixed(2)}`;
      breakdownProcessing.textContent = `$${breakdown.paymentProcessing.toFixed(2)}`;

    } catch (err) {
      console.error('Calculation error:', err);
    }
  }

  // Initial Calculation on Load
  calculateAndRenderArbitrage();
});
