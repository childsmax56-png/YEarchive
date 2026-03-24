// Add your MP3 files here
const files = [
  {
 name: "Anyway_V1.mp3",
    url: "https://pub-1a8fe616ae624b4faf.a22b54ba231c4.r2.dev/808s%20and%20heartbreak/808s%20%26%20Heartbreak/Anyway_V1.mp3"
  },
  {
    name: "city in the sky.mp3",
    url: "https://yearchives.com/Yandhi%20Era/Yandhi/10%20City%20In%20The%20Sky.mp3"
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

