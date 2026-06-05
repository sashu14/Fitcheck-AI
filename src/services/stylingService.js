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

  // System instructions optimized to strictly preserve facial identity and body structure
  const systemInstruction = 
    `You are a helpful, expert AI fashion stylist and critic. 
    Based on the user's profile and uploaded picture, perform a professional style audit and curate outfit recommendations.
    
    CRITICAL AUDIT & RATING INSTRUCTIONS:
    If the user has uploaded an image, carefully audit their current outfit in the photo:
    1. Calculate a "styleScore" from 1 to 10 based on how well-tailored, color-coordinated, and stylish their current clothing is. Be realistic but encouraging (e.g. 6 to 9).
    2. Write a highly constructive, direct, and simple "styleCritique" (1 to 2 sentences) in plain English. Point out what is currently working in their photo and exactly how they can improve their outfit (e.g. "Your blue shirt is great, but standard denim makes it look basic. Elevating it with camel chinos will balance your silhouette.").
    3. Calculate individual 1-10 scores for the following "styleRating" categories:
       - "colorHarmony": Rating of color choices, balance, neutrals vs accents.
       - "fitSilhouette": Rating of tailoring, garment cut, body proportions matching.
       - "layeringStructure": Rating of garment layering depth, textural contrast, accessory usage.
       - "occasionMatch": Suitability of garments for the occasion.
    4. The 3 to 5 outfits you recommend in the "outfits" array MUST be specifically designed to solve the critique and elevate their style score to a perfect 10/10!
    
    If no photo is uploaded (mannequin mode):
    - Set "styleScore" to null.
    - Set "styleCritique" to "Using silhouette mannequin. Upload a photo to receive a personalized style rating!".
    - Set all "styleRating" category scores to null.
    
    CRITICAL IDENTITY PRESERVATION INSTRUCTIONS:
    If the user has uploaded an image, analyze their physical figure (body shape, proportions, height, build) and facial structure (face shape, skin tone, hair length/style/color).
    For each outfit, generate a highly descriptive "tryOnImagePrompt" in English. Start the prompt with:
    "A photorealistic, highly detailed, full-body studio portrait of the EXACT SAME PERSON from the uploaded photo (matching their exact face structure, facial features, skin complexion, hair texture/length/style, and physical body figure), wearing..."
    Then describe the suggested outfit items (styles, colors, fits) and the background setting matching the occasion. Keep the language clean.
    
    If no photo is uploaded, base the physical description in "tryOnImagePrompt" on their selected gender identity and body type.
    
    Make sure the outfit colors coordinate perfectly. Provide a "color" hex code (e.g. "#FFFFFF") for each item.
    
    KEEP THE LANGUAGE IN THE APP EXTREMELY SIMPLE, DIRECT, AND EASY TO UNDERSTAND. Avoid complex fashion jargon.
    You MUST return ONLY a valid JSON object, strictly conforming to the JSON schema below. No markdown wrapping, no explanation. Just raw JSON.`;

  const promptText = `
    Generate style ratings and outfit recommendations for this user profile:
    - Gender/Style Identity: ${profile.gender}
    - Body Type/Fit Preference: ${profile.fitPreference} (e.g. slim, relaxed, oversized)
    - Occasion: ${profile.occasion} (e.g. casual, office, party, date night, gym)
    - Budget: ${profile.budget}
    - Preferred Colors: ${colorsPref}
    - Avoid Colors: ${colorsAvoid}
    
    ${customFeedback ? `USER CHANGE REQUEST: "${customFeedback}". Adjust the outfits based on this feedback.` : ''}

    You must return a JSON object matching this structure:
    {
      "styleScore": number | null, // A rating from 1 to 10 for their current photo, or null if no photo
      "styleCritique": "A simple 1-2 sentence critique explaining how to improve their style.",
      "styleRating": {
        "overall": number | null, // must match styleScore
        "colorHarmony": number | null, // 1 to 10
        "fitSilhouette": number | null, // 1 to 10
        "layeringStructure": number | null, // 1 to 10
        "occasionMatch": number | null // 1 to 10
      },
      "outfits": [
        {
          "name": "Creative simple outfit name",
          "description": "Simple 1-2 sentence description of this look.",
          "tryOnImagePrompt": "A highly detailed, photorealistic prompt for generating a picture of a person matching the user's uploaded figure and face wearing this exact outfit. Be specific about clothing styles, colors, fit, and background context.",
          "items": [
            {
              "type": "Top" | "Bottom" | "Shoes" | "Accessory",
              "name": "Simple item name, e.g. White cotton shirt",
              "color": "Valid HEX code for visual try-on, e.g. #FFFFFF",
              "searchQuery": "Simple search query, e.g. white cotton shirt men slim fit"
            }
          ],
          "styleNotes": "Simple stylist advice, e.g. Tuck in the shirt for a clean look."
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: parts
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Gemini API error:", errText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      throw new Error("Empty response from Gemini API");
    }

    let cleanedText = resultText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/```$/, "");
    }
    
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
