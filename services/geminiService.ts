
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, FortuneAnalysis } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const extractBase64 = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

const getMimeType = (dataUrl: string) => {
  return dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
};

export const generateFortuneAnalysis = async (profile: UserProfile): Promise<FortuneAnalysis> => {
  const parts: any[] = [];

  let promptText = `
    你是一位精通紫微斗数、子平八字和传统面相学的当代命理大师，你的代号是“蒜蒜”。
    
    用户信息：
    姓名：${profile.name}
    出生日期：${profile.birthDate}
    出生时辰：${profile.birthTime}
    星座：${profile.zodiac}

    请提供一份专业且深度的命理分析，语言使用简体中文。
    
    1. **本命盘解析 (Natal Chart Analysis)**：从大师视角深度剖析：
       - **性格**：内在特质、潜能与底层本色。
       - **事业**：职业路径、领导力、适合行业。
       - **爱情**：情感风格、桃花规律。
       - **婚姻**：婚姻稳定性、理想伴侣特质。
       - **财富**：财库容量、赚钱机遇、守财建议。
       
    2. **今年运势 (Yearly Fortune)**：请务必针对 **2025乙巳蛇年** 进行紫微流年大运预测。
    3. **命运里程碑 (Milestones)**：确定未来几个重要的时间节点（具体年份和事件）。
    4. **面相解析 (Physiognomy)**：根据提供的面部特征进行命理推演。
    5. **灵魂底色 (Personality Color)**：提供一个对应的 HEX 颜色代码，并起一个富有诗意的中文名及含义。
    6. **命理映射 (Similar Person)**：寻找一位历史上命格相似的人物进行映射。
    
    以严格的 JSON 格式返回，符合 Schema 要求。
  `;

  if (profile.faceImage) {
    promptText += "\n已附带面相照片，请针对五官、气色和痣相进行详细分析。";
    parts.push({
      inlineData: {
        data: extractBase64(profile.faceImage),
        mimeType: getMimeType(profile.faceImage),
      }
    });
  }

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
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
          },
          similarPerson: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING }
            }
          },
          natalChart: {
            type: Type.OBJECT,
            properties: {
              personality: { type: Type.STRING },
              career: { type: Type.STRING },
              love: { type: Type.STRING },
              marriage: { type: Type.STRING },
              wealth: { type: Type.STRING }
            },
            required: ["personality", "career", "love", "marriage", "wealth"]
          }
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("生成分析报告失败。");
  }

  return JSON.parse(response.text) as FortuneAnalysis;
};

let chatSession: any = null;

export const initializeChat = (profile: UserProfile, analysis: FortuneAnalysis) => {
  const systemInstruction = `
    你是一位神秘的 AI 命理官，名叫“蒜蒜”。
    用户：${profile.name}，星座：${profile.zodiac}。
    2025年核心运势：${analysis.yearlyFortune}。
    
    请使用简体中文回答后续问题。
    语气：庄重、富有禅意且充满智慧，偶尔带有一点赛博朋克的冷峻感。回答要简练而深刻。
  `;

  chatSession = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: systemInstruction,
    }
  });
};

export const sendMessageToChat = async (message: string) => {
  if (!chatSession) {
    throw new Error("会话尚未初始化");
  }
  const response = await chatSession.sendMessage({ message });
  return response.text;
};
