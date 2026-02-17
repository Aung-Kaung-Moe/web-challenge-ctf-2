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

btn.addEventListener("click", async () => {
  try {
    const r = await fetch("/api/h1nt-message", { cache: "no-store" });
    const data = await r.json();

    if (toast) {
      toast.textContent = data.message || "No message";
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2500);
    } else {
      alert(data.message || "No message");
    }
  } catch (e) {
    if (toast) {
      toast.textContent = "Error loading message";
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 1500);
    } else {
      alert("Error loading message");
    }
  }
});


// Re-place on resize
window.addEventListener("resize", placeInitial);

placeInitial();
