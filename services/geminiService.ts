
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { UserProfile, FortuneAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 全局会话变量，用于跟踪聊天上下文
let chatSession: Chat | null = null;

const extractBase64 = (dataUrl: string) => {
  return dataUrl.split(',')[1];
};

const getMimeType = (dataUrl: string) => {
  return dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
};

export const generateFortuneAnalysis = async (profile: UserProfile): Promise<FortuneAnalysis> => {
  const parts: any[] = [];

  let promptText = `
    你是一位殿堂级的命理导师“蒜蒜”，精通子平八字、紫微斗数与现代心理占星。
    
    【核心指令：严禁幻觉】
    用户出生数据：姓名：${profile.name}，日期：${profile.birthDate}，时间：${profile.birthTime}。
    
    在进行推演前，你必须在内心严格执行以下逻辑：
    1. **四柱排盘**：根据出生日期计算出精准的年、月、日、时四柱。
    2. **日主校验**：识别日柱天干（日元）。确保日主属性推导绝对正确。
    3. **严禁错误**：如果你无法确定干支，请以万年历标准为准。

    【输出文风与内容深度规范】
    你必须保持“专业、详尽、温情”的平衡感。用户反馈此前的分析内容过少，因此在本次推演中：
    
    1. **五行核心能量 (深度要求)**：
       - **nature (性格优势)**：严禁只给出一句短语。请提供至少3个维度的深刻剖析（如：精神内核、行动模式、思维优势），字数应在100字左右。
       - **supplement (增运补救)**：提供至少3条具体的、可实操的转运建议（涵盖颜色、方位、社交行为、环境能量等）。
       - **taboos (重点避坑)**：列举至少3个在职场、人际、心态上必须警惕的死穴或负面磁场。
    
    2. **三段式结构**：针对每一项分析（流年、事业、感情、财富）必须强制包含：
       - **【总体概况】**：对该维度的现状定性。
       - **【潜力与机遇】**：挖掘正向闪光点或即将到来的好运。
       - **【避坑指南】**：指出潜在风险或性格盲点。

    3. **全篇严禁英文**：不允许出现任何英文单词、缩写或标点。
    4. **大运节点**：给出3个关键大运（格式：XXXX年-XXXX年）。

    请严格以 JSON 格式返回。
  `;

  if (profile.faceImage) {
    promptText += "\n已附带面相数据。请结合面部的三停五岳、神采气色，对八字推演结果进行校准。";
    parts.push({
      inlineData: {
        data: extractBase64(profile.faceImage),
        mimeType: getMimeType(profile.faceImage),
      }
    });
  }

  parts.push({ text: promptText });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          yearlyFortune: { type: Type.STRING },
          fiveElements: {
            type: Type.OBJECT,
            properties: {
              element: { type: Type.STRING },
              nature: { type: Type.STRING },
              strength: { type: Type.STRING },
              supplement: { type: Type.STRING },
              taboos: { type: Type.STRING }
            },
            required: ["element", "nature", "strength", "supplement", "taboos"]
          },
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
          interpersonal: {
            type: Type.OBJECT,
            properties: {
              style: { type: Type.STRING },
              connection: { type: Type.STRING },
              caution: { type: Type.STRING }
            },
            required: ["style", "connection", "caution"]
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

  const responseText = response.text;
  if (!responseText) {
    throw new Error("推演中断，请重新链接。");
  }

  return JSON.parse(responseText.trim()) as FortuneAnalysis;
};

export const initializeChat = (profile: UserProfile, analysis: FortuneAnalysis) => {
  const systemInstruction = `
    你是一位专业且温情的 AI 命理导师“蒜蒜”。
    
    【核心规则】：
    1. 遵循“三段式”分析（总览+优势+避坑）。
    2. 针对五行分析，必须给出多维度的详细建议，不能只是几个词。
    3. 全程禁止输出英文。
    4. 始终围绕用户的日主属性 ${analysis.fiveElements.element} 进行专业且人性化的解答。
  `;

  chatSession = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction }
  });
};

export const sendMessageToChat = async (message: string) => {
  if (!chatSession) throw new Error("会话尚未初始化");
  const response = await chatSession.sendMessage({ message });
  return response.text;
};
