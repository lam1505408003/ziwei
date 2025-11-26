export interface UserProfile {
  name: string;
  birthDate: string;
  birthTime: string;
  zodiac: string;
  faceImage: string | null; // Base64
  earImage: string | null; // Base64
}

export interface FortuneAnalysis {
  yearlyFortune: string; // Detailed string
  milestones: {
    timeframe: string;
    prediction: string;
    advice: string;
  }[];
  physiognomy: {
    faceAnalysis: string;
    earAnalysis: string;
    moleAnalysis: string;
  };
  personalityColor: {
    hex: string;
    name: string;
    meaning: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const ZODIAC_SIGNS = [
  "白羊座", "金牛座", "双子座", "巨蟹座", 
  "狮子座", "处女座", "天秤座", "天蝎座", 
  "射手座", "摩羯座", "水瓶座", "双鱼座"
];