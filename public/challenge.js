const buttonsEl = document.getElementById("buttons");
const statusEl = document.getElementById("status");

function showJson(obj) {
  statusEl.textContent = JSON.stringify(obj, null, 2);
}

async function send(letter) {
  showJson({ received: letter, flag: null });

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

  if (data.flag) {
    alert(data.flag);
  }
}

buttonsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-letter]");
  if (!btn) return;
  send(btn.dataset.letter);
});
