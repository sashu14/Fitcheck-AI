import React, { useState, useEffect, useRef } from "react";
import { User, Sparkles, Shirt, ChevronRight, ZoomIn, ShoppingBag } from "lucide-react";
import { generateTryOnFromSelfie } from "../services/stylingService";

export default function TryOnAvatar({ profile, activeOutfit, userApiKey, styleScore, styleCritique }) {
  const [afterImageUrl, setAfterImageUrl] = useState("");
  const [afterImageLoaded, setAfterImageLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(null);
  const [outfitKey, setOutfitKey] = useState("");

  const topColor    = activeOutfit?.items?.find(i => i.type === "Top")?.color    || "#C5A880";
  const bottomColor = activeOutfit?.items?.find(i => i.type === "Bottom")?.color || "#1F2937";

  const isMountedRef         = useRef(true);
  const safetyTimerRef       = useRef(null);
  const afterImageLoadedRef  = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  // Re-generate whenever outfit changes
  useEffect(() => {
    if (!activeOutfit?.name) return;
    const key = `${activeOutfit.name}-${profile?.gender}`;
    if (key === outfitKey) return;
    setOutfitKey(key);

    setAfterImageUrl("");
    setAfterImageLoaded(false);
    afterImageLoadedRef.current = false;
    setIsGenerating(true);

    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    async function generate() {
      try {
        const result = await generateTryOnFromSelfie(
          profile?.photo && profile.photo.startsWith("data:") ? profile.photo : null,
          activeOutfit?.items || [],
          activeOutfit?.name || "outfit",
          profile?.occasion || "casual",
          userApiKey
        );
        if (isMountedRef.current) {
          setAfterImageUrl(result);
          // data URLs are already loaded; HTTP URLs need onLoad
          if (result.startsWith("data:")) {
            afterImageLoadedRef.current = true;
            setAfterImageLoaded(true);
            setIsGenerating(false);
          }
        }
      } catch (err) {
        console.warn("Try-on failed:", err);
        if (isMountedRef.current) {
          // Show the outfit board instead
          afterImageLoadedRef.current = true;
          setAfterImageLoaded(true);
          setIsGenerating(false);
        }
      }

      // Safety: if the image URL hasn't loaded in 15s, stop spinner
      safetyTimerRef.current = setTimeout(() => {
        if (isMountedRef.current && !afterImageLoadedRef.current) {
          afterImageLoadedRef.current = true;
          setAfterImageLoaded(true);
          setIsGenerating(false);
        }
      }, 15000);
    }

    generate();
  }, [activeOutfit?.name, userApiKey]);

  const handleLoad = () => {
    afterImageLoadedRef.current = true;
    setAfterImageLoaded(true);
    setIsGenerating(false);
    if (safetyTimerRef.current) { clearTimeout(safetyTimerRef.current); safetyTimerRef.current = null; }
  };

  const handleError = () => {
    // Image URL failed → show outfit board
    afterImageLoadedRef.current = true;
    setAfterImageLoaded(true);
    setAfterImageUrl(""); // clear broken URL → fall through to outfit board
    setIsGenerating(false);
    if (safetyTimerRef.current) { clearTimeout(safetyTimerRef.current); safetyTimerRef.current = null; }
  };

  const colorChips = activeOutfit?.items?.map(i => ({ name: i.name, color: i.color, type: i.type })) || [];

  // ── Outfit Board — always shows the CORRECT outfit ──────────
  const OutfitBoard = () => {
    const items = activeOutfit?.items || [];
    const top    = items.find(i => i.type === "Top");
    const bottom = items.find(i => i.type === "Bottom");
    const shoes  = items.find(i => i.type === "Shoes");
    const acc    = items.find(i => i.type === "Accessory");

    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-5"
           style={{ minHeight: 400, background: "linear-gradient(135deg, #0A0A0A 0%, #111 100%)" }}>
        
        {/* Outfit name */}
        <div className="text-center mb-1">
          <p className="text-[9px] uppercase tracking-[0.2em] text-gold-400 font-bold font-sans">Outfit Preview</p>
          <p className="text-sm font-serif text-gold-100 leading-tight mt-0.5">{activeOutfit?.name}</p>
        </div>

        {/* Outfit figure with actual colors */}
        <div className="relative flex flex-col items-center gap-0 select-none" style={{ width: 160 }}>
          {/* Head */}
          <div className="w-10 h-10 rounded-full border-2 border-obsidian-700 bg-obsidian-800 mb-1 relative overflow-hidden">
            {profile?.photo ? (
              <img src={profile.photo} alt="" className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-5 h-5 text-obsidian-500" />
              </div>
            )}
          </div>

          {/* TOP garment */}
          {top && (
            <div className="w-full rounded-t-xl shadow-lg flex items-center justify-center py-4"
                 style={{ backgroundColor: top.color, minHeight: 80 }}>
              <div className="text-center px-2">
                <p className="text-[8px] font-bold uppercase tracking-wider leading-none"
                   style={{ color: isLight(top.color) ? "#111" : "#fff", opacity: 0.9 }}>
                  {top.type}
                </p>
                <p className="text-[10px] font-semibold mt-0.5 leading-tight"
                   style={{ color: isLight(top.color) ? "#222" : "#f0f0f0" }}>
                  {top.name}
                </p>
              </div>
            </div>
          )}

          {/* BOTTOM garment */}
          {bottom && (
            <div className="w-full shadow-lg flex items-center justify-center py-5"
                 style={{ backgroundColor: bottom.color, minHeight: 90 }}>
              <div className="text-center px-2">
                <p className="text-[8px] font-bold uppercase tracking-wider leading-none"
                   style={{ color: isLight(bottom.color) ? "#111" : "#fff", opacity: 0.9 }}>
                  {bottom.type}
                </p>
                <p className="text-[10px] font-semibold mt-0.5 leading-tight"
                   style={{ color: isLight(bottom.color) ? "#222" : "#f0f0f0" }}>
                  {bottom.name}
                </p>
              </div>
            </div>
          )}

          {/* SHOES */}
          {shoes && (
            <div className="w-4/5 rounded-b-xl shadow flex items-center justify-center py-2"
                 style={{ backgroundColor: shoes.color, minHeight: 30 }}>
              <p className="text-[8px] font-semibold text-center px-1 leading-tight"
                 style={{ color: isLight(shoes.color) ? "#111" : "#eee" }}>
                {shoes.name}
              </p>
            </div>
          )}
        </div>

        {/* Accessory chip */}
        {acc && (
          <div className="flex items-center gap-1.5 mt-1 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: acc.color }} />
            <span className="text-[9px] text-gold-300 font-sans font-semibold">{acc.name}</span>
          </div>
        )}

        {/* Style notes */}
        {activeOutfit?.styleNotes && (
          <p className="text-[9px] text-obsidian-400 font-sans text-center leading-relaxed px-4 italic mt-1 max-w-[200px]">
            "{activeOutfit.styleNotes}"
          </p>
        )}

        <p className="text-[8px] text-obsidian-600 font-sans mt-1">
          ✦ Outfit board • colors match exactly
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* ── Before / After Panel ─────────────────────────────── */}
      <div className="glass-panel-luxury rounded-3xl border border-gold-500/15 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-xs uppercase tracking-wider text-gold-300 font-semibold font-sans">AI Virtual Try-On</span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-obsidian-400 font-sans font-bold">
            {isGenerating ? "Generating..." : "AI Try-On"}
          </span>
        </div>

        {/* Side-by-side */}
        <div className="grid grid-cols-2 gap-0 relative" style={{ minHeight: 420 }}>

          {/* BEFORE */}
          <div className="relative flex flex-col items-center justify-center bg-black/30 border-r border-white/5 group cursor-pointer"
               onClick={() => profile?.photo && setLightboxOpen("before")}>
            <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full">
              <span className="text-[9px] uppercase font-bold tracking-widest text-white/80 font-sans">Before</span>
            </div>
            {profile?.photo ? (
              <img src={profile.photo} alt="Before selfie"
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                   style={{ minHeight: 380 }} />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center gap-4 min-h-[380px]">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-obsidian-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-obsidian-300 font-sans">No selfie uploaded</p>
                  <p className="text-[10px] text-obsidian-500 mt-1 leading-normal">Upload your photo in Step 1</p>
                </div>
              </div>
            )}
            {styleScore && (
              <div className="absolute bottom-3 right-3 z-10 bg-black/80 backdrop-blur-md border border-gold-500/30 px-2.5 py-1 rounded-full">
                <span className="text-[9px] font-bold text-gold-300 font-sans uppercase tracking-wider">Score: {styleScore}/10</span>
              </div>
            )}
          </div>

          {/* AFTER */}
          <div className="relative flex flex-col items-center justify-center bg-black/20 group">
            {/* Gold AFTER badge */}
            <div className="absolute top-3 right-3 z-10 bg-gold-500/90 backdrop-blur-md border border-gold-400/50 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-2.5 h-2.5 text-obsidian-900" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-obsidian-900 font-sans">After</span>
            </div>

            {/* Spinner while generating */}
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-obsidian-950/80 z-10 gap-4">
                <div className="w-10 h-10 rounded-xl animate-pulse flex items-center justify-center"
                     style={{ background: `linear-gradient(135deg, ${topColor}, ${bottomColor})` }}>
                  <Shirt className="w-5 h-5 text-white/70 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <div className="w-7 h-7 rounded-full border-2 border-white/5 border-t-gold-500 animate-spin mx-auto" />
                  <p className="text-[10px] text-gold-300 font-semibold uppercase tracking-wider font-sans animate-pulse">
                    {profile?.photo ? "Styling your photo..." : "Building outfit..."}
                  </p>
                </div>
              </div>
            )}

            {/* If we got a real image URL from Gemini — show it */}
            {afterImageUrl && !isGenerating && (
              <div className="w-full h-full overflow-hidden cursor-pointer"
                   onClick={() => afterImageLoaded && setLightboxOpen("after")}>
                <img src={afterImageUrl}
                     alt="AI outfit try-on"
                     onLoad={handleLoad}
                     onError={handleError}
                     className={`w-full h-full object-cover transition-opacity duration-500 group-hover:scale-[1.02] ${afterImageLoaded ? "opacity-100" : "opacity-0"}`}
                     style={{ minHeight: 380 }} />
              </div>
            )}

            {/* Outfit Board — shows when no real image or image failed */}
            {!isGenerating && !afterImageUrl && (
              <div className="w-full h-full" style={{ minHeight: 380 }}>
                <OutfitBoard />
              </div>
            )}
          </div>

          {/* Center Arrow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-gold-500 border-2 border-obsidian-950 flex items-center justify-center shadow-lg shadow-gold-500/30">
            <ChevronRight className="w-4 h-4 text-obsidian-900" />
          </div>
        </div>

        {/* Color chips */}
        <div className="px-6 py-4 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-obsidian-400 font-bold font-sans mr-1">Outfit Colors:</span>
          {colorChips.map((chip, idx) => (
            <div key={idx} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-[10px] text-obsidian-200">
              <span className="w-2.5 h-2.5 rounded-full border border-white/20 block flex-shrink-0" style={{ backgroundColor: chip.color }} />
              <span className="font-semibold text-gold-400 hidden sm:inline">{chip.type}:</span>
              <span className="truncate max-w-[80px] font-sans text-obsidian-300">{chip.name}</span>
            </div>
          ))}
        </div>

        <div className="px-6 pb-4">
          <p className="text-[9px] text-obsidian-500 font-sans leading-relaxed">
            <span className="text-gold-500/60">✦</span> The After panel shows the exact recommended outfit.
            {profile?.photo ? " When AI image generation is available, it will show you wearing the clothes." : " Upload your selfie for a personalized try-on."}
          </p>
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
             onClick={() => setLightboxOpen(null)}>
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-10 left-0 right-0 flex justify-between items-center px-1">
              <span className={`text-xs font-bold uppercase tracking-widest font-sans px-3 py-1 rounded-full ${lightboxOpen === "before" ? "bg-white/10 text-white/70" : "bg-gold-500/90 text-obsidian-900"}`}>
                {lightboxOpen === "before" ? "Before" : "After — AI Try-On"}
              </span>
              <button onClick={() => setLightboxOpen(null)}
                      className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white">✕</button>
            </div>
            <img src={lightboxOpen === "before" ? profile?.photo : afterImageUrl}
                 alt={lightboxOpen}
                 className="w-full rounded-2xl shadow-2xl border border-white/10" />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: is a hex color light or dark?
function isLight(hex) {
  if (!hex) return false;
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0,2)||"88",16);
  const g = parseInt(h.slice(2,4)||"88",16);
  const b = parseInt(h.slice(4,6)||"88",16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}
