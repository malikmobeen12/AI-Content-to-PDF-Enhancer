## AI Content‑to‑PDF Enhancer 

### What it is
A small web app that lets you paste a URL or text, then:
- Summarize, expand, or validate the content using an LLM
- Download a clean, professional PDF for any mode

Recent improvements:
- Validation report uses a sectioned narrative (no tables)
- Status line is bold and emoji‑safe (e.g., Verified, False, Partially True, Uncertain)

---

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+ (a `venv/` is provided but optional)
- Groq API key

---

### Setup
1) Backend
```
cd backend
python -m venv ../venv  # optional if you don’t already have it
../venv/Scripts/pip install -r requirements.txt  # Windows
# or: ../venv/bin/pip install -r requirements.txt  # macOS/Linux

copy .env.example .env  # if present; otherwise create .env
# .env needs:
# GROQ_API_KEY=your_key_here
```

2) Frontend
```
cd ../frontend
npm install
npm run build
```

3) Run (local)
```
# Terminal A
cd backend
../venv/Scripts/python app.py  # Windows
# or: ../venv/bin/python app.py

# Terminal B (optional for dev)
cd frontend
npm start
```

App will serve the production build at http://localhost:5000 by default.

---

### Usage
1) Open the app in your browser
2) Paste text or a URL
3) Choose a mode: Summarize, Expand, or Validate
4) Click Enhance → Download PDF

Notes for Validate mode:
- Each claim appears under its own header with Claim, Status (bold), Reasoning, Source
- Status strings are normalized (no broken emoji characters)

---

### Docker (optional)
```
docker build -t ai-content-to-pdf-enhancer .
docker run -p 5000:5000 --env GROQ_API_KEY=your_key ai-content-to-pdf-enhancer
```

---

### Key Features
- Clean PDF layouts for all modes (A4, margins, headers/footers)
- Narrative Validation Report 
- Robust URL content extraction with BeautifulSoup fallback
- Consistent typography and page numbering

---

### Troubleshooting
- 401/403 from API: ensure `GROQ_API_KEY` is set and valid
- Blank or truncated PDFs: try smaller input or re‑generate
- CSS/JS not found: run `npm run build` in `frontend/`


