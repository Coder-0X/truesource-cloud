# TrueSource Cloud - OpenAPI / REST API Reference

**Base URL:** `http://localhost:3000/api/v1`  
**Protocol:** HTTP/1.1  
**Content-Type:** `application/json`  
**Authentication:** Open Access (v1.0.0 Community Edition)

---

## 1. System Health

### `GET /api/v1/health`
Checks API server availability and indexed catalog stats.

#### Response `200 OK`
```json
{
  "status": "healthy",
  "service": "TrueSource Cloud Visual Vector API",
  "version": "1.0.0",
  "indexedSuppliersCount": 5,
  "indexedCatalogCount": 5,
  "timestamp": "2026-10-26T12:00:00.000Z"
}
```

---

## 2. Visual Vector Search

### `POST /api/v1/search/visual`
Performs nearest-neighbor vector search over indexed factory items.

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `imageUrl` | string | Optional* | Public URL of product image to vectorize |
| `queryText` | string | Optional* | Semantic query or product title |
| `imageBase64`| string | Optional* | Raw base64 data URI string |
| `category` | string | Optional | Filter by category (`home-goods`, `electronics`, `kitchen`, etc.) |
| `limit` | integer| Optional | Maximum results returned (default: 10) |
| `minSimilarity` | float | Optional | Minimum cosine similarity threshold (0.0 to 1.0, default: 0.35) |

*\*Must provide at least one of `imageUrl`, `queryText`, or `imageBase64`.*

#### Example Request
```json
{
  "queryText": "Nordic Candle Warmer Lamp Dimmable",
  "category": "home-goods",
  "limit": 5,
  "minSimilarity": 0.40
}
```

#### Response `200 OK`
```json
{
  "success": true,
  "query": {
    "inputSource": "queryText",
    "category": "home-goods",
    "featuresExtracted": 64
  },
  "matchesCount": 1,
  "matches": [
    {
      "id": "prod_1688_001",
      "title": "Nordic Dimmable Candle Warmer Lamp with Timer",
      "category": "home-goods",
      "platform": "1688 Wholesale",
      "supplierId": "sup_yiwu_091",
      "supplier": "Yiwu Oupai Lighting Co., Ltd.",
      "location": "Yiwu, Zhejiang",
      "priceCny": 28.5,
      "priceUsd": 3.94,
      "moq": 2,
      "weightGrams": 750,
      "rating": 4.9,
      "yearsActive": 8,
      "imageUrl": "https://images.unsplash.com/...",
      "directUrl": "https://s.1688.com/youyuan.html?...",
      "similarityScore": 0.9415
    }
  ]
}
```

---

## 3. Landed-Cost & Profit Margin Calculation

### `POST /api/v1/arbitrage/calculate`
Calculates international landed cost, shipping overhead, customs tariffs, and net margins.

#### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `retailPriceUsd` | float | Yes | Target retail selling price on Amazon or Shopify |
| `factoryPriceCny`| float | Optional* | Factory price in Chinese Yuan (CNY) |
| `factoryPriceUsd`| float | Optional* | Factory price in US Dollars (USD) |
| `weightGrams` | integer| No | Packaged product weight in grams (default: 450) |
| `shippingMethod` | string | No | `air_standard`, `air_express`, or `sea_economy` |
| `tariffRate` | float | No | Customs duty percentage (default: 0.05 / 5%) |

#### Example Request
```json
{
  "retailPriceUsd": 29.99,
  "factoryPriceCny": 28.50,
  "weightGrams": 750,
  "shippingMethod": "air_standard"
}
```

#### Response `200 OK`
```json
{
  "success": true,
  "currency": "USD",
  "exchangeRate": { "cnyToUsd": 7.23 },
  "retailPrice": 29.99,
  "factoryPriceCny": 28.5,
  "factoryPriceUsd": 3.94,
  "shippingDetails": {
    "method": "air_standard",
    "weightGrams": 750,
    "ratePerKg": 6.5
  },
  "breakdown": {
    "factoryCostUsd": 3.94,
    "domesticChinaFreight": 0.85,
    "internationalAirFreight": 4.88,
    "estimatedCustomsDuty": 0.2,
    "paymentProcessing": 1.17,
    "totalLandedCost": 11.04
  },
  "metrics": {
    "netProfit": 18.95,
    "grossMarginPct": 63.19,
    "markupRatio": "7.6x",
    "viabilityRating": "Healthy Commercial Margin"
  }
}
```

---

## 4. Supplier Intelligence

### `GET /api/v1/suppliers/:id`
Retrieves manufacturing audit status, export regions, and compliance records.

#### Example Request
```bash
curl http://localhost:3000/api/v1/suppliers/sup_yiwu_091
```

#### Response `200 OK`
```json
{
  "success": true,
  "supplier": {
    "id": "sup_yiwu_091",
    "companyName": "Yiwu Oupai Lighting Co., Ltd.",
    "verifiedStatus": "Audited Manufacturer",
    "platform": "1688 / Alibaba",
    "location": "Yiwu, Zhejiang, China",
    "businessType": "Direct Manufacturer",
    "yearEstablished": 2017,
    "rating": 4.9,
    "exportMarkets": ["North America", "Europe", "Australia"],
    "certifications": ["CE", "RoHS", "FCC", "UL Listed"],
    "trustScore": 98,
    "factoryAreaSqM": 12000,
    "employeeCount": "150-200"
  }
}
```
