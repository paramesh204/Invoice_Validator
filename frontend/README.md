# 📄 Invoice Validation System

The **Invoice Validation System** is a full-stack web application that verifies invoice authenticity by matching user-entered invoice details with stored scanned invoice records.

It helps businesses **prevent fraud, automate validation, and improve document verification efficiency**.

---

# 🚀 Features

## 🔍 Invoice Verification

* Validate invoices using:

  * Invoice Number
  * Invoice Date
* Instant validation results

## 📂 Scanned Invoice Matching

* Matches user input with stored **scanned PDF invoices**
* Uses OCR (Optical Character Recognition) for extraction

## ✅ Match / Mismatch Detection

* ✔ Displays invoice details when matched
* ❌ Shows clear error messages for mismatches
* Provides match score for validation accuracy

## 📥 PDF Invoice Download

* Download verified invoices
* Maintains scanned document format

## 🔐 Secure Backend APIs

* Token-based authentication (JWT)
* Input validation & error handling
* Protected API routes

## 🎨 Modern UI

* Responsive design (mobile + desktop)
* Toast notifications
* Loading indicators & feedback

## 🌙 Optional UI Enhancements

* Dark mode support
* Animated success indicators
* Progress tracking UI

---

# 🛠️ Tech Stack

## Frontend

* ⚛️ React.js
* 🎨 Bootstrap / Custom CSS
* 🔗 Axios (API calls)

## Backend

* 🟢 Node.js
* 🚀 Express.js
* 🔁 RESTful APIs

## Database

* 🗄️ MySQL

## Other Tools

* 📄 PDF Processing (pdf-parse)
* 🔍 OCR (Tesseract.js)
* ⚙️ Environment Configuration (.env)
* 📁 Modular Folder Structure

---

# 📂 Project Structure

```
invoice-validator/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── utils/
│   └── App.jsx
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── uploads/
│   ├── utils/
│   └── server.js
│
├── database/
│   └── schema.sql
│
└── README.md
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/invoice-validator.git
cd invoice-validator
```

---

## 2️⃣ Backend Setup

```bash
cd backend
npm install
```

### Create `.env` file

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=invoice_db
JWT_SECRET=your_secret_key
```

### Start Backend

```bash
npm start
```

---

## 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

---

# 🔄 Workflow

1. User creates a **declaration**
2. Uploads scanned invoice PDF
3. System:

   * Extracts text (OCR)
   * Parses invoice details
4. Matches against stored data
5. Displays:

   * ✅ Match → show invoice details
   * ❌ Mismatch → show error

---

# 🧠 Core Logic

### Invoice Matching Logic

* Invoice Number → Highest priority
* Vendor Name → Partial match
* Amount → Tolerance-based match
* Date → Format-normalized comparison

### Duplicate Prevention

* One invoice = one validation
* Duplicate PDFs are blocked before processing

---

# 📊 Example Output

| Field          | Value        |
| -------------- | ------------ |
| Invoice Number | IN-845739261 |
| Vendor         | Amazon       |
| Amount         | ₹2,499.00    |
| Match Score    | 85%          |
| Status         | ✅ Approved   |

---

# 🔐 Security Features

* JWT Authentication
* Input Sanitization
* File Type Validation (PDF only)
* Duplicate Invoice Detection

---

# 🚀 Future Enhancements

* 🔍 AI-based invoice extraction
* 📊 Analytics dashboard
* ☁️ Cloud storage (AWS S3)
* 📱 Mobile app version
* 🔐 Role-based access control

---

# 🤝 Contribution

Contributions are welcome!

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/new-feature

# Commit changes
git commit -m "Add new feature"

# Push
git push origin feature/new-feature
```

---

# 📜 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Shree Paramesh**

* Full Stack Developer
* Passionate about building scalable web applications

---

# ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🍴 Fork it
* 🧠 Share ideas

---
