import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

export interface MenuItem {
  name: string;
  description?: string;
  price: string;
  dietary?: string[]; // e.g., "V", "GF"
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export interface MenuData {
  restaurantName?: string;
  categories: MenuCategory[];
}

export async function extractMenuData(
  base64Images: string[],
  modelName: string,
  apiKey: string
): Promise<MenuData> {
  const ai = new GoogleGenAI({ apiKey });
  
  const parts = base64Images.map(base64 => ({
    inlineData: {
      data: base64,
      mimeType: "image/jpeg",
    }
  }));

  const prompt = {
    text: `Analysiere diese Bilder einer Restaurant-Speisekarte. Extrahiere die strukturierten Daten, einschließlich des Restaurantnamens (falls sichtbar), der Kategorien und der einzelnen Artikel.
    Extrahiere für jeden Artikel den Namen, die Beschreibung (falls vorhanden), den Preis und alle diätetischen Kennzeichnungen (wie V, GF, Vegan).
    Korrigiere offensichtliche OCR-Fehler (z. B. unnötige Doppelpunkte entfernen, Tippfehler korrigieren).
    Gib die Daten strikt im angeforderten JSON-Format zurück. Antworte auf Deutsch.`
  };

  const isPro = modelName.includes('pro');
  
  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        restaurantName: { type: Type.STRING, description: "Name des Restaurants" },
        categories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Kategoriename, z. B. Vorspeisen, Hauptgerichte, Getränke" },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name des Gerichts oder Getränks" },
                    description: { type: Type.STRING, description: "Beschreibung des Gerichts" },
                    price: { type: Type.STRING, description: "Preis des Artikels, einschließlich Währungssymbol, falls vorhanden" },
                    dietary: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Diätetische Kennzeichnungen wie V, GF, Vegan"
                    }
                  },
                  required: ["name", "price"]
                }
              }
            },
            required: ["category", "items"]
          }
        }
      },
      required: ["categories"]
    }
  };

  if (isPro) {
    config.thinkingConfig = { thinkingLevel: "HIGH" };
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: modelName,
    contents: { parts: [...parts, prompt] },
    config
  });

  const text = response.text;
  if (!text) {
    throw new Error("No text returned from Gemini");
  }

  return JSON.parse(text) as MenuData;
}
