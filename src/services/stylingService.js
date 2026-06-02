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
 * VIRTUAL TRY-ON: Generate an "After" photo of the SAME PERSON
 * wearing the AI-recommended outfit — like the WeShop AI style.
 *
 * Strategy:
 * 1. PRIMARY: Use gemini-2.0-flash-exp (image generation mode)
 *    with the user's selfie as input + outfit swap instruction.
 *    This preserves face, hair, skin tone — only swaps clothes.
 * 2. FALLBACK: Use Imagen 3 text-to-image with a detailed prompt
 *    built from the outfit + user's described appearance.
 * ============================================================
 */
export async function generateTryOnFromSelfie(userPhotoBase64, outfitPrompt, userApiKey = "") {
  const apiKey = userApiKey.trim() || DEFAULT_GEMINI_KEY;

  // Extract mime type and base64 data from data URL
  let mimeType = "image/jpeg";
  let base64Data = userPhotoBase64;
  if (userPhotoBase64 && userPhotoBase64.startsWith("data:")) {
    const matches = userPhotoBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }
  }

  const instruction = `You are a professional fashion AI. 
Look at this person's selfie carefully. Keep EVERYTHING about this person EXACTLY the same:
- Their face, facial features, skin tone, complexion
- Their hair (length, style, color, texture)  
- Their body shape, height, proportions
- Their pose and expression
- The mirror/background environment

The ONLY thing you should change is their clothing. Replace their current outfit with:
${outfitPrompt}

Generate a photorealistic, high-quality "after" photo showing this EXACT SAME PERSON wearing this new outfit. 
The result should look like a real mirror selfie photo, matching the lighting, angle, and style of the original photo.
Do not add watermarks. Keep it natural and photorealistic.`;

  // PRIMARY: Try Gemini 2.0 Flash image generation (image-in, image-out)
  try {
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`;
    
    const response = await fetch(geminiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: instruction },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Gemini image-gen failed:", errText);
      throw new Error(`Gemini image-gen: ${response.status}`);
    }

    const data = await response.json();
    
    // Look for image part in response
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const imgMime = part.inlineData.mimeType || "image/png";
        return `data:${imgMime};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image in Gemini response");

  } catch (geminiErr) {
    console.warn("Gemini image-gen failed, falling back to Imagen 3:", geminiErr);
    
    // FALLBACK: Imagen 3 text-to-image
    return generateTryOnImage(outfitPrompt, userApiKey);
  }
}

/**
 * Generate photorealistic image using Google's Imagen 3 API (text-to-image fallback)
 */
export async function generateTryOnImage(prompt, userApiKey = "") {
  const apiKey = userApiKey.trim() || DEFAULT_GEMINI_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: prompt,
      numberOfImages: 1,
      outputMimeType: "image/jpeg",
      aspectRatio: "3:4" // Best for full-body styled clothing portraiture
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.warn("Google Imagen 3 API failed:", errText);
    throw new Error(`Imagen API failed: ${response.status}`);
  }

  const data = await response.json();
  const base64Bytes = data.generatedImages?.[0]?.image?.imageBytes;
  
  if (!base64Bytes) {
    throw new Error("No image bytes returned from Imagen 3");
  }

  return `data:image/jpeg;base64,${base64Bytes}`;
}

