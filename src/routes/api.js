/**
 * TrueSource Cloud - API Route Handlers
 * REST endpoints for visual vector reverse-search, arbitrage calculation, and supplier intelligence.
 */

const { extractFeatureVector, searchCatalog } = require('../services/visual-engine');
const { calculateArbitrage } = require('../services/arbitrage-calc');
const { getCatalog, getSupplierById, getAllSuppliers } = require('../services/catalog-store');

function handleApiRequest(req, res, url, body) {
  const pathname = url.pathname;
  const method = req.method;

  // Set standard CORS & JSON headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Helper: send JSON response
  const json = (statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  };

  try {
    // 1. Health Check
    if (pathname === '/api/v1/health' && method === 'GET') {
      const catalog = getCatalog();
      return json(200, {
        status: 'healthy',
        service: 'TrueSource Cloud Visual Vector API',
        version: '1.0.0',
        indexedSuppliersCount: getAllSuppliers().length,
        indexedCatalogCount: catalog.length,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Visual Reverse-Image Search
    if (pathname === '/api/v1/search/visual' && method === 'POST') {
      const { imageUrl, queryText, imageBase64, category, limit, minSimilarity } = body || {};

      if (!imageUrl && !queryText && !imageBase64) {
        return json(400, {
          success: false,
          error: 'Must provide either imageUrl, queryText, or imageBase64'
        });
      }

      const input = imageUrl || queryText || imageBase64;
      const queryVector = extractFeatureVector(input);
      const catalog = getCatalog();

      const matches = searchCatalog(queryVector, catalog, {
        category,
        limit: parseInt(limit, 10) || 10,
        minSimilarity: parseFloat(minSimilarity) || 0.35
      });

      return json(200, {
        success: true,
        query: {
          inputSource: imageUrl ? 'imageUrl' : queryText ? 'queryText' : 'imageBase64',
          category: category || 'all',
          featuresExtracted: queryVector.length
        },
        matchesCount: matches.length,
        matches
      });
    }

    // 3. Landed Cost & Arbitrage Calculation
    if (pathname === '/api/v1/arbitrage/calculate' && method === 'POST') {
      const result = calculateArbitrage(body || {});
      return json(200, {
        success: true,
        ...result
      });
    }

    // 4. Supplier Intelligence
    if (pathname.startsWith('/api/v1/suppliers/') && method === 'GET') {
      const supplierId = pathname.replace('/api/v1/suppliers/', '').trim();
      const supplier = getSupplierById(supplierId);

      if (!supplier) {
        return json(404, {
          success: false,
          error: `Supplier with ID "${supplierId}" not found`
        });
      }

      return json(200, {
        success: true,
        supplier
      });
    }

    // 5. Full Catalog Retrieval
    if (pathname === '/api/v1/catalog' && method === 'GET') {
      const catalog = getCatalog();
      return json(200, {
        success: true,
        count: catalog.length,
        items: catalog
      });
    }

    // Route not found
    return json(404, {
      success: false,
      error: `Endpoint ${method} ${pathname} not found`
    });

  } catch (err) {
    console.error('[API Route Handler Error]:', err);
    return json(500, {
      success: false,
      error: err.message || 'Internal Server Error'
    });
  }
}

module.exports = {
  handleApiRequest
};
