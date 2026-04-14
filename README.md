<div align="center">

<img src="https://img.shields.io/badge/LeadFlow-CRM%20Automation-6366f1?style=for-the-badge&logo=lightning&logoColor=white" alt="LeadFlow Badge" />

# ⚡ LeadFlow

### Intelligent CRM Workflow Automation System

A production-ready backend that captures leads from a web form, persists them to MongoDB, and instantly triggers multi-channel notifications via WhatsApp and Email — all in a single submission.

<br />

[![Node.js](https://img.shields.io/badge/Node.js-≥18.0-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](https://opensource.org/licenses/ISC)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Demo](#-demo)
- [Security](#-security)
- [Contributing](#-contributing)

---

## 🎯 Overview

**LeadFlow** automates the critical handoff between a prospect submitting a form and your sales team being notified. The moment a lead is captured:

1. ✅ Lead data is **validated** and **persisted** to MongoDB Atlas
2. 📱 A formatted **WhatsApp alert** is sent via UltraMsg API
3. 📧 A **professional HTML email** is dispatched via Gmail SMTP
4. 🏷️ Leads are auto-assigned a **priority tier** (High / Medium / Low) based on budget

No manual hand-off. No missed leads.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Lead Capture Form** | Responsive, production-ready HTML form served as a static frontend |
| **Input Validation** | Server-side validation via `express-validator` (name, email, phone, budget) |
| **MongoDB Persistence** | Leads stored in Atlas with timestamps and structured schema |
| **WhatsApp Notifications** | Instant formatted alerts via UltraMsg API upon each lead submission |
| **Email Notifications** | Rich HTML email via Nodemailer + Gmail SMTP |
| **Priority Scoring** | Auto-classification of leads into High / Medium / Low tiers |
| **Rate Limiting** | 100 requests / 15 min per IP to prevent abuse |
| **Security Hardening** | Helmet.js HTTP headers, CORS allowlisting, JSON payload size limits |
| **Graceful Shutdown** | SIGTERM/SIGINT handlers for clean server + DB teardown |
| **Health Endpoint** | `GET /health` for uptime monitoring and load balancer probes |

---

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js ≥ 18.0
- **Framework:** Express.js 4.x
- **Database:** MongoDB Atlas via Mongoose 8.x
- **Validation:** express-validator 7.x
- **Security:** Helmet.js, express-rate-limit, CORS

### Notifications
- **WhatsApp:** UltraMsg REST API (via Axios)
- **Email:** Nodemailer + Gmail SMTP (App Password)

### Frontend
- Vanilla HTML5 / CSS3 / JavaScript (served as Express static)

### Dev Tools
- **Process Manager (dev):** Nodemon
- **HTTP Logging:** Morgan

---

## 📁 Project Structure

```
leadflow/
├── public/                  # Static frontend (served by Express)
│   ├── index.html           # Lead capture web form
│   └── form.js              # Client-side form logic & API calls
│
├── src/
│   ├── server.js            # Entry point: DB connect → HTTP server start
│   ├── app.js               # Express app: middleware, routes, error handlers
│   │
│   ├── routes/
│   │   └── leadRoutes.js    # POST /lead/submit route definition
│   │
│   ├── controllers/
│   │   └── leadController.js # Request handling → service orchestration
│   │
│   ├── models/
│   │   └── Lead.js          # Mongoose schema & model
│   │
│   ├── services/
│   │   ├── emailService.js      # Nodemailer integration (HTML templates)
│   │   ├── whatsappService.js   # UltraMsg API integration
│   │   └── priorityService.js   # Lead priority classification logic
│   │
│   ├── middleware/
│   │   └── validate.js      # express-validator chains + error formatting
│   │
│   └── utils/
│       └── logger.js        # Colour-coded console logger utility
│
├── .env.example             # ✅ Template — copy to .env and fill values
├── .gitignore               # Excludes .env, node_modules, logs, etc.
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0 ([Download](https://nodejs.org/))
- **MongoDB Atlas** account ([Free tier](https://www.mongodb.com/cloud/atlas/register))
- **UltraMsg** account + active instance ([ultramsg.com](https://ultramsg.com/))
- **Gmail** account with 2-Step Verification + an App Password

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/leadflow.git
cd leadflow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the template
cp .env.example .env
```

Open `.env` and fill in all required values (see [Environment Variables](#-environment-variables) below).

### 4. Start the Development Server

```bash
npm run dev
```

The API and web form will be available at: **[http://localhost:3000](http://localhost:3000)**

### 5. Start for Production

```bash
npm start
```

> 💡 **Recommendation:** Use [PM2](https://pm2.keymetrics.io/) for production process management:
> ```bash
> npm install -g pm2
> pm2 start src/server.js --name leadflow
> pm2 save && pm2 startup
> ```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and populate these values. **Never commit `.env` to version control.**

| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | No | HTTP server port (default: 3000) | `3000` |
| `MONGO_URI` | ✅ Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `ULTRAMSG_INSTANCE_ID` | ✅ Yes | Your UltraMsg instance ID | `instance170058` |
| `ULTRAMSG_TOKEN` | ✅ Yes | UltraMsg API auth token | `xxxxxxxxxxxx` |
| `WHATSAPP_TO` | ✅ Yes | WhatsApp recipient number (with country code) | `+919876543210` |
| `EMAIL_USER` | ✅ Yes | Gmail address for SMTP sender | `you@gmail.com` |
| `EMAIL_PASS` | ✅ Yes | Gmail App Password (not your account password) | `xxxx xxxx xxxx xxxx` |
| `NOTIFY_EMAIL` | ✅ Yes | Email address to receive lead alerts | `team@yourcompany.com` |
| `ALLOWED_ORIGIN` | No | CORS allowed origin (front-end URL) | `https://your-app.com` |
| `NODE_ENV` | No | Set to `production` on live servers | `production` |

### How to Get a Gmail App Password

1. Enable **2-Step Verification** on your Google account
2. Visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Create a new app password (select "Mail" + "Other")
4. Paste the generated 16-character password into `EMAIL_PASS`

---

## 📡 API Reference

### `POST /lead/submit`

Captures a new lead, saves it to MongoDB, and dispatches notifications.

**Request Body (JSON):**

```json
{
  "name": "Jane Doe",
  "email": "jane@company.com",
  "phone": "+919876543210",
  "company": "Acme Corp",
  "budget": 50000,
  "message": "Looking for a CRM automation solution."
}
```

**Success Response (`201 Created`):**

```json
{
  "status": "success",
  "message": "Lead captured and team notified.",
  "data": {
    "leadId": "664abc123...",
    "priority": "High",
    "notifications": {
      "whatsapp": "sent",
      "email": "sent"
    }
  }
}
```

**Validation Error (`422 Unprocessable Entity`):**

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Must be a valid email address." }
  ]
}
```

---

### `GET /health`

Lightweight health check endpoint for uptime monitors and load balancers.

**Response (`200 OK`):**

```json
{
  "status": "ok",
  "service": "LeadFlow API",
  "timestamp": "2026-04-14T14:23:00.000Z"
}
```

---

## 🎬 Demo

> The web form is served directly by Express at the root URL (`/`).
> Submit a lead and watch the real-time confirmation panel with WhatsApp & Email status.

**Live Form Flow:**

1. Fill in name, email, phone, company, budget, and message
2. Click **Submit Lead** — client-side validation runs first
3. Server validates, saves to MongoDB, dispatches notifications
4. Animated confirmation panel shows per-channel delivery status

---

## 🔒 Security

LeadFlow applies defense-in-depth at every layer:

| Layer | Measure |
|---|---|
| **Secrets** | All credentials in `.env`, excluded from Git via `.gitignore` |
| **HTTP Headers** | Helmet.js sets `X-Frame-Options`, `X-Content-Type-Options`, `CSP`, etc. |
| **CORS** | Strict allowlist via `ALLOWED_ORIGIN` env var |
| **Rate Limiting** | 100 req / 15 min per IP via `express-rate-limit` |
| **Payload Size** | JSON body capped at 10 KB to prevent denial-of-service |
| **Input Validation** | All inputs sanitized and validated server-side before DB write |
| **Error Handling** | Stack traces never exposed to API consumers |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **ISC License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Built with ⚡ by the LeadFlow team
</div>
