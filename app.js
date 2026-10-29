(() => {
  const catalogue = window.OMARI_CATALOG;
  const productGrid = document.querySelector("#product-grid");
  const categoryFilters = document.querySelector("#category-filters");
  const catalogueSearch = document.querySelector("#catalogue-search");
  const additionalGrid = document.querySelector("#additional-grid");
  const resultsLabel = document.querySelector("#catalogue-results");
  const clearSearch = document.querySelector("#clear-search");
  let activeCategory = "All";

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  const normalize = (value) => value.toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const additionalItemName = (item) => typeof item === "string" ? item : item.name;

  const setupContact = () => {
    const phone = catalogue.phone;
    const whatsappNumber = `254${phone.replace(/\D/g, "").replace(/^0/, "")}`;
    const email = catalogue.email;
    document.querySelector("#cover-image").src = catalogue.coverImage;
    document.querySelector("#whatsapp-float").href = `https://wa.me/${whatsappNumber}`;
    document.querySelector("#whatsapp-float").setAttribute("aria-label", `Chat with us on WhatsApp at ${phone}`);
    document.querySelector("#whatsapp-number").textContent = phone;

    for (const id of ["contact-phone"]) {
      const link = document.querySelector(`#${id}`);
      link.href = `tel:${phone.replace(/\D/g, "")}`;
      link.textContent = phone;
    }

    for (const id of ["contact-email"]) {
      const link = document.querySelector(`#${id}`);
      link.href = `mailto:${email}`;
      link.textContent = email;
    }

    document.querySelector("#contact-location").textContent = catalogue.location;
  };

  const renderFilters = () => {
    const categories = ["All", ...new Set(catalogue.products.map((product) => product.category))];
    categoryFilters.innerHTML = categories.map((category) => `
      <button class="filter-button" type="button" data-category="${escapeHtml(category)}" aria-pressed="${category === activeCategory}">
        ${escapeHtml(category)}
      </button>
    `).join("");

    categoryFilters.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        categoryFilters.querySelectorAll("button").forEach((filter) => {
          filter.setAttribute("aria-pressed", String(filter === button));
        });
        renderCatalogue();
      });
    });
  };

  const productCard = (product) => {
    const additionalBenefits = product.benefits.slice(1).map((benefit) => `<li>${escapeHtml(benefit)}</li>`).join("");
    const price = product.priceKES === undefined
      ? "Price on request"
      : `KES ${product.priceKES.toLocaleString("en-KE")}`;
    const summary = product.benefits[0] || "From the Omari Apothecary catalogue.";
    const notes = product.benefits.length > 1
      ? `<details class="product-notes">
          <summary>Read more benefits</summary>
          <ul>${additionalBenefits}</ul>
        </details>`
      : "";

    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <img class="product-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy">
          <span class="product-category">${escapeHtml(product.category)}</span>
          <span class="product-price-tag${product.priceKES === undefined ? " product-price-on-request" : ""}">${price}</span>
        </div>
        <div class="product-content">
          <div class="product-meta">
            <span>Catalogue · page ${product.cataloguePage}</span>
          </div>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="product-summary">${escapeHtml(summary)}</p>
          ${notes}
        </div>
      </article>
    `;
  };

  const renderCatalogue = () => {
    const query = normalize(catalogueSearch.value.trim());
    const filtered = catalogue.products.filter((product) => {
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      const searchable = normalize([product.name, product.category, ...product.benefits].join(" "));
      return matchesCategory && searchable.includes(query);
    });
    const additionalCount = catalogue.additionalCatalogue.reduce((count, group) => {
      const matchesCategory = normalize(group.category).includes(query);
      return count + (matchesCategory
        ? group.items.length
        : group.items.filter((item) => normalize(additionalItemName(item)).includes(query)).length);
    }, 0);

    resultsLabel.textContent = `${filtered.length} ${filtered.length === 1 ? "product" : "products"} · ${additionalCount} more catalogue ${additionalCount === 1 ? "item" : "items"}`;
    clearSearch.hidden = !catalogueSearch.value;
    productGrid.innerHTML = filtered.length
      ? filtered.map(productCard).join("")
      : additionalCount
        ? ""
        : `<div class="empty-state"><strong>No catalogue matches found</strong>Try another name, note or category.</div>`;
    additionalGrid.innerHTML = catalogue.additionalCatalogue.map((group) => {
      const matchesCategory = normalize(group.category).includes(query);
      const items = matchesCategory
        ? group.items
        : group.items.filter((item) => normalize(additionalItemName(item)).includes(query));
      return items.length ? `
        <article class="additional-card">
          <h3>${escapeHtml(group.category)}</h3>
          <ul class="chip-list">
            ${items.map((item) => `<li>${escapeHtml(additionalItemName(item))}</li>`).join("")}
          </ul>
        </article>
      ` : "";
    }).join("");
  };
  catalogueSearch.addEventListener("input", renderCatalogue);
  clearSearch.addEventListener("click", () => {
    catalogueSearch.value = "";
    renderCatalogue();
    catalogueSearch.focus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      catalogueSearch.focus();
    }
  });

  setupContact();
  renderFilters();
  renderCatalogue();
})();
