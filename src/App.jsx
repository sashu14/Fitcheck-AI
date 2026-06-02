import React, { useState, useEffect, useRef } from "react";
import OnboardingQuiz from "./components/OnboardingQuiz";
import OutfitRecommendations from "./components/OutfitRecommendations";
import { generateOutfitRecommendations } from "./services/stylingService";
import { Sparkles, Compass, Eye, Shield, Key, Settings, X, RefreshCw, ArrowRight, Award, Shirt, Upload, ShoppingCart, Info, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const RUNWAY_QUOTES = [
  { text: "Dress like you are already famous.", author: "Anonymous" },
  { text: "Fashion changes, but style endures.", author: "Coco Chanel" },
  { text: "Style is a way to say who you are without speaking.", author: "Rachel Zoe" },
  { text: "Elegance is being noticed, not standing out.", author: "Giorgio Armani" },
  { text: "Dress well, live well.", author: "Anonymous" }
];

export default function App() {
  const [step, setStep] = useState("welcome"); // welcome, quiz, styling, results
  const [userProfile, setUserProfile] = useState(null);
  const [stylingData, setStylingData] = useState(null);
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  // Custom API key config
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Rotate quotes while AI is styling
  useEffect(() => {
    let interval;
    if (step === "styling") {
      interval = setInterval(() => {
        setCurrentQuoteIdx((prev) => (prev + 1) % RUNWAY_QUOTES.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Read saved API key on startup
  useEffect(() => {
    const saved = localStorage.getItem("FITCHECK_GEMINI_KEY");
    if (saved) setApiKey(saved);
  }, []);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem("FITCHECK_GEMINI_KEY", key);
    setShowSettings(false);
  };

  const clearApiKey = () => {
    setApiKey("");
    localStorage.removeItem("FITCHECK_GEMINI_KEY");
    setShowSettings(false);
  };

  // Onboarding quiz submit
  const handleQuizSubmit = async (profile) => {
    setUserProfile(profile);
    setStep("styling");
    
    try {
      const data = await generateOutfitRecommendations(profile, "", apiKey);
      setStylingData(data);
      setStep("results");
    } catch (error) {
      console.error("Stylist error:", error);
      setStep("results");
    }
  };

  // Inline custom tailoring refinement
  const handleRegenerateLook = async (feedback, activeIndex) => {
    try {
      // Regenerate look book with custom user feedback
      const data = await generateOutfitRecommendations(userProfile, feedback, apiKey);
      setStylingData(data);
    } catch (error) {
      console.error("Lookbook adjustment failed:", error);
    }
  };

  const handleInlineUpload = async (photoBase64) => {
    if (!userProfile) return;
    const updatedProfile = { ...userProfile, photo: photoBase64 };
    setUserProfile(updatedProfile);
    setStep("styling");
    try {
      const data = await generateOutfitRecommendations(updatedProfile, "", apiKey);
      setStylingData(data);
      setStep("results");
    } catch (error) {
      console.error("Inline upload failed:", error);
      setStep("results");
    }
  };

  const handleReset = () => {
    setUserProfile(null);
    setStylingData(null);
    setStep("welcome");
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Editorial Grain Overlay */}
      <div className="grain-overlay" />
      
      {/* Cinematic Full-Screen Background Video (High Opacity, Fully Visible, Crystal Clear) - ONLY during starting welcome step */}
      {step === "welcome" && (
        <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-100 bg-neutral-950 animate-fade-in">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            src="/active_lookbook.mp4?v=2"
          />
          {/* Soft, minimal blend overlay (keeps video bright and clear) */}
          <div className="absolute inset-0 bg-black/15" />
        </div>
      )}
      
      {/* Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-20 border-b border-white/5 bg-obsidian-900/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
          <div className="h-9 w-9 rounded-full bg-luxury-gold-gradient flex items-center justify-center border border-gold-500/30">
            <Sparkles className="w-4 h-4 text-obsidian-900" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-medium tracking-wide text-gold-100 flex items-center gap-1">
              FITCHECK <span className="text-[10px] tracking-widest font-sans font-bold text-gold-400 bg-gold-500/10 px-1.5 py-0.5 rounded border border-gold-500/20">AI</span>
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-obsidian-300 hover:text-gold-300 hover:border-gold-500/40 hover:bg-gold-500/5 transition-all"
            title="API Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 flex items-center justify-center z-10">
        
        {/* STEP 1: WELCOME SCREEN (Consolidated High-Clarity Lookbook Dashboard) */}
        {step === "welcome" && (
          <div className="w-full space-y-24 z-10">
            
            {/* Above the Fold: Minimalist Widescreen Hero Section (Takes full viewport height, frameless visual overlay) */}
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-center py-12">
              <div className="max-w-4xl mx-auto space-y-8 select-none">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-gold-500/25 text-gold-300 text-[10px] font-semibold tracking-widest uppercase animate-pulse shadow-md backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5" /> FITCHECK AI • THE PERSONAL ATELIER
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl lg:text-7xl font-serif font-light text-gold-100 leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
                    Your Outfit Deserves <br />
                    <span className="italic text-gold-gradient font-serif font-light">Better Than Guesswork.</span>
                  </h2>
                  
                  <p className="text-xs md:text-sm text-white/85 font-sans font-light leading-relaxed max-w-xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                    A high-fashion generative styling engine that instantly audits your outfit structure, assesses color harmony, and designs custom try-on upgrades.
                  </p>
                </div>

                {/* The Only Option on Screen (Begin / Design Style) */}
                <div className="space-y-4 pt-4">
                  <button
                    onClick={() => setStep("quiz")}
                    className="btn-gold px-14 py-5 rounded-full text-xs font-bold tracking-widest hover:scale-[1.03] transition-all duration-300 flex items-center justify-center gap-2.5 mx-auto border border-gold-400/40 shadow-[0_10px_30px_rgba(212,175,55,0.35)]"
                  >
                    DESIGN YOUR STYLE <ArrowRight className="w-4 h-4" />
                  </button>
                  
                  <div className="text-center">
                    {apiKey ? (
                      <span className="text-[9px] text-emerald-400 font-sans tracking-wide drop-shadow-md bg-black/50 px-2.5 py-0.5 rounded border border-emerald-400/20 backdrop-blur-sm">
                        ✓ Custom Gemini Engine Active
                      </span>
                    ) : (
                      <span className="text-[9px] text-gold-400/80 font-sans tracking-wide drop-shadow-md bg-black/50 px-2.5 py-0.5 rounded border border-gold-500/10 backdrop-blur-sm">
                        Demo Mode (Default Stylist Active)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Scroll down indicator */}
              <div className="pt-8 animate-bounce flex flex-col items-center gap-2 opacity-80">
                <span className="text-[9px] uppercase tracking-[0.2em] text-gold-300 font-semibold font-sans bg-black/60 px-3.5 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                  Scroll to explore the atelier
                </span>
                <div className="w-4 h-7 rounded-full border border-gold-500/50 flex justify-center p-1 bg-black/40">
                  <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse" />
                </div>
              </div>
            </div>

            {/* Below the Fold: Consolidated High-Clarity Editorial Console (Scroll Down) */}
            <div className="w-full max-w-5xl mx-auto space-y-16 py-12 border-t border-white/5 bg-obsidian-950/40 backdrop-blur-md rounded-[3rem] p-8 md:p-12 border border-white/10 shadow-2xl">
              
              <div className="text-center space-y-2">
                <span className="text-[9px] uppercase tracking-[0.2em] text-gold-400 font-bold font-sans">The Narrative Flow</span>
                <h3 className="text-3xl font-serif text-gold-100 font-light">Inside the Styling Atelier</h3>
              </div>

              {/* Simplified Feature Chapters Stack (Clean Grid, Not scattered) */}
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-gold-500/15 transition-all space-y-2.5">
                  <span className="text-[9px] uppercase tracking-wider font-sans font-bold text-gold-400">01 / Style Audit</span>
                  <h4 className="font-serif text-lg text-gold-100 font-medium">Visual Style Scoring</h4>
                  <p className="text-xs text-obsidian-300 font-sans leading-relaxed">
                    Upload your profile silhouette and receive an aesthetic score out of 10 across shade match, layering, and tailoring symmetry.
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-gold-500/15 transition-all space-y-2.5">
                  <span className="text-[9px] uppercase tracking-wider font-sans font-bold text-gold-400">02 / Custom Atelier</span>
                  <h4 className="font-serif text-lg text-gold-100 font-medium">Couture Refinements</h4>
                  <p className="text-xs text-obsidian-300 font-sans leading-relaxed">
                    Receive custom-designed outfit recommendations tailor-made by AI intelligence to elevate your visual metrics to a 10/10.
                  </p>
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-gold-500/15 transition-all space-y-2.5">
                  <span className="text-[9px] uppercase tracking-wider font-sans font-bold text-gold-400">03 / Mannequin Try-On</span>
                  <h4 className="font-serif text-lg text-gold-100 font-medium">AI Visual Metamorphosis</h4>
                  <p className="text-xs text-obsidian-300 font-sans leading-relaxed">
                    Virtually try on the custom curated styles mapped cleanly onto your figure using advanced Imagen generative rendering.
                  </p>
                </div>
              </div>

              {/* Inline Metamorphosis Preview Slider Bar */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20 text-gold-300 flex-shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-serif text-gold-200">Interactive Style Auditing</h4>
                    <p className="text-xs text-obsidian-300 font-sans leading-relaxed mt-1">Witness your score double from a basic baseline rating to full couture excellence.</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-black/40 px-5 py-2.5 rounded-full border border-white/5 text-xs font-sans font-semibold tracking-wider flex-shrink-0">
                  <span className="text-obsidian-400">Before: <strong className="text-red-400/80 font-bold">6.2</strong></span>
                  <ArrowRight className="w-4 h-4 text-gold-500" />
                  <span className="text-gold-200">After: <strong className="text-luxury-gold-gradient text-gold-300 font-bold">10.0</strong></span>
                </div>
              </div>

              {/* Affiliate Shopping & Action Footer */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-8 border-t border-white/5">
                <div className="space-y-1.5">
                  <span className="text-[9px] uppercase tracking-wider font-sans font-bold text-gold-400">PARTNER RETAIL AFFILIATIONS</span>
                  <div className="flex items-center gap-4 text-xs text-obsidian-300 font-medium font-sans">
                    <span>Myntra India</span>
                    <span className="text-white/20">•</span>
                    <span>Flipkart Couture</span>
                    <span className="text-white/20">•</span>
                    <span>Amazon Luxury</span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => setStep("quiz")}
                    className="btn-gold px-12 py-4 rounded-full text-xs font-bold shadow-2xl tracking-widest hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    DESIGN YOUR STYLE NOW <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* STEP 2: ONBOARDING QUIZ */}
        {step === "quiz" && (
          <OnboardingQuiz onSubmit={handleQuizSubmit} />
        )}

        {/* STEP 3: RUNWAY LOADING STATE */}
        {step === "styling" && (
          <div className="text-center py-20 max-w-xl mx-auto space-y-12 animate-fade-in flex flex-col items-center justify-center">
            {/* Spinning styling loom */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-white/5 border-t-gold-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border border-dashed border-gold-500/20 animate-pulse" />
              <Sparkles className="w-6 h-6 text-gold-300 animate-pulse" />
            </div>

            {/* Changing Editorial Quote */}
            <div className="space-y-4 px-4 min-h-[120px] flex flex-col justify-center">
              <p className="text-xl lg:text-2xl font-serif text-gold-200 leading-normal italic transition-opacity duration-500 ease-in-out">
                "{RUNWAY_QUOTES[currentQuoteIdx].text}"
              </p>
              <p className="text-xs uppercase tracking-wider text-gold-500 font-semibold font-sans">
                — {RUNWAY_QUOTES[currentQuoteIdx].author}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-obsidian-400 font-semibold font-sans animate-pulse block">
                Auditing Style & Generating Curations
              </span>
              <p className="text-xs text-obsidian-300 max-w-sm mx-auto font-sans leading-relaxed">
                Our Gemini stylist is rating your photo and designing custom clothing items specifically tailored to make your style score perfect.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: RECOMMENDATIONS */}
        {step === "results" && (
          <OutfitRecommendations 
            outfits={stylingData?.outfits || []} 
            profile={userProfile} 
            styleScore={stylingData?.styleScore}
            styleCritique={stylingData?.styleCritique}
            styleRating={stylingData?.styleRating}
            onRegenerate={handleRegenerateLook} 
            onReset={handleReset} 
            userApiKey={apiKey}
            onUploadPhoto={handleInlineUpload}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 border-t border-white/5 text-[10px] text-obsidian-400 font-sans tracking-widest z-10 bg-obsidian-950/20">
        © 2026 FITCHECK AI. ALL RIGHTS RESERVED.
      </footer>

      {/* Settings Modal (Gemini API Configuration) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
          <div className="w-full max-w-md glass-panel-luxury p-8 rounded-3xl border border-white/10 relative">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-obsidian-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-gold-500/10 flex items-center justify-center border border-gold-500/20 text-gold-300">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-serif font-medium text-gold-200">Gemini Styling Engine</h3>
            </div>

            <p className="text-xs text-obsidian-300 leading-relaxed font-sans mb-6">
              By default, FitCheck AI uses our pre-loaded key to generate outfits instantly. You can save your own Gemini API Key below.
            </p>

            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold font-sans block">
                Personal API Key
              </label>
              <input
                type="password"
                placeholder={apiKey ? "••••••••••••••••••••••••••••" : "AIzaSy..."}
                onChange={(e) => saveApiKey(e.target.value)}
                className="w-full luxury-input rounded-xl p-3 text-xs"
              />
              <p className="text-[9px] text-obsidian-400 leading-normal">
                Your key will be securely saved only on your local browser storage (`localStorage`).
              </p>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-white/5">
              {apiKey && (
                <button
                  onClick={clearApiKey}
                  className="flex-1 btn-outline py-2.5 rounded-xl text-[10px] font-semibold tracking-widest uppercase"
                >
                  Use Default Key
                </button>
              )}
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 btn-gold py-2.5 rounded-xl text-[10px] font-semibold tracking-widest uppercase"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
