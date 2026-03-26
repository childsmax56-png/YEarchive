// =========================
//      DARK MODE TOGGLE
// =========================
const themeToggle = document.getElementById("themeToggle");

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️";
}

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    themeToggle.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggle.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
});

// =========================
//      SPLASH / LOADING
// =========================
function hideLoadingScreen() {
  const loader = document.getElementById("loadingScreen");
  loader.classList.add("hidden");
  setTimeout(() => loader.remove(), 600);
}

// =========================
//   FETCH FILE KEYS
// =========================
async function getAllKeys() {
  const url = "https://yearchives-list.childsmax56.workers.dev";
  return await fetch(url).then(r => r.json());
}

// Build folder tree
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

// Flatten tree for search
function flattenTree(tree, prefix = "") {
  let results = [];
  for (const key in tree) {
    const value = tree[key];
    const fullPath = prefix ? `${prefix}/${key}` : key;
    if (value === null) results.push(fullPath);
    else results = results.concat(flattenTree(value, fullPath));
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

// Render folder
function renderFolder() {
  grid.innerHTML = "";
  let pointer = folderTree;
  currentPath.forEach(p => pointer = pointer[p]);

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

  for (const name in pointer) {
    const isFile = pointer[name] === null;
    const item = document.createElement("div");
    item.className = "file-item";

    if (isFile) {
      item.innerHTML = `<div class="file-icon">🎵</div><div class="filename">${name}</div>`;
      const fullPath = [...currentPath, name].join("/");
      const url = `https://yearchives.com/${encodeURIComponent(fullPath).replace(/%2F/g, "/")}`;
      item.onclick = () => openPlayer({ name, url });

    } else {
      let coverUrl = null;
      const folderPath = [...currentPath, name].join("/");
      const covers = ["cover.jpg","cover.png","folder.jpg","folder.png"];

      for (const cover of covers) {
        if (pointer[name] && pointer[name][cover] === null) {
          coverUrl = `https://yearchives.com/${encodeURIComponent(folderPath + "/" + cover).replace(/%2F/g, "/")}`;
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

// Search
function performSearch(query) {
  const allFiles = flattenTree(folderTree);
  const matches = allFiles.filter(path =>
    path.toLowerCase().includes(query.toLowerCase())
  );
  renderSearchResults(matches);
}

function renderSearchResults(results) {
  grid.innerHTML = "";
  if (results.length === 0) {
    grid.innerHTML = "<div>No results found.</div>";
    return;
  }
  results.forEach(fullPath => {
    const name = fullPath.split("/").pop();
    const url = `https://yearchives.com/${encodeURIComponent(fullPath).replace(/%2F/g, "/")}`;
    const item = document.createElement("div");
    item.className = "file-item";
    item.innerHTML = `<div class="file-icon">🎵</div><div class="filename">${name}</div>`;
    item.onclick = () => openPlayer({ name, url });
    grid.appendChild(item);
  });
}

searchInput.addEventListener("input", e => {
  const q = e.target.value.trim();
  q === "" ? renderFolder() : performSearch(q);
});

// Modal
function openPlayer(file) {
  trackTitle.textContent = file.name;
  audioPlayer.src = file.url;
  modal.style.display = "flex";
}

closeModal.onclick = () => {
  modal.style.display = "none";
  audioPlayer.pause();
};
// =========================
//      MINI PLAYER
// =========================

const miniPlayer = document.getElementById("miniPlayer");
const miniTitle = document.getElementById("miniTitle");
const miniPlayPause = document.getElementById("miniPlayPause");

// Sync mini-player with modal player
function updateMiniPlayer(name) {
  miniTitle.textContent = name;
  miniPlayer.classList.add("show");
  miniPlayer.classList.remove("hidden");
}

// Play/pause from mini-player
miniPlayPause.addEventListener("click", () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    miniPlayPause.textContent = "⏸";
  } else {
    audioPlayer.pause();
    miniPlayPause.textContent = "▶️";
  }
});

// Update icon when audio changes
audioPlayer.addEventListener("play", () => {
  miniPlayPause.textContent = "⏸";
});

audioPlayer.addEventListener("pause", () => {
  miniPlayPause.textContent = "▶️";
});
window.onclick = e => {
  if (e.target === modal) {
    modal.style.display = "none";
    audioPlayer.pause();
  }
};

// Init
(async () => {
  const keys = await getAllKeys();
  const mp3Paths = keys.filter(k => k.toLowerCase().includes(".mp3"));
  folderTree = buildFolderTree(mp3Paths);

  renderFolder();
  hideLoadingScreen();
})();
