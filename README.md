# BSA Merit Badge Workbook Generator

A powerful tool designed for Scouts and Leaders to instantly convert raw BSA merit badge requirements into professional, fillable PDF workbooks or editable Word documents using AI.

---

## 🚀 Features

- **AI-Powered Parsing**: Automatically detects hierarchical requirement structures (1, a, i, etc.).
- **Smart Components**: Intelligently generates checklists, tracking grids, meal planners, and structured tables based on requirement context.
- **Fillable PDFs**: Generates interactive PDF text fields for digital completion.
- **Editable Word Docs**: Pixel-perfect conversion to DOCX for custom editing.
- **Modern UI**: A cinematic, responsive interface built with Next.js 15 and Framer Motion.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Framer Motion, GSAP.
- **Backend**: Python (Vercel Serverless Functions), ReportLab for PDF generation, Gemini 2.0 Flash for AI parsing.
- **Database/Storage**: Supabase (PostgreSQL + Storage) for workbook persistence and rate limiting.

---

## ⚙️ Setup & Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd bsa2
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Locally
```bash
npm run dev
```

---

## 📁 Project Structure

- `app/`: Next.js frontend pages and layouts.
- `api/`: Python backend functions (Vercel runtime).
- `generator/`: Core Python logic for AI parsing and PDF generation.
- `components/`: Reusable React components.
- `lib/`: Shared utilities and Supabase client.

---

## 🛡️ Security Note

API keys should **never** be committed to the repository. Ensure all `.env` files are ignored by git. If you find any exposed keys in the history, rotate them immediately.

---

## ❤️ Credits

Built with passion for the Scouting community. Not officially affiliated with the Boy Scouts of America.
