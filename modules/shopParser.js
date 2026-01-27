// Parser для реального магазина через Awin Product Feed API
// modules/shopParser.js

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

/**
 * Получает товары через Awin Product Feed API (рекомендуется)
 * @param {Object} options - Опции запроса
 * @param {string} options.category - Категория товаров
 * @param {number} options.advertiserId - ID рекламодателя в Awin
 * @param {number} options.limit - Максимальное количество товаров
 * @returns {Promise<Array>} Массив товаров
 */
export async function fetchAwinProducts({ category, advertiserId, limit = 100 }) {
  const AWIN_API_KEY = process.env.AWIN_API_KEY;

  if (!AWIN_API_KEY) {
    console.warn('⚠️  AWIN_API_KEY not set, using fallback method');
    return fetchAwinProductsFallback({ category, limit });
  }

  try {
    console.log(`🔍 Fetching products from Awin API: category=${category}, advertiser=${advertiserId}`);

    // Awin Product Feed API endpoint
    const url = `https://productdata.awin.com/datafeed/download/apikey/${AWIN_API_KEY}/language/en/fid/${advertiserId}/columns/aw_product_id,product_name,aw_deep_link,search_price,brand_name,aw_image_url,description,category_name,in_stock,specifications/format/json/delimiter/%7C/compression/gzip/`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AWIN_API_KEY}`,
        'User-Agent': 'OPTIMARKET/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Awin API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Преобразуем Awin формат в наш формат
    const products = (data || [])
      .filter(item => {
        // Фильтруем по категории если указана
        if (category) {
          const catLower = (item.category_name || '').toLowerCase();
          return catLower.includes(category.toLowerCase());
        }
        return true;
      })
      .slice(0, limit)
      .map((item, index) => ({
        id: item.aw_product_id || `awin_${index}`,
        product: item.product_name || '',
        price: formatPrice(item.search_price),
        brand: item.brand_name || '',
        image: item.aw_image_url || '',
        url: item.aw_deep_link || '', // Уже содержит affiliate tracking
        specs: parseSpecifications(item.specifications),
        description: item.description || '',
        in_stock: item.in_stock === '1' || item.in_stock === 'true',
        category: item.category_name || category,
        source: 'awin'
      }));

    console.log(`✅ Fetched ${products.length} products from Awin API`);
    return products;

  } catch (error) {
    console.error(`❌ Awin API error:`, error.message);
    console.log('⚠️  Falling back to alternative method...');
    return fetchAwinProductsFallback({ category, limit });
  }
}

/**
 * Fallback: использует demo данные если API недоступен
 */
function fetchAwinProductsFallback({ category, limit = 100 }) {
  console.log(`📦 Using fallback demo data for category: ${category}`);

  // Demo данные по категориям
  const demoData = {
    'drills': [
      {
        id: 'drill_eco_1',
        product: 'Einhell TE-CD 18/2 Li-Ion',
        price: '€99.99',
        brand: 'Einhell',
        image: 'https://via.placeholder.com/300x300?text=Einhell+Drill',
        url: 'https://example.com/einhell-te-cd',
        specs: { voltage: '18V', torque: '42Nm', battery: '2.0Ah', weight: '1.2kg' },
        description: 'Compact cordless drill for home DIY projects',
        in_stock: true,
        category: 'Power Tools',
        source: 'demo'
      },
      {
        id: 'drill_opt_1',
        product: 'Makita DDF484RTJ 18V',
        price: '€169.00',
        brand: 'Makita',
        image: 'https://via.placeholder.com/300x300?text=Makita+Drill',
        url: 'https://example.com/makita-ddf484',
        specs: { voltage: '18V', torque: '54Nm', battery: '5.0Ah', weight: '1.7kg' },
        description: 'Professional-grade brushless drill driver',
        in_stock: true,
        category: 'Power Tools',
        source: 'demo'
      },
      {
        id: 'drill_pre_1',
        product: 'Bosch GSR 18V-110 C Professional',
        price: '€249.00',
        brand: 'Bosch',
        image: 'https://via.placeholder.com/300x300?text=Bosch+Drill',
        url: 'https://example.com/bosch-gsr-18v',
        specs: { voltage: '18V', torque: '110Nm', battery: '5.0Ah', weight: '2.0kg' },
        description: 'Top-tier professional drill with connectivity',
        in_stock: true,
        category: 'Power Tools',
        source: 'demo'
      }
    ],
    'headphones': [
      {
        id: 'hp_eco_1',
        product: 'Anker Soundcore Q20',
        price: '€59.99',
        brand: 'Soundcore',
        image: 'https://via.placeholder.com/300x300?text=Soundcore+Q20',
        url: 'https://example.com/soundcore-q20',
        specs: { anc: 'Hybrid ANC', battery: '40h', driver: '40mm', weight: '235g' },
        description: 'Budget ANC headphones with excellent battery',
        in_stock: true,
        category: 'Audio',
        source: 'demo'
      },
      {
        id: 'hp_opt_1',
        product: 'Sony WH-1000XM4',
        price: '€279.00',
        brand: 'Sony',
        image: 'https://via.placeholder.com/300x300?text=Sony+XM4',
        url: 'https://example.com/sony-xm4',
        specs: { anc: 'Industry-leading ANC', battery: '30h', driver: '40mm', weight: '254g' },
        description: 'Premium noise cancelling with superb sound',
        in_stock: true,
        category: 'Audio',
        source: 'demo'
      },
      {
        id: 'hp_pre_1',
        product: 'Apple AirPods Max',
        price: '€579.00',
        brand: 'Apple',
        image: 'https://via.placeholder.com/300x300?text=AirPods+Max',
        url: 'https://example.com/airpods-max',
        specs: { anc: 'Active ANC', battery: '20h', driver: '40mm', weight: '384g' },
        description: 'Premium over-ear with Apple ecosystem integration',
        in_stock: true,
        category: 'Audio',
        source: 'demo'
      }
    ]
  };

  const products = demoData[category] || [];
  console.log(`✅ Loaded ${products.length} demo products for ${category}`);
  return products.slice(0, limit);
}

/**
 * Вспомогательные функции
 */
function formatPrice(price) {
  if (!price) return '€0.00';
  const num = parseFloat(price);
  return isNaN(num) ? price : `€${num.toFixed(2)}`;
}

function parseSpecifications(specsString) {
  if (!specsString) return {};

  try {
    // Awin specs часто в формате "key:value|key:value"
    const specs = {};
    specsString.split('|').forEach(pair => {
      const [key, value] = pair.split(':');
      if (key && value) {
        specs[key.trim()] = value.trim();
      }
    });
    return specs;
  } catch {
    return {};
  }
}

// ============================================================================
// LEGACY: HTML парсинг (оставлено для обратной совместимости)
// ============================================================================

/**
 * [LEGACY] Парсит каталог магазина через HTML (не рекомендуется)
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
