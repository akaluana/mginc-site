// TAB SWITCHING
document.querySelectorAll(".portfolio-tabs .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".portfolio-tabs .tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");

    const target = tab.dataset.tab;

    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.getElementById(target + "-tab").classList.add("active");
  });
});


async function loadPortfolio() {
  const grid = document.getElementById("portfolio-grid");
  const repo = "akaluana/mginc-site";

  // Fetch list of markdown files
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

    // Build thumbnail strip HTML
    const thumbs = data.images
      .map((img, i) => `<img src="${img}" class="thumb" data-index="${i}">`)
      .join("");

    // Create card element
    const card = document.createElement("div");
    card.className = "portfolio-card";

    card.innerHTML = `
      <div class="card-header">
        <h3>${data.title}</h3>
        <p>${data.summary}</p>
      </div>
    `;

    // Add click handler → open modal
    card.addEventListener("click", () => openModal(data, thumbs, htmlBody));

    grid.appendChild(card);
  }
}

function openModal(data, thumbs, htmlBody) {
  const modal = document.getElementById("portfolio-modal");
  const modalBody = modal.querySelector(".modal-body");

  modalBody.innerHTML = `
    <h2>${data.title}</h2>
    <p>${data.summary}</p>

    <div class="image-viewer">
      <button class="nav left">‹</button>
      <img class="main-image" src="${data.images[0]}">
      <button class="nav right">›</button>
    </div>

    <div class="thumbs">${thumbs}</div>

    <div class="details">${htmlBody}</div>
  `;

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Image navigation logic
  let currentIndex = 0;
  const mainImage = modalBody.querySelector(".main-image");

  function updateImage() {
    mainImage.src = data.images[currentIndex];
  }

  modalBody.querySelector(".nav.left").addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + data.images.length) % data.images.length;
    updateImage();
  });

  modalBody.querySelector(".nav.right").addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % data.images.length;
    updateImage();
  });

  modalBody.querySelectorAll(".thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      currentIndex = parseInt(thumb.dataset.index);
      updateImage();
    });
  });
}

// Close modal (X button)
document.querySelector(".modal-close").addEventListener("click", () => {
  closeModal();
});

// Close modal when clicking outside content
document.getElementById("portfolio-modal").addEventListener("click", (e) => {
  if (e.target.id === "portfolio-modal") {
    closeModal();
  }
});

function closeModal() {
  document.getElementById("portfolio-modal").classList.add("hidden");
  document.body.style.overflow = "";
}

async function loadGallery() {
  const gallery = document.getElementById("gallery-grid");
  const repo = "akaluana/mginc-site";

  const response = await fetch(`https://api.github.com/repos/${repo}/contents/images/portfolio`);
  const files = await response.json();

  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
  const projectImages = files.filter(f => imageExtensions.test(f.name));

  galleryImages = projectImages.map(img => img.download_url);

  projectImages.forEach((img, index) => {
    const el = document.createElement("img");
    el.src = img.download_url;
    el.addEventListener("click", () => openGalleryLightbox(index));
    gallery.appendChild(el);
  });
}


// GALLERY LIGHTBOX LOGIC
let galleryImages = [];
let galleryIndex = 0;

function openGalleryLightbox(index) {
  galleryIndex = index;
  const modal = document.getElementById("gallery-lightbox");
  const img = document.getElementById("gallery-lightbox-image");

  img.src = galleryImages[galleryIndex];
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeGalleryLightbox() {
  document.getElementById("gallery-lightbox").classList.add("hidden");
  document.body.style.overflow = "";
}

function galleryNext() {
  galleryIndex = (galleryIndex + 1) % galleryImages.length;
  document.getElementById("gallery-lightbox-image").src = galleryImages[galleryIndex];
}

function galleryPrev() {
  galleryIndex = (galleryIndex - 1 + galleryImages.length) % galleryImages.length;
  document.getElementById("gallery-lightbox-image").src = galleryImages[galleryIndex];
}

// Close on click outside
document.getElementById("gallery-lightbox").addEventListener("click", (e) => {
  if (e.target.id === "gallery-lightbox") closeGalleryLightbox();
});

// Close button
document.querySelector(".gallery-lightbox-close").addEventListener("click", closeGalleryLightbox);

// Nav buttons
document.querySelector(".gallery-nav.left").addEventListener("click", galleryPrev);
document.querySelector(".gallery-nav.right").addEventListener("click", galleryNext);

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  const modal = document.getElementById("gallery-lightbox");
  if (modal.classList.contains("hidden")) return;

  if (e.key === "ArrowRight") galleryNext();
  if (e.key === "ArrowLeft") galleryPrev();
  if (e.key === "Escape") closeGalleryLightbox();
});


loadGallery();
loadPortfolio();

