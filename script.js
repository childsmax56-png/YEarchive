// Add your MP3 files here
const files = [
  {
    name: "Track 1.mp3",
    url: "https://your-cloudflare-url.com/track1.mp3"
  },
  {
    name: "Track 2.mp3",
    url: "https://your-cloudflare-url.com/track2.mp3"
  }
  // Add more...
];

const grid = document.getElementById("fileGrid");
const modal = document.getElementById("audioModal");
const closeModal = document.getElementById("closeModal");
const audioPlayer = document.getElementById("audioPlayer");
const trackTitle = document.getElementById("trackTitle");

// Build file grid
files.forEach(file => {
  const item = document.createElement("div");
  item.className = "file-item";
  item.innerHTML = `
    <div class="file-icon">🎵</div>
    <div class="filename">${file.name}</div>
  `;
  item.onclick = () => openPlayer(file);
  grid.appendChild(item);
});

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
