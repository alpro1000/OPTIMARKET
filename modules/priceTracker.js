import cron from "node-cron";
import db from "./database.js";
import productFetcher from "./productFetcher.js";

class PriceTracker {
  constructor() {
    this.isRunning = false;
    this.cronJobs = [];
    this.notificationCallbacks = {
      email: null,
      telegram: null,
      webhook: null
    };
  }

  /**
   * Регистрирует callback для отправки уведомлений
   */
  onNotification(channel, callback) {
    this.notificationCallbacks[channel] = callback;
  }

  /**
   * Отправляет уведомление через зарегистрированный канал
   */
  async notify(channel, alert) {
    const callback = this.notificationCallbacks[channel];
    if (callback) {
      try {
        await callback(alert);
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }
  }

  /**
   * Проверяет цены для одного продукта
   */
  async checkProductPrice(productId) {
    try {
      const product = db.getProductById(productId);
      if (!product) {
        console.warn(`Product ${productId} not found`);
        return null;
      }

      // Получаем последнюю записанную цену
      const lastPrice = db.getLatestPrice(productId);
      const currentPrice = product.price_eur;

      if (!lastPrice) {
        // Первая запись
        db.addPriceRecord(productId, currentPrice, currentPrice);
        return { change: 0, alert: null };
      }

      const priceChange = ((currentPrice - lastPrice.price_eur) / lastPrice.price_eur) * 100;

      // Добавляем новую запись в историю
      db.addPriceRecord(productId, currentPrice, lastPrice.price_eur);

      // Проверяем подписки на этот товар
      const subscriptions = db.getActiveSubscriptions(productId);

      if (subscriptions.length === 0) {
        return { change: priceChange, alert: null };
      }

      // Обрабатываем каждую подписку
      const alerts = [];
      for (const subscription of subscriptions) {
        const priceDropPercentage = Math.abs(priceChange);

        // Если цена упала ниже порога подписки - отправляем alert
        if (currentPrice <= subscription.threshold && priceChange < 0) {
          const alert = {
            subscription_id: subscription.id,
            user_id: subscription.user_id,
            product_id: productId,
            product_name: product.name,
            previous_price: lastPrice.price_eur,
            current_price: currentPrice,
            price_drop_percent: Math.round(priceDropPercentage * 10) / 10,
            saved_amount: Math.round((lastPrice.price_eur - currentPrice) * 100) / 100,
            alert_threshold: subscription.threshold,
            timestamp: new Date().toISOString(),
            affiliate_url: product.url
          };

          alerts.push(alert);
          db.markAlertAsSent(subscription.id);

          // Отправляем через регистрированные каналы
          await this.notify("email", alert);
          await this.notify("telegram", alert);
          await this.notify("webhook", alert);
        }
      }

      return { change: priceChange, alerts };
    } catch (error) {
      console.error(`Error checking price for ${productId}:`, error);
      return null;
    }
  }

  /**
   * Проверяет все активные подписки и отправляет alert'ы
   */
  async checkAllPrices() {
    console.log("\n🔔 [Price Tracker] Running price check at", new Date().toISOString());

    try {
      // Получаем все продукты
      const categories = ["drills", "headphones", "laptops", "phones"];
      let totalChecked = 0;
      let totalAlerts = 0;

      for (const category of categories) {
        const products = db.getProductsByCategory(category, 1000);

        for (const product of products) {
          const result = await this.checkProductPrice(product.id);
          totalChecked++;

          if (result?.alerts?.length > 0) {
            totalAlerts += result.alerts.length;
            console.log(
              `  💸 Alert: ${product.name} - ${result.alerts.length} notifications sent`
            );
          }
        }
      }

      console.log(`✅ Price check completed. Checked: ${totalChecked}, Alerts: ${totalAlerts}`);
    } catch (error) {
      console.error("❌ Error in checkAllPrices:", error);
    }
  }

  /**
   * Обновляет товары из веб-источников (для demo)
   * В production использовать реальные API
   */
  async updateProductPricesFromWeb() {
    console.log("\n🔄 [Update] Fetching fresh product data...");

    try {
      const categories = ["drills", "headphones", "laptops", "phones"];

      for (const category of categories) {
        // Генерируем новые mock-цены (в production - парсим реальные)
        const products = await productFetcher.generateMockProducts(category, 20);

        for (const product of products) {
          const existing = db.getProductById(product.id);

          if (existing) {
            // Обновляем цену с небольшой вариацией
            const newPrice = existing.price_eur * (0.95 + Math.random() * 0.1);
            db.updateProductPrice(product.id, newPrice);
          }
        }

        console.log(`✅ Updated prices for ${category}`);
      }
    } catch (error) {
      console.error("❌ Error updating prices:", error);
    }
  }

  /**
   * Запускает Cron Job для проверки цен
   * Параметр: cron expression для расписания
   */
  startPriceCheckSchedule(cronExpression = "0 */4 * * *") {
    if (this.isRunning) {
      console.warn("⚠️  Price check schedule already running");
      return;
    }

    console.log(`🚀 Starting price check schedule on schedule`);

    const job = cron.schedule(cronExpression, async () => {
      await this.checkAllPrices();
    });

    this.cronJobs.push(job);
    this.isRunning = true;
  }

  /**
   * Запускает Cron Job для обновления продуктов
   * Параметр: cron expression для расписания
   */
  startProductUpdateSchedule(cronExpression = "0 0 * * *") {
    console.log(`🚀 Starting product update schedule on schedule`);

    const job = cron.schedule(cronExpression, async () => {
      await this.updateProductPricesFromWeb();
    });

    this.cronJobs.push(job);
  }

  /**
   * Останавливает все Cron Jobs
   */
  stopSchedules() {
    console.log("⛔ Stopping all price tracker schedules");

    for (const job of this.cronJobs) {
      job.stop();
    }

    this.cronJobs = [];
    this.isRunning = false;
  }

  /**
   * Возвращает историю цен для продукта
   */
  getPriceHistory(productId) {
    return db.getPriceHistory(productId);
  }

  /**
   * Подписывает пользователя на alert при падении цены
   */
  subscribeToAlert(userId, productId, thresholdPrice) {
    try {
      db.subscribeToPriceAlert(userId, productId, thresholdPrice);
      console.log(
        `✅ User ${userId} subscribed to alerts for ${productId} at €${thresholdPrice}`
      );
      return true;
    } catch (error) {
      console.error("Error subscribing to alert:", error);
      return false;
    }
  }

  /**
   * Отписывает пользователя от уведомлений
   */
  unsubscribeFromAlert(userId, productId) {
    try {
      db.unsubscribeFromAlert(userId, productId);
      console.log(`✅ User ${userId} unsubscribed from alerts for ${productId}`);
      return true;
    } catch (error) {
      console.error("Error unsubscribing from alert:", error);
      return false;
    }
  }

  /**
   * Генерирует отчёт о изменениях цен
   */
  generatePriceReport(category) {
    const products = db.getProductsByCategory(category, 100);

    const report = products.map((product) => {
      const priceHistory = this.getPriceHistory(product.id);

      if (priceHistory.length < 2) {
        return null;
      }

      const earliest = priceHistory[priceHistory.length - 1];
      const latest = priceHistory[0];
      const priceChange = latest.price_eur - earliest.price_eur;
      const priceChangePercent = (priceChange / earliest.price_eur) * 100;

      return {
        product_id: product.id,
        product_name: product.name,
        price_change: Math.round(priceChange * 100) / 100,
        price_change_percent: Math.round(priceChangePercent * 10) / 10,
        earliest_price: earliest.price_eur,
        latest_price: latest.price_eur,
        checked_count: priceHistory.length
      };
    }).filter(Boolean);

    // Сортируем по величине падения цены
    report.sort((a, b) => a.price_change - b.price_change);

    return {
      category,
      generated_at: new Date().toISOString(),
      products_with_history: report.length,
      top_drops: report.slice(0, 10),
      top_increases: report.slice(-10).reverse()
    };
  }
}

export default new PriceTracker();
