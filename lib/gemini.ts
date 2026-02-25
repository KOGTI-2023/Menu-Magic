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
    text: `Analyze these images of a restaurant menu. Extract the structured data including the restaurant name (if visible), categories, and individual items. 
    For each item, extract the name, description (if any), price, and any dietary markers (like V, GF, Vegan).
    Correct any obvious OCR errors (e.g., remove unnecessary colons, fix typos).
    Return the data strictly in the requested JSON format.`
  };

  const isPro = modelName.includes('pro');
  
  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        restaurantName: { type: Type.STRING, description: "Name of the restaurant" },
        categories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Category name, e.g., Starters, Mains, Drinks" },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name of the dish or drink" },
                    description: { type: Type.STRING, description: "Description of the dish" },
                    price: { type: Type.STRING, description: "Price of the item, including currency symbol if present" },
                    dietary: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Dietary markers like V, GF, Vegan"
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
