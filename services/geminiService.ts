
import { GoogleGenAI, Type } from "@google/genai";
import { BoardData } from "../types";

export async function parseBoardImage(base64Image: string): Promise<BoardData> {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key not configured. Please set VITE_GEMINI_API_KEY in .env.local");
  }

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            text: `Analyze this football squares board image. 
            1. Identify the 10 numbers on the top horizontal axis (oppAxis).
            2. Identify the 10 numbers on the left vertical axis (bearsAxis).
            3. Extract the names written in each of the 100 squares.
            
            Important:
            - Output the results as JSON.
            - Identify the positions of names. 
            - Provide 'squaresGrid' as an array of 100 items. 
            - Each item corresponds to a position (moving row by row, left to right).
            - Each item is an array of strings (names in that box).
            - If a square is empty, provide an empty array [].
            - Ensure output is exactly 100 items in 'squaresGrid'.`
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bearsAxis: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "The 10 digits on the vertical (left) axis."
            },
            oppAxis: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
              description: "The 10 digits on the horizontal (top) axis."
            },
            squaresGrid: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              description: "Exactly 100 arrays, one per grid cell."
            }
          },
          required: ["bearsAxis", "oppAxis", "squaresGrid"]
        }
      }
    });
  } catch (apiError: any) {
    console.error("Gemini API Error:", apiError);
    throw new Error(`Gemini API error: ${apiError?.message || 'Unknown API error'}`);
  }

  const text = response.text;
  if (!text) {
    console.error("Gemini returned empty response:", response);
    throw new Error("AI returned empty response - check API key and quota");
  }

  try {
    const rawData = JSON.parse(text);

    return {
      bearsAxis: rawData.bearsAxis,
      oppAxis: rawData.oppAxis,
      squares: rawData.squaresGrid
    } as BoardData;
  } catch (e) {
    console.error("Failed to parse or transform AI response:", text);
    throw new Error("AI returned invalid data structure");
  }
}
