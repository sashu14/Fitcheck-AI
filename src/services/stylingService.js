// Gemini AI Styling Service for FitCheck AI

const DEFAULT_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Dynamic shopping URL builders
export function buildShoppingURLs(query, itemType, gender) {
  const encodedQuery = encodeURIComponent(query);
  
  let myntraCategory = "search";
  const g = (gender || "").toLowerCase();
  const t = (itemType || "").toLowerCase();
  
  if (t === "top") {
    myntraCategory = g === "women" ? "women-tops" : "men-shirts";
  } else if (t === "bottom") {
    myntraCategory = g === "women" ? "women-trousers-jeans" : "men-jeans-chinos";
  } else if (t === "shoes") {
    myntraCategory = g === "women" ? "women-footwear" : "men-footwear";
  } else if (t === "accessory") {
    myntraCategory = g === "women" ? "women-accessories" : "men-accessories";
  }

  return {
    amazonURL: `https://www.amazon.in/s?k=${encodedQuery}`,
    myntraURL: `https://www.myntra.com/${myntraCategory}?rawQuery=${encodedQuery}`,
    ajioURL: `https://www.ajio.com/search/?text=${encodedQuery}`,
    flipkartURL: `https://www.flipkart.com/search?q=${encodedQuery}`
  };
}

/**
 * Call the Gemini API to generate outfit recommendations and rate the uploaded photo
 */
export async function generateOutfitRecommendations(profile, customFeedback = "", userApiKey = "") {
  const apiKey = userApiKey.trim() || DEFAULT_GEMINI_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const colorsPref = profile.preferredColors && profile.preferredColors.length > 0 
    ? profile.preferredColors.join(", ") 
    : "Neutrals like beige, white, black, blue";
  const colorsAvoid = profile.avoidColors && profile.avoidColors.length > 0 
    ? profile.avoidColors.join(", ") 
    : "None";

  const systemInstruction = `You are an expert AI fashion stylist. Your job is to suggest outfits that strictly use the user's preferred colors. 
ABSOLUTE RULE: Only use colors the user specifies. Never suggest burgundy, purple, or any other color unless it's in their preferred list.
If user says white and black — every item must be white or black.
If a photo is provided, rate their current style (1-10) and critique it.
Return ONLY valid JSON. No markdown. No explanation. No extra text.`;


  const promptText = `
Generate outfit recommendations for this user:
- Gender: ${profile.gender}
- Fit Preference: ${profile.fitPreference}
- Occasion: ${profile.occasion}
- Budget: ${profile.budget}
- REQUIRED Colors (MUST use these): ${colorsPref}
- FORBIDDEN Colors (MUST NOT use): ${colorsAvoid}

CRITICAL: Every outfit item's color MUST come from the "REQUIRED Colors" list above.
If the user says white and black, ALL items must be white or black.
If they say blue and grey, use ONLY blue and grey combinations.
Do NOT suggest colors outside their preferences.

${customFeedback ? `USER CHANGE REQUEST: "${customFeedback}". Adjust accordingly.` : ""}

Return ONLY a raw JSON object (no markdown, no explanation) in this exact format:
{
  "styleScore": number_or_null,
  "styleCritique": "1-2 sentence critique",
  "styleRating": {"overall": number_or_null, "colorHarmony": number_or_null, "fitSilhouette": number_or_null, "layeringStructure": number_or_null, "occasionMatch": number_or_null},
  "outfits": [
    {
      "name": "Outfit name",
      "description": "1-2 sentence description",
      "tryOnImagePrompt": "Detailed photorealistic image prompt",
      "items": [
        {"type": "Top", "name": "Item name", "color": "#HEXCODE", "searchQuery": "search query for shopping"},
        {"type": "Bottom", "name": "Item name", "color": "#HEXCODE", "searchQuery": "search query"},
        {"type": "Shoes", "name": "Item name", "color": "#HEXCODE", "searchQuery": "search query"},
        {"type": "Accessory", "name": "Item name", "color": "#HEXCODE", "searchQuery": "search query"}
      ],
      "styleNotes": "Quick styling tip"
    }
  ]
}
  `;

  // Parse multimodal base64 image if uploaded
  const parts = [];
  parts.push({ text: `${systemInstruction}\n\n${promptText}` });

  if (profile.photo && profile.photo.startsWith("data:")) {
    const matches = profile.photo.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      parts.push({
        inlineData: {
          mimeType: matches[1],
          data: matches[2]
        }
      });
    }
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API HTTP error:", response.status, errText.slice(0, 300));
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Gemini raw response candidates:", data.candidates?.length, "finish:", data.candidates?.[0]?.finishReason);

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      console.error("Gemini returned no text. Full response:", JSON.stringify(data).slice(0, 500));
      throw new Error("Empty response from Gemini");
    }

    // Robustly extract JSON — handles markdown fences, leading text, trailing text
    let cleanedText = resultText.trim();
    // Strip markdown code fences
    cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");
    // Find the outermost { ... } block
    const jsonStart = cleanedText.indexOf("{");
    const jsonEnd   = cleanedText.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedText = cleanedText.slice(jsonStart, jsonEnd + 1);
    }
    console.log("Parsed JSON snippet:", cleanedText.slice(0, 150));

    const resultObj = JSON.parse(cleanedText);
    
    return {
      styleScore: resultObj.styleScore,
      styleCritique: resultObj.styleCritique,
      styleRating: resultObj.styleRating || null,
      outfits: resultObj.outfits.map(outfit => ({
        ...outfit,
        items: outfit.items.map(item => {
          // Auto-build search query if Gemini didn't provide one
          const searchQ = item.searchQuery
            || `${item.name} ${profile.gender === "women" ? "women" : "men"}`.trim();
          return {
            ...item,
            searchQuery: searchQ,
            ...buildShoppingURLs(searchQ, item.type, profile.gender)
          };
        })
      }))
    };

  } catch (error) {
    console.error("Error calling Gemini API, using simplified fallback:", error);
    return getFallbackResponse(profile);
  }
}


