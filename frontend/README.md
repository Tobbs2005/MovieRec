---

# 🎬 Swipe Movie Recommender

A hybrid movie recommendation system using semantic similarity (SBERT), collaborative filtering, and a swipe-based interface. Users can search for movies, like some to build preferences, and then swipe through recommendations.

---

## 📁 Project Structure

```
.
├── backend/
│   ├── swipe_api.py         # Main FastAPI backend logic: recommendation, feedback, search
│   ├── server.py            # Entry point for launching the FastAPI app
│   ├── movies.csv           # Main movie metadata (title, overview, genres, etc.)
│   ├── ratings.csv          # User ratings for collaborative filtering
│   └── movie_embeddings.npy # Cached SBERT embeddings of movie overviews
│
├── frontend/
│   ├── App.jsx              # Root React component that toggles preference setup and swiping
│   ├── components/
│   │   ├── UserPreference.jsx  # UI for search and selecting pre-liked movies
│   │   └── SwipeRecommender.jsx # Main swipe UI that handles feedback and recommendations
│   └── index.html           # Entry HTML file for React/Vite
│
├── package.json             # Root script that concurrently runs backend and frontend
└── README.md                # You’re reading it 🙂
```

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/swipe-recommender.git
cd swipe-recommender
```

---

### 2. Install dependencies

**Backend Python dependencies** (create a virtualenv first if you'd like):

```bash
cd backend
pip install -r requirements.txt
```

**Frontend dependencies**:

```bash
cd ../frontend
npm install
```

**Root-level dev tools (for concurrently running both)**:

```bash
cd ..
npm install
```

---

### 3. Run the app (from root)

```bash
npm run dev
```

This will:

* Launch the **FastAPI server** on `localhost:8000`
* Launch the **React frontend** via Vite on `localhost:5173`

---

## 🧠 Key Features

* **Hybrid Recommendation**: Combines sentence-transformer similarity with collaborative filtering
* **SBERT-Powered Search**: Matches based on overview, title, and genre using both keyword and embedding similarity
* **Feedback Loop**: Updates user embedding dynamically as you like/dislike
* **Swipe Interface**: Tinder-style UI with clear like/dislike buttons
* **Pre-Like Mode**: Select movies before swiping to personalize cold start

---

## 🔧 Scripts (root `package.json`)

```json
"scripts": {
  "dev": "concurrently \"npm:backend\" \"npm:frontend\"",
  "backend": "python backend/server.py",
  "frontend": "npm run dev --prefix frontend"
}
```

---

## 📌 Notes

* SBERT embeddings are cached in `movie_embeddings.npy` after first run.
* Backend logs print in the terminal (make sure you're editing `swipe_api.py` if updating backend logic).
* Be sure to avoid recommending already liked or seen movies — handled both in frontend and backend.

---
