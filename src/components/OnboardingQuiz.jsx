import React, { useState } from "react";
import { 
  Camera, Upload, ArrowRight, ArrowLeft, Check, Sparkles, User, 
  Briefcase, Heart, Dumbbell, Wine, Coffee
} from "lucide-react";

const OCCASIONS = [
  { id: "casual", label: "Casual", subtitle: "Out & About", icon: Coffee },
  { id: "office", label: "Office", subtitle: "Work & Boardrooms", icon: Briefcase },
  { id: "party", label: "Party", subtitle: "Clubs & Events", icon: Wine },
  { id: "date night", label: "Date Night", subtitle: "Dinners & Dates", icon: Heart },
  { id: "gym", label: "Gym", subtitle: "Workout & Sports", icon: Dumbbell }
];

const BUDGETS = [
  { id: "₹500–₹1000", label: "Affordable Plan", price: "₹500 – ₹1000" },
  { id: "₹1000–₹3000", label: "Mid-Range Plan", price: "₹1000 – ₹3000" },
  { id: "₹3000–₹7000", label: "Premium Plan", price: "₹3000 – ₹7000" },
  { id: "₹7000+", label: "Luxury Plan", price: "₹7000+" }
];

const COLOR_CHIPS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FAF9F6" },
  { name: "Gold / Beige", hex: "#C5A880" },
  { name: "Navy Blue", hex: "#000080" },
  { name: "Emerald Green", hex: "#046A38" },
  { name: "Ruby Red", hex: "#9B111E" },
  { name: "Gray", hex: "#36454F" },
  { name: "Brown / Tan", hex: "#C19A6B" }
];

