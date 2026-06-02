import React, { useState } from "react";
import TryOnAvatar from "./TryOnAvatar";
import { 
  ShoppingBag, ExternalLink, RefreshCw, ChevronRight, Sparkles, 
  RotateCcw, Info, ShoppingCart, MessageSquare, Award, User, Upload
} from "lucide-react";

export default function OutfitRecommendations({ outfits, profile, styleScore, styleCritique, styleRating, onRegenerate, onReset, userApiKey, onUploadPhoto }) {
  const [activeTab, setActiveTab] = useState(0);
  const [customFeedback, setCustomFeedback] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const activeOutfit = outfits[activeTab] || outfits[0];

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!customFeedback.trim()) return;
    
    setIsRegenerating(true);
    try {
      await onRegenerate(customFeedback, activeTab);
      setCustomFeedback("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleInlineUpload = (e) => {
    const file = e.target.files[0];
    if (file && onUploadPhoto) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUploadPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!activeOutfit) {
    return (
      <div className="text-center p-12 glass-panel rounded-3xl">
        <div className="w-10 h-10 rounded-full border-2 border-white/5 border-t-gold-500 animate-spin mb-4 mx-auto" />
        <p className="text-obsidian-300 font-serif italic">Stylist preparing recommendations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-gold-400 font-semibold font-sans">AI Recommendations</span>
          <h2 className="text-3xl lg:text-4xl text-gold-100 font-serif font-light mt-1">Your Curated Outfits</h2>
        </div>
        
        <button
          onClick={onReset}
          className="btn-outline px-5 py-2.5 rounded-full flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Start Over
        </button>
      </div>

      {/* STYLE AUDIT DASHBOARD */}
      <div className="glass-panel-luxury p-6 md:p-8 rounded-3xl border border-gold-500/20 relative overflow-hidden space-y-6">
        {/* Ambient background gold glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          {/* Column 1: Before Image (User Photo) */}
          <div className="flex flex-col items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold font-sans">
              Base Style (Before)
            </span>
            <div className="w-32 md:w-36 aspect-[3/4] bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl flex items-center justify-center relative">
              {profile.photo ? (
                <img 
                  src={profile.photo} 
                  alt="Original profile base style" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <label className="flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-white/[0.02] w-full h-full transition-all group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleInlineUpload} 
                    className="hidden" 
                  />
                  <Upload className="w-6 h-6 text-gold-400 group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-[10px] text-gold-200 font-semibold uppercase tracking-wider">Upload Pic</span>
                  <span className="text-[8px] text-obsidian-400 mt-1 leading-normal">To Rate Style</span>
                </label>
              )}
              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] tracking-wider text-gold-200 uppercase font-sans">
                {profile.photo ? "Source Pic" : "Silhouette"}
              </div>
            </div>
          </div>
          
          {/* Column 2: Glowing Circular Style Score Ring */}
          <div className="flex flex-col items-center justify-center text-center px-4 relative min-w-[180px]">
            <span className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold font-sans mb-3">
              AI Style Rating
            </span>
            
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Circular SVG Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke="rgba(255,255,255,0.03)" 
                  strokeWidth="6" 
                  fill="transparent" 
                />
                {/* Gold Progress Track */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke="url(#goldGradient)" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray="263.89" 
                  strokeDashoffset={263.89 - (263.89 * (styleScore || 0)) / 10} 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                
                {/* Linear Gradients Definition */}
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C5A880" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#FAF6F0" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Central Text Digit */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-serif font-light text-gold-100 mt-1">
                  {styleScore ? styleScore.toFixed(1) : "—"}
                </span>
                <span className="text-[8px] uppercase tracking-widest text-gold-400 font-bold font-sans">
                  Score / 10
                </span>
              </div>
            </div>
            
            <div className="mt-3">
              <span className="text-[9px] uppercase tracking-[0.2em] font-sans font-bold px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-300">
                {styleScore >= 9 ? "Couture Level" : styleScore >= 8 ? "Highly Stylish" : styleScore >= 7 ? "Good Potential" : styleScore >= 5 ? "Fair Stylings" : "Needs Upgrading"}
              </span>
            </div>
          </div>
          
          {/* Column 3: Sleek Horizontal luxury category sliders & Critique */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gold-400 font-semibold font-sans block mb-1">
                Visual Style Critique
              </span>
              <p className="text-xs text-gold-200 italic font-serif leading-relaxed relative bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                "{styleCritique || "Using standard mannequin sketch. Upload a photo of your current outfit to receive a personalized stylist critique and detailed audit score!"}"
              </p>
            </div>
            
            {styleRating && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 pt-2">
                {[
                  { label: "Color Harmony", key: "colorHarmony" },
                  { label: "Fit & Silhouette", key: "fitSilhouette" },
                  { label: "Layering & Structure", key: "layeringStructure" },
                  { label: "Occasion Match", key: "occasionMatch" }
                ].map((category) => {
                  const ratingVal = styleRating[category.key] || 0;
                  return (
                    <div key={category.key} className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-sans font-semibold">
                        <span className="text-obsidian-400 uppercase tracking-wider">{category.label}</span>
                        <span className="text-gold-300">{ratingVal.toFixed(1)}/10</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/10">
                        <div 
                          className="h-full bg-luxury-gold-gradient rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${ratingVal * 10}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Action text */}
            <p className="text-[9px] text-obsidian-400 uppercase tracking-widest font-sans font-bold flex items-center gap-1.5 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-gold-500 animate-pulse" />
              UPGRADE IN PROGRESS: Recommended outfits below are meticulously styled to reach a perfect 10/10!
            </p>
          </div>
        </div>
      </div>

      {/* Tabs navigation for different outfits */}
      <div className="flex border-b border-white/5 overflow-x-auto gap-2 pb-1 scrollbar-none">
        {outfits.map((outfit, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(index)}
            className={`px-5 py-3 rounded-t-xl transition-all duration-300 text-xs font-sans font-medium uppercase tracking-wider whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === index 
                ? "border-gold-500 bg-gold-500/5 text-gold-100 font-semibold" 
                : "border-transparent text-obsidian-400 hover:text-obsidian-200"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${activeTab === index ? 'bg-gold-500' : 'bg-transparent'}`} />
            {outfit.name || `Look ${index + 1}`}
          </button>
        ))}
      </div>

      {/* Primary Lookbook Area */}
      <div className="grid lg:grid-cols-12 gap-10 items-start">
        {/* Left Side: Try On Mannequin + User Photo Upload */}
        <div className="lg:col-span-7 w-full">
          <TryOnAvatar 
            profile={profile} 
            activeOutfit={activeOutfit} 
            userApiKey={userApiKey} 
            styleScore={styleScore}
            styleCritique={styleCritique}
          />
        </div>

        {/* Right Side: Outfit details */}
        <div className="lg:col-span-5 space-y-8 glass-panel-luxury p-8 rounded-3xl relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Header Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[9px] uppercase tracking-wider text-gold-400 font-semibold border border-gold-500/30 px-2 py-0.5 rounded-md bg-gold-500/5 font-sans">
                {profile.occasion || 'Casual'}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-obsidian-400 font-semibold border border-white/10 px-2 py-0.5 rounded-md font-sans">
                {profile.fitPreference || 'Relaxed'} fit
              </span>
            </div>
            
            <h3 className="text-2xl lg:text-3xl text-gold-100 font-serif font-light leading-tight">
              {activeOutfit.name}
            </h3>
            
            <p className="text-xs text-obsidian-300 font-sans leading-relaxed mt-3">
              {activeOutfit.description}
            </p>
          </div>

          {/* Outfit Items Breakdown */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-wider text-gold-300 font-semibold flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-gold-500" />
              Outfit Items
            </h4>
            
            <div className="space-y-3">
              {activeOutfit.items?.map((item, index) => (
                <div key={index} className="glass-panel p-4 rounded-xl border border-white/5 hover:border-gold-500/25 transition-all group">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full border border-white/20 block flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-obsidian-400 leading-none">{item.type}</span>
                        <p className="text-xs font-semibold text-gold-200 truncate mt-0.5">{item.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shopping affiliate action links */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <a 
                      href={item.amazonURL} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-white/5 border border-white/5 hover:border-amber-500/40 hover:bg-amber-500/5 text-obsidian-300 hover:text-amber-400 py-1.5 px-2 rounded-lg text-[9px] font-sans font-semibold flex items-center justify-center gap-1.5 transition-all leading-none"
                    >
                      Amazon <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <a 
                      href={item.myntraURL} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-white/5 border border-white/5 hover:border-pink-500/40 hover:bg-pink-500/5 text-obsidian-300 hover:text-pink-400 py-1.5 px-2 rounded-lg text-[9px] font-sans font-semibold flex items-center justify-center gap-1.5 transition-all leading-none"
                    >
                      Myntra <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <a 
                      href={item.ajioURL} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-white/5 border border-white/5 hover:border-blue-500/40 hover:bg-blue-500/5 text-obsidian-300 hover:text-blue-400 py-1.5 px-2 rounded-lg text-[9px] font-sans font-semibold flex items-center justify-center gap-1.5 transition-all leading-none"
                    >
                      Ajio <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    <a 
                      href={item.flipkartURL} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="bg-white/5 border border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/5 text-obsidian-300 hover:text-indigo-400 py-1.5 px-2 rounded-lg text-[9px] font-sans font-semibold flex items-center justify-center gap-1.5 transition-all leading-none"
                    >
                      Flipkart <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Style Notes from Stylist */}
          <div className="border-l-2 border-gold-500 bg-gold-500/5 p-4 rounded-r-xl">
            <span className="text-[9px] uppercase tracking-wider text-gold-400 font-semibold font-sans">Stylist Tip</span>
            <p className="text-xs italic text-gold-200 mt-1.5 leading-relaxed font-serif">
              "{activeOutfit.styleNotes}"
            </p>
          </div>

          {/* Refine / Regenerate This Look */}
          <form onSubmit={handleFeedbackSubmit} className="pt-4 border-t border-white/5">
            <h4 className="text-xs uppercase tracking-wider text-gold-300 font-semibold flex items-center gap-2 mb-3">
              <MessageSquare className="w-3.5 h-3.5 text-gold-500" />
              Request Outfit Changes
            </h4>
            <div className="relative">
              <input
                type="text"
                value={customFeedback}
                onChange={(e) => setCustomFeedback(e.target.value)}
                placeholder="e.g. Make this look darker, or use jeans instead"
                disabled={isRegenerating}
                className="w-full luxury-input rounded-full py-3 pl-4 pr-12 text-xs"
              />
              <button
                type="submit"
                disabled={isRegenerating || !customFeedback.trim()}
                className={`absolute right-1.5 top-1.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  customFeedback.trim() && !isRegenerating 
                    ? "bg-gold-500 text-obsidian-900 shadow-md hover:scale-105" 
                    : "bg-white/5 text-obsidian-500"
                }`}
              >
                {isRegenerating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-obsidian-400 mt-2 font-sans">
              Tell the AI what to change (e.g. "Use a black leather jacket"). The AI will adjust the outfit details and update your try-on photo!
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
