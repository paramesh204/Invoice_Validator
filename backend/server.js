/**
 * Invoice Validator Backend
 * - Auth: Register / Login (JWT + bcrypt)
 * - Declarations: create, list, get
 * - Uploads: multi-PDF, OCR fallback, auto-match by invoice/declaration number
 * Logic flow: enter declaration -> upload PDFs -> if extracted invoice number == declaration -> APPROVED, else PENDING
 */
const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
let pdf = null;
try { pdf = require("pdf-poppler"); } catch (e) { console.warn("pdf-poppler unavailable, OCR fallback disabled."); }

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Prevent timeouts (OCR can be slow)
app.use((req, res, next) => { req.setTimeout(10 * 60 * 1000); res.setTimeout(10 * 60 * 1000); next(); });

// ---- Storage dirs ----
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

// ---- DB ----
const db = new sqlite3.Database(path.join(__dirname, "data.db"));
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS declarations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    declaration_number TEXT,
    vendor TEXT,
    amount REAL,
    invoice_date TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    declaration_id INTEGER,
    filename TEXT,
    original_name TEXT,
    extracted_number TEXT,
    extracted_vendor TEXT,
    extracted_amount REAL,
    extracted_date TEXT,
    ocr_text TEXT,
    status TEXT DEFAULT 'pending',
    match_score INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
});

// ---- Auth middleware ----
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: "Invalid token" });
  }
}

// ---- Auth routes ----
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be 6+ chars" });
  const hash = await bcrypt.hash(password, 10);
  db.run(
    `INSERT INTO users (name,email,password) VALUES (?,?,?)`,
    [name, email.toLowerCase(), hash],
    function (err) {
      if (err) return res.status(400).json({ error: "Email already registered" });
      const token = jwt.sign({ id: this.lastID, email, name }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: this.lastID, name, email } });
    }
  );
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing fields" });
  db.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase()], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  });
});

app.get("/api/auth/me", auth, (req, res) => res.json({ user: req.user }));

// ---- Stats ----
app.get("/api/stats", auth, (req, res) => {
  const out = {};
  db.get(`SELECT COUNT(*) c FROM declarations WHERE user_id=?`, [req.user.id], (e, r) => {
    out.declarations = r?.c || 0;
    db.get(`SELECT COUNT(*) c FROM documents d JOIN declarations dc ON d.declaration_id=dc.id WHERE dc.user_id=?`, [req.user.id], (e, r) => {
      out.documents = r?.c || 0;
      db.get(`SELECT COUNT(*) c FROM documents d JOIN declarations dc ON d.declaration_id=dc.id WHERE dc.user_id=? AND d.status='approved'`, [req.user.id], (e, r) => {
        out.approved = r?.c || 0;
        db.get(`SELECT COUNT(*) c FROM documents d JOIN declarations dc ON d.declaration_id=dc.id WHERE dc.user_id=? AND d.status='pending'`, [req.user.id], (e, r) => {
          out.pending = r?.c || 0;
          res.json(out);
        });
      });
    });
  });
});

// ---- Declarations ----
app.post("/api/declarations", auth, (req, res) => {
  const { declaration_number, vendor, amount, invoice_date, notes } = req.body || {};
  if (!declaration_number) return res.status(400).json({ error: "declaration_number required" });
  db.run(
    `INSERT INTO declarations (user_id,declaration_number,vendor,amount,invoice_date,notes) VALUES (?,?,?,?,?,?)`,
    [req.user.id, declaration_number.trim(), vendor || null, amount || null, invoice_date || null, notes || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get(`SELECT * FROM declarations WHERE id=?`, [this.lastID], (e, row) => res.json(row));
    }
  );
});

