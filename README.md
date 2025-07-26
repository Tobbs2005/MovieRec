
# 🎬 Movie Recommender App

A Tinder-style movie recommendation system powered by FastAPI, sentence-transformers, and a React frontend.

---

## 🚀 Getting Started

### 1. Activate the Python virtual environment

```bash
source sbert-env/bin/activate
````

> Make sure you're in the root directory of the project when running this.

---

### 2. Install frontend dependencies

```bash
npm install
```

---

### 3. Start the app

```bash
npm run dev
```

---

## 🧠 Tech Stack

* **Backend:** FastAPI, Sentence-Transformers, scikit-learn
* **Frontend:** React, Vite
* **Embedding Model:** `all-MiniLM-L6-v2`
* **Recommendation Logic:** Cosine similarity + feedback loop

---

## 📁 Folder Structure

```
├── sbert-env/              # Python virtual environment
├── backend/                # FastAPI app and embedding logic
├── frontend/               # React app with swiping UI
├── data/                   # TMDB CSV and precomputed embeddings
├── requirements.txt
└── README.md
```

---

## ✨ Features

* Personalized movie recommendations
* Swipe interface (like/dislike)
* Genre, language, and year filters
* Learns user preferences through feedback

---

## 📌 Notes

* Ensure Python 3.9+ and Node.js 18+ are installed
* You must activate the Python environment before running the server
* If you see `(venv)` or another env, run `deactivate` first

---

## 🤝 Contributing

Pull requests welcome. For major changes, open an issue first.

---

## 🪪 License

MIT License

```

---

