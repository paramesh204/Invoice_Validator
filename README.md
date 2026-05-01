# Invoice Validator (Express + React JS)

Amazon-style invoice validation workspace with OCR, auth, and responsive UI.

## Flow
1. **Register → Login** (JWT + bcrypt)
2. **Create Declaration** (declaration number + optional vendor/amount/date)
3. **Upload Scanned PDFs** (multi-file; pdf-parse → tesseract.js fallback)
4. **Auto-match**: extracted invoice # vs declaration #
   - ≥70% match → **APPROVED**
   - else → **PENDING** (manual audit)
5. **Audit**: search, filter, approve/reject

## Run

### Backend
```bash
cd backend
npm install
npm start          # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The frontend Vite dev server proxies `/api` and `/uploads` to the backend.

## Folder structure
```
backend/
  server.js          # Express + SQLite + OCR + JWT
  package.json
  uploads/           # stored PDFs (auto-created)
  data.db            # SQLite (auto-created)
frontend/
  index.html
  vite.config.js
  tailwind.config.js
  src/
    main.jsx
    App.jsx
    index.css
    components/
      AppShell.jsx
      ProtectedRoute.jsx
      StatusBadge.jsx
    pages/
      Login.jsx
      Register.jsx
      Dashboard.jsx
      CreateDeclaration.jsx
      UploadDocuments.jsx
      AuditPage.jsx
    utils/
      api.js
      auth.js
```

## Notes
- Fully responsive (mobile menu in AppShell).
- All 3 auth screens (Register, Login, Dashboard) work end-to-end.
- OCR fallback uses `pdf-poppler` + `tesseract.js`. On systems without poppler installed, only text-based PDFs (like the supplied `scanned_ocr_output*.pdf` samples that contain selectable text) will extract — which is enough for the demo.
- Set `JWT_SECRET=...` env var for production.
