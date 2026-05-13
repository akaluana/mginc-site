async function loadPortfolio() {
  const grid = document.getElementById("portfolio-grid");

  const repo = "akaluana/mginc-site";

  // Fetch directory listing from GitHub API
  const response = await fetch(`https://api.github.com/repos/${repo}/contents/portfolio`);
  const files = await response.json();

  const mdFiles = files.filter(f => f.name.endsWith(".md"));

  for (const file of mdFiles) {
    const raw = await fetch(file.download_url).then(r => r.text());

    // Extract front matter
    const frontMatterMatch = raw.match(/---([\s\S]*?)---/);
    const frontMatter = frontMatterMatch ? frontMatterMatch[1] : "";
    const body = raw.replace(frontMatterMatch[0], "").trim();

    const data = {};
    let parsingImages = false;

    frontMatter.split("\n").forEach(line => {
      const trimmed = line.trim();

      // Detect start of images array
      if (trimmed.startsWith("images:")) {
        data.images = [];
        parsingImages = true;
        return;
      }

      // Parse array items
      if (parsingImages && trimmed.startsWith("-")) {
        const img = trimmed.replace("-", "").trim().replace(/"/g, "");
        data.images.push(img);
        return;
      }

      // Stop parsing images when another key appears
      if (parsingImages && !trimmed.startsWith("-")) {
        parsingImages = false;
      }

      // Parse normal key/value pairs
      const [key, ...rest] = trimmed.split(":");
      if (key && rest.length) {
        data[key.trim()] = rest.join(":").trim().replace(/"/g, "");
      }
    });

    // Use first image or fallback
    const firstImage = data.images?.[0] || "/images/default.jpg";

    // Build card
    const card = document.createElement("div");
    card.className = "portfolio-card";

    card.innerHTML = `
      <img src="${firstImage}" alt="${data.title}">
      <div class="content">
        <h3>${data.title}</h3>
        <p>${data.summary}</p>
      </div>
    `;

    grid.appendChild(card);
  }
}

loadPortfolio();
