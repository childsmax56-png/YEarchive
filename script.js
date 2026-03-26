// Fetch all file keys from your Worker
async function getAllKeys() {
  const url = "https://yearchives-list.childsmax56.workers.dev";
  return await fetch(url).then(r => r.json());
}

// Build folder tree from paths
function buildFolderTree(paths) {
  const tree = {};

  paths.forEach(path => {
    const parts = path.split("/");
    let current = tree;

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = index === parts.length - 1 ? null : {};
      }
      current = current[part];
    });
  });

  return tree;
}

// Flatten folder tree for search
function flattenTree(tree, prefix = "") {
  let results = [];

  for (const key in tree) {
    const value = tree[key];
    const fullPath = prefix ? `${prefix}/${key}` : key;

    if (value === null) {
      results.push(fullPath); // file
    } else {
      results = results.concat(flattenTree(value, fullPath)); // folder
    }
  }

  return results;
}

const grid = document.getElementById("fileGrid");
const modal = document.getElementById("audioModal");
const closeModal = document.getElementById("closeModal");
const audioPlayer = document.getElementById("audioPlayer");
const trackTitle = document.getElementById("trackTitle");
const searchInput = document.getElementById("searchInput");

let folderTree = {};
let currentPath = [];

// Render current folder contents
function renderFolder() {
  grid.innerHTML = "";

  let pointer = folderTree;
  currentPath.forEach(p => pointer = pointer[p]);

  // Back button
  if (currentPath.length > 0) {
    const back = document.createElement("div");
    back.className = "file-item";
    back.innerHTML = `<div class="file-icon">⬅️</div><div class="filename">Back</div>`;
    back.onclick = () => {
      currentPath.pop();
      renderFolder();
    };
    grid.appendChild(back);
  }

  // Render folders + files
  for (const name in pointer) {
    const isFile = pointer[name] === null;

    const item = document.createElement("div");
    item.className = "file-item";

    if (isFile) {
      // File
      item.innerHTML = `<div class="file-icon">🎵</div><div class="filename">${name}</div>`;
      const fullPath = [...currentPath, name].join("/");
      const url = `https://yearchives.com/${encodeURIComponent(fullPath).replace(/%2F/g, "/")}`;
      item.onclick = () => openPlayer({ name, url });

    } else {
      // Folder — detect album cover
      let coverUrl = null;
      const folderPath = [...currentPath, name].join("/");

      const possibleCovers = [
        "cover.jpg", "cover.png",
        "folder.jpg", "folder.png"
      ];

      for (const cover of possibleCovers) {
        if (pointer[name] && pointer[name][cover] === null) {
          const encoded = `https://yearchives.com/${encodeURIComponent(folderPath + "/" + cover).replace(/%2F/g, "/")}`;
          coverUrl = encoded;
          break;
        }
      }

      item.innerHTML = coverUrl
        ? `<img src="${coverUrl}" class="album-cover"><div class="filename">${name}</div>`
        : `<div class="file-icon">📁</div><div class="filename">${name}</div>`;

      item.onclick = () => {
        currentPath.push(name);
        renderFolder();
      };
    }

    grid.appendChild(item);
  }
}

// Search logic
function performSearch(query) {
  const allFiles = flattenTree(folderTree);

  const matches = allFiles.filter(path =>
    path.toLowerCase().includes(query.toLowerCase())
  );

  renderSearchResults(matches);
}

// Render search results
function renderSearchResults(results) {
  grid.innerHTML = "";

  if (results.length === 0) {
    grid.innerHTML = "<div>No results found.</div>";
    return;
  }

  results.forEach(fullPath => {
    const parts = fullPath.split("/");
    const name = parts.pop();
    const url = `https://yearchives.com/${encodeURIComponent(fullPath).replace(/%2F/g, "/")}`;

    const item = document.createElement("div");
    item.className = "file-item";
    item.innerHTML = `<div class="file-icon">🎵</div><div class="filename">${name}</div>`;
    item.onclick = () => openPlayer({ name, url });

    grid.appendChild(item);
  });
}

// Search bar listener
searchInput.addEventListener("input", e => {
  const query = e.target.value.trim();

  if (query === "") {
    renderFolder();
  } else {
    performSearch(query);
  }
});

// Audio modal
function openPlayer(file) {
  trackTitle.textContent = file.name;
  audioPlayer.src = file.url;
  modal.style.display = "flex";
}

closeModal.onclick = () => {
  modal.style.display = "none";
  audioPlayer.pause();
};

window.onclick = e => {
  if (e.target === modal) {
    modal.style.display = "none";
    audioPlayer.pause();
  }
};

// Initialize
(async () => {
  const keys = await getAllKeys();
  const mp3Paths = keys.filter(k => k.toLowerCase().includes(".mp3"));
  folderTree = buildFolderTree(mp3Paths);
  renderFolder();
})();
