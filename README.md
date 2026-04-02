# CandleVision | Immersive Trading Intelligence

CandleVision is an AI-powered trading education and analytics platform featuring interactive 3D visualizations, neural market analysis, and a complete prediction verification system.

## Features

- **AI Strategy Terminal**: Real-time trading signals driven by a ResNet18 candlestick model with AI-generated explanations.
- **3D Market Terminal**: Immersive WebGL-based candlestick visualizations using Three.js.
- **Prediction Verification**: Automated tracking of AI signal accuracy and PnL.
- **Performance Analytics**: Advanced metrics including Win Rate, Profit Factor, and Equity Curves.
- **Market Replay**: Historical simulation engine for studying market patterns.
- **Learning Hub**: Educational modules for mastering candlestick patterns and risk management.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **AI Engine**: Google Genkit + Gemini 1.5 Flash
- **Database/Auth**: Firebase Firestore & Firebase Authentication
- **Visuals**: Three.js (3D Charts) & Recharts (Analytics)
- **ML Inference**: Python ResNet18 candlestick classifier with optional standalone HTTP service

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase Project
- Google AI API Key (for Gemini)

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables in `.env`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   GOOGLE_API_KEY=your_gemini_api_key
   ML_SERVICE_URL=http://localhost:8001
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## ML Service Deployment

The trading panel now supports a production-safe Python inference service.

Run the standalone ML service locally:

```bash
python ml/service.py
```

Or run it in Docker:

```bash
docker compose -f docker-compose.ml.yml up --build
```

The Next.js app will call `ML_SERVICE_URL` when it is set. If that variable is not set, it falls back to running `python ml/predict.py` directly on the same host.

## License

MIT
