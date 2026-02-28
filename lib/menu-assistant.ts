import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { withRetry } from "./error-handler";
import { MenuData } from "./gemini";

export async function updateMenuData(
  currentData: MenuData,
  promptText: string,
  apiKey: string,
  thinkingLevel: "FAST" | "BALANCED" | "MAX" = "BALANCED"
): Promise<{ data: MenuData, usage: any }> {
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = {
    text: `Du bist ein professioneller KI-Assistent für Speisekarten-Design. Deine Aufgabe ist es, eine bestehende Speisekarte im JSON-Format basierend auf Benutzeranweisungen zu aktualisieren.

<CONSTRAINTS>
1. Behalte alle Daten bei, die nicht explizit von der Änderung betroffen sind.
2. Ändere nur die Felder, die durch den Benutzerbefehl impliziert werden.
3. Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt.
4. Verwende KEINE Markdown-Formatierung (wie \`\`\`json) in deiner Antwort.
</CONSTRAINTS>

<CURRENT_MENU>
${JSON.stringify(currentData)}
</CURRENT_MENU>

<USER_COMMAND>
${promptText}
</USER_COMMAND>

Generiere nun das aktualisierte JSON-Objekt:`
  };

  const config: any = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        restaurantName: { type: Type.STRING },
        subtitle: { type: Type.STRING },
        processingDecision: { type: Type.STRING },
        originalStyle: {
          type: Type.OBJECT,
          properties: {
            fontFamily: { type: Type.STRING },
            primaryColor: { type: Type.STRING },
            accentColor: { type: Type.STRING },
            backgroundColor: { type: Type.STRING },
            textColor: { type: Type.STRING }
          },
          required: ["fontFamily", "primaryColor", "backgroundColor", "textColor"]
        },
        categories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    number: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    ingredients: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    prices: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          value: { type: Type.STRING }
                        },
                        required: ["value"]
                      }
                    },
                    additives: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    allergens: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    boundingBox: {
                      type: Type.OBJECT,
                      properties: {
                        x: { type: Type.NUMBER },
                        y: { type: Type.NUMBER },
                        width: { type: Type.NUMBER },
                        height: { type: Type.NUMBER }
                      }
                    },
                    repairMetadata: {
                      type: Type.OBJECT,
                      properties: {
                        wasRepaired: { type: Type.BOOLEAN },
                        confidence: { type: Type.NUMBER },
                        originalText: { type: Type.STRING }
                      }
                    }
                  },
                  required: ["name", "prices"]
                }
              }
            },
            required: ["category", "items"]
          }
        },
        footer: {
          type: Type.OBJECT,
          properties: {
            additives: { type: Type.STRING },
            allergens: { type: Type.STRING }
          }
        }
      },
      required: ["categories"]
    }
  };

  const executeUpdate = async () => {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [prompt] },
      config
    });

    let text = response.text;
    if (!text) {
      throw new Error("Leere Antwort von der API erhalten.");
    }

    text = text.replace(/^```json\n?/g, '').replace(/```\n?$/g, '').trim();

    try {
      const parsedData = JSON.parse(text) as MenuData;
      return { data: parsedData, usage: response.usageMetadata };
    } catch (parseError) {
      throw new Error("Fehler beim Verarbeiten der API-Antwort (ungültiges JSON).");
    }
  };

  try {
    return await withRetry(executeUpdate);
  } catch (error: any) {
    throw new Error(`Gemini API Fehler: ${error.message || String(error)}`);
  }
}
