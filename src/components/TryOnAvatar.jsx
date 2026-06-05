import React, { useState, useEffect, useRef } from "react";
import { User, Sparkles, Shirt, ChevronRight, ZoomIn } from "lucide-react";
import { generateTryOnFromSelfie, buildPollinationsUrl } from "../services/stylingService";

// Editorial editorial fallback images per occasion
const UNSPLASH_REVIEWS = {
  casual: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=80",
  office: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=400&auto=format&fit=crop&q=80",
  party: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&auto=format&fit=crop&q=80",
  "date night": "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&auto=format&fit=crop&q=80",
  gym: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80"
};

// Build a concise outfit description for the image generation prompt
function buildOutfitDescription(outfit, profile) {
  if (!outfit?.items?.length) return outfit?.tryOnImagePrompt || "";

  const items = outfit.items.map(i => `${i.name} (${i.color})`).join(", ");
  const gender = (profile?.gender || "person").toLowerCase();
  const occasion = profile?.occasion || "casual";
  const fit = profile?.fitPreference || "regular";

  return `Replace ONLY the clothing. Keep the same person, face, hair, skin tone, pose, background, and lighting.
New outfit: ${items}.
Style: ${fit} fit, suitable for ${occasion}.
${outfit.styleNotes ? `Styling tip: ${outfit.styleNotes}` : ""}
Make it look like a real ${gender === "women" ? "woman" : gender === "men" ? "man" : "person"}'s mirror selfie photo wearing these exact clothes.`;
}

