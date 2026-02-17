const buttonsEl = document.getElementById("buttons");
const statusEl = document.getElementById("status");

function showJson(obj) {
  statusEl.textContent = JSON.stringify(obj, null, 2);
}

function setButtonsDisabled(disabled) {
  buttonsEl.querySelectorAll("button[data-letter]").forEach((b) => {
    b.disabled = disabled;
    b.setAttribute("aria-disabled", disabled ? "true" : "false");
  });
}

let busy = false;

async function send(letter) {
  if (busy) return;
  busy = true;
  setButtonsDisabled(true);

  // show immediate local UI update (always JSON)
  showJson({ received: letter, flag: null });

  try {
    const res = await fetch("/api/press", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ button: letter })
    });

    const data = await res.json();

    showJson({
      received: data.received ?? null,
      flag: data.flag ?? null
    });

    if (data.flag) alert(data.flag);
  } catch (e) {
    showJson({ received: null, flag: null, error: "network_error" });
  } finally {
    busy = false;
    setButtonsDisabled(false);
  }
}

buttonsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-letter]");
  if (!btn) return;
  if (btn.disabled) return;
  send(btn.dataset.letter);
});
