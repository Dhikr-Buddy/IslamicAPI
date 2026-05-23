# Getting Started

Learn how to set up the IslamicAPI repository locally, run the development server, and explore the workspace structure.

---

## Installation

### Prerequisites
*   **Node.js**: >= 20.0.0
*   **pnpm**: Recommended package manager
*   **Python**: >= 3.10

### 1. Clone & Install Dependencies
Clone the repository and install both the JavaScript and Python package dependencies:

```sh
# Clone repo
git clone https://github.com/Dhikr-Buddy/IslamicAPI.git
cd IslamicAPI

# Install Node dependencies
pnpm install

# Install Python SDK in editable/development mode
pip install -e .
```

---

## Run Local API Server

We provide a lightweight HTTP server designed for local testing and debugging. To start the local server:

```sh
pnpm dev
```

By default, the server listens on `http://127.0.0.1:3000`.

### Local Endpoints

*   `GET /health`: Server health status.
*   `GET /quran/surah/:number`: Retrieve a specific Surah with all its ayahs.
*   `GET /quran/ayah/:surah/:ayah`: Retrieve a single Ayah.
*   `GET /quran/search?q=الله`: Search the Quran (supports exact diacritics).
*   `GET /hadith/:id`: Retrieve a specific Hadith by composite ID (e.g., `bukhari:3722`).
*   `GET /hadith/random?collection=bukhari`: Get a random Hadith (optional collection filter).
*   `GET /prayer/times?latitude=40.7128&longitude=-74.006&timezone=-4`: Calculate prayer times.
*   `GET /qibla?latitude=40.7128&longitude=-74.006`: Calculate Qibla bearing.
*   `GET /audio/reciters`: List all audio reciters.
*   `GET /audio/url?reciterId=1:1&surah=1&ayah=1`: Retrieve recitation URL.
*   `GET /fonts`: Get the list of Quran/Mushaf fonts.
*   `GET /fonts.css`: Serves CSS `@font-face` declarations.
*   `GET /fonts/files/:file`: Retrieve binary WOFF2 font files.
*   `GET /raw-api`: Load the static Raw GitHub API index.

---

## Workspace Directory Structure

```
├── data/                 # Raw and normalized datasets (Quran, Hadith, Audio, Fonts, etc.)
│   ├── api/              # Unified raw API index pointing to CDN/raw links
│   ├── audio/            # Recitation indexes and raw fetch metadata
│   ├── fonts/            # WOFF2 font files and CSS generator metadata
│   ├── hadith/           # Fawaz Ahmed collection JSONs and normalized files
│   └── quran/            # Tanzil-backed Quran simple and uthmani corpus
├── deensdk/              # Python SDK package
│   ├── core.py           # Core logic for calculations and queries
│   └── models.py         # Pydantic schema definitions
├── docs/                 # Static web client demo files
├── packages/
│   └── deen-sdk/         # Javascript SDK package
│       └── src/          # Source logic, helpers, and exports
├── scripts/              # Crawler, normalizer, and publisher scripts
└── tests/                # Verification test suites
```
