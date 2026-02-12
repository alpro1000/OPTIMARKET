import fetch from "node-fetch";
import { load } from "cheerio";
import { v4 as uuidv4 } from "uuid";
import db from "./database.js";

class ProductFetcher {
  constructor() {
    this.sources = {
      amazon: "https://www.amazon.de",
      heureka: "https://www.heureka.cz",
      aliexpress: "https://www.aliexpress.com"
    };
  }

  // === ПАРСИНГ AMAZON ===
  async fetchAmazonProducts(searchQuery, category) {
    try {
      console.log(`📦 Fetching Amazon: "${searchQuery}"`);

      const url = `${this.sources.amazon}/s?k=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      if (!response.ok) {
        console.warn(`⚠️  Amazon fetch failed: ${response.status}`);
        return [];
      }

      const html = await response.text();
      const $ = load(html);
      const products = [];

      $("[data-component-type='s-search-result']").each((index, element) => {
        if (products.length >= 10) return;

        const name = $(element).find("h2 a span").text().trim();
        const price = $(element)
          .find(".a-price-whole")
          .text()
          .replace(/[^0-9,]/g, "")
          .replace(",", ".");
        const rating = $(element).find(".a-icon-star-small span").text();
        const reviewCount = $(element)
          .find("[aria-label*='Bewertung']")
          .text()
          .match(/\d+/);
        const url = $(element).find("h2 a").attr("href");

        if (name && price) {
          products.push({
            id: uuidv4(),
            name,
            category,
            url: url
              ? `${this.sources.amazon}${url}`
              : this.sources.amazon,
            price_eur: parseFloat(price) || 0,
            brand: name.split(" ")[0],
            rating: parseFloat(rating) || 0,
            review_count: reviewCount ? parseInt(reviewCount[0]) : 0,
            image_url: $(element).find("img").attr("src"),
            source: "amazon.de",
            specs: {}
          });
        }
      });

      console.log(`✅ Found ${products.length} Amazon products`);
      return products;
    } catch (error) {
      console.error("❌ Amazon fetch error:", error.message);
      return [];
    }
  }

  // === ПАРСИНГ HEUREKA ===
  async fetchHeurekaProducts(searchQuery, category) {
    try {
      console.log(`📦 Fetching Heureka: "${searchQuery}"`);

      const url = `${this.sources.heureka}/search?q=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      if (!response.ok) {
        console.warn(`⚠️  Heureka fetch failed: ${response.status}`);
        return [];
      }

      const html = await response.text();
      const $ = load(html);
      const products = [];

      $(".product-item").each((index, element) => {
        if (products.length >= 10) return;

        const name = $(element).find(".product-name").text().trim();
        const price = $(element)
          .find(".product-price-value")
          .text()
          .replace(/[^0-9.,]/g, "");
        const rating = $(element)
          .find(".product-rating-average")
          .text()
          .match(/\d+\.?\d*/)?.[0];
        const reviewCount = $(element)
          .find(".product-reviews")
          .text()
          .match(/\d+/)?.[0];

        if (name && price) {
          products.push({
            id: uuidv4(),
            name,
            category,
            url:
              `${this.sources.heureka}${$(element).find("a").attr("href")}` ||
              this.sources.heureka,
            price_eur: parseFloat(price.replace(",", ".")) || 0,
            brand: name.split(" ")[0],
            rating: parseFloat(rating) || 0,
            review_count: parseInt(reviewCount) || 0,
            image_url: $(element).find("img").attr("src"),
            source: "heureka.cz",
            specs: {}
          });
        }
      });

      console.log(`✅ Found ${products.length} Heureka products`);
      return products;
    } catch (error) {
      console.error("❌ Heureka fetch error:", error.message);
      return [];
    }
  }

