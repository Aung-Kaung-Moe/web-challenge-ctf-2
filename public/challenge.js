(() => {
  const buttons = Array.from(document.querySelectorAll("[data-letter]"));
  const statusEl = document.getElementById("status");

  // Cooldown prevents manual multi-click winning.
  // Scripted race still works by calling /api/press directly.
  const COOLDOWN_MS = 700;

  let locked = false;
  let lockTimer = null;

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function setLocked(on) {
    locked = on;
    for (const b of buttons) b.disabled = on;
    if (on) {
      clearTimeout(lockTimer);
      lockTimer = setTimeout(() => setLocked(false), COOLDOWN_MS);
    }
  }

  async function press(letter) {
    // If locked, ignore clicks (prevents manual win)
    if (locked) return;

    // Lock immediately on first click
    setLocked(true);

    try {
      const r = await fetch("/api/press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ button: letter })
      });

      const data = await r.json();

      // keep your minimal response UI
      if (data.flag) {
        setStatus(`✅ FLAG: ${data.flag}`);
      } else {
        setStatus(`received: ${data.received} | flag: null`);
      }
    } catch (e) {
      setStatus("Network error");
    }
  }

  for (const b of buttons) {
    b.addEventListener("click", () => press(b.dataset.letter));
  }

  setStatus("Press a button…");
})();
