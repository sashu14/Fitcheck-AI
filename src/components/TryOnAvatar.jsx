import React, { useState, useEffect, useRef } from "react";
import { User, Sparkles, Image as ImageIcon, Shirt, Eye, Award } from "lucide-react";
import { generateTryOnImage } from "../services/stylingService";

// High-end curated editorial backup images matching each occasion
const UNSPLASH_REVIEWS = {
  casual: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=80",
  office: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&auto=format&fit=crop&q=80",
  party: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&auto=format&fit=crop&q=80",
  "date night": "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&auto=format&fit=crop&q=80",
  gym: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80"
};

export default function TryOnAvatar({ profile, activeOutfit, userApiKey, styleScore, styleCritique }) {
  const [viewMode, setViewMode] = useState("ai-photo"); // ai-photo, mannequin-svg
  const [aiImageUrl, setAiImageUrl] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fallbackStage, setFallbackStage] = useState(0); // 0 = Imagen 3, 1 = Pollinations, 2 = Unsplash, 3 = SVG

  // Refs to avoid stale closures in setTimeout callbacks!
  const imageLoadedRef = useRef(imageLoaded);
  const safetyTimerRef = useRef(null);

  // Sync ref with state
  useEffect(() => {
    imageLoadedRef.current = imageLoaded;
  }, [imageLoaded]);

  // Extract colors for the mannequin SVG sketch
  const topColor = activeOutfit?.items?.find(i => i.type === "Top")?.color || "#121212";
  const bottomColor = activeOutfit?.items?.find(i => i.type === "Bottom")?.color || "#1F2937";
  const shoesColor = activeOutfit?.items?.find(i => i.type === "Shoes")?.color || "#4B5563";
  const accessoryColor = activeOutfit?.items?.find(i => i.type === "Accessory")?.color || "#D4AF37";

  const gender = (profile.gender || "unisex").toLowerCase();
  const fit = (profile.fitPreference || "relaxed").toLowerCase();

  // Color chips display
  const colorChips = activeOutfit?.items?.map((item) => ({
    name: item.name,
    color: item.color,
    type: item.type
  })) || [];

  // Get current occasion image fallback
  const unsplashFallbackUrl = UNSPLASH_REVIEWS[profile.occasion] || UNSPLASH_REVIEWS.casual;

  // Reset states and fetch image
  useEffect(() => {
    if (!activeOutfit?.tryOnImagePrompt) return;

    let isMounted = true;
    
    setIsLoading(true);
    setImageLoaded(false);
    setAiImageUrl("");
    setFallbackStage(0);

    // Truncate prompt to max 1000 chars to avoid buffer cutoffs
    const rawPrompt = activeOutfit.tryOnImagePrompt || "";
    const truncatedPrompt = rawPrompt.length > 1000 
      ? rawPrompt.substring(0, 1000) + " photorealistic"
      : rawPrompt;

    async function loadTryOnImage() {
      try {
        // TIER 1: Try official Google Imagen 3 API
        const base64Url = await generateTryOnImage(truncatedPrompt, userApiKey);
        
        if (isMounted) {
          setAiImageUrl(base64Url);
          setIsLoading(false);
          setImageLoaded(true);
        }
      } catch (err) {
        console.warn("Google Imagen 3 failed, falling back to Pollinations:", err);
        
        // TIER 2: Safe fallback URL to Pollinations turbo
        const pollinationsUrl = `https://image.pollinations.ai/p/${encodeURIComponent(truncatedPrompt)}?width=400&height=500&nologo=true&model=turbo&seed=${encodeURIComponent(activeOutfit.name || 'fitcheck')}`;
        
        if (isMounted) {
          setFallbackStage(1);
          setAiImageUrl(pollinationsUrl);
          
          // Safety Timer: Cleared instantly when loaded, using imageLoadedRef to avoid stale closures
          safetyTimerRef.current = setTimeout(() => {
            if (isMounted && !imageLoadedRef.current) {
              console.warn("Pollinations load timed out after 15s, using Unsplash editorial");
              triggerUnsplashFallback();
            }
          }, 15000);
        }
      }
    }

    function triggerUnsplashFallback() {
      if (isMounted) {
        setFallbackStage(2);
        setAiImageUrl(unsplashFallbackUrl);
        setIsLoading(false);
        setImageLoaded(true);
      }
    }

    loadTryOnImage();

    return () => {
      isMounted = false;
      if (safetyTimerRef.current) {
        clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = null;
      }
    };
  }, [activeOutfit, userApiKey]);

  // Handle image load error to fall back to the next tier
  const handleImageError = () => {
    console.warn(`Image failed to load in stage: ${fallbackStage}`);
    
    if (fallbackStage === 0 || fallbackStage === 1) {
      // If Imagen 3 or Pollinations fails, trigger Unsplash backup
      setFallbackStage(2);
      setAiImageUrl(unsplashFallbackUrl);
      setIsLoading(false);
      setImageLoaded(true);
    } else {
      // If everything else fails, fall back to the interactive 2D mannequin sketch
      setFallbackStage(3);
      setViewMode("mannequin-svg");
      setIsLoading(false);
      setImageLoaded(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-stretch w-full">
      
      {/* Primary Visual Preview Card */}
      <div className="flex-1 glass-panel-luxury p-6 rounded-3xl flex flex-col items-center justify-between relative overflow-hidden group min-h-[520px]">
        {/* Color accents */}
        <div 
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] opacity-10 pointer-events-none transition-all duration-700 ease-in-out"
          style={{ backgroundColor: topColor }}
        />
        <div 
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[120px] opacity-10 pointer-events-none transition-all duration-700 ease-in-out"
          style={{ backgroundColor: bottomColor }}
        />
        
        {/* Toggle Controls */}
        <div className="w-full flex justify-between items-center z-10 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-xs uppercase tracking-wider text-gold-300 font-semibold">AI Outfit Preview</span>
          </div>

          <div className="flex bg-black/40 p-1 rounded-full border border-white/10 text-[10px]">
            <button
              onClick={() => setViewMode("ai-photo")}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                viewMode === "ai-photo" ? "bg-gold-500 text-obsidian-900" : "text-obsidian-300 hover:text-white"
              }`}
            >
              AI Photo Try-On
            </button>
            <button
              onClick={() => setViewMode("mannequin-svg")}
              className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                viewMode === "mannequin-svg" ? "bg-gold-500 text-obsidian-900" : "text-obsidian-300 hover:text-white"
              }`}
            >
              Mannequin Sketch
            </button>
          </div>
        </div>

        {/* View Mode Contents */}
        <div className="relative w-full flex-1 flex items-center justify-center my-4 z-10 min-h-[360px]">
          
          {/* VIEW A: PHOTOREALISTIC AI PHOTO TRY-ON */}
          {viewMode === "ai-photo" ? (
            <div className="relative w-64 aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-neutral-900">
              
              {(!imageLoaded || isLoading || !aiImageUrl) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-obsidian-300 bg-obsidian-800 z-10">
                  <div className="w-10 h-10 rounded-full border-2 border-white/5 border-t-gold-500 animate-spin mb-4" />
                  <span className="text-xs font-semibold text-gold-300 animate-pulse">Generating AI Photo...</span>
                  <p className="text-[10px] text-obsidian-300 mt-2 leading-normal max-w-[180px]">
                    Creating your try-on image!
                  </p>
                  <p className="text-[9px] text-obsidian-400 mt-2 leading-normal max-w-[180px]">
                    If it takes too long, click <strong>"Mannequin Sketch"</strong> above to see the colors instantly!
                  </p>
                </div>
              )}
              
              {aiImageUrl && (
                <img
                  src={aiImageUrl}
                  alt="AI generated outfit try-on"
                  onLoad={() => {
                    setImageLoaded(true);
                    setIsLoading(false);
                    // Double-safeguard: Clear safety timer as soon as image successfully loads
                    if (safetyTimerRef.current) {
                      clearTimeout(safetyTimerRef.current);
                      safetyTimerRef.current = null;
                    }
                  }}
                  onError={handleImageError}
                  className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
                    imageLoaded && !isLoading ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}

              {/* Watermark */}
              <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[8px] tracking-wider text-gold-200 uppercase font-sans font-bold">
                {fallbackStage === 2 ? "Style Preview" : "AI TRY-ON"}
              </div>
            </div>
          ) : (
            
            /* VIEW B: INTERACTIVE MANNEQUIN SVG SKETCH */
            <div className="relative w-60 h-[340px] flex items-center justify-center drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
              <svg
                viewBox="0 0 200 400"
                className="w-full h-full transition-transform duration-500 group-hover:scale-[1.01]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Silhouette paths */}
                <path
                  d="M100 40 C110 40, 115 50, 112 60 C110 70, 105 75, 100 75 C95 75, 90 70, 88 60 C85 50, 90 40, 100 40 Z"
                  fill="#222" stroke="#D4AF37" strokeWidth="0.75" opacity="0.3"
                />
                <path
                  d="M93 75 L107 75 L112 85 L145 98 C155 102, 160 112, 155 125 L145 180 L140 180 L148 125 L115 100 L85 100 L52 125 L60 180 L55 180 L45 125 C40 112, 45 102, 55 98 L88 85 Z"
                  fill="#222" stroke="#D4AF37" strokeWidth="0.75" opacity="0.3"
                />
                <path
                  d="M75 100 L125 100 C130 130, 125 160, 120 200 L80 200 C75 160, 70 130, 75 100 Z"
                  fill="#1A1A1A" stroke="#D4AF37" strokeWidth="0.5" opacity="0.25"
                />
                <path d="M80 200 L95 200 L93 360 L85 380 L75 380 L80 200 Z" fill="#222" stroke="#D4AF37" strokeWidth="0.5" opacity="0.2" />
                <path d="M120 200 L105 200 L107 360 L115 380 L125 380 L120 200 Z" fill="#222" stroke="#D4AF37" strokeWidth="0.5" opacity="0.2" />

                {/* 1. TOP OVERLAY */}
                <g id="TryOn-Top" className="transition-all duration-500 ease-in-out">
                  {gender === "women" ? (
                    <path
                      d="M82 85 C90 92, 110 92, 118 85 L140 102 L132 165 C122 170, 110 172, 100 172 C90 172, 78 170, 68 165 L60 102 Z"
                      fill={topColor} stroke="#FAF6F0" strokeWidth="0.5"
                    />
                  ) : (
                    <path
                      d="M85 85 L100 95 L115 85 L145 98 L138 175 L125 178 L100 170 L75 178 L62 175 L55 98 Z"
                      fill={topColor} stroke="#FAF6F0" strokeWidth="0.5"
                    />
                  )}
                  <path d="M85 85 L100 102 L115 85" stroke="#FAF6F0" strokeWidth="1" fill="none" opacity="0.4" />
                </g>

                {/* 2. BOTTOM OVERLAY */}
                <g id="TryOn-Bottom" className="transition-all duration-500 ease-in-out">
                  {gender === "women" ? (
                    <path d="M72 170 C85 168, 115 168, 128 170 L136 290 L64 290 Z" fill={bottomColor} stroke="#FAF6F0" strokeWidth="0.5" />
                  ) : (
                    <path d="M75 170 L125 170 L128 350 L110 350 L100 220 L90 350 L72 350 Z" fill={bottomColor} stroke="#FAF6F0" strokeWidth="0.5" />
                  )}
                </g>

                {/* 3. SHOES OVERLAY */}
                <g id="TryOn-Shoes" className="transition-all duration-500 ease-in-out">
                  <path d="M70 350 L84 350 L86 382 L65 382 Z" fill={shoesColor} stroke="#FAF6F0" strokeWidth="0.5" />
                  <path d="M130 350 L116 350 L114 382 L135 382 Z" fill={shoesColor} stroke="#FAF6F0" strokeWidth="0.5" />
                </g>

                {/* 4. ACCESSORY OVERLAY */}
                <g id="TryOn-Accessory" className="transition-all duration-500 ease-in-out">
                  <rect x="86" y="55" width="12" height="6" rx="2" fill={accessoryColor} stroke="#FAF6F0" strokeWidth="0.5" />
                  <rect x="102" y="55" width="12" height="6" rx="2" fill={accessoryColor} stroke="#FAF6F0" strokeWidth="0.5" />
                  <line x1="98" y1="58" x2="102" y2="58" stroke="#FAF6F0" strokeWidth="1" />
                  <path d="M136 172 L150 205 L132 205 Z" fill={accessoryColor} stroke="#FAF6F0" strokeWidth="0.5" opacity="0.9" />
                  <path d="M140 172 C140 162, 146 162, 146 172" stroke="#FAF6F0" strokeWidth="1" fill="none" />
                </g>
              </svg>
            </div>
          )}

        </div>

        {/* Palette Swatches */}
        <div className="w-full flex flex-col gap-2 z-10 mt-2">
          <p className="text-[10px] uppercase tracking-wider text-obsidian-400 font-semibold">Outfit Colors</p>
          <div className="flex gap-2 flex-wrap">
            {colorChips.map((chip, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-[10px] text-obsidian-200"
              >
                <span 
                  className="w-3 h-3 rounded-full border border-white/20 block"
                  style={{ backgroundColor: chip.color }}
                />
                <span className="font-semibold text-gold-300">{chip.type}:</span>
                <span className="truncate max-w-[80px] font-sans text-obsidian-300">{chip.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Uploaded Photo Polaroid Frame */}
      <div className="w-full lg:w-[300px] flex flex-col justify-between items-center glass-panel p-6 rounded-3xl relative overflow-hidden">
        <div className="w-full flex justify-between items-center mb-6">
          <span className="text-xs uppercase tracking-wider text-gold-300 font-semibold">Your Photo</span>
          <ImageIcon className="w-3.5 h-3.5 text-obsidian-400" />
        </div>

        {/* Elegant Polaroid Container */}
        <div className="w-full bg-white p-3.5 rounded shadow-[0_15px_30px_rgba(0,0,0,0.6)] border border-neutral-300 flex flex-col items-center justify-center transform rotate-[-1deg] hover:rotate-0 transition-transform duration-500 ease-in-out">
          <div className="w-full aspect-[4/5] bg-neutral-100 rounded-sm overflow-hidden relative flex flex-col items-center justify-center group border border-neutral-200">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt="Your uploaded profile"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-neutral-400">
                <div className="w-14 h-14 rounded-full bg-neutral-200 flex items-center justify-center mb-3">
                  <User className="w-7 h-7 text-neutral-400" />
                </div>
                <p className="text-xs font-serif italic font-semibold text-neutral-600 text-center">Silhouette Mode</p>
                <p className="text-[10px] text-neutral-500 text-center mt-1 leading-normal max-w-[150px]">
                  No photo uploaded. Using template mannequin.
                </p>
              </div>
            )}
            
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[8px] tracking-wider text-gold-200 uppercase font-sans">
              SOURCE
            </div>
          </div>
          
          <div className="mt-4 w-full text-center py-2 flex flex-col items-center border-t border-neutral-100 pt-3">
            <span className="font-editorial text-sm italic text-neutral-800 tracking-wide font-semibold">
              {profile.gender === 'women' ? 'Women Profile' : profile.gender === 'men' ? 'Men Profile' : 'Unisex Profile'}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-sans mt-0.5 font-bold">
              {profile.occasion || 'Casual'} Selection
            </span>
            {styleScore !== undefined && styleScore !== null && (
              <div className="mt-2 bg-neutral-900 border border-gold-500/30 text-[9px] font-sans font-bold text-gold-300 py-1 px-3 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wide">
                <Award className="w-3 h-3 text-gold-400" /> Score: {styleScore}/10
              </div>
            )}
          </div>
        </div>

        {/* Style Summary */}
        <div className="w-full mt-6 bg-white/5 border border-white/5 rounded-2xl p-4 text-xs">
          <h4 className="font-editorial italic text-gold-200 text-sm mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            Style Profile
          </h4>
          <div className="space-y-2 text-obsidian-300 font-sans leading-relaxed text-[11px]">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span>Body Fit:</span>
              <span className="font-medium text-gold-300 capitalize">{fit} fit</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span>Budget Plan:</span>
              <span className="font-medium text-gold-300">{profile.budget}</span>
            </div>
            <p className="text-obsidian-400 mt-2 text-[10px]">
              AI Photo Try-On generates an image combining your suggested garments with the body shape and facial appearance of your uploaded photo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
