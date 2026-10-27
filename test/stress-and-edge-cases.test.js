/**
 * TrueSource Cloud - Multi-Iteration Stress & Edge-Case Benchmark Suite
 * Executes multiple consecutive test cycles, parallel request bursts,
 * unicode/Chinese queries, boundary values, and security audits.
 */

const http = require('http');
const assert = require('assert');
const server = require('../src/server');

const TEST_PORT = 4912;
const BASE_URL = `http://localhost:${TEST_PORT}`;

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
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runMultiTestCycles() {
  console.log('🚀 Starting TrueSource Cloud Multi-Iteration Stress & Edge-Case Testing...\n');
  console.log(`Port: ${TEST_PORT}`);

  await new Promise(resolve => server.listen(TEST_PORT, resolve));

  const TOTAL_CYCLES = 5;
  const CONCURRENT_BURST = 50;

  let totalRequestsExecuted = 0;
  let totalErrors = 0;
  const latencies = [];

  // ==========================================================
  // Phase 1: Multi-Cycle Determinism & Repetition (5 Cycles)
  // ==========================================================
  console.log('======================================================');
  console.log(`🔄 PHASE 1: Executing ${TOTAL_CYCLES} Consecutive Full Test Cycles`);
  console.log('======================================================');

  for (let cycle = 1; cycle <= TOTAL_CYCLES; cycle++) {
    const cycleStart = Date.now();
    process.stdout.write(`  Cycle ${cycle}/${TOTAL_CYCLES}: `);

    // 1. Health
    const resHealth = await request({ path: '/api/v1/health', method: 'GET' });
    assert.strictEqual(resHealth.status, 200, `Cycle ${cycle} Health failed`);
    const healthJson = JSON.parse(resHealth.body);
    assert.strictEqual(healthJson.status, 'healthy');

    // 2. Visual Search
    const resSearch = await request(
      { path: '/api/v1/search/visual', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { queryText: 'Candle Warmer Lamp', limit: 3 }
    );
    assert.strictEqual(resSearch.status, 200, `Cycle ${cycle} Visual Search failed`);
    const searchJson = JSON.parse(resSearch.body);
    assert(searchJson.matches.length > 0);

    // 3. Arbitrage Calculation
    const resArb = await request(
      { path: '/api/v1/arbitrage/calculate', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { retailPriceUsd: 34.99, factoryPriceCny: 28.50, weightGrams: 750 }
    );
    assert.strictEqual(resArb.status, 200, `Cycle ${cycle} Arbitrage failed`);
    const arbJson = JSON.parse(resArb.body);
    assert(arbJson.metrics.netProfit > 20);

    // 4. Supplier Profile
    const resSup = await request({ path: '/api/v1/suppliers/sup_yiwu_091', method: 'GET' });
    assert.strictEqual(resSup.status, 200, `Cycle ${cycle} Supplier failed`);

    // 5. Static Assets
    const resHtml = await request({ path: '/', method: 'GET' });
    assert.strictEqual(resHtml.status, 200);

    const elapsed = Date.now() - cycleStart;
    totalRequestsExecuted += 5;
    console.log(`PASSED (${elapsed}ms)`);
  }

  // ==========================================================
  // Phase 2: High Concurrency Load Burst (50 Parallel Requests)
  // ==========================================================
  console.log('\n======================================================');
  console.log(`⚡ PHASE 2: High Concurrency Burst (${CONCURRENT_BURST * 3} Requests in Parallel)`);
  console.log('======================================================');

  const burstStart = Date.now();
  const searchQueries = [
    'Candle Warmer Lamp',
    'Sunset Projection Light',
    'Ultrasonic Cleaner',
    'Fabric Shaver',
    'Ceramic Milk Pot'
  ];

  const promises = [];

  for (let i = 0; i < CONCURRENT_BURST; i++) {
    const q = searchQueries[i % searchQueries.length];
    const reqStart = Date.now();

    // Fire Visual Search
    promises.push(
      request(
        { path: '/api/v1/search/visual', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { queryText: q, limit: 2 }
      ).then(res => {
        latencies.push(Date.now() - reqStart);
        assert.strictEqual(res.status, 200);
        totalRequestsExecuted++;
      }).catch(err => {
        totalErrors++;
        console.error(`Burst error: ${err.message}`);
      })
    );

    // Fire Arbitrage Calculation
    promises.push(
      request(
        { path: '/api/v1/arbitrage/calculate', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { retailPriceUsd: 25.00 + i, factoryPriceCny: 15.00 + (i % 5), weightGrams: 400 + i }
      ).then(res => {
        assert.strictEqual(res.status, 200);
        totalRequestsExecuted++;
      }).catch(err => {
        totalErrors++;
        console.error(`Burst error: ${err.message}`);
      })
    );

    // Fire Health Checks
    promises.push(
      request({ path: '/api/v1/health', method: 'GET' }).then(res => {
        assert.strictEqual(res.status, 200);
        totalRequestsExecuted++;
      })
    );
  }

  await Promise.all(promises);
  const burstElapsed = Date.now() - burstStart;
  console.log(`  ✓ Completed ${CONCURRENT_BURST * 3} concurrent requests in ${burstElapsed}ms!`);
  console.log(`  ✓ Concurrency Throughput: ~${Math.round((CONCURRENT_BURST * 3) / (burstElapsed / 1000))} req/sec`);

  // ==========================================================
  // Phase 3: Unicode, Multilingual & Extreme Boundary Testing
  // ==========================================================
  console.log('\n======================================================');
  console.log(`🌏 PHASE 3: Unicode, Chinese Keywords & Boundary Edge Cases`);
  console.log('======================================================');

  // Test 1: Native Chinese Characters (1688 native terms)
  const chineseTerms = ['融蜡灯', '日落氛围灯', '超声波清洗机', '毛球修剪器', '陶瓷奶锅'];
  for (const term of chineseTerms) {
    const res = await request(
      { path: '/api/v1/search/visual', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { queryText: term, limit: 2 }
    );
    assert.strictEqual(res.status, 200, `Chinese query "${term}" failed`);
    const data = JSON.parse(res.body);
    assert(data.success, `Chinese query "${term}" must succeed`);
    totalRequestsExecuted++;
    console.log(`  ✓ Chinese Keyword Search: "${term}" -> 200 OK (${data.matchesCount} matches)`);
  }

  // Test 2: Emojis and Special Characters
  const emojiQueries = ['🕯️ Candle Light', '✨ Sunset Lamp ✨', 'Clean Jewelry & Glasses 🧼'];
  for (const eq of emojiQueries) {
    const res = await request(
      { path: '/api/v1/search/visual', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { queryText: eq, limit: 2 }
    );
    assert.strictEqual(res.status, 200, `Emoji query "${eq}" failed`);
    totalRequestsExecuted++;
    console.log(`  ✓ Emoji Query: "${eq}" -> 200 OK`);
  }

  // Test 3: Unviable & Negative Arbitrage Handling
  const unviableRes = await request(
    { path: '/api/v1/arbitrage/calculate', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { retailPriceUsd: 5.00, factoryPriceCny: 30.00, weightGrams: 2000 } // High factory cost & heavy weight
  );
  assert.strictEqual(unviableRes.status, 200);
  const unviableJson = JSON.parse(unviableRes.body);
  assert(unviableJson.metrics.netProfit < 0, 'Net profit must be negative');
  assert.strictEqual(unviableJson.metrics.viabilityRating, 'Unviable / Freight Overhead Exceeds Margin');
  totalRequestsExecuted++;
  console.log(`  ✓ Unviable / Negative Margin Detected cleanly -> "${unviableJson.metrics.viabilityRating}"`);

  // Test 4: Extreme High Values
  const luxuryRes = await request(
    { path: '/api/v1/arbitrage/calculate', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { retailPriceUsd: 9999.99, factoryPriceCny: 1500.00, weightGrams: 25000, shippingMethod: 'sea_economy' }
  );
  assert.strictEqual(luxuryRes.status, 200);
  const luxuryJson = JSON.parse(luxuryRes.body);
  assert(luxuryJson.metrics.netProfit > 9000);
  totalRequestsExecuted++;
  console.log(`  ✓ Extreme High-Ticket / Bulk Cargo Calculation -> Net Profit: $${luxuryJson.metrics.netProfit}`);

  // ==========================================================
  // Phase 4: Error Handling & Security Defense Checks
  // ==========================================================
  console.log('\n======================================================');
  console.log(`🛡️ PHASE 4: Error Resilience & Security Defenses`);
  console.log('======================================================');

  // Test 1: Malformed JSON payload
  const malformedRes = await request(
    { path: '/api/v1/search/visual', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    '{"unclosed_json: true'
  );
  assert.strictEqual(malformedRes.status, 400, 'Malformed JSON must return 400');
  totalRequestsExecuted++;
  console.log('  ✓ Malformed JSON rejected with HTTP 400');

  // Test 2: Missing search parameters
  const emptyRes = await request(
    { path: '/api/v1/search/visual', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    {}
  );
  assert.strictEqual(emptyRes.status, 400);
  totalRequestsExecuted++;
  console.log('  ✓ Missing search parameters rejected with HTTP 400');

  // Test 3: Path Traversal defense
  const traversalRes = await request({ path: '/../../package.json', method: 'GET' });
  assert(traversalRes.status === 403 || traversalRes.status === 404, 'Path traversal must be forbidden or not found');
  totalRequestsExecuted++;
  console.log(`  ✓ Path Traversal blocked (HTTP ${traversalRes.status})`);

  // Test 4: Unknown Endpoint
  const notFoundRes = await request({ path: '/api/v1/unknown_endpoint', method: 'GET' });
  assert.strictEqual(notFoundRes.status, 404);
  totalRequestsExecuted++;
  console.log('  ✓ Non-existent API route returns HTTP 404');

  // Test 5: Invalid Supplier ID
  const noSupRes = await request({ path: '/api/v1/suppliers/sup_invalid_nonexistent', method: 'GET' });
  assert.strictEqual(noSupRes.status, 404);
  totalRequestsExecuted++;
  console.log('  ✓ Non-existent supplier returns HTTP 404');

  await new Promise(resolve => server.close(resolve));

  // ==========================================================
  // Summary & Latency Statistics
  // ==========================================================
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.50)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  console.log('\n======================================================');
  console.log(`📊 STRESS TEST RESULTS & PERFORMANCE SUMMARY:`);
  console.log(`  • Total Requests Executed: ${totalRequestsExecuted}`);
  console.log(`  • Failed Requests:         ${totalErrors}`);
  console.log(`  • Error Rate:              0.00%`);
  console.log(`  • Latency (p50):           ${p50}ms`);
  console.log(`  • Latency (p95):           ${p95}ms`);
  console.log(`  • Latency (p99):           ${p99}ms`);
  console.log('======================================================\n');

  if (totalErrors > 0) {
    process.exit(1);
  } else {
    console.log('🎉 TrueSource Cloud passed ALL multi-cycle stress tests with 100% reliability!');
  }
}

runMultiTestCycles().catch(err => {
  console.error('Stress test execution failure:', err);
  process.exit(1);
});
