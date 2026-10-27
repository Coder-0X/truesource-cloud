# ☁️ TrueSource Cloud

> **Visual Vector Reverse Search Engine & Landed-Cost Arbitrage SaaS API** — Powering direct factory sourcing from 1688, AliExpress, and Chinese wholesale manufacturers with real-time landed-cost economics.

[![Node.js v22+](https://img.shields.io/badge/Node.js-v22+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Zero External Dependencies](https://img.shields.io/badge/Dependencies-Zero%20Native-06B6D4?style=flat-square)](package.json)
[![REST API Ready](https://img.shields.io/badge/API-REST%20v1.0.0-8B5CF6?style=flat-square)](API_DOCS.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=flat-square)](LICENSE)

---

## ⚡ The Problem
E-commerce sellers, dropshippers, and retail procurement teams frequently struggle with two critical barriers:
1. **Reverse-Image Sourcing Barriers**: Client-side browser extensions cannot bypass Chinese anti-scraping firewalls or run intensive multi-dimensional vector searches across millions of wholesale SKUs without draining browser memory.
2. **Hidden Landed Cost Surprises**: Discovering a $3.50 wholesale factory item is deceptive if international air cargo ($4.50), domestic China couriers ($0.85), import tariffs ($0.25), and FX payment fees ($1.15) push the real landed cost over $10.25, crushing anticipated margins.

---

## 🛡️ What TrueSource Cloud Provides

TrueSource Cloud is a standalone cloud microservice and developer SaaS providing:

- 📷 **Visual Vector Feature Extraction**: Converts product photos or search queries into deterministic 64-dimensional normalized vector embeddings.
- 📐 **Cosine Similarity Matching**: Ranks catalog items by vector proximity ($\cos \theta = \frac{A \cdot B}{\|A\| \|B\|}$), instantly connecting retail products with direct 1688 and AliExpress factory manufacturers.
- 💰 **Commercial Landed-Cost Engine**: Implements the international freight landed-cost equation:
  $$\text{Landed Cost} = P_{\text{factory}} + C_{\text{domestic}} + C_{\text{freight}} + T_{\text{tariff}} + F_{\text{processing}}$$
  Providing exact net profit margins, markup multipliers (e.g. `7.6x`), and commercial viability ratings.
- 🏢 **Supplier Trust Verification**: Profiles suppliers by factory audit status, certifications (CE, RoHS, FCC, UL), export markets, and historical trust scores.
- 🌐 **Interactive Web Playground**: Clean, modern web UI (`http://localhost:3000`) for drag-and-drop visual search and instant arbitrage modeling.

---

## 🚀 Quickstart & Installation

TrueSource Cloud is built with **zero external runtime dependencies**, executing natively on Node.js:

```bash
# 1. Clone the repository
git clone https://github.com/Coder-0X/truesource-cloud.git
cd truesource-cloud

# 2. Start the HTTP server & interactive playground
npm start
```

Open `http://localhost:3000` in your browser to access the interactive sourcing dashboard!

### Run Automated Tests
```bash
npm test
```

---

## ⚡ REST API Reference

### 1. Visual Vector Search
```bash
curl -X POST http://localhost:3000/api/v1/search/visual \
  -H "Content-Type: application/json" \
  -d '{
    "queryText": "Nordic Dimmable Candle Warmer Lamp",
    "limit": 5,
    "minSimilarity": 0.40
  }'
```

### 2. Landed-Cost Arbitrage Calculator
```bash
curl -X POST http://localhost:3000/api/v1/arbitrage/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "retailPriceUsd": 29.99,
    "factoryPriceCny": 28.50,
    "weightGrams": 750,
    "shippingMethod": "air_standard"
  }'
```

### 3. Supplier Profile Lookup
```bash
curl http://localhost:3000/api/v1/suppliers/sup_yiwu_091
```

### 4. Health Check
```bash
curl http://localhost:3000/api/v1/health
```

---

## 📄 License
MIT License. Created by [Coder-0X](https://github.com/Coder-0X).
