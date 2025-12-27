
import { GoogleGenAI, Type } from "@google/genai";
import { Lead, LeadSourceType } from "../types";

// Initialisation sécurisée
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const getUserLocation = (): Promise<{latitude: number, longitude: number} | null> => {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null), // On résout avec null pour ne pas bloquer
      { timeout: 3000 } // Timeout plus court pour la prod
    );
  });
};

/**
 * Nettoie la réponse de l'IA pour extraire uniquement le JSON
 */
const extractJson = (text: string) => {
  try {
    // Tente un parse direct
    return JSON.parse(text);
  } catch (e) {
    // Si échec, tente d'extraire ce qui est entre les balises json ou les premiers crochets
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("INVALID_JSON_FORMAT");
  }
};

export const searchForLeads = async (query: string, sources: LeadSourceType[], userPitch: string): Promise<Partial<Lead>[]> => {
  try {
    const ai = getAIClient();
    const location = await getUserLocation();
    
    const toolConfig = location ? {
      retrievalConfig: {
        latLng: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      }
    } : undefined;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `TACHE : Recherche et QUALIFICATION de prospects B2B.
      
      REQUÊTE DE RECHERCHE : "${query}"
      NOTRE OFFRE (PITCH) : "${userPitch}"
      SOURCES : ${sources.join(", ")}
      
      DIRECTIVES :
      1. Identifie des entreprises réelles correspondant à la requête.
      2. Évalue leur pertinence par rapport à NOTRE OFFRE.
      3. Attribue un "qualificationScore" de 0 à 100.
      4. Explique pourquoi dans "qualificationReason".
      
      Retourne UNIQUEMENT un tableau JSON valide.
      Structure : [{ "companyName": "...", "contactName": "...", "website": "...", "description": "...", "email": "...", "qualificationScore": number, "qualificationReason": "..." }]`,
      config: {
        tools: [{ googleSearch: {} }],
        toolConfig: toolConfig as any,
        responseMimeType: "application/json"
      },
    });

    return extractJson(response.text);
  } catch (error: any) {
    console.error("Détails de l'erreur Gemini:", error);
    if (error.message === "API_KEY_MISSING") throw new Error("La clé API est manquante dans les variables d'environnement.");
    if (error.status === 429) throw new Error("Quota API dépassé. Réessayez dans une minute.");
    if (error.status === 403) throw new Error("Accès refusé. Vérifiez votre clé API ou les restrictions régionales.");
    throw new Error("Impossible de joindre le moteur de recherche IA. Vérifiez votre connexion.");
  }
};

export const generateLeadEmail = async (lead: Lead, additionalInstructions?: string) => {
  try {
    const ai = getAIClient();
    const prompt = `
      Rôle : SDR Expert en prospection B2B.
      Cible : ${lead.companyName} (${lead.description})
      Qualification : ${lead.qualificationReason}
      Offre : ${lead.offeringDetails || "Solutions business"}
      ${additionalInstructions ? `Instructions : ${additionalInstructions}` : ''}

      Génère 2 variantes d'emails (Directe et Créative).
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
              properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } },
              required: ["subject", "body"]
            },
            variantB: {
              type: Type.OBJECT,
              properties: { subject: { type: Type.STRING }, body: { type: Type.STRING } },
              required: ["subject", "body"]
            }
          },
          required: ["variantA", "variantB"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Email Gen Error:", error);
    throw error;
  }
};
