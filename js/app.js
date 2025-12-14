function search() {
  const q = document.getElementById("search").value.trim();
  if (!q) return;

  const url = `https://www.youtube.com/embed/videoseries?list=search&query=${encodeURIComponent(q)}`;

  document.getElementById("player").innerHTML = `
    <iframe
      width="100%"
      height="400"
      src="${url}"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen>
    </iframe>
  `;
}
