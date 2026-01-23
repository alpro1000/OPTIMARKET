const grid = document.querySelector("#product-grid");

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

fetch("data/products.json")
  .then((response) => response.json())
  .then((data) => {
    grid.innerHTML = data.items.map(renderCard).join("");
  })
  .catch(() => {
    grid.innerHTML =
      "<p class=\"section-text\">Не удалось загрузить подборку.</p>";
  });
