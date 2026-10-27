/**
 * TrueSource Cloud - Factory Catalog & Supplier Store
 * Indexed database of verified Chinese wholesale suppliers and product vectors.
 */

const { extractFeatureVector } = require('./visual-engine');

const RAW_SUPPLIERS = [
  {
    id: 'sup_yiwu_091',
    companyName: 'Yiwu Oupai Lighting Co., Ltd.',
    verifiedStatus: 'Audited Manufacturer',
    platform: '1688 / Alibaba',
    location: 'Yiwu, Zhejiang, China',
    businessType: 'Direct Manufacturer',
    yearEstablished: 2017,
    rating: 4.9,
    exportMarkets: ['North America', 'Europe', 'Australia'],
    certifications: ['CE', 'RoHS', 'FCC', 'UL Listed'],
    trustScore: 98,
    factoryAreaSqM: 12000,
    employeeCount: '150-200'
  },
  {
    id: 'sup_shenzhen_104',
    companyName: 'Shenzhen Aoto Optoelectronics Co., Ltd.',
    verifiedStatus: 'Gold Supplier',
    platform: '1688 / Alibaba',
    location: 'Baoan, Shenzhen, Guangdong, China',
    businessType: 'OEM / ODM Electronics',
    yearEstablished: 2015,
    rating: 4.8,
    exportMarkets: ['North America', 'Japan', 'South Korea'],
    certifications: ['CE', 'RoHS', 'KC'],
    trustScore: 94,
    factoryAreaSqM: 8500,
    employeeCount: '80-120'
  },
  {
    id: 'sup_cixi_218',
    companyName: 'Cixi Feike Small Home Appliances Factory',
    verifiedStatus: 'Audited Manufacturer',
    platform: '1688 Wholesale',
    location: 'Cixi, Ningbo, Zhejiang, China',
    businessType: 'Direct Manufacturer',
    yearEstablished: 2012,
    rating: 4.9,
    exportMarkets: ['North America', 'Europe', 'Southeast Asia'],
    certifications: ['CE', 'GS', 'CB', 'RoHS'],
    trustScore: 97,
    factoryAreaSqM: 15000,
    employeeCount: '200-300'
  },
  {
    id: 'sup_dongguan_330',
    companyName: 'Dongguan Jiekang Ultrasonic Cleaning Equipment Co.',
    verifiedStatus: 'Verified Pro Supplier',
    platform: '1688 / Alibaba',
    location: 'Dongguan, Guangdong, China',
    businessType: 'Direct Manufacturer',
    yearEstablished: 2014,
    rating: 4.8,
    exportMarkets: ['North America', 'Europe', 'Middle East'],
    certifications: ['CE', 'FCC', 'RoHS'],
    trustScore: 95,
    factoryAreaSqM: 6000,
    employeeCount: '50-100'
  },
  {
    id: 'sup_yongkang_412',
    companyName: 'Yongkang King Cookware Manufacturing Co.',
    verifiedStatus: 'Audited Factory',
    platform: '1688 Wholesale',
    location: 'Yongkang, Jinhua, Zhejiang, China',
    businessType: 'Direct Manufacturer',
    yearEstablished: 2010,
    rating: 4.9,
    exportMarkets: ['North America', 'Europe', 'Japan'],
    certifications: ['FDA', 'LFGB', 'ISO9001'],
    trustScore: 99,
    factoryAreaSqM: 25000,
    employeeCount: '350-500'
  }
];