  // === ГЕНЕРАЦИЯ MOCK-ТОВАРОВ (для тестирования без скрейпинга) ===
  async generateMockProducts(category, count = 15) {
    console.log(
      `🎲 Generating ${count} mock products for category: ${category}`
    );

    const mockProducts = {
      drills: [
        { name: "Bosch GSR 18V-110", brand: "Bosch", basePrice: 249 },
        { name: "Makita DDF482Z", brand: "Makita", basePrice: 189 },
        { name: "DeWalt DCD792D2", brand: "DeWalt", basePrice: 159 },
        { name: "Festool TXS 3", brand: "Festool", basePrice: 399 },
        { name: "Metabo BS 18 LTX", brand: "Metabo", basePrice: 219 }
      ],
      headphones: [
        { name: "Sony WH-1000XM5", brand: "Sony", basePrice: 379 },
        { name: "Bose QC45", brand: "Bose", basePrice: 399 },
        { name: "Apple AirPods Max", brand: "Apple", basePrice: 549 },
        { name: "Sennheiser Momentum 4", brand: "Sennheiser", basePrice: 369 },
        { name: "JBL Tour One", brand: "JBL", basePrice: 299 }
      ],
      laptops: [
        { name: "Dell XPS 13", brand: "Dell", basePrice: 999 },
        { name: "MacBook Air M2", brand: "Apple", basePrice: 1199 },
        { name: "Lenovo ThinkPad X1", brand: "Lenovo", basePrice: 1099 },
        { name: "ASUS ZenBook 13", brand: "ASUS", basePrice: 799 },
        { name: "HP Pavilion 15", brand: "HP", basePrice: 699 }
      ],
      phones: [
        { name: "iPhone 15 Pro", brand: "Apple", basePrice: 999 },
        { name: "Samsung Galaxy S24", brand: "Samsung", basePrice: 899 },
        { name: "Google Pixel 8", brand: "Google", basePrice: 799 },
        { name: "OnePlus 12", brand: "OnePlus", basePrice: 699 },
        { name: "Xiaomi 14", brand: "Xiaomi", basePrice: 599 }
      ]
    };

    const categoryProducts = mockProducts[category] || mockProducts.drills;
    const products = [];

    for (let i = 0; i < Math.min(count, categoryProducts.length * 3); i++) {
      const template = categoryProducts[i % categoryProducts.length];
      const variance = 0.95 + Math.random() * 0.1;
      const priceVariance = 0.9 + Math.random() * 0.2;

      products.push({
        id: uuidv4(),
        name: `${template.name} (Variant ${Math.floor(i / categoryProducts.length) + 1})`,
        category,
        url: `https://example-store.com/product-${i}`,
        price_eur: Math.round(template.basePrice * priceVariance),
        brand: template.brand,
        rating: 3.5 + Math.random() * 1.5,
        review_count: Math.floor(50 + Math.random() * 450),
        image_url: `https://via.placeholder.com/150?text=${template.brand}`,
        source: "mock_generator",
        specs: {
          rating_distribution: {
            five_star: Math.floor(Math.random() * 100),
            four_star: Math.floor(Math.random() * 100),
            three_star: Math.floor(Math.random() * 50),
            two_star: Math.floor(Math.random() * 20),
            one_star: Math.floor(Math.random() * 10)
          }
        }
      });
    }

    return products;
  }

  // === ОСНОВНОЙ МЕТОД СБОРА ===
  async fetchProductsForCategory(category, useRealScraping = false) {
    console.log(`\n🔄 Started fetching products for category: ${category}`);

    if (useRealScraping) {
      const amazonProducts = await this.fetchAmazonProducts(
        category,
        category
      );
      const heurekaProducts = await this.fetchHeurekaProducts(
        category,
        category
      );

      return [...amazonProducts, ...heurekaProducts];
    } else {
      // По умолчанию используем mock для быстрого тестирования
      return await this.generateMockProducts(category, 20);
    }
  }

  // === СОХРАНЕНИЕ В БД ===
  async saveProductsToDB(products, category) {
    console.log(
      `💾 Saving ${products.length} products to database (category: ${category})`
    );

    let saved = 0;
    for (const product of products) {
      try {
        db.addProduct({
          ...product,
          category
        });
        saved++;
      } catch (error) {
        console.warn(`⚠️  Failed to save product: ${product.name}`, error.message);
      }
    }

    console.log(`✅ Saved ${saved}/${products.length} products`);
    return saved;
  }

  // === ПОЛНЫЙ ЦИКЛ СБОРА И СОХРАНЕНИЯ ===
  async fetchAndSave(category, useRealScraping = false) {
    try {
      const products = await this.fetchProductsForCategory(
        category,
        useRealScraping
      );
      const saved = await this.saveProductsToDB(products, category);
      return { success: true, count: saved, products };
    } catch (error) {
      console.error("❌ Fetch and save error:", error);
      return { success: false, count: 0, error: error.message };
    }
  }

  // === ОБНОВЛЕНИЕ КАТЕГОРИЙ ===
  async updateAllCategories() {
    const categories = ["drills", "headphones", "laptops", "phones"];

    for (const category of categories) {
      await this.fetchAndSave(category, false);
      console.log(`\n---\n`);
    }

    console.log("✅ All categories updated!");
  }
}

export default new ProductFetcher();
