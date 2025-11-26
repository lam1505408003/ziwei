import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, FortuneAnalysis } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to convert Base64 string to standard format if needed,
 * though GenAI SDK usually handles raw base64 data in parts.
 * We expect the input here to be the full data URL "data:image/png;base64,..."
 */
const extractBase64 = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

const getMimeType = (dataUrl: string) => {
  return dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
};

export const generateFortuneAnalysis = async (profile: UserProfile): Promise<FortuneAnalysis> => {
  const parts: any[] = [];

  // Construct the prompt
  let promptText = `
    You are a grandmaster of Zi Wei Dou Shu (Purple Star Astrology) and traditional Chinese Physiognomy (Face Reading).
    
    User Profile:
    Name: ${profile.name}
    Birthday: ${profile.birthDate}
    Birth Time: ${profile.birthTime}
    Zodiac: ${profile.zodiac}

    Please provide a comprehensive fortune analysis in Chinese (Simplified).
    1. Predict the yearly fortune based on Zi Wei Dou Shu.
    2. Identify future important milestones (dates and events).
    3. Analyze the provided face and ear images (if any) for personality and destiny traits (Physiognomy).
    4. Provide a "Soul Color" (hex code) that represents their aura based on this analysis.
    
    Return the response in strict JSON format.
  `;

  if (profile.faceImage) {
    promptText += "\nI have attached a photo of my face. Please analyze facial features and moles.";
    parts.push({
      inlineData: {
        data: extractBase64(profile.faceImage),
        mimeType: getMimeType(profile.faceImage),
      }
    });
  }

  if (profile.earImage) {
    promptText += "\nI have attached a photo of my ear. Please analyze ear shape and fortune.";
    parts.push({
      inlineData: {
        data: extractBase64(profile.earImage),
        mimeType: getMimeType(profile.earImage),
      }
    });
  }

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash', // Flash is great for multimodal analysis
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          yearlyFortune: { type: Type.STRING },
          milestones: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                timeframe: { type: Type.STRING },
                prediction: { type: Type.STRING },
                advice: { type: Type.STRING }
              }
            }
          },
          physiognomy: {
            type: Type.OBJECT,
            properties: {
              faceAnalysis: { type: Type.STRING },
              earAnalysis: { type: Type.STRING },
              moleAnalysis: { type: Type.STRING }
            }
          },
          personalityColor: {
            type: Type.OBJECT,
            properties: {
              hex: { type: Type.STRING },
              name: { type: Type.STRING },
              meaning: { type: Type.STRING }
            }
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate fortune analysis.");
  }

  return JSON.parse(response.text) as FortuneAnalysis;
};

// Chat instance storage to maintain history per session (simple implementation)
let chatSession: any = null;

export const initializeChat = (profile: UserProfile, analysis: FortuneAnalysis) => {
  const systemInstruction = `
    You are a mystic AI fortune teller using Zi Wei Dou Shu.
    You have already analyzed the user ${profile.name} (Born: ${profile.birthDate}).
    
    Here is their summary analysis:
    Yearly: ${analysis.yearlyFortune}
    Face Reading: ${analysis.physiognomy.faceAnalysis}
    
    Answer their follow-up questions with a mysterious, wisdom-filled, yet helpful tone in Chinese (Simplified).
    Keep answers concise but profound.
  `;

  chatSession = ai.chats.create({
    model: 'gemini-3-pro-preview', // Using the powerful model for reasoning/chat
    config: {
      systemInstruction: systemInstruction,
    }
  });
};

export const sendMessageToChat = async (message: string) => {
  if (!chatSession) {
    throw new Error("Chat session not initialized");
  }

  const response = await chatSession.sendMessage({ message });
  return response.text;
};