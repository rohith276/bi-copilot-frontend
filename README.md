# BI-Copilot Frontend

Enterprise AI Business Intelligence interface built with Next.js, React 19, and Tailwind CSS.

## Deployment to Vercel

1. **Create Repo**: Create a new public/private GitHub repository and push the contents of this `frontend/` folder to it.
2. **Deploy**:
   - Go to [vercel.com](https://vercel.com).
   - Import your frontend repository.
   - Vercel will automatically detect the Next.js framework.
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed Render backend (e.g., `https://bi-copilot-api.onrender.com`). **Do not include a trailing slash.**

## Local Setup

1. Install dependencies: `npm install`
2. Create a `.env.local` file (copy from `.env.example`) and set `NEXT_PUBLIC_API_URL=http://localhost:8000`.
3. Start dev server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)