const RAW_CATALOG = [
  {
    id: 'prod_1688_001',
    title: 'Nordic Dimmable Candle Warmer Lamp with Timer',
    category: 'home-goods',
    platform: '1688 Wholesale',
    supplierId: 'sup_yiwu_091',
    supplier: 'Yiwu Oupai Lighting Co., Ltd.',
    location: 'Yiwu, Zhejiang',
    priceCny: 28.50,
    moq: 2,
    weightGrams: 750,
    rating: 4.9,
    yearsActive: 8,
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-5613589b3590?w=600&auto=format&fit=crop',
    directUrl: 'https://s.1688.com/youyuan.html?keywords=%E8%9E%8D%E8%9C%A1%E7%81%AF',
    visualSignature: 'candle warmer lamp wood metal base dimmable halogen bulb nordic minimal'
  },
  {
    id: 'prod_1688_002',
    title: 'Rainbow Sunset Projection Atmosphere Night Light',
    category: 'electronics',
    platform: '1688 Wholesale',
    supplierId: 'sup_shenzhen_104',
    supplier: 'Shenzhen Aoto Optoelectronics Co., Ltd.',
    location: 'Shenzhen, Guangdong',
    priceCny: 12.80,
    moq: 5,
    weightGrams: 320,
    rating: 4.8,
    yearsActive: 10,
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop',
    directUrl: 'https://s.1688.com/youyuan.html?keywords=%E6%97%A5%E8%90%BD%E7%81%AF',
    visualSignature: 'sunset lamp projection halo atmosphere usb 360 rotation led lens'
  },
  {
    id: 'prod_1688_003',
    title: 'Rechargeable Electric Fabric Shaver & Lint Remover',
    category: 'home-appliances',
    platform: '1688 Wholesale',
    supplierId: 'sup_cixi_218',
    supplier: 'Cixi Feike Small Home Appliances Factory',
    location: 'Ningbo, Zhejiang',
    priceCny: 14.50,
    moq: 10,
    weightGrams: 280,
    rating: 4.9,
    yearsActive: 13,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop',
    directUrl: 'https://s.1688.com/youyuan.html?keywords=%E6%AF%9B%E7%90%83%E4%BF%AE%E5%89%AA%E5%99%A8',
    visualSignature: 'fabric shaver lint remover usb rechargeable 6-leaf stainless blade ergonomic'
  },
  {
    id: 'prod_1688_004',
    title: '45kHz Portable Ultrasonic Jewelry & Eyeglass Cleaner',
    category: 'electronics',
    platform: '1688 Wholesale',
    supplierId: 'sup_dongguan_330',
    supplier: 'Dongguan Jiekang Ultrasonic Cleaning Equipment Co.',
    location: 'Dongguan, Guangdong',
    priceCny: 26.00,
    moq: 5,
    weightGrams: 420,
    rating: 4.8,
    yearsActive: 11,
    imageUrl: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop',
    directUrl: 'https://s.1688.com/youyuan.html?keywords=%E8%B6%85%E5%A3%B0%E6%B3%A2%E6%B8%85%E6%B4%97%E6%9C%BA',
    visualSignature: 'ultrasonic cleaner 45khz stainless tank glasses watch jewelry dental retainer'
  },
  {
    id: 'prod_1688_005',
    title: 'Ceramic Non-Stick Butter Warmer & Mini Saucepan with Wood Handle',
    category: 'kitchen',
    platform: '1688 Wholesale',
    supplierId: 'sup_yongkang_412',
    supplier: 'Yongkang King Cookware Manufacturing Co.',
    location: 'Jinhua, Zhejiang',
    priceCny: 18.20,
    moq: 10,
    weightGrams: 550,
    rating: 4.9,
    yearsActive: 15,
    imageUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop',
    directUrl: 'https://s.1688.com/youyuan.html?keywords=%E5%A5%B6%E9%94%85+%E4%B8%8D%E7%B2%98%E9%94%85',
    visualSignature: 'ceramic milk pot mini saucepan wood handle induction gas spout nonstick'
  }
];

// Initialize indexed catalog with computed feature vectors
const INDEXED_CATALOG = RAW_CATALOG.map(item => {
  const seedString = `${item.title} ${item.category} ${item.visualSignature}`;
  const featureVector = extractFeatureVector(seedString);
  const priceUsd = +(item.priceCny / 7.23).toFixed(2);

  return {
    ...item,
    priceUsd,
    featureVector
  };
});

function getCatalog() {
  return INDEXED_CATALOG;
}

function getSupplierById(supplierId) {
  return RAW_SUPPLIERS.find(s => s.id === supplierId) || null;
}

function getAllSuppliers() {
  return RAW_SUPPLIERS;
}

module.exports = {
  getCatalog,
  getSupplierById,
  getAllSuppliers
};