export default function TryOnAvatar({ profile, activeOutfit, userApiKey, styleScore, styleCritique }) {
  const [afterImageUrl, setAfterImageUrl] = useState("");
  const [afterImageLoaded, setAfterImageLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState("idle"); // idle, gemini, imagen, fallback, done, error
  const [lightboxOpen, setLightboxOpen] = useState(null); // "before" | "after" | null
  const [outfitKey, setOutfitKey] = useState("");

  // Mannequin color chips
  const topColor = activeOutfit?.items?.find(i => i.type === "Top")?.color || "#C5A880";
  const bottomColor = activeOutfit?.items?.find(i => i.type === "Bottom")?.color || "#1F2937";

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const safetyTimerRef = useRef(null);
  const afterImageLoadedRef = useRef(false); // avoid stale closure in timeout

  useEffect(() => {
    isMountedRef.current = true;
    afterImageLoadedRef.current = false;
    return () => {
      isMountedRef.current = false;
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, []);

  // Generate new "After" image whenever outfit changes
  useEffect(() => {
    if (!activeOutfit?.name) return;
    const key = `${activeOutfit.name}-${profile?.gender}`;
    if (key === outfitKey) return; // Don't regenerate same outfit
    setOutfitKey(key);

    setAfterImageUrl("");
    setAfterImageLoaded(false);
    setIsGenerating(true);
    setGenerationStage("gemini");

    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    async function generate() {
      try {
        // Gemini Vision describes person → Pollinations Flux generates After image
        const urlOrDataUrl = await generateTryOnFromSelfie(
          profile?.photo && profile.photo.startsWith("data:") ? profile.photo : null,
          activeOutfit?.items || [],
          activeOutfit?.name || "outfit",
          profile?.occasion || "casual",
          userApiKey
        );
        if (isMountedRef.current) {
          setAfterImageUrl(urlOrDataUrl);
          setGenerationStage("done");
          // If it's already a data URL (e.g. from a paid Gemini key), mark loaded
          if (urlOrDataUrl.startsWith("data:")) {
            setAfterImageLoaded(true);
            setIsGenerating(false);
          }
          // If it's an HTTP URL (Pollinations), image onLoad will fire
        }
      } catch (err) {
        console.warn("generateTryOnFromSelfie failed:", err);
        // Emergency fallback — Pollinations with outfit name only
        const fallbackUrl = buildPollinationsUrl(
          `Fashion photo of a person wearing ${activeOutfit?.name || "stylish outfit"}, photorealistic, 4k`,
          activeOutfit?.name
        );
        if (isMountedRef.current) {
          setAfterImageUrl(fallbackUrl);
          setGenerationStage("fallback");
        }
      }

      // Safety timeout — if image takes too long, show curated Unsplash fashion photo
      safetyTimerRef.current = setTimeout(() => {
        if (isMountedRef.current && !afterImageLoadedRef.current) {
          const fallbackImg = UNSPLASH_REVIEWS[profile?.occasion] || UNSPLASH_REVIEWS.casual;
          setAfterImageUrl(fallbackImg);
          afterImageLoadedRef.current = true;
          setAfterImageLoaded(true);
          setIsGenerating(false);
          setGenerationStage("done");
        }
      }, 20000);
    }



    generate();
  }, [activeOutfit?.name, userApiKey]);

  const handleAfterImageLoad = () => {
    afterImageLoadedRef.current = true;
    setAfterImageLoaded(true);
    setIsGenerating(false);
    setGenerationStage("done");
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  const handleAfterImageError = () => {
    const fallback = UNSPLASH_REVIEWS[profile?.occasion] || UNSPLASH_REVIEWS.casual;
    setAfterImageUrl(fallback);
    afterImageLoadedRef.current = true;
    setAfterImageLoaded(true);
    setIsGenerating(false);
    setGenerationStage("done");
  };

  const stageLabel = {
    idle: "Preparing...",
    gemini: "AI analyzing your selfie...",
    imagen: "Generating outfit...",
    fallback: "Loading preview...",
    done: "AI Try-On",
    error: "Style Preview"
  };

  const colorChips = activeOutfit?.items?.map(item => ({
    name: item.name,
    color: item.color,
    type: item.type
  })) || [];

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* ── Before / After Panel ──────────────────────────────── */}
      <div className="glass-panel-luxury rounded-3xl border border-gold-500/15 overflow-hidden relative">

        {/* Header Row */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold-500 animate-pulse" />
            <span className="text-xs uppercase tracking-wider text-gold-300 font-semibold font-sans">
              AI Virtual Try-On
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-widest text-obsidian-400 font-sans font-bold">
            {stageLabel[generationStage] || "Generating..."}
          </span>
        </div>

        {/* Side-by-side Before / After */}
        <div className="grid grid-cols-2 gap-0 relative min-h-[400px]">

          {/* ─ BEFORE (User Selfie) ─ */}
          <div className="relative flex flex-col items-center justify-center bg-black/30 border-r border-white/5 group">
            {/* Label */}
            <div className="absolute top-3 left-3 z-10 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="text-[9px] uppercase font-bold tracking-widest text-white/80 font-sans">Before</span>
            </div>

            <div
              className="w-full h-full flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => profile?.photo && setLightboxOpen("before")}
            >
              {profile?.photo ? (
                <img
                  src={profile.photo}
                  alt="Your uploaded selfie"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  style={{ minHeight: 380 }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-4 min-h-[380px]">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-obsidian-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-obsidian-300 font-sans">No selfie uploaded</p>
                    <p className="text-[10px] text-obsidian-500 mt-1 leading-normal">Upload your photo in Step 1 to see your personalized AI try-on</p>
                  </div>
                </div>
              )}
            </div>

            {/* Style score chip on before */}
            {styleScore && (
              <div className="absolute bottom-3 right-3 z-10 bg-black/80 backdrop-blur-md border border-gold-500/30 px-2.5 py-1 rounded-full">
                <span className="text-[9px] font-bold text-gold-300 font-sans uppercase tracking-wider">
                  Score: {styleScore}/10
                </span>
              </div>
            )}

            {profile?.photo && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 pointer-events-none">
                <ZoomIn className="w-5 h-5 text-white/70" />
              </div>
            )}
          </div>

          {/* ─ AFTER (AI Generated) ─ */}
          <div className="relative flex flex-col items-center justify-center bg-black/20 group">
            {/* Label */}
            <div className="absolute top-3 right-3 z-10 bg-gold-500/90 backdrop-blur-md border border-gold-400/50 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sparkles className="w-2.5 h-2.5 text-obsidian-900" />
              <span className="text-[9px] uppercase font-bold tracking-widest text-obsidian-900 font-sans">After</span>
            </div>

            {/* Loading skeleton */}
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-obsidian-950/80 z-10 gap-4 px-6">
                {/* Animated pulsing outfit shapes */}
                <div className="relative w-20 h-24 flex-shrink-0">
                  <div
                    className="absolute inset-0 rounded-xl animate-pulse opacity-40"
                    style={{ background: `linear-gradient(135deg, ${topColor}, ${bottomColor})` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shirt className="w-8 h-8 text-gold-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white/5 border-t-gold-500 animate-spin mx-auto" />
                  <p className="text-[10px] text-gold-300 font-semibold uppercase tracking-wider font-sans animate-pulse">
                    {stageLabel[generationStage]}
                  </p>
                  <p className="text-[9px] text-obsidian-400 font-sans leading-relaxed max-w-[150px] mx-auto">
                    {profile?.photo
                      ? "Swapping outfit while keeping your face & style"
                      : "Generating styled outfit preview"}
                  </p>
                </div>
              </div>
            )}

            {/* Generated image */}
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => afterImageLoaded && setLightboxOpen("after")}
            >
              {afterImageUrl ? (
                <img
                  src={afterImageUrl}
                  alt="AI outfit try-on result"
                  onLoad={handleAfterImageLoad}
                  onError={handleAfterImageError}
                  className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.02] ${
                    afterImageLoaded && !isGenerating ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ minHeight: 380 }}
                />
              ) : !isGenerating ? (
                <div className="flex flex-col items-center justify-center p-8 text-center gap-4 min-h-[380px]">
                  <Sparkles className="w-8 h-8 text-gold-400/40" />
                  <p className="text-xs text-obsidian-400 font-sans">AI photo will appear here</p>
                </div>
              ) : null}
            </div>

            {afterImageLoaded && !isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 pointer-events-none">
                <ZoomIn className="w-5 h-5 text-white/70" />
              </div>
            )}
          </div>

          {/* Center divider arrow */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-gold-500 border-2 border-obsidian-950 flex items-center justify-center shadow-lg shadow-gold-500/30">
            <ChevronRight className="w-4 h-4 text-obsidian-900" />
          </div>
        </div>

        {/* Bottom: Outfit color palette */}
        <div className="px-6 py-4 border-t border-white/5 flex flex-wrap items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-obsidian-400 font-bold font-sans mr-1">Outfit Colors:</span>
          {colorChips.map((chip, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-[10px] text-obsidian-200"
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/20 block flex-shrink-0"
                style={{ backgroundColor: chip.color }}
              />
              <span className="font-semibold text-gold-400 hidden sm:inline">{chip.type}:</span>
              <span className="truncate max-w-[80px] font-sans text-obsidian-300">{chip.name}</span>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="px-6 pb-4">
          <p className="text-[9px] text-obsidian-500 font-sans leading-relaxed">
            <span className="text-gold-500/60">✦</span> AI virtual try-on powered by Google Gemini.
            {profile?.photo
              ? " Your face, hair, and skin tone are preserved — only the clothing is replaced."
              : " Upload your selfie in Step 1 for a personalized try-on showing you in the outfit."}
          </p>
        </div>
      </div>

      {/* ── Mannequin Color Sketch (compact) ─────────────────── */}
      <details className="glass-panel rounded-2xl border border-white/5 overflow-hidden group">
        <summary className="px-5 py-3.5 flex items-center justify-between cursor-pointer select-none list-none">
          <div className="flex items-center gap-2">
            <Shirt className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gold-300 font-sans">Color Silhouette</span>
          </div>
          <ChevronRight className="w-4 h-4 text-obsidian-400 group-open:rotate-90 transition-transform" />
        </summary>

        <div className="px-5 pb-5 flex items-center justify-center">
          <svg
            viewBox="0 0 200 400"
            className="w-36 h-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Head silhouette */}
            <path
              d="M100 40 C110 40, 115 50, 112 60 C110 70, 105 75, 100 75 C95 75, 90 70, 88 60 C85 50, 90 40, 100 40 Z"
              fill="#1A1A1A" stroke="#D4AF37" strokeWidth="0.75" opacity="0.5"
            />
            {/* Torso + arms silhouette */}
            <path
              d="M93 75 L107 75 L112 85 L145 98 C155 102, 160 112, 155 125 L145 180 L140 180 L148 125 L115 100 L85 100 L52 125 L60 180 L55 180 L45 125 C40 112, 45 102, 55 98 L88 85 Z"
              fill="#1A1A1A" stroke="#D4AF37" strokeWidth="0.75" opacity="0.3"
            />

            {/* TOP overlay */}
            <path
              d={(profile?.gender === "women")
                ? "M82 85 C90 92, 110 92, 118 85 L140 102 L132 165 C122 170, 110 172, 100 172 C90 172, 78 170, 68 165 L60 102 Z"
                : "M85 85 L100 95 L115 85 L145 98 L138 175 L125 178 L100 170 L75 178 L62 175 L55 98 Z"}
              fill={topColor} stroke="#FAF6F0" strokeWidth="0.5" opacity="0.85"
            />

            {/* BOTTOM overlay */}
            <path
              d={(profile?.gender === "women")
                ? "M72 170 C85 168, 115 168, 128 170 L136 310 L64 310 Z"
                : "M75 170 L125 170 L128 370 L110 370 L100 220 L90 370 L72 370 Z"}
              fill={bottomColor} stroke="#FAF6F0" strokeWidth="0.5" opacity="0.85"
            />
          </svg>

          <div className="ml-5 space-y-3 flex-1">
            {colorChips.map((chip, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                <span
                  className="w-4 h-4 rounded-sm border border-white/20 block flex-shrink-0 shadow"
                  style={{ backgroundColor: chip.color }}
                />
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-obsidian-400 font-bold leading-none">{chip.type}</p>
                  <p className="text-[11px] text-gold-200 font-sans leading-snug">{chip.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* ── Lightbox ──────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setLightboxOpen(null)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-10 left-0 right-0 flex justify-between items-center px-1">
              <span className={`text-xs font-bold uppercase tracking-widest font-sans px-3 py-1 rounded-full ${
                lightboxOpen === "before" ? "bg-white/10 text-white/70" : "bg-gold-500/90 text-obsidian-900"
              }`}>
                {lightboxOpen === "before" ? "Before" : "After — AI Try-On"}
              </span>
              <button
                onClick={() => setLightboxOpen(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white"
              >✕</button>
            </div>
            <img
              src={lightboxOpen === "before" ? profile?.photo : afterImageUrl}
              alt={lightboxOpen === "before" ? "Before selfie" : "After AI try-on"}
              className="w-full rounded-2xl shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