/**
 * ============================================================
 * STEP 1: Gemini Vision → Ultra-detailed person description
 * Uses gemini-2.5-flash (vision/text — works on free tier)
 * ============================================================
 */
async function extractPersonDescription(userPhotoBase64, userApiKey) {
  const apiKey = userApiKey.trim() || DEFAULT_GEMINI_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  let mimeType = "image/jpeg";
  let base64Data = userPhotoBase64;
  if (userPhotoBase64?.startsWith("data:")) {
    const m = userPhotoBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (m) { mimeType = m[1]; base64Data = m[2]; }
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `You are a photography AI. Describe the person in this selfie photo with extreme precision for AI image generation.

Write ONE dense paragraph starting with "Photorealistic mirror selfie photo of" describing:
1. Ethnicity and exact skin tone (e.g. "South Asian woman with warm deep brown skin")
2. Face: shape, eyes (color/shape), nose, lips, expression, any bindi/makeup
3. Hair: EXACT color, length (chest/shoulder/waist length), texture (wavy/straight/curly), how it falls
4. Accessories being KEPT (cap color/brand/style, bag, jewelry)
5. Pose: (e.g. "right arm raised, hand holding black iPhone near face, slight forward chin tilt, looking into mirror")
6. Background: (e.g. "inside H&M dressing room, tan wooden partition walls, large mirror, white recessed ceiling spotlights")
7. Lighting and camera angle

CRITICAL: Do NOT describe what they are currently wearing (clothes). Only describe the person, accessories, pose, background.`
            },
            { inlineData: { mimeType, data: base64Data } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 600 }
      })
    });

    if (!response.ok) throw new Error(`Vision ${response.status}`);
    const data = await response.json();
    const desc = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    console.log("✓ Person desc:", desc.slice(0, 100) + "...");
    return desc;
  } catch (e) {
    console.warn("Person description failed:", e.message);
    return "";
  }
}

/**
 * ============================================================
 * Build Pollinations Flux image generation prompt
 * Combines person description + outfit for identity-aware result
 * ============================================================
 */
