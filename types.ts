
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
  interpersonal: {
    style: string;      // 社交风格
    connection: string; // 贵人/人脉情况
    caution: string;    // 社交注意点
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
  fiveElements: {
    element: string;      // 五行属性 (如：乙木)
    nature: string;       // 形象描述 (如：花草之木)
    strength: string;     // 能量强度 (如：身强、身弱、中和)
    supplement: string;   // 补益建议
    taboos: string;       // 注意事项
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
