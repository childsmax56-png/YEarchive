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

// =========================
//   MP3 COVER EXTRACTION
// =========================
function extractCoverFromMP3(url, callback) {
  // jsmediatags must be loaded via CDN in HTML
  new jsmediatags.Reader(url)
    .setTagsToRead(["picture"])
    .read({
      onSuccess: tag => {
        const pic = tag.tags.picture;
        if (!pic) return callback(null);

        const base64 = `data:${pic.format};base64,${btoa(
          pic.data.reduce((data, byte) => data + String.fromCharCode(byte), "")
        )}`;

        callback(base64);
      },
      onError: () => callback(null)
    });
}

// =========================
//      MINI PLAYER
// =========================
const miniPlayer = document.getElementById("miniPlayer");
const miniTitle = document.getElementById("miniTitle");
const miniCover = document.getElementById("miniCover");
const miniPlayPause = document.getElementById("miniPlayPause");
const miniPrev = document.getElementById("miniPrev");
const miniNext = document.getElementById("miniNext");
const miniProgressBar = document.getElementById("miniProgressBar");

let playQueue = [];
let currentIndex = 0;

function updateMiniPlayer(file) {
  miniTitle.textContent = file.name;
  miniPlayer.classList.add("show");
  miniPlayer.classList.remove("hidden");

  if (!playQueue.find(f => f.url === file.url)) {
    playQueue.push(file);
    currentIndex = playQueue.length - 1;
  }
}

// =========================
//      RENDER FOLDER
// =========================
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
      // Folder: default icon first
      item.innerHTML = `<div class="file-icon">📁</div><div class="filename">${name}</div>`;
      const folderPath = [...currentPath, name].join("/");
      const folderObj = pointer[name];

      // Try to use first MP3 inside this folder for cover
      const mp3s = Object.keys(folderObj).filter(f => f.toLowerCase().endsWith(".mp3"));
      if (mp3s.length > 0) {
        const firstMP3Path = `${folderPath}/${mp3s[0]}`;
        const mp3Url = `https://yearchives.com/${encodeURIComponent(firstMP3Path).replace(/%2F/g, "/")}`;

        extractCoverFromMP3(mp3Url, cover => {
          if (cover) {
            item.innerHTML = `<img src="${cover}" class="album-cover"><div class="filename">${name}</div>`;
          }
        });
      }

      item.onclick = () => {
        currentPath.push(name);
        renderFolder();
      };
    }

    grid.appendChild(item);
  }
}

// =========================
//         SEARCH
// =========================
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

// =========================
//       OPEN PLAYER
// =========================
function openPlayer(file) {
  trackTitle.textContent = file.name;
  audioPlayer.src = file.url;
  modal.style.display = "flex";

  // Extract embedded album art for mini-player + modal
  extractCoverFromMP3(file.url, cover => {
    if (cover) {
      miniCover.src = cover;
    } else {
      miniCover.removeAttribute("src"); // fallback to gray bg
    }
  });

  updateMiniPlayer(file);
  miniPlayPause.textContent = "⏸";
  audioPlayer.play();
}

closeModal.onclick = () => {
  modal.style.display = "none";
  audioPlayer.pause();
};

// =========================
//   MINI PLAYER CONTROLS
// =========================
miniPlayPause.addEventListener("click", () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    miniPlayPause.textContent = "⏸";
  } else {
    audioPlayer.pause();
    miniPlayPause.textContent = "▶️";
  }
});

miniNext.addEventListener("click", () => {
  if (currentIndex < playQueue.length - 1) {
    currentIndex++;
    openPlayer(playQueue[currentIndex]);
  }
});

miniPrev.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    openPlayer(playQueue[currentIndex]);
  }
});

audioPlayer.addEventListener("timeupdate", () => {
  if (!audioPlayer.duration) return;
  const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  miniProgressBar.style.setProperty("--progress", `${percent}%`);
});

audioPlayer.addEventListener("play", () => {
  miniPlayPause.textContent = "⏸";
});

audioPlayer.addEventListener("pause", () => {
  miniPlayPause.textContent = "▶️";
});

// Close modal by clicking outside
window.onclick = e => {
  if (e.target === modal) {
    modal.style.display = "none";
    audioPlayer.pause();
  }
};

// =========================
//          INIT
// =========================
(async () => {
  const keys = await getAllKeys();
  const mp3Paths = keys.filter(k => k.toLowerCase().includes(".mp3"));
  folderTree = buildFolderTree(mp3Paths);

  renderFolder();
  hideLoadingScreen();
})();