export default function OnboardingQuiz({ onSubmit }) {
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState(null);
  const [photoName, setPhotoName] = useState("");
  const [gender, setGender] = useState("unisex");
  const [fitPreference, setFitPreference] = useState("relaxed");
  const [occasion, setOccasion] = useState("casual");
  const [budget, setBudget] = useState("₹1000–₹3000");
  const [preferredColors, setPreferredColors] = useState(["Black", "Gold / Beige"]);
  const [avoidColors, setAvoidColors] = useState([]);

  // File Upload handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result); // Base64 url
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorToggle = (color, list, setList) => {
    if (list.includes(color)) {
      setList(list.filter(c => c !== color));
    } else {
      setList([...list, color]);
    }
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      photo,
      gender,
      fitPreference,
      occasion,
      budget,
      preferredColors,
      avoidColors
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="w-full max-w-4xl mx-auto glass-panel-luxury rounded-3xl p-8 lg:p-12 relative overflow-hidden animate-fade-in">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/5 rounded-full blur-[80px] pointer-events-none" />
      
      {/* Quiz Progress Header */}
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
        <div>
          <span className="text-xs uppercase tracking-wider text-gold-400 font-semibold font-sans">Outfit Quiz</span>
          <h2 className="text-2xl lg:text-3xl text-gold-100 mt-1 font-serif font-light">
            {step === 1 && "Choose Your Photo Mode"}
            {step === 2 && "Gender & Body Fit"}
            {step === 3 && "Occasion & Budget"}
            {step === 4 && "Preferred Colors"}
          </h2>
        </div>
        <div className="text-xs font-sans text-obsidian-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
          Step <span className="text-gold-300 font-bold">{step}</span> of 4
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/5 h-[2px] mb-10 overflow-hidden rounded-full">
        <div 
          className="h-full bg-luxury-gold-gradient transition-all duration-500 ease-out" 
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* STEP 1: PHOTO UPLOAD */}
      {step === 1 && (
        <div className="space-y-8 animate-fade-in-up">
          <div className="text-center max-w-lg mx-auto">
            <p className="text-sm text-obsidian-300 leading-relaxed font-sans">
              Upload a photo of yourself. The AI will look at your body shape and face to generate a picture showing you wearing the suggested outfit! Or, skip to use our standard mannequin sketch.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-6">
            {/* Upload Option */}
            <label className="flex flex-col items-center justify-center border border-dashed border-white/15 hover:border-gold-400 rounded-2xl p-8 cursor-pointer transition-all duration-300 bg-white/[0.02] hover:bg-white/[0.04] group relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload} 
                className="hidden" 
              />
              <div className="w-14 h-14 rounded-full bg-gold-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mb-4 border border-gold-500/20">
                <Upload className="w-6 h-6 text-gold-300" />
              </div>
              <span className="text-sm font-semibold text-gold-200">Upload Photo</span>
              <span className="text-[10px] text-obsidian-400 mt-2 font-sans text-center">
                Select a full-body or half-body portrait.
              </span>
              {photo && (
                <div className="absolute inset-0 bg-obsidian-800/90 rounded-2xl p-4 flex flex-col items-center justify-center border border-gold-500/30">
                  <img src={photo} alt="Preview" className="w-20 h-20 rounded-full object-cover border border-gold-300 mb-2" />
                  <span className="text-xs text-gold-300 font-semibold truncate max-w-[180px]">{photoName}</span>
                  <span className="text-[10px] text-obsidian-400 mt-1">Click to change photo</span>
                </div>
              )}
            </label>

            {/* Skip Option */}
            <div 
              onClick={() => { setPhoto(null); setPhotoName(""); handleNext(); }}
              className="flex flex-col items-center justify-center border border-white/10 hover:border-white/20 rounded-2xl p-8 cursor-pointer transition-all duration-300 bg-white/[0.01] hover:bg-white/[0.03] group text-center"
            >
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mb-4 border border-white/10">
                <User className="w-6 h-6 text-obsidian-300" />
              </div>
              <span className="text-sm font-semibold text-obsidian-200">Use Mannequin Sketch</span>
              <span className="text-[10px] text-obsidian-400 mt-2 font-sans">
                Skip upload. Renders outfits directly onto our standard 2D vector silhouette.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-8 max-w-2xl mx-auto border-t border-white/5">
            <button
              type="button"
              onClick={handleNext}
              className="btn-gold px-6 py-3 rounded-full flex items-center gap-2 text-xs"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: GENDER & FIT */}
      {step === 2 && (
        <div className="space-y-10 animate-fade-in-up">
          {/* Gender selection */}
          <div>
            <h3 className="text-base text-gold-200 mb-4 font-serif italic text-center">Gender / Style</h3>
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { id: "men", label: "Men", desc: "Masculine Style" },
                { id: "women", label: "Women", desc: "Feminine Style" },
                { id: "unisex", label: "Unisex", desc: "Fluid / Gender Neutral" }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGender(item.id)}
                  className={`border p-5 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center font-sans ${
                    gender === item.id 
                      ? "border-gold-500 bg-gold-500/5 text-gold-100 shadow-[0_4px_20px_rgba(212,175,55,0.1)]" 
                      : "border-white/10 bg-white/[0.01] hover:bg-white/[0.03] text-obsidian-300"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
                  <span className="text-[9px] text-obsidian-400 mt-1.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fit preference */}
          <div className="pt-4">
            <h3 className="text-base text-gold-200 mb-4 font-serif italic text-center">Fit / Silhouette</h3>
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {[
                { id: "slim", label: "Slim Fit", desc: "Form-fitting & tailored" },
                { id: "relaxed", label: "Relaxed Fit", desc: "Comfortable & standard" },
                { id: "oversized", label: "Oversized", desc: "Loose & trendy" }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFitPreference(item.id)}
                  className={`border p-5 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center font-sans ${
                    fitPreference === item.id 
                      ? "border-gold-500 bg-gold-500/5 text-gold-100 shadow-[0_4px_20px_rgba(212,175,55,0.1)]" 
                      : "border-white/10 bg-white/[0.01] hover:bg-white/[0.03] text-obsidian-300"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
                  <span className="text-[9px] text-obsidian-400 mt-1.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-8 border-t border-white/5">
            <button
              type="button"
              onClick={handleBack}
              className="btn-outline px-6 py-3 rounded-full flex items-center gap-2 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="btn-gold px-6 py-3 rounded-full flex items-center gap-2 text-xs"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: OCCASION & BUDGET */}
      {step === 3 && (
        <div className="space-y-10 animate-fade-in-up">
          {/* Occasion */}
          <div>
            <h3 className="text-base text-gold-200 mb-4 font-serif italic text-center">Occasion</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {OCCASIONS.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOccasion(item.id)}
                    className={`border p-5 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center font-sans relative overflow-hidden group ${
                      occasion === item.id 
                        ? "border-gold-500 bg-gold-500/5 text-gold-100 shadow-[0_4px_20px_rgba(212,175,55,0.1)]" 
                        : "border-white/10 bg-white/[0.01] hover:bg-white/[0.03] text-obsidian-300"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${
                      occasion === item.id ? "bg-gold-500/10 border border-gold-500/20 text-gold-300" : "bg-white/5 border border-white/5 text-obsidian-400"
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
                    <span className="text-[8px] text-obsidian-400 mt-1 leading-normal">{item.subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <h3 className="text-base text-gold-200 mb-4 font-serif italic text-center">Budget Plan</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {BUDGETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setBudget(item.id)}
                  className={`border p-5 rounded-2xl transition-all duration-300 flex flex-col items-center justify-center text-center font-sans ${
                    budget === item.id 
                      ? "border-gold-500 bg-gold-500/5 text-gold-100 shadow-[0_4px_20px_rgba(212,175,55,0.1)]" 
                      : "border-white/10 bg-white/[0.01] hover:bg-white/[0.03] text-obsidian-300"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold-300">{item.label}</span>
                  <span className="text-sm font-bold text-gold-100 mt-2 font-sans">{item.price}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-8 border-t border-white/5">
            <button
              type="button"
              onClick={handleBack}
              className="btn-outline px-6 py-3 rounded-full flex items-center gap-2 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="btn-gold px-6 py-3 rounded-full flex items-center gap-2 text-xs"
            >
              Next <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: COLORS */}
      {step === 4 && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Preferred colors */}
          <div>
            <h3 className="text-sm uppercase tracking-wider text-gold-300 font-semibold mb-3 text-center">Preferred Colors</h3>
            <p className="text-xs text-obsidian-400 text-center mb-6 font-sans">Select one or more colors you want us to use</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {COLOR_CHIPS.map((color) => {
                const active = preferredColors.includes(color.name);
                return (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleColorToggle(color.name, preferredColors, setPreferredColors)}
                    className={`flex items-center gap-3 border p-3 rounded-xl transition-all duration-300 text-left ${
                      active 
                        ? "border-gold-500 bg-gold-500/10 text-gold-100 shadow-[0_2px_10px_rgba(212,175,55,0.05)]" 
                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.02] text-obsidian-300"
                    }`}
                  >
                    <span 
                      className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate leading-none">{color.name}</p>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avoid colors */}
          <div className="pt-4">
            <h3 className="text-sm uppercase tracking-wider text-red-400 font-semibold mb-3 text-center">Colors to Avoid</h3>
            <p className="text-xs text-obsidian-400 text-center mb-6 font-sans">Select any colors you do NOT want to wear</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {COLOR_CHIPS.map((color) => {
                const active = avoidColors.includes(color.name);
                const disabled = preferredColors.includes(color.name);
                return (
                  <button
                    key={color.name}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleColorToggle(color.name, avoidColors, setAvoidColors)}
                    className={`flex items-center gap-3 border p-3 rounded-xl transition-all duration-300 text-left ${
                      active 
                        ? "border-red-500 bg-red-500/10 text-red-200" 
                        : "border-white/5 bg-white/[0.01] hover:bg-white/[0.02] text-obsidian-300"
                    } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
                  >
                    <span 
                      className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate leading-none">{color.name}</p>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex justify-between pt-8 border-t border-white/5 max-w-2xl mx-auto">
            <button
              type="button"
              onClick={handleBack}
              className="btn-outline px-6 py-3 rounded-full flex items-center gap-2 text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="submit"
              className="btn-gold px-8 py-3 rounded-full flex items-center gap-2 text-xs font-semibold shadow-lg"
            >
              <Sparkles className="w-4 h-4" /> Get Styled Outfits
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
