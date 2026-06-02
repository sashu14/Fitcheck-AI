# FITCHECK AI ── The Personal Atelier

An ultra-premium, AI-powered outfit recommendation and visual try-on application styled in a sleek, luxury dark fashion editorial aesthetic.

🚀 **Live Production Link**: [https://fitcheck-ai-tan.vercel.app](https://fitcheck-ai-tan.vercel.app)

---

## 🎨 Creative Architecture & Key Features

* **Widescreen Video Background (100% Quality)**: High-resolution, unblurred background video backdrop displaying gorgeous styling loops natively, seamlessly blended with frameless typography overlay.
* **Minimalist Above-The-Fold Hero**: Styled with a minimal layout. The only active option on load is the elegant `"DESIGN YOUR STYLE"` Call to Action.
* **Atelier Chapters Flow (Scroll Down)**:
  * **Chapter 01 (Visual Style Scoring)**: Deep aesthetic audit across layering, color coordination, and fit metrics (rated out of 10).
  * **Chapter 02 (Tailored Capsule Curations)**: Custom recommendations curated dynamically by Gemini AI to raise your score to a perfect 10.
  * **Chapter 03 (Mannequin Try-On)**: Advanced Google Imagen 3 visual metamorphosis rendering styles directly onto your figure.
* **Interactive Before/After Slider**: Side-by-side rating comparisons showing standard styles upgrading to couture ratings.
* **E-Commerce Affiliations**: Integrated shopping links for Myntra, Flipkart, and Amazon India.

---

## 🛠️ Technology Stack

* **Frontend Framework**: React 18, Vite
* **Styling**: Vanilla CSS & Tailwind v3
* **Animations**: Framer Motion
* **Iconography**: Lucide React
* **AI Orchestration**: Google Gemini Developer API (Multimodal 2.5 Flash / Pro models)

---

## 🚀 How to Run Locally

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/sashu14/Fitcheck-AI.git
   cd Fitcheck-AI
   ```

2. **Configure Environment Variables**:
   Create a `.env` file at the root and add your Google Gemini Key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Install Dependencies & Start Server**:
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:5173/](http://localhost:5173/) in your browser.
