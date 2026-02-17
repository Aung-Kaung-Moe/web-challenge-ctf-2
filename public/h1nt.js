const btn = document.getElementById("getHintBtn");
const toast = document.getElementById("toast");

function placeInitial() {
  const pad = 16;
  const bw = btn.offsetWidth;
  const bh = btn.offsetHeight;

  const x = Math.max(pad, window.innerWidth - bw - 80);
  const y = Math.floor(Math.random() * Math.max(pad, window.innerHeight - bh - pad));

  btn.style.left = x + "px";
  btn.style.top  = y + "px";
}

function moveRandom() {
  const pad = 16;
  const bw = btn.offsetWidth;
  const bh = btn.offsetHeight;

  const maxX = Math.max(pad, window.innerWidth - bw - pad);
  const maxY = Math.max(pad, window.innerHeight - bh - pad);

  const x = Math.floor(Math.random() * maxX);
  const y = Math.floor(Math.random() * maxY);

  btn.style.left = x + "px";
  btn.style.top  = y + "px";
}

// Runs away on hover to be unclickable
btn.addEventListener("mouseenter", moveRandom);
btn.addEventListener("mousemove", moveRandom);

btn.addEventListener("click", () => {
  alert("If the server checks that four letters arrive at the same time, you will get flag. Make sure you request with same session id for all four letters!");
});


// Re-place on resize
window.addEventListener("resize", placeInitial);

placeInitial();
