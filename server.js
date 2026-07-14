const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Challenge config ----
const FLAG = process.env.FLAG || "flag{f4ke}";
const HOLD_MS = 250;
const REQUIRED = new Set(["f", "l", "a", "g"]);

// In-memory per-session storage:
// sessionId -> [{ letter, wins, claimed }]
const pending = new Map();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { etag: false }));

// Very simple session cookie (no external libs)
function getSessionId(req, res) {
  const cookie = req.headers.cookie || "";
  const found = cookie
    .split(";")
    .map(s => s.trim())
    .find(s => s.startsWith("sid="));

  if (found) return found.slice("sid=".length);

  const sid = crypto.randomBytes(16).toString("hex");
  // httpOnly so solvers can't trivially set it from JS (still not secure; it's a CTF)
  res.setHeader("Set-Cookie", `sid=${sid}; Path=/; HttpOnly; SameSite=Lax`);
  return sid;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function markWinningPacket(arr, winner) {
  const byLetter = new Map();

  for (const entry of arr) {
    if (!entry.claimed && !byLetter.has(entry.letter)) {
      byLetter.set(entry.letter, entry);
    }
  }

  for (const letter of REQUIRED) {
    if (!byLetter.has(letter)) return;
  }

  for (const entry of byLetter.values()) {
    entry.claimed = true;
  }

  winner.wins = true;
}

// Routes
app.get("/", (req, res) => res.redirect("/challenge"));

app.get("/challenge", (req, res) => {
  // viewing source reveals /h1nt via HTML comment in the file
  res.sendFile(path.join(__dirname, "public", "challenge.html"));
});

app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.send(
`User-agent: *
Disallow: /h1nt
`
  );
});

app.get("/h1nt", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "h1nt.html"));
});

app.get("/api/h1nt-message", (req, res) => {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.json({
    message:
      "If the server checks that four letters arrive at the same time, you will get flag. Make sure you request with same session id for all four letters!"
  });
});


app.post("/api/press", async (req, res) => {
  const sid = getSessionId(req, res);
  const letter = String(req.body?.button || "").toLowerCase();

  if (!REQUIRED.has(letter)) {
    return res.status(400).json({ received: null, flag: null });
  }

  let arr = pending.get(sid);
  if (!arr) {
    arr = [];
    pending.set(sid, arr);
  }

  const entry = { letter, wins: false, claimed: false };
  arr.push(entry);
  markWinningPacket(arr, entry);
  await delay(HOLD_MS);

  const idx = arr.indexOf(entry);
  if (idx !== -1) arr.splice(idx, 1);
  if (arr.length === 0) pending.delete(sid);

  return res.json({
    received: letter,
    flag: entry.wins ? FLAG : null
  });
});

app.post("/api/reset", (req, res) => {
  const sid = getSessionId(req, res);
  pending.delete(sid);
  res.json({ ok: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CTF server on http://0.0.0.0:${PORT}`);
});
