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
    
    // Inject shopping links dynamically into the returned outfits
    return {
      styleScore: resultObj.styleScore,
      styleCritique: resultObj.styleCritique,
      styleRating: resultObj.styleRating || null,
      outfits: resultObj.outfits.map(outfit => ({
        ...outfit,
        items: outfit.items.map(item => ({
          ...item,
          ...buildShoppingURLs(item.searchQuery || item.name, item.type, profile.gender)
        }))
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
  const outfitStr = outfitItems?.length
    ? outfitItems.map(i => `${i.name} (${i.color})`).join(", ")
    : outfitName || "stylish outfit";

  if (personDescription) {
    return `${personDescription}, now wearing: ${outfitStr}. ONLY the clothing has changed. Same person, same face, same hair, same cap, same pose, same mirror background. High quality realistic photography, fashion photo, sharp focus, 4k.`;
  }

  // Generic (no photo uploaded)
  return `Photorealistic fashion photo of a stylish person wearing ${outfitStr}, ${occasion || "casual"} look, studio lighting, full body shot, sharp focus, 4k photography.`;
}

/**
 * ============================================================
 * generateTryOnFromSelfie — MAIN EXPORT
 *
 * 2-step reliable pipeline:
 * 1. Gemini 2.5 Flash Vision → exact person description (FREE, works)
 * 2. Pollinations Flux → high quality image generation (FREE, reliable)
 * ============================================================
 */
export async function generateTryOnFromSelfie(userPhotoBase64, outfitItems, outfitName, occasion, userApiKey = "") {
  // Step 1: Get exact person description from Gemini Vision
  let personDescription = "";
  if (userPhotoBase64 && userPhotoBase64.startsWith("data:")) {
    personDescription = await extractPersonDescription(userPhotoBase64, userApiKey);
  }

  // Step 2: Build identity-aware Flux prompt
  const prompt = buildFluxPrompt(personDescription, outfitItems, outfitName, occasion);

  // Step 3: Generate via Pollinations Flux (reliable, free, high quality)
  return buildPollinationsUrl(prompt, outfitName);
}

/**
 * Build a Pollinations Flux image URL (synchronous — returns URL immediately)
 * The browser fetches and renders the image asynchronously.
 */
export function buildPollinationsUrl(prompt, seed = "fitcheck") {
  const cleanPrompt = prompt.slice(0, 1800); // URL limit
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=512&height=640&model=flux&nologo=true&seed=${encodeURIComponent(String(seed))}&enhance=true`;
}

/**
 * Legacy generateTryOnImage — kept for any old callers
 */
export function generateTryOnImage(prompt) {
  return buildPollinationsUrl(prompt);
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
          name: "Elevated Blue Denim Look",
          description: "A clean and upgraded daily outfit featuring a light blue shirt paired with dark blue jeans.",
          tryOnImagePrompt: "Photorealistic fashion photo of a sporty young man wearing a light blue linen shirt and dark blue slim jeans, outdoor cafe, natural lighting, 4k.",
          items: [
            { type: "Top", name: "Light Blue Linen Shirt", color: "#AED6F1", searchQuery: "light blue cotton shirt men slim fit" },
            { type: "Bottom", name: "Dark Wash Slim Jeans", color: "#1B4F72", searchQuery: "dark wash slim fit jeans men" },
            { type: "Shoes", name: "White Leather Sneakers", color: "#FFFFFF", searchQuery: "plain white leather sneakers men" },
            { type: "Accessory", name: "Black Sunglasses", color: "#000000", searchQuery: "classic black sunglasses men" }
          ],
          styleNotes: "Roll up the sleeves and leave the shirt untucked for a clean, relaxed style."
        }
      ],
      feminine: [
        {
          name: "Elevated Beige & White",
          description: "An elegant daytime look combining a white top with loose beige trousers.",
          tryOnImagePrompt: "Photorealistic fashion photo of an elegant South Asian woman wearing a white cotton top and high-waisted wide-leg beige trousers, sunlit city street, 4k.",
          items: [
            { type: "Top", name: "White Ribbed Crop Top", color: "#FFFFFF", searchQuery: "white ribbed crop top women" },
            { type: "Bottom", name: "Beige Wide-Leg Trousers", color: "#E5C494", searchQuery: "high waist beige wide leg trousers women" },
            { type: "Shoes", name: "Tan Leather Sandals", color: "#CD7F32", searchQuery: "tan flat leather sandals women" },
            { type: "Accessory", name: "Gold Hoop Earrings", color: "#D4AF37", searchQuery: "gold medium hoop earrings" }
          ],
          styleNotes: "Tuck in the top and wear flat sandals for a balanced aesthetic."
        }
      ]
    },
    office: {
      masculine: [
        {
          name: "Classic Office Suit",
          description: "A formal office look pairing a crisp white shirt with dark gray trousers.",
          tryOnImagePrompt: "Photorealistic portrait of a professional man wearing a tailored white dress shirt and dark charcoal trousers, bright corporate office, 4k.",
          items: [
            { type: "Top", name: "White Formal Shirt", color: "#FFFFFF", searchQuery: "white formal cotton shirt men" },
            { type: "Bottom", name: "Dark Gray Trousers", color: "#4A5568", searchQuery: "charcoal grey formal trousers men" },
            { type: "Shoes", name: "Black Oxford Shoes", color: "#1A1A1A", searchQuery: "black leather oxford formal shoes men" },
            { type: "Accessory", name: "Black Leather Belt", color: "#000000", searchQuery: "simple black leather formal belt men" }
          ],
          styleNotes: "Keep the shirt neatly tucked in and wear dark formal shoes to match the belt."
        }
      ],
      feminine: [
        {
          name: "Smart Office Blouse",
          description: "A clean professional style matching a green blouse with neat black trousers.",
          tryOnImagePrompt: "Photorealistic portrait of a professional woman wearing an emerald green satin blouse and slim black trousers, office desk, 4k.",
          items: [
            { type: "Top", name: "Emerald Green Satin Blouse", color: "#0F5257", searchQuery: "emerald green formal blouse women" },
            { type: "Bottom", name: "Black Slim Trousers", color: "#1A1A1A", searchQuery: "black slim fit formal trousers women" },
            { type: "Shoes", name: "Black Pointed Heels", color: "#000000", searchQuery: "black pointed toe heels formal women" },
            { type: "Accessory", name: "Silver Wristwatch", color: "#C0C0C0", searchQuery: "classic silver metal strap watch women" }
          ],
          styleNotes: "Tuck the blouse into the trousers and style with simple silver jewelry."
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
