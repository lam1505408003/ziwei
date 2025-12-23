
export interface UserProfile {
  name: string;
  birthDate: string;
  birthTime: string;
  zodiac: string;
  faceImage: string | null; // Base64
  earImage: string | null; // Base64
}

export interface FortuneAnalysis {
  yearlyFortune: string;
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
  similarPerson: {
    name: string;
    description: string;
  };
  natalChart: {
    personality: string;
    career: string;
    love: string;
    marriage: string;
    wealth: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
