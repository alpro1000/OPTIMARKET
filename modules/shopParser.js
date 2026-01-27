// Parser для реального магазина (например, Tire shop из Awin)
// modules/shopParser.js

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * Парсит каталог магазина и возвращает товары
 * @param {string} shopUrl - URL магазина
 * @param {string} category - Категория (tires, tools, etc)
 * @returns {Array} Массив товаров
 */
export async function parseShopCatalog(shopUrl, category = 'tires') {
  console.log(`🔍 Parsing shop: ${shopUrl}`);

  try {
    const response = await fetch(shopUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OptimartketBot/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const products = [];

    // Пример парсинга (структура зависит от сайта)
    $('.product-item, .product-card, article.product').each((i, element) => {
      const $el = $(element);

      const product = {
        id: $el.attr('data-product-id') || `product_${i}`,
        product: $el.find('.product-name, h3, .title').first().text().trim(),
        price: extractPrice($el),
        brand: $el.find('.brand, .manufacturer').first().text().trim(),
        image: $el.find('img').first().attr('src'),
        url: $el.find('a').first().attr('href'),
        specs: extractSpecs($el),
        in_stock: !$el.find('.out-of-stock, .unavailable').length
      };

      // Пропускаем если нет названия или цены
      if (product.product && product.price) {
        products.push(product);
      }
    });

    console.log(`✅ Parsed ${products.length} products from ${shopUrl}`);
    return products;

  } catch (error) {
    console.error(`❌ Failed to parse ${shopUrl}:`, error.message);
    return [];
  }
}

/**
 * Извлекает цену из элемента
 */
function extractPrice($element) {
  const priceText = $element.find('.price, .product-price, [class*="price"]')
    .first()
    .text()
    .trim();

  // Извлекаем число из текста (например: "145,99 €" → 145.99)
  const match = priceText.match(/[\d,\.]+/);
  if (match) {
    const price = parseFloat(match[0].replace(',', '.'));
    return `€${price.toFixed(2)}`;
  }

  return null;
}

/**
 * Извлекает характеристики из элемента
 */
function extractSpecs($element) {
  const specs = {};

  $element.find('.spec, .attribute, [class*="spec"]').each((i, spec) => {
    const $spec = cheerio.load(spec);
    const label = $spec('.label, .key, dt').text().trim();
    const value = $spec('.value, dd').text().trim();

    if (label && value) {
      specs[label] = value;
    }
  });

  return specs;
}

/**
 * Парсит конкретные магазины из Awin
 */
export async function parseAwinShop(shopName, category) {
  const shopConfigs = {
    // Пример: Tire Shop
    'tire-shop': {
      url: 'https://example-tire-shop.com/catalog',
      selectors: {
        product: '.tire-item',
        name: '.tire-name',
        price: '.tire-price',
        brand: '.tire-brand',
        specs: {
          size: '.tire-size',
          season: '.tire-season',
          speed: '.speed-rating',
          load: '.load-index'
        }
      }
    },
    // Добавьте другие магазины
  };

  const config = shopConfigs[shopName];
  if (!config) {
    throw new Error(`Unknown shop: ${shopName}`);
  }

  return parseShopCatalog(config.url, category);
}

/**
 * Пример использования с пагинацией
 */
export async function parseMultiplePages(baseUrl, maxPages = 5) {
  const allProducts = [];

  for (let page = 1; page <= maxPages; page++) {
    console.log(`📄 Parsing page ${page}/${maxPages}...`);

    const pageUrl = `${baseUrl}?page=${page}`;
    const products = await parseShopCatalog(pageUrl);

    if (products.length === 0) {
      console.log('No more products found, stopping pagination');
      break;
    }

    allProducts.push(...products);

    // Rate limiting (уважаем сервер)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return allProducts;
}

/**
 * Добавляет affiliate ссылки (после подключения к Awin)
 */
export function addAffiliateLinks(products, awinPublisherId, awinMerchantId) {
  return products.map(product => ({
    ...product,
    affiliate_link: generateAwinLink(
      product.url,
      awinPublisherId,
      awinMerchantId
    )
  }));
}

/**
 * Генерирует Awin affiliate ссылку
 */
function generateAwinLink(productUrl, publisherId, merchantId) {
  // Awin link format
  const clickRef = Date.now(); // Уникальный reference для отслеживания
  return `https://www.awin1.com/cread.php?awinmid=${merchantId}&awinaffid=${publisherId}&ued=${encodeURIComponent(productUrl)}&clickref=${clickRef}`;
}

// Export mock data для тестирования без парсинга
export function generateMockProducts(category, count = 10) {
  const mockData = {
    tires: [
      {
        id: 'tire_1',
        product: 'Michelin Pilot Sport 4',
        price: '€145.00',
        brand: 'Michelin',
        specs: { size: '225/45 R17', season: 'Summer', speed: 'Y', load: '94' },
        url: 'https://example.com/michelin-pilot-sport-4',
        in_stock: true
      },
      // ... больше товаров
    ]
  };

  return (mockData[category] || []).slice(0, count);
}