function buildFluxPrompt(personDescription, outfitItems, outfitName, occasion) {
  // Build a very explicit outfit description with exact colors FIRST
  // Flux is a text-first model — the most important thing must come at the start
  const topItem    = outfitItems?.find(i => i.type === "Top");
  const bottomItem = outfitItems?.find(i => i.type === "Bottom");
  const shoeItem   = outfitItems?.find(i => i.type === "Shoes");
  const accItem    = outfitItems?.find(i => i.type === "Accessory");

  // Convert hex to plain English for Flux (it understands color names better than hex)
  const colorName = (hex) => {
    if (!hex) return '';
    const h = hex.toLowerCase();
    if (h === '#ffffff' || h === '#fff') return 'white';
    if (h === '#000000' || h === '#000') return 'black';
    if (h.match(/#[0-9a-f]{6}/) ) {
      const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
      if (r>200&&g>200&&b>200) return 'light ' + (r>g&&r>b?'red':g>b?'green':'blue');
      if (r<60&&g<60&&b<60) return 'black';
      if (r>180&&g<100&&b<100) return 'red';
      if (r<100&&g<100&&b>180) return 'blue';
      if (r<100&&g>150&&b<100) return 'green';
      if (r>180&&g>120&&b<80) return 'orange';
      if (r>180&&g>180&&b<100) return 'yellow';
      if (r>150&&g<100&&b>150) return 'purple';
      if (r>180&&g>140&&b>100) return 'beige';
      if (r>100&&g>60&&b<60)   return 'brown';
      if (r<100&&g>100&&b>150) return 'teal';
      if (r>180&&g<120&&b>120) return 'pink';
      if (r>100&&g>100&&b>100) return 'grey';
    }
    return '';
  };

  const outfitParts = [];
  if (topItem)    outfitParts.push(`${colorName(topItem.color)} ${topItem.name}`.trim());
  if (bottomItem) outfitParts.push(`${colorName(bottomItem.color)} ${bottomItem.name}`.trim());
  if (shoeItem)   outfitParts.push(`${shoeItem.name}`);
  if (accItem)    outfitParts.push(`${accItem.name}`);

  const outfitStr = outfitParts.length ? outfitParts.join(', ') : (outfitName || 'stylish outfit');

  if (personDescription) {
    // OUTFIT FIRST — colors must be at the very start so Flux prioritizes them
    // Person description trimmed and put after
    const shortDesc = personDescription.slice(0, 350);
    return `OUTFIT: ${outfitStr}. Fashion try-on photo. ${shortDesc} wearing the exact outfit described above: ${outfitStr}. Same face, same hair, same background, same pose. Only clothes changed. Photorealistic, sharp, 4k fashion photography.`;
  }

  // Generic (no photo uploaded)
  return `High quality fashion photograph. A stylish person wearing ${outfitStr}. ${occasion || 'casual'} occasion. Full body shot. Photorealistic, professional studio lighting, 4k.`;
}

/**
 * ============================================================
/**
 * ============================================================
 * generateTryOnFromSelfie — MAIN EXPORT
 *
 * Pipeline:
 * 1. Gemini Vision → extract person description
 * 2. Gemini image generation models → try to get real try-on image
 * 3. Curated Unsplash fashion photo matched to outfit color/occasion
 * ============================================================
 */
export async function generateTryOnFromSelfie(userPhotoBase64, outfitItems, outfitName, occasion, userApiKey = "") {
  const apiKey = userApiKey.trim() || DEFAULT_GEMINI_KEY;

  // Step 1: Extract person description from selfie
  let personDescription = "";
  if (userPhotoBase64 && userPhotoBase64.startsWith("data:")) {
    personDescription = await extractPersonDescription(userPhotoBase64, userApiKey);
  }

  // Step 2: Build the image generation prompt
  const prompt = buildFluxPrompt(personDescription, outfitItems, outfitName, occasion);

  // Step 3: Try Gemini image generation models
  const GEMINI_IMAGE_MODELS = [
    "gemini-2.5-flash-image",
    "gemini-3.1-flash-image-preview",
    "gemini-3.1-flash-image",
    "gemini-3-pro-image-preview",
    "gemini-3-pro-image",
  ];

  let mimeType = "image/jpeg";
  let base64Data = null;
  if (userPhotoBase64?.startsWith("data:")) {
    const m = userPhotoBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (m) { mimeType = m[1]; base64Data = m[2]; }
  }

  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const parts = [{ text: prompt }];
      if (base64Data) parts.push({ inlineData: { mimeType, data: base64Data } });

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"], temperature: 0.5 }
        })
      });

      if (res.status === 429) { console.warn(`${model}: quota exceeded`); continue; }
      if (!res.ok) { console.warn(`${model}: ${res.status}`); continue; }

      const d = await res.json();
      const resParts = d.candidates?.[0]?.content?.parts || [];
      for (const p of resParts) {
        if (p.inlineData?.data) {
          console.log(`✓ Got image from ${model}`);
          return `data:${p.inlineData.mimeType || "image/jpeg"};base64,${p.inlineData.data}`;
        }
      }
    } catch (e) {
      console.warn(`${model} failed:`, e.message);
    }
  }

  // Step 4: Smart Unsplash fallback — find a fashion photo that matches the outfit
  return getCuratedFashionPhoto(outfitItems, occasion, personDescription);
}

