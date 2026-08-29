# KoparGov AI — Municipal Civic Decision Support Platform

An AI-powered civic intelligence & resource allocation decision support system for municipal corporations, featuring the **Civic Impact Engine (CIE)**.

---

## 📁 Project Architecture

The project is structured with clean frontend and backend separation:

```text
KoparGOV_AI/
├── frontend/                     # React + Vite + TypeScript Frontend Application
│   ├── src/
│   │   ├── components/           # UI components (dashboard, issues, recommendation, citizen, analytics, map)
│   │   ├── pages/                # Officer and Citizen route views
│   │   ├── services/             # Mock & API service layer (ready for backend integration)
│   │   ├── mock/                 # Isolated mock data fixtures
│   │   ├── context/              # React contexts (Auth, Civic, Toast)
│   │   └── types/                # TypeScript domain models and interfaces
│   ├── public/                   # Static assets & icons
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                      # FastAPI + Python Engine
│   └── ...                       # Backend services, models, & optimization logic
│
├── .gitignore
└── README.md
```

---

## 🚀 Running the Frontend

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start local development server (runs on port 5173 with local network support)
npm run dev

# Build production bundle
npm run build
```

---

## 🏛️ Key Capabilities

- **Officer Portal (`/dashboard`, `/issues`, `/recommendations/:id`, `/assignments`, `/map`, `/analytics`)**:
  - CIE Multi-Factor Civic Priority Scoring
  - Resource Availability & Team Dispatch Recommendations
  - Alternative Allocation Trade-off Analysis
  - Spatial GIS Map Explorer with heatmap density and ward filters
  - Performance Analytics & Decision-Support Comparison
- **Citizen Redressal Portal (`/citizen`, `/citizen/report`, `/citizen/issues`, `/citizen/leaderboard`, `/citizen/profile`)**:
  - Multi-category Complaint Filing with In-Browser Live Camera & Cross-Device Phone Sync
  - Real Name vs. Anonymous Alias Privacy Matrix
  - Ethical Civic Leaderboard
  - Live Complaint Progress Tracking & Notification Drawer
