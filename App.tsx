import React, { useState, useRef, useEffect } from 'react';
import StarryBackground from './components/StarryBackground';
import FileUpload from './components/FileUpload';
import { UserProfile, FortuneAnalysis, ZODIAC_SIGNS, ChatMessage } from './types';
import { generateFortuneAnalysis, initializeChat, sendMessageToChat } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<'input' | 'loading' | 'result'>('input');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    birthDate: '',
    birthTime: '',
    zodiac: ZODIAC_SIGNS[0],
    faceImage: null,
    earImage: null
  });
  
  const [analysis, setAnalysis] = useState<FortuneAnalysis | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof UserProfile, value: string | null) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const startAnalysis = async () => {
    if (!profile.name || !profile.birthDate) {
      alert("请填写姓名和出生日期。");
      return;
    }
    setView('loading');
    try {
      const result = await generateFortuneAnalysis(profile);
      setAnalysis(result);
      initializeChat(profile, result);
      // Add initial greeting from bot
      setMessages([{
        role: 'model',
        text: `您好，${profile.name}。星象已成。我已经为您排盘并分析了面相。关于您的未来运势，请随意提问。`
      }]);
      setView('result');
    } catch (error) {
      console.error(error);
      alert("星象晦暗不明 (API 错误)。请重试。");
      setView('input');
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const response = await sendMessageToChat(userMsg);
      if (response) {
        setMessages(prev => [...prev, { role: 'model', text: response }]);
      }
    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, { role: 'model', text: "与星辰的连接微弱..." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resetApp = () => {
    setProfile({
      name: '',
      birthDate: '',
      birthTime: '',
      zodiac: ZODIAC_SIGNS[0],
      faceImage: null,
      earImage: null
    });
    setAnalysis(null);
    setMessages([]);
    setView('input');
  };

  // --- VIEWS ---

  const LoadingView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 z-10 relative">
      <div className="w-24 h-24 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(168,85,247,0.5)]"></div>
      <h2 className="text-3xl font-serif text-white mb-4 tracking-widest animate-pulse">星运推演中</h2>
      <p className="text-purple-300 font-sans max-w-md">
        正在排盘紫微斗数... <br/>
        正在解析面相与痣相...
      </p>
    </div>
  );

  const InputView = () => (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 z-10 relative">
      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-serif text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-200 mb-2">
            紫微星运
          </h1>
          <p className="text-purple-300/80 font-serif tracking-widest text-sm">紫微斗数 & AI面相分析</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-purple-200 text-xs uppercase tracking-wider mb-1">姓名</label>
              <input 
                type="text" 
                value={profile.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-void-purple/50 border border-purple-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-mystic-accent transition-colors"
                placeholder="请输入姓名"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-purple-200 text-xs uppercase tracking-wider mb-1">出生日期</label>
                <input 
                  type="date" 
                  value={profile.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="w-full bg-void-purple/50 border border-purple-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-mystic-accent"
                />
              </div>
              <div>
                <label className="block text-purple-200 text-xs uppercase tracking-wider mb-1">出生时辰</label>
                <input 
                  type="time" 
                  value={profile.birthTime}
                  onChange={(e) => handleInputChange('birthTime', e.target.value)}
                  className="w-full bg-void-purple/50 border border-purple-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-mystic-accent"
                />
              </div>
            </div>
            <div>
              <label className="block text-purple-200 text-xs uppercase tracking-wider mb-1">星座</label>
              <select 
                value={profile.zodiac}
                onChange={(e) => handleInputChange('zodiac', e.target.value)}
                className="w-full bg-void-purple/50 border border-purple-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-mystic-accent"
              >
                {ZODIAC_SIGNS.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
             <FileUpload 
              label="面部照片 (面相)" 
              currentImage={profile.faceImage}
              onChange={(val) => handleInputChange('faceImage', val)}
             />
             <FileUpload 
              label="耳朵/特征照片" 
              currentImage={profile.earImage}
              onChange={(val) => handleInputChange('earImage', val)}
             />
          </div>
        </div>

        <button 
          onClick={startAnalysis}
          className="w-full bg-gradient-to-r from-indigo-900 to-purple-900 hover:from-indigo-800 hover:to-purple-800 border border-purple-500/50 text-white font-serif tracking-widest py-4 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] transition-all duration-300 transform hover:scale-[1.02]"
        >
          开启命运轮盘
        </button>
      </div>
    </div>
  );

  const ResultView = () => {
    if (!analysis) return null;

    return (
      <div className="min-h-screen p-4 md:p-8 relative z-10 flex flex-col md:flex-row gap-6 max-w-7xl mx-auto">
        
        {/* Left Column: Analysis Dashboard */}
        <div className="flex-1 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] custom-scrollbar pb-20 md:pb-0">
          
          <div className="flex items-center justify-between bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
             <div>
               <h2 className="text-3xl font-serif text-white">{profile.name}</h2>
               <p className="text-purple-300">{profile.zodiac} • {profile.birthDate}</p>
             </div>
             <button onClick={resetApp} className="text-xs border border-purple-500/50 px-3 py-1 rounded-full hover:bg-purple-900/50 transition">
                重新测算
             </button>
          </div>

          {/* Personality Color */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex items-center gap-6">
             <div 
                className="w-24 h-24 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border-4 border-white/10 flex-shrink-0"
                style={{ backgroundColor: analysis.personalityColor.hex }}
             ></div>
             <div>
                <h3 className="text-purple-200 text-sm uppercase tracking-wider mb-1">灵魂气场色</h3>
                <p className="text-2xl font-serif text-white mb-2">{analysis.personalityColor.name}</p>
                <p className="text-sm text-gray-300 italic">{analysis.personalityColor.meaning}</p>
             </div>
          </div>

          {/* Physiognomy */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-serif text-mystic-accent mb-4 border-b border-white/10 pb-2">面相运势报告</h3>
            <div className="space-y-4">
              <div className="bg-black/20 p-4 rounded-xl">
                <h4 className="text-purple-200 font-bold text-sm mb-1">面相分析</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{analysis.physiognomy.faceAnalysis}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 p-4 rounded-xl">
                  <h4 className="text-purple-200 font-bold text-sm mb-1">耳相运势</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{analysis.physiognomy.earAnalysis}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-xl">
                  <h4 className="text-purple-200 font-bold text-sm mb-1">痣相寓意</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{analysis.physiognomy.moleAnalysis}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Yearly Fortune */}
          <div className="bg-gradient-to-br from-purple-900/40 to-black/40 backdrop-blur-md p-6 rounded-2xl border border-purple-500/30">
            <h3 className="text-xl font-serif text-star-gold mb-4 flex items-center gap-2">
              <span className="text-2xl">✦</span> 流年运势
            </h3>
            <p className="text-gray-200 leading-7">{analysis.yearlyFortune}</p>
          </div>

          {/* Milestones */}
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
             <h3 className="text-xl font-serif text-white mb-6">未来重要节点</h3>
             <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-purple-800">
                {analysis.milestones.map((m, idx) => (
                  <div key={idx} className="relative pl-10">
                    <div className="absolute left-[13px] top-[6px] w-3.5 h-3.5 bg-mystic-accent rounded-full border-2 border-void-dark shadow-[0_0_10px_#9F7AEA]"></div>
                    <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition">
                      <span className="text-mystic-accent font-bold text-sm">{m.timeframe}</span>
                      <h4 className="text-white font-serif text-lg mt-1 mb-2">{m.prediction}</h4>
                      <p className="text-gray-400 text-sm">{m.advice}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>

        </div>

        {/* Right Column: Interactive Chat */}
        <div className="w-full md:w-96 h-[500px] md:h-auto md:max-h-[calc(100vh-4rem)] flex flex-col bg-void-dark/80 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden sticky top-8">
          <div className="p-4 bg-purple-900/30 border-b border-purple-500/20 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <h3 className="font-serif text-white tracking-widest">星运对话</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-br-none' 
                    : 'bg-white/10 text-gray-200 rounded-bl-none border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
               <div className="flex justify-start">
                 <div className="bg-white/10 p-3 rounded-2xl rounded-bl-none flex gap-1">
                   <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-75"></span>
                   <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-150"></span>
                 </div>
               </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-black/20 border-t border-purple-500/20">
            <div className="relative">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="向星辰提问..."
                className="w-full bg-void-dark border border-purple-500/30 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:outline-none focus:border-mystic-accent"
              />
              <button 
                onClick={handleChatSend}
                className="absolute right-2 top-2 p-1.5 text-purple-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-purple-500 selection:text-white">
      <StarryBackground />
      {view === 'input' && <InputView />}
      {view === 'loading' && <LoadingView />}
      {view === 'result' && <ResultView />}
    </div>
  );
};

export default App;