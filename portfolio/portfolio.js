async function loadPortfolio() {
  const grid = document.getElementById("portfolio-grid");
  const repo = "akaluana/mginc-site";

  const response = await fetch(`https://api.github.com/repos/${repo}/contents/portfolio`);
  const files = await response.json();
  const mdFiles = files.filter(f => f.name.endsWith(".md"));

  for (const file of mdFiles) {
    const raw = await fetch(file.download_url).then(r => r.text());

    // Extract front matter
    const fm = raw.match(/---([\s\S]*?)---/);
    const frontMatter = fm ? fm[1] : "";
    const body = raw.replace(fm[0], "").trim();

    const data = {};
    let parsingImages = false;

    frontMatter.split("\n").forEach(line => {
      const trimmed = line.trim();

      if (trimmed.startsWith("images:")) {
        data.images = [];
        parsingImages = true;
        return;
      }

      if (parsingImages && trimmed.startsWith("-")) {
        data.images.push(trimmed.replace("-", "").trim().replace(/"/g, ""));
        return;
      }

      if (parsingImages && !trimmed.startsWith("-")) {
        parsingImages = false;
      }

      const [key, ...rest] = trimmed.split(":");
      if (key && rest.length) {
        data[key.trim()] = rest.join(":").trim().replace(/"/g, "");
      }
    });

    const htmlBody = marked.parse(body);

    // Create card
    const card = document.createElement("div");
    card.className = "portfolio-card compact";

    // Build thumbnail strip
    const thumbs = data.images
      .map((img, i) => `<img src="${img}" class="thumb" data-index="${i}">`)
      .join("");

    // Build card HTML
    card.innerHTML = `
      <div class="card-header">
        <div class="header-text">
          <h3>${data.title}</h3>
          <p>${data.summary}</p>
        </div>
        <div class="chevron"></div>
      </div>


      <div class="card-expanded">
        <div class="image-viewer">
          <button class="nav left">‹</button>
          <img class="main-image" src="${data.images[0]}">
          <button class="nav right">›</button>
        </div>

        <div class="thumbs">${thumbs}</div>

        <div class="details">${htmlBody}</div>
      </div>
    `;

    // Expand/collapse behavior
    card.querySelector(".card-header").addEventListener("click", () => {
      card.classList.toggle("compact");
    });

    // Image navigation
    let currentIndex = 0;

    const mainImage = card.querySelector(".main-image");

    function updateImage() {
      mainImage.src = data.images[currentIndex];
    }

    card.querySelector(".nav.left").addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + data.images.length) % data.images.length;
      updateImage();
    });

    card.querySelector(".nav.right").addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % data.images.length;
      updateImage();
    });

    // Thumbnail click
    card.querySelectorAll(".thumb").forEach(thumb => {
      thumb.addEventListener("click", () => {
        currentIndex = parseInt(thumb.dataset.index);
        updateImage();
      });
    });

    grid.appendChild(card);
  }
}

loadPortfolio();