app.get("/api/declarations", auth, (req, res) => {
  db.all(`SELECT * FROM declarations WHERE user_id=? ORDER BY created_at DESC`, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/declarations/:id", auth, (req, res) => {
  db.get(`SELECT * FROM declarations WHERE id=? AND user_id=?`, [req.params.id, req.user.id], (err, dec) => {
    if (err || !dec) return res.status(404).json({ error: "Not found" });
    db.all(`SELECT * FROM documents WHERE declaration_id=? ORDER BY created_at DESC`, [dec.id], (e, docs) => {
      dec.documents = docs || [];
      res.json(dec);
    });
  });
});

// ---- Upload ----
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// ---- Extraction helpers ----
function extractFields(text) {
  const t = text || "";

  // 🔥 Stronger invoice detection (covers more formats)
  const invMatch =
    t.match(/Invoice\s*(No|Number)[:\s]*([A-Z0-9-]+)/i) ||
    t.match(/IN[-\s]?\d{6,}/i) ||
    t.match(/[A-Z]{2,}\d{6,}/);

  const orderMatch = t.match(/Order\s*(No|Number)[:\s]*([0-9-]+)/i);

  const dateMatch =
    t.match(/\d{2}[-/][A-Za-z]{3}[-/]\d{4}/) ||
    t.match(/\d{2}[-/]\d{2}[-/]\d{4}/);

  const vendorMatch =
    t.match(/Sold\s*By[:\s]+([^\n]+)/i) ||
    t.match(/Vendor[:\s]+([^\n]+)/i);

  const amountMatch =
    t.match(/Total[^\d₹]*₹?\s*([\d,]+\.\d{2})/i) ||
    t.match(/₹\s*([\d,]+\.\d{2})/);

  let amount = null;
  if (amountMatch) {
    const val = amountMatch[1] || amountMatch[0];
    amount = parseFloat(String(val).replace(/[₹,\s]/g, ""));
  }

  return {
    extracted_number: invMatch
      ? (invMatch[2] || invMatch[0]).trim()
      : null,

    extracted_order: orderMatch
      ? orderMatch[2]
      : null,

    extracted_vendor: vendorMatch
      ? vendorMatch[1].trim()
      : null,

    extracted_amount: amount,

    extracted_date: dateMatch
      ? dateMatch[0]
      : null,
  };
}

async function extractTextFromPdf(filePath) {
  // ✅ Try normal PDF parsing
  try {
    const buf = fs.readFileSync(filePath);
    const data = await pdfParse(buf);

    if (data.text && data.text.trim().length > 50) {
      return data.text;
    }

    console.warn("Weak PDF text → fallback OCR");
  } catch (e) {
    console.warn("pdf-parse failed:", e.message);
  }

  // 🔥 OCR fallback (for scanned PDFs)
  try {
    const result = await Tesseract.recognize(filePath, "eng", {
      logger: () => {}, // silence logs
    });

    return result.data.text || "";
  } catch (e) {
    console.warn("OCR failed:", e.message);
    return "";
  }
}

function normalize(str) {
  return String(str || "").replace(/\W/g, "").toLowerCase();
}

function scoreMatch(declaration, extracted) {
  let score = 0;

  const decNum = normalize(declaration.declaration_number);
  const extNum = normalize(extracted.extracted_number);

  // 🔥 Invoice match (most important)
  if (decNum && extNum) {
    if (decNum === extNum) score += 70;
    else if (decNum.includes(extNum) || extNum.includes(decNum)) score += 40;
  }

  // 🔥 Vendor match
  if (declaration.vendor && extracted.extracted_vendor) {
    const v1 = declaration.vendor.toLowerCase();
    const v2 = extracted.extracted_vendor.toLowerCase();

    if (v2.includes(v1.split(" ")[0])) score += 15;
  }

  // 🔥 Amount match
  if (declaration.amount && extracted.extracted_amount) {
    const diff = Math.abs(declaration.amount - extracted.extracted_amount);
    if (diff < 1) score += 15;
  }

  return Math.min(score, 100);
}

// ---- UPDATE Declaration ----
app.put("/api/declarations/:id", auth, (req, res) => {
  const { declaration_number, vendor, amount, invoice_date, notes, status } = req.body;

  db.run(
    `UPDATE declarations 
     SET declaration_number=?, vendor=?, amount=?, invoice_date=?, notes=?, status=? 
     WHERE id=? AND user_id=?`,
    [declaration_number, vendor, amount, invoice_date, notes, status, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ ok: true });
    }
  );
});

// ---- DELETE Declaration ----
// ---- DELETE Declaration (WITH DOCUMENT + FILE CLEANUP) ----
app.delete("/api/declarations/:id", auth, (req, res) => {
  const id = req.params.id;

  // Step 1: Get related documents
  db.all(
    `SELECT * FROM documents WHERE declaration_id=?`,
    [id],
    (err, docs) => {
      if (err) return res.status(500).json({ error: err.message });

      // Step 2: Delete files from uploads folder
      docs.forEach((doc) => {
        const filePath = path.join(UPLOAD_DIR, doc.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.warn("File delete error:", e.message);
          }
        }
      });

      // Step 3: Delete documents from DB
      db.run(
        `DELETE FROM documents WHERE declaration_id=?`,
        [id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });

          // Step 4: Delete declaration
          db.run(
            `DELETE FROM declarations WHERE id=? AND user_id=?`,
            [id, req.user.id],
            function (err3) {
              if (err3) return res.status(500).json({ error: err3.message });

              res.json({ ok: true });
            }
          );
        }
      );
    }
  );
});

app.post("/api/declarations/:id/upload", auth, upload.array("files", 10), async (req, res) => {
  const decId = req.params.id;
  db.get(`SELECT * FROM declarations WHERE id=? AND user_id=?`, [decId, req.user.id], async (err, dec) => {
    if (err || !dec) return res.status(404).json({ error: "Declaration not found" });
    const results = [];
    for (const file of req.files || []) {
      const text = await extractTextFromPdf(file.path);
      const fields = extractFields(text);
      const score = scoreMatch(dec, fields);
      const status = score >= 70 ? "approved" : "pending";
      await new Promise((resolve) => {
        db.run(
          `INSERT INTO documents (declaration_id,filename,original_name,extracted_number,extracted_vendor,extracted_amount,extracted_date,ocr_text,status,match_score)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [dec.id, file.filename, file.originalname, fields.extracted_number, fields.extracted_vendor, fields.extracted_amount, fields.extracted_date, text.slice(0, 5000), status, score],
          function () {
            results.push({ id: this.lastID, original_name: file.originalname, status, match_score: score, ...fields });
            resolve();
          }
        );
      });
    }
    // Roll up declaration status: approved if any doc approved
    const anyApproved = results.some((r) => r.status === "approved");
    db.run(`UPDATE declarations SET status=? WHERE id=?`, [anyApproved ? "approved" : "pending", dec.id]);
    res.json({ declaration_id: dec.id, results });
  });
});

// ---- Documents listing (audit) ----
app.get("/api/documents", auth, (req, res) => {
  db.all(
    `SELECT d.*, dc.declaration_number, dc.vendor as dec_vendor
     FROM documents d JOIN declarations dc ON d.declaration_id = dc.id
     WHERE dc.user_id=? ORDER BY d.created_at DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.patch("/api/documents/:id", auth, (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected", "pending"].includes(status)) return res.status(400).json({ error: "bad status" });
  db.run(`UPDATE documents SET status=? WHERE id=?`, [status, req.params.id], function () {
    res.json({ ok: true });
  });
});

app.get("/", (_, res) => res.json({ ok: true, name: "Invoice Validator API" }));

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
