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

const grid = document.getElementById("fileGrid");
const modal = document.getElementById("audioModal");
const closeModal = document.getElementById("closeModal");
const audioPlayer = document.getElementById("audioPlayer");
const trackTitle = document.getElementById("trackTitle");

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
      item.innerHTML = `<div class="file-icon">🎵</div><div class="filename">${name}</div>`;
      const fullPath = [...currentPath, name].join("/");
      const url = `https://yearchives.com/${encodeURIComponent(fullPath).replace(/%2F/g, "/")}`;
      item.onclick = () => openPlayer({ name, url });
    } else {
      item.innerHTML = `<div class="file-icon">📁</div><div class="filename">${name}</div>`;
      item.onclick = () => {
        currentPath.push(name);
        renderFolder();
      };
    }

    grid.appendChild(item);
  }
}

function open
