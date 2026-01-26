const grid = document.querySelector("#product-grid");
const aiStatus = document.querySelector("#ai-status");
const aiResults = document.querySelector("#ai-results");
const runMvpButton = document.querySelector("#run-mvp");

const setAiStatus = (message) => {
  if (!aiStatus) return;
  aiStatus.textContent = message;
};

const levelDescriptions = {
  Premium: "Максимальная надёжность и ресурс, для интенсивной работы.",
  Optimum: "Лучший баланс цены и мощности для большинства задач.",
  Economy: "Бюджетный выбор с честными ограничениями."
};

const formatSpecs = (specs) =>
  Object.entries(specs)
    .map(
      ([label, value]) =>
        `<span><strong>${label}</strong><span>${value}</span></span>`
    )
    .join("");

const renderCard = (item) => {
  const pros = item.pros.map((pro) => `<li>${pro}</li>`).join("");
  const cons = item.cons.map((con) => `<li>${con}</li>`).join("");

  return `
    <article class="product-card">
      <div class="product-tier">${item.level}</div>
      <h3>${item.product}</h3>
      <p class="product-price">${item.price}</p>
      <p class="section-text">${item.summary}</p>
      <div class="product-specs">
        ${formatSpecs(item.specs)}
        <span><strong>Скоринг</strong><span>${item.score}</span></span>
      </div>
      <div class="product-notes">
        <strong>LLM‑вывод:</strong> ${levelDescriptions[item.level]}
      </div>
      <div class="product-specs">
        <span><strong>Плюсы</strong></span>
        <ul>${pros}</ul>
        <span><strong>Минусы</strong></span>
        <ul>${cons}</ul>
      </div>
      <div class="product-actions">
        <a class="primary-button" href="${item.affiliate_link}">Купить</a>
        <button class="secondary-button">Сравнить</button>
      </div>
    </article>
  `;
};

const renderAiCard = ({ level, product, price, reason, signals, valueScore }) => `
  <article class="ai-card">
    <div class="product-tier">${level}</div>
    <h4>${product}</h4>
    <p class="product-price">${price}</p>
    <p class="section-text">${reason}</p>
    <small>Value score: ${valueScore} · Trust: ${signals.trust_score.toFixed(
      2
    )}</small>
    <small>Sentiment: +${signals.positive_mentions} / -${
  signals.negative_mentions
}</small>
  </article>
`;

const getCategoryName = () =>
  document.querySelector(".selection h2")?.textContent?.trim();

const resolveItems = (data) => {
  if (Array.isArray(data)) {
    const categoryName = getCategoryName();
    const category =
      data.find((entry) => entry.category === categoryName) || data[0];
    return category?.items ?? [];
  }

  return data?.items ?? [];
};

fetch("data/products.json")
  .then((response) => response.json())
  .then((data) => {
    const items = resolveItems(data);

    if (!items.length) {
      grid.innerHTML =
        "<p class=\"section-text\">Подборка пока недоступна.</p>";
      return;
    }

    grid.innerHTML = items.map(renderCard).join("");
  })
  .catch(() => {
    grid.innerHTML =
      "<p class=\"section-text\">Не удалось загрузить подборку.</p>";
  });

const selectionLabels = {
  economy: "Economy",
  optimum: "Optimum",
  premium: "Premium"
};

const renderAiResults = (payload) => {
  if (!payload || !payload.selection || !payload.products) {
    setAiStatus("AI‑отчёт пока недоступен. Запустите AI‑подбор.");
    if (aiResults) {
      aiResults.innerHTML = "";
    }
    return;
  }

  const productsById = new Map(
    payload.products.map((product) => [product.id, product])
  );

  const cards = Object.entries(payload.selection).map(([key, entry]) => {
    const product = productsById.get(entry.id);
    if (!product) return "";
    return renderAiCard({
      level: selectionLabels[key] || key,
      product: product.name,
      price: `${product.price}€`,
      reason: entry.reason,
      signals: product.signals,
      valueScore: product.value_score
    });
  });

  if (aiResults) {
    aiResults.innerHTML = cards.join("");
  }
  setAiStatus(`AI‑подбор обновлён: ${new Date(
    payload.generated_at
  ).toLocaleString("ru-RU")}`);
};

const fetchAiOutput = async () => {
  try {
    const response = await fetch("/api/mvp-output");
    if (!response.ok) throw new Error("No AI output");
    const payload = await response.json();
    renderAiResults(payload);
  } catch (error) {
    setAiStatus(
      "AI‑отчёт не найден. Запустите AI‑подбор, чтобы получить данные."
    );
  }
};

const runMvp = async () => {
  if (!runMvpButton) return;
  runMvpButton.disabled = true;
  runMvpButton.textContent = "Запуск...";
  setAiStatus("AI‑подбор запущен. Ожидаем результаты...");

  try {
    const response = await fetch("/api/run-mvp", { method: "POST" });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Не удалось запустить AI‑подбор.");
    }

    setAiStatus(
      "AI‑подбор выполняется. Перезагрузим данные через несколько секунд..."
    );
    setTimeout(fetchAiOutput, 4000);
  } catch (error) {
    setAiStatus(error.message);
  } finally {
    runMvpButton.disabled = false;
    runMvpButton.textContent = "Запустить AI‑подбор";
  }
};

if (runMvpButton) {
  runMvpButton.addEventListener("click", runMvp);
}

fetchAiOutput();
