const express = require("express");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Challenge config ----
const FLAG = process.env.FLAG || "flag{f4ke}";
const WINDOW_MS = 50;  
const REQUIRED = new Set(["f", "l", "a", "g"]);

// In-memory per-session storage:
// sessionId -> [{ letter, ts }]
const seen = new Map();

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

function pruneOld(arr, now) {
  // keep only last ~2 seconds of events for this session
  const cutoff = now - 2000;
  return arr.filter(e => e.ts >= cutoff);
}
function checkSameTime(arr) {
  // Use the most recent timestamp of each letter
  const last = { f: null, l: null, a: null, g: null };

  for (const e of arr) {
    if (REQUIRED.has(e.letter)) last[e.letter] = e.ts;
  }

  // must have all 4
  for (const k of ["f", "l", "a", "g"]) {
    if (last[k] === null) return false;
  }

  const times = Object.values(last);
  const min = Math.min(...times);
  const max = Math.max(...times);
  return (max - min) <= WINDOW_MS;
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


app.post("/api/press", (req, res) => {
  const sid = getSessionId(req, res);
  const letter = String(req.body?.button || "").toLowerCase();
  const now = Date.now();

  if (!REQUIRED.has(letter)) {
    return res.status(400).json({ received: null, flag: null });
  }

  let arr = seen.get(sid);
  if (!arr) {
    arr = [];
    seen.set(sid, arr);
  }

  // prune in-place
  const cutoff = now - 2000;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i].ts < cutoff) arr.splice(i, 1);
  }

  // append this event
  arr.push({ letter, ts: now });

  const ok = checkSameTime(arr);

  return res.json({
    received: letter,
    flag: ok ? FLAG : null
  });
});

app.post("/api/reset", (req, res) => {
  const sid = getSessionId(req, res);
  seen.delete(sid);
  res.json({ ok: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`CTF server on http://0.0.0.0:${PORT}`);
});
