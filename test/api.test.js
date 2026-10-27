/**
 * TrueSource Cloud - Comprehensive Automated Test Suite
 * Tests Vector Cosine Engine, Arbitrage Formulas, and HTTP REST Endpoints.
 */

const http = require('http');
const assert = require('assert');
const { cosineSimilarity, extractFeatureVector, searchCatalog } = require('../src/services/visual-engine');
const { calculateArbitrage, CNY_TO_USD_RATE } = require('../src/services/arbitrage-calc');
const { getCatalog, getSupplierById } = require('../src/services/catalog-store');
const server = require('../src/server');

console.log('☁️ Starting TrueSource Cloud Automated Test Suite...\n');

let testsPassed = 0;
let testsFailed = 0;

function it(name, fn) {
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      return res
        .then(() => {
          console.log(`  ✓ ${name}`);
          testsPassed++;
        })
        .catch(err => {
          console.error(`  ✗ ${name}`);
          console.error(`    ${err.message}`);
          testsFailed++;
        });
    } else {
      console.log(`  ✓ ${name}`);
      testsPassed++;
    }
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

// ----------------------------------------------------
// 1. Vector Engine & Cosine Math Tests
// ----------------------------------------------------
console.log('📐 1. Vector Cosine Similarity & Embedding Tests');

it('Identical vectors produce cosine similarity of 1.0', () => {
  const vecA = [0.5, 0.5, 0.5, 0.5];
  const vecB = [0.5, 0.5, 0.5, 0.5];
  const sim = cosineSimilarity(vecA, vecB);
  assert.strictEqual(sim, 1.0, `Expected 1.0, got ${sim}`);
});

it('Orthogonal vectors produce cosine similarity of 0.0', () => {
  const vecA = [1.0, 0.0, 0.0];
  const vecB = [0.0, 1.0, 0.0];
  const sim = cosineSimilarity(vecA, vecB);
  assert.strictEqual(sim, 0.0, `Expected 0.0, got ${sim}`);
});

it('extractFeatureVector generates normalized 64-dimensional vectors', () => {
  const vector = extractFeatureVector('Nordic Candle Warmer Lamp Dimmable');
  assert.strictEqual(vector.length, 64, 'Vector must be 64-dimensional');
  
  // Calculate L2 norm to verify unit length
  const sumSq = vector.reduce((acc, val) => acc + val * val, 0);
  assert(Math.abs(sumSq - 1.0) < 0.001, `Vector must be L2 normalized (got ${sumSq})`);
});

it('searchCatalog accurately ranks relevant candle warmer items at the top', () => {
  const catalog = getCatalog();
  const queryVec = extractFeatureVector('Nordic Dimmable Candle Warmer Lamp with Timer');
  const results = searchCatalog(queryVec, catalog, { limit: 5 });

  assert(results.length > 0, 'Must return at least 1 match');
  assert.strictEqual(results[0].id, 'prod_1688_001', 'Top match must be the candle warmer lamp');
  assert(results[0].similarityScore >= 0.80, `Expected high similarity >= 0.80, got ${results[0].similarityScore}`);
});

// ----------------------------------------------------
// 2. Landed Cost & Arbitrage Economics Tests
// ----------------------------------------------------
console.log('\n💰 2. Landed Cost & Arbitrage Margin Economics Tests');

it('Computes precise commercial landed cost and margin breakdown', () => {
  const params = {
    retailPriceUsd: 29.99,
    factoryPriceCny: 28.50,
    weightGrams: 750,
    shippingMethod: 'air_standard',
    tariffRate: 0.05
  };

  const result = calculateArbitrage(params);

  // Assertions
  assert.strictEqual(result.retailPrice, 29.99);
  assert.strictEqual(result.factoryPriceUsd, 3.94); // 28.50 / 7.23 = 3.94
  assert.strictEqual(result.breakdown.domesticChinaFreight, 0.85);
  assert.strictEqual(result.breakdown.internationalFreight, 4.88); // 0.75kg * $6.50 = $4.88
  assert.strictEqual(result.breakdown.estimatedCustomsDuty, 0.20); // 3.94 * 0.05 = 0.20
  assert.strictEqual(result.breakdown.paymentProcessing, 1.17); // (29.99 * 0.029) + 0.30 = 1.17
  assert.strictEqual(result.breakdown.totalLandedCost, 11.04);
  assert.strictEqual(result.metrics.netProfit, 18.95); // 29.99 - 11.04 = 18.95
  assert.strictEqual(result.metrics.grossMarginPct, 63.19); // (18.95 / 29.99) * 100
  assert.strictEqual(result.metrics.markupRatio, '7.6x');
  assert.strictEqual(result.metrics.viabilityRating, 'Healthy Commercial Margin');
});

it('Rejects invalid or negative retail prices with descriptive errors', () => {
  assert.throws(() => {
    calculateArbitrage({ retailPriceUsd: -10, factoryPriceCny: 20 });
  }, /retailPriceUsd must be a positive number/);
});

// ----------------------------------------------------
// 3. HTTP Server & REST API Endpoint Tests
// ----------------------------------------------------
console.log('\n⚡ 3. HTTP Server & REST API Endpoint Tests');

async function runHttpTests() {
  const TEST_PORT = 3892;

  await new Promise(resolve => server.listen(TEST_PORT, resolve));

  function request(options, postData) {
    return new Promise((resolve, reject) => {
      const req = http.request({ port: TEST_PORT, host: 'localhost', ...options }, res => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      });
      req.on('error', reject);
      if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      req.end();
    });
  }

  await it('GET /api/v1/health returns 200 with catalog and supplier counts', async () => {
    const res = await request({ path: '/api/v1/health', method: 'GET' });
    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.status, 'healthy');
    assert(json.indexedCatalogCount > 0);
  });

  await it('POST /api/v1/search/visual returns matched factory items', async () => {
    const payload = { queryText: 'Sunset Atmosphere Light', limit: 3 };
    const res = await request({ path: '/api/v1/search/visual', method: 'POST', headers: { 'Content-Type': 'application/json' } }, payload);
    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.success, true);
    assert(json.matches.length > 0);
  });

  await it('POST /api/v1/search/visual with missing payload returns 400', async () => {
    const res = await request({ path: '/api/v1/search/visual', method: 'POST', headers: { 'Content-Type': 'application/json' } }, {});
    assert.strictEqual(res.status, 400);
  });

  await it('POST /api/v1/arbitrage/calculate computes margins correctly over HTTP', async () => {
    const payload = { retailPriceUsd: 19.99, factoryPriceCny: 12.80, weightGrams: 320 };
    const res = await request({ path: '/api/v1/arbitrage/calculate', method: 'POST', headers: { 'Content-Type': 'application/json' } }, payload);
    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.success, true);
    assert(json.metrics.netProfit > 0);
  });

  await it('GET /api/v1/suppliers/:id returns supplier trust profile', async () => {
    const res = await request({ path: '/api/v1/suppliers/sup_yiwu_091', method: 'GET' });
    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.supplier.id, 'sup_yiwu_091');
    assert(json.supplier.trustScore >= 90);
  });

  await it('GET / serves the interactive visual playground HTML', async () => {
    const res = await request({ path: '/', method: 'GET' });
    assert.strictEqual(res.status, 200);
    assert(res.body.includes('TrueSource Cloud'));
    assert(res.body.includes('Visual Factory Matcher'));
  });

  await new Promise(resolve => server.close(resolve));

  // Summary
  console.log('\n=======================================');
  console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('=======================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All TrueSource Cloud tests passed successfully!');
  }
}

runHttpTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