// Fallback unified structure
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
          tryOnImagePrompt: "A high-quality, photorealistic full-body portrait of a sporty man with casual styling, wearing a light blue linen shirt and dark blue slim jeans in a modern outdoor cafe. Soft natural lighting.",
          items: [
            { type: "Top", name: "Light Blue Shirt", color: "#AED6F1", searchQuery: "light blue cotton shirt men slim fit" },
            { type: "Bottom", name: "Dark Blue Jeans", color: "#1B4F72", searchQuery: "dark wash slim fit jeans men" },
            { type: "Shoes", name: "White Casual Sneakers", color: "#FFFFFF", searchQuery: "plain white leather sneakers men" },
            { type: "Accessory", name: "Black Sunglasses", color: "#000000", searchQuery: "classic black sunglasses men" }
          ],
          styleNotes: "Roll up the sleeves and leave the shirt untucked for a clean, relaxed style."
        }
      ],
      feminine: [
        {
          name: "Elevated Beige & White Outfit",
          description: "An upgraded elegant daytime look combining a white top with loose beige trousers.",
          tryOnImagePrompt: "A photorealistic, detailed portrait of an elegant woman with casual hair styling, wearing a white cotton top and high-waisted wide-leg beige trousers, walking down a sunlit city street.",
          items: [
            { type: "Top", name: "White Cotton Top", color: "#FFFFFF", searchQuery: "white cotton sleeveless top women" },
            { type: "Bottom", name: "Beige Wide-Leg Trousers", color: "#E5C494", searchQuery: "high waist beige wide leg trousers women" },
            { type: "Shoes", name: "Tan Sandals", color: "#CD7F32", searchQuery: "tan flat leather sandals women" },
            { type: "Accessory", name: "Gold Hoop Earrings", color: "#D4AF37", searchQuery: "gold medium hoop earrings" }
          ],
          styleNotes: "Tuck in the top and wear flat sandals for a balanced, simple aesthetic."
        }
      ]
    },
    office: {
      masculine: [
        {
          name: "Classic Office Suit",
          description: "A formal office look pairing a crisp white shirt with dark gray trousers.",
          tryOnImagePrompt: "A crisp, photorealistic portrait of a professional man wearing a tailored white dress shirt and dark charcoal formal trousers standing in a bright corporate office hallway.",
          items: [
            { type: "Top", name: "White Formal Shirt", color: "#FFFFFF", searchQuery: "white formal cotton shirt men" },
            { type: "Bottom", name: "Dark Gray Trousers", color: "#4A5568", searchQuery: "charcoal grey formal trousers men" },
            { type: "Shoes", name: "Black Leather Shoes", color: "#1A1A1A", searchQuery: "black leather oxford formal shoes men" },
            { type: "Accessory", name: "Black Leather Belt", color: "#000000", searchQuery: "simple black leather formal belt men" }
          ],
          styleNotes: "Keep the shirt neatly tucked in and wear dark formal shoes to match the belt."
        }
      ],
      feminine: [
        {
          name: "Smart Office Blouse Outfit",
          description: "A clean professional style matching a green blouse with neat black trousers.",
          tryOnImagePrompt: "A highly-detailed, photorealistic portrait of an executive woman wearing an emerald green satin formal blouse and slim-fit black formal trousers, sitting at an office desk.",
          items: [
            { type: "Top", name: "Green Satin Blouse", color: "#0F5257", searchQuery: "emerald green formal blouse women" },
            { type: "Bottom", name: "Black Slim Trousers", color: "#1A1A1A", searchQuery: "black slim fit formal trousers women" },
            { type: "Shoes", name: "Black Heels", color: "#000000", searchQuery: "black pointed toe heels formal women" },
            { type: "Accessory", name: "Silver Wristwatch", color: "#C0C0C0", searchQuery: "classic silver metal strap watch women" }
          ],
          styleNotes: "Tuck the blouse into the trousers and style with simple silver jewelry for a clean professional look."
        }
      ]
    }
  };

  const resolvedOccasion = mocks[occasion] || mocks.casual;
  let list = [];
  
  if (gender === "women") {
    list = resolvedOccasion.feminine || mocks.casual.feminine;
  } else {
    list = resolvedOccasion.masculine || mocks.casual.masculine;
  }

  const resolvedOutfits = list.map(outfit => ({
    ...outfit,
    items: outfit.items.map(item => ({
      ...item,
      ...buildShoppingURLs(item.searchQuery, item.type, gender)
    }))
  }));

  return {
    styleScore: score,
    styleCritique: critique,
    styleRating: styleRating,
    outfits: resolvedOutfits
  };
}
