
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, LeadSourceType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getUserLocation = (): Promise<{latitude: number, longitude: number} | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
};

export const searchForLeads = async (query: string, sources: LeadSourceType[]): Promise<Partial<Lead>[]> => {
  try {
    const location = await getUserLocation();
    
    const sourceInstructions = sources.map(s => {
      switch(s) {
        case 'linkedin': return "Utilise massivement 'site:linkedin.com/company' pour trouver des entreprises.";
        case 'directories': return "Scanne les annuaires locaux et nationaux (Kompass, Pages Jaunes, Yelp).";
        case 'social': return "Cherche des entreprises avec une forte présence sur Instagram/Facebook/Twitter.";
        default: return "Recherche web générale.";
      }
    }).join(" ");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Gemini 2.5 required for Maps grounding
      contents: `TACHE : Recherche de prospects B2B pour la requête : "${query}".
      
      SOURCES CIBLÉES : ${sources.join(", ")}
      DIRECTIVES : ${sourceInstructions}
      
      IMPORTANT : 
      1. Trouve le MAXIMUM de prospects possibles (vise 15-20 résultats).
      2. Utilise Google Maps pour localiser précisément les établissements physiques si pertinent.
      3. Pour chaque prospect, extrais : Nom exact, Nom du dirigeant/contact, Email pro, Site Web, Adresse complète, Ville, et une description métier.
      4. Rédige tout en FRANÇAIS.

      Retourne UNIQUEMENT un tableau JSON structuré ainsi :
      [{
        "companyName": "string",
        "contactName": "string or null",
        "website": "string (URL)",
        "address": "string (adresse complète)",
        "location": "string (Ville, Pays)",
        "description": "string (activité en FR)",
        "email": "string (email pro ou null)"
      }]`,
      config: {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        toolConfig: location ? {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        } : undefined
      },
    });

    let text = response.text || "[]";
    // Clean potential markdown artifacts
    text = text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    try {
      const parsed = JSON.parse(text);
      
      // Attempt to match Maps URIs from grounding metadata if available
      const mapsLinks: Record<string, string> = {};
      const groundingChunks = (response as any).candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.maps?.uri && chunk.maps?.title) {
            mapsLinks[chunk.maps.title.toLowerCase()] = chunk.maps.uri;
          }
        });
      }

      return parsed.map((item: any) => ({
        ...item,
        // Match maps link by name if found in metadata
        website: item.website || mapsLinks[item.companyName.toLowerCase()],
        source: sources.join(", ") + (mapsLinks[item.companyName.toLowerCase()] ? ", Maps" : "")
      }));
    } catch (e) {
      console.error("JSON Parse Error. Raw text:", text);
      return [];
    }
  } catch (error) {
    console.error("Search Error:", error);
    throw error;
  }
};

export const generateLeadEmail = async (lead: Lead, additionalInstructions?: string) => {
  const prompt = `
    Rôle : SDR Expert en prospection B2B.
    Cible : ${lead.companyName} (${lead.description})
    Contact : ${lead.contactName || "Responsable"}
    Offre à vendre : ${lead.offeringDetails || "Optimisation de performance business"}

    Tâche : Générer 2 variantes d'emails (A/B Test) hautement personnalisées.
    Langue : Français uniquement.
    
    Variante A : Directe, focus sur le retour sur investissement (ROI).
    Variante B : Empathique, focus sur la résolution de problèmes spécifiques.

    ${additionalInstructions ? `CONSIGNES PARTICULIÈRES : ${additionalInstructions}` : ''}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          variantA: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ["subject", "body"]
          },
          variantB: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING },
            },
            required: ["subject", "body"]
          }
        },
        required: ["variantA", "variantB"],
      },
    },
  });

  return JSON.parse(response.text);
};