/**
 * Get a curated Unsplash fashion photo that matches the outfit's dominant color and occasion.
 * Uses Unsplash Source (no key needed, always works).
 */
function getCuratedFashionPhoto(outfitItems, occasion, personDescription) {
  // Determine dominant outfit color from top item
  const topItem    = outfitItems?.find(i => i.type === "Top");
  const bottomItem = outfitItems?.find(i => i.type === "Bottom");
  const primaryHex = topItem?.color || bottomItem?.color || "#333333";

  // Detect gender from person description
  const isMale = personDescription?.toLowerCase().includes("man") ||
                 personDescription?.toLowerCase().includes("male") ||
                 personDescription?.toLowerCase().includes(" he ");
  const genderTerm = isMale ? "man fashion" : "woman fashion";

  // Map hex color to Unsplash search term
  const r = parseInt(primaryHex.slice(1,3)||"33",16);
  const g = parseInt(primaryHex.slice(3,5)||"33",16);
  const b = parseInt(primaryHex.slice(5,7)||"33",16);

  let colorTerm = "neutral";
  if (r > 180 && g < 100 && b < 100) colorTerm = "red";
  else if (r < 80  && g < 80  && b > 160) colorTerm = "blue";
  else if (r < 80  && g > 140 && b < 100) colorTerm = "green";
  else if (r > 160 && g > 120 && b < 80)  colorTerm = "orange";
  else if (r > 140 && g < 80  && b > 140) colorTerm = "purple";
  else if (r > 180 && g < 120 && b > 120) colorTerm = "pink";
  else if (r < 60  && g < 60  && b < 60)  colorTerm = "black";
  else if (r > 200 && g > 200 && b > 200) colorTerm = "white";
  else if (r > 100 && g > 60  && b < 60)  colorTerm = "brown";
  else if (r < 80  && g > 100 && b > 140) colorTerm = "teal";
  else if (r < 60  && g < 60  && b > 80)  colorTerm = "navy";
  else if (r > 150 && g > 150 && b < 80)  colorTerm = "yellow";
  else if (r > 120 && g > 80  && b < 40)  colorTerm = "olive";

  // Map occasion to style
  const occasionMap = {
    casual: "street style casual",
    office: "business professional formal",
    party: "party night outfit glamorous",
    "date night": "elegant date night outfit",
    gym: "athletic gym workout"
  };
  const occasionTerm = occasionMap[occasion?.toLowerCase()] || "fashion outfit";

  // Outfit name keywords for better search
  const outfitKeywords = outfitItems?.slice(0,2).map(i => i.name.split(" ").slice(0,2).join("+")).join("+") || "outfit";

  // Use Unsplash Source with specific search terms
  const query = encodeURIComponent(`${colorTerm} ${genderTerm} ${occasionTerm}`);
  const seed = outfitKeywords.replace(/[^a-z0-9]/gi, "").slice(0,20) || "fashion";

  return `https://source.unsplash.com/512x640/?${query}&sig=${seed}`;
}

/**
 * Legacy exports for backwards compatibility
 */
export function buildPollinationsUrl(prompt, seed = "fitcheck") {
  // Pollinations now requires payment — use Unsplash fashion fallback instead
  return getCuratedFashionPhoto([], "casual", "");
}

export function generateTryOnImage(prompt) {
  return getCuratedFashionPhoto([], "casual", "");
}


// ============================================================
// Fallback mock response when Gemini API is unavailable
// ============================================================
function getFallbackResponse(profile) {
  const gender = profile.gender || "unisex";
  const occasion = profile.occasion || "casual";
  
  const score = profile.photo ? 7.5 : null;
  const critique = profile.photo 
    ? "Your current style is comfortable, but could use more color balance. Elevate this look with contrasting neutral tones and structured layering." 
    : "Using silhouette mannequin. Upload a photo to receive a personalized style rating!";

  const styleRating = profile.photo ? {
    overall: 7.5,
    colorHarmony: 8.0,
    fitSilhouette: 7.0,
    layeringStructure: 6.0,
    occasionMatch: 8.5
  } : null;

  const mocks = {
    casual: {
      masculine: [
        {
          name: "Dark Olive Street Look",
          description: "A sharp street-style outfit with an olive green jacket and dark navy jeans.",
          tryOnImagePrompt: "Photorealistic street-style photo of a young man wearing an olive green bomber jacket over a black t-shirt and dark navy slim jeans, urban street, natural lighting, 4k.",
          items: [
            { type: "Top", name: "Olive Green Bomber Jacket", color: "#4A5240", searchQuery: "olive green bomber jacket men" },
            { type: "Bottom", name: "Dark Navy Slim Jeans", color: "#1A237E", searchQuery: "dark navy slim fit jeans men" },
            { type: "Shoes", name: "Black Chunky Sneakers", color: "#111111", searchQuery: "black chunky platform sneakers men" },
            { type: "Accessory", name: "Brown Leather Watch", color: "#6D4C41", searchQuery: "brown leather strap watch men" }
          ],
          styleNotes: "Leave the jacket unzipped over a black tee for a cool layered look."
        }
      ],
      feminine: [
        {
          name: "Bold Navy & Red Power Look",
          description: "A striking outfit pairing a deep navy blazer with a red mini skirt.",
          tryOnImagePrompt: "Photorealistic fashion photo of a woman wearing a fitted deep navy blazer and red mini skirt, city street, bold editorial look, 4k.",
          items: [
            { type: "Top", name: "Deep Navy Fitted Blazer", color: "#0D1B3E", searchQuery: "navy blue fitted blazer women" },
            { type: "Bottom", name: "Cherry Red Mini Skirt", color: "#C0392B", searchQuery: "red mini skirt women" },
            { type: "Shoes", name: "Black Ankle Boots", color: "#111111", searchQuery: "black ankle boots women" },
            { type: "Accessory", name: "Gold Chain Necklace", color: "#D4AF37", searchQuery: "gold chain necklace women" }
          ],
          styleNotes: "Pair with a simple black top underneath the blazer to let the bold colors shine."
        }
      ]
    },
    office: {
      masculine: [
        {
          name: "Slate Blue Business Look",
          description: "A modern office outfit with a slate blue shirt and charcoal trousers.",
          tryOnImagePrompt: "Photorealistic portrait of a professional man wearing a slate blue dress shirt and dark charcoal formal trousers, corporate office, 4k.",
          items: [
            { type: "Top", name: "Slate Blue Dress Shirt", color: "#4A7196", searchQuery: "slate blue formal shirt men" },
            { type: "Bottom", name: "Charcoal Slim Trousers", color: "#3A3A3A", searchQuery: "charcoal grey slim trousers men" },
            { type: "Shoes", name: "Dark Brown Oxford Shoes", color: "#4E342E", searchQuery: "dark brown leather oxford shoes men" },
            { type: "Accessory", name: "Silver Tie Clip", color: "#9E9E9E", searchQuery: "silver tie clip men formal" }
          ],
          styleNotes: "Pair with a dark burgundy tie to complete the sharp professional look."
        }
      ],
      feminine: [
        {
          name: "Burgundy Power Suit",
          description: "A commanding office look in a deep burgundy blazer with matching trousers.",
          tryOnImagePrompt: "Photorealistic portrait of a professional woman in a deep burgundy blazer and matching trousers, bright office, editorial 4k.",
          items: [
            { type: "Top", name: "Deep Burgundy Blazer", color: "#6D1A2A", searchQuery: "burgundy blazer women formal" },
            { type: "Bottom", name: "Matching Burgundy Trousers", color: "#6D1A2A", searchQuery: "burgundy formal trousers women" },
            { type: "Shoes", name: "Nude Pointed Heels", color: "#D4A574", searchQuery: "nude pointed heels women" },
            { type: "Accessory", name: "Gold Stud Earrings", color: "#D4AF37", searchQuery: "gold stud earrings women formal" }
          ],
          styleNotes: "Add a silk cream blouse underneath for contrast against the rich burgundy."
        }
      ]
    }
  };

  const resolvedOccasion = mocks[occasion] || mocks.casual;
  let list = gender === "women"
    ? (resolvedOccasion.feminine || mocks.casual.feminine)
    : (resolvedOccasion.masculine || mocks.casual.masculine);

  return {
    styleScore: score,
    styleCritique: critique,
    styleRating: styleRating,
    outfits: list.map(outfit => ({
      ...outfit,
      items: outfit.items.map(item => ({
        ...item,
        ...buildShoppingURLs(item.searchQuery, item.type, gender)
      }))
    }))
  };
}
