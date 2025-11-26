import React, { useState, useRef, useEffect } from 'react';
import StarryBackground from './components/StarryBackground';
import FileUpload from './components/FileUpload';
import { UserProfile, FortuneAnalysis, ChatMessage } from './types';
import { generateFortuneAnalysis, initializeChat, sendMessageToChat } from './services/geminiService';

// Helper to calculate Zodiac sign from date string (YYYY-MM-DD)
const getZodiacSign = (dateString: string): string => {
  if (!dateString) return "";
  // Split manually to avoid timezone issues with new Date()
  const parts = dateString.split('-');
  if (parts.length !== 3) return "";
  
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "白羊座";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "金牛座";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 21)) return "双子座";
  if ((month === 6 && day >= 22) || (month === 7 && day <= 22)) return "巨蟹座";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "狮子座";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "处女座";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 23)) return "天秤座";
  if ((month === 10 && day >= 24) || (month === 11 && day <= 22)) return "天蝎座";
  if ((month === 11 && day >= 23) || (month === 12 && day <= 21)) return "射手座";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "摩羯座";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "水瓶座";
  return "双鱼座";
};

const App: React.FC = () => {
  const [view, setView] = useState<'input' | 'loading' | 'result'>('input');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    birthDate: '',
    birthTime: '',
    zodiac: '',
    faceImage: null,
    earImage: null
  });
  
  const [analysis, setAnalysis] = useState<FortuneAnalysis | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof UserProfile, value: string | null) => {
    setProfile(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate zodiac when birthDate changes
      if (field === 'birthDate' && value) {
        updated.zodiac = getZodiacSign(value);
      }
      
      return updated;
    });
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
      // Add initial greeting from bot in Chinese
      setMessages([{
        role: 'model',
        text: `您好，${profile.name}。星轨已定，面相已观。关于您的运势，或与您命运相似的古人 ${result.similarPerson.name}，请随意提问。`
      }]);
      setView('result');
    } catch (error) {
      console.error(error);
      alert("星象连接失败 (API Error)。请重试。");
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
      setMessages(prev => [...prev, { role: 'model', text: "星辰信号微弱..." }]);
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
      zodiac: '',
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
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-ping"></div>
        <div className="absolute inset-2 border-4 border-t-purple-400 border-r-transparent border-b-purple-400 border-l-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">✦</span>
        </div>
      </div>
      <h2 className="text-3xl font-serif text-white mb-4 tracking-[0.2em] animate-pulse">星运推演中</h2>
      <p className="text-purple-300/60 font-sans font-light tracking-wide text-sm">
        连接紫微星垣... <br/>
        解析面相命宫...
      </p>
    </div>
  );

  const InputView = () => (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 z-10 relative">
      <div className="w-full max-w-xl bg-[#0B0216]/60 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-6 md:p-10 shadow-[0_0_50px_rgba(76,29,149,0.2)]">
        <div className="text-center mb-10">
          <div className="inline-block p-3 rounded-full bg-purple-900/20 mb-4 border border-purple-500/20">
            <span className="text-3xl">🔮</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-2 tracking-wider">
            紫微星运
          </h1>
          <p className="text-purple-300/50 font-sans tracking-[0.2em] text-xs uppercase">AI Powered Destiny Analysis</p>
        </div>

        {/* Updated to Single Column Vertical Stack */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="space-y-1">
            <label className="text-purple-200/60 text-xs uppercase tracking-widest pl-1">姓名</label>
            <input 
              type="text" 
              value={profile.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full bg-black/20 border border-purple-500/20 rounded-xl p-3 text-white placeholder-purple-500/30 focus:outline-none focus:border-purple-400/50 focus:bg-purple-900/10 transition-all"
              placeholder="请输入您的姓名"
            />
          </div>
          <div className="space-y-1">
            <label className="text-purple-200/60 text-xs uppercase tracking-widest pl-1">出生日期</label>
            <input 
              type="date" 
              value={profile.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className="w-full bg-black/20 border border-purple-500/20 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-400/50 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-purple-200/60 text-xs uppercase tracking-widest pl-1">出生时辰</label>
            <input 
              type="time" 
              value={profile.birthTime}
              onChange={(e) => handleInputChange('birthTime', e.target.value)}
              className="w-full bg-black/20 border border-purple-500/20 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-purple-400/50 transition-all"
            />
          </div>
          {/* Zodiac input removed - automatically calculated */}

          {/* Uploads in the same vertical stack */}
          <FileUpload 
            label="上传面部照片 (面相)" 
            currentImage={profile.faceImage}
            onChange={(val) => handleInputChange('faceImage', val)}
          />
          <FileUpload 
            label="上传耳朵照片 (可选)" 
            currentImage={profile.earImage}
            onChange={(val) => handleInputChange('earImage', val)}
          />
        </div>

        <button 
          onClick={startAnalysis}
          className="group w-full relative overflow-hidden bg-purple-600 hover:bg-purple-500 text-white font-serif tracking-[0.2em] py-4 rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all duration-300 transform hover:scale-[1.01]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          <span className="relative z-10">开启命运轮盘</span>
        </button>
      </div>
    </div>
  );

  const ResultView = () => {
    if (!analysis) return null;

    return (
      <div className="min-h-screen p-4 md:p-6 relative z-10 flex flex-col md:flex-row gap-6 max-w-[1600px] mx-auto">
        
        {/* Left Column: Analysis Dashboard */}
        <div className="flex-[2] space-y-6 overflow-y-auto max-h-[calc(100vh-3rem)] custom-scrollbar pr-2">
          
          {/* Header Card */}
          <div className="flex items-center justify-between bg-[#150528]/80 backdrop-blur-xl p-8 rounded-[1.5rem] border border-white/5 shadow-lg">
             <div className="flex items-center gap-6">
                 {/* Back Button */}
                 <button 
                   onClick={resetApp}
                   className="w-12 h-12 flex items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-purple-500/20 text-purple-200 transition-all hover:scale-105"
                   title="返回主页"
                 >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                   </svg>
                 </button>
                 <div>
                   <h2 className="text-4xl font-serif text-white mb-2">{profile.name}</h2>
                   <div className="flex items-center gap-3 text-purple-300/80 text-sm tracking-wide">
                     <span className="uppercase">{profile.zodiac}</span>
                     <span className="w-1 h-1 bg-purple-500 rounded-full"></span>
                     <span>{profile.birthDate}</span>
                   </div>
                 </div>
             </div>
             <button onClick={resetApp} className="hidden md:block px-6 py-2 border border-purple-500/30 rounded-full text-sm hover:bg-purple-500/10 text-purple-200 transition-colors">
                重新测算
             </button>
          </div>

          {/* Grid for Soul Color & Similar Person */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Soul Color Aura */}
            <div className="bg-[#150528]/80 backdrop-blur-xl p-6 rounded-[1.5rem] border border-blue-400/20 shadow-[0_0_30px_rgba(56,189,248,0.1)] relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="flex items-center gap-6 relative z-10">
                  <div 
                      className="w-20 h-20 shrink-0 rounded-full shadow-[0_0_20px_rgba(0,0,0,0.6)] border border-white/20 relative"
                      style={{ backgroundColor: analysis.personalityColor.hex, boxShadow: `0 0 20px ${analysis.personalityColor.hex}60` }}
                  ></div>
                  <div>
                    <span className="text-blue-200/70 text-xs uppercase tracking-[0.2em] mb-1 block">灵魂气场色</span>
                    <h3 className="text-2xl font-serif text-white mb-2">{analysis.personalityColor.name}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed italic line-clamp-3">
                      "{analysis.personalityColor.meaning}"
                    </p>
                  </div>
              </div>
            </div>

            {/* Historical Figure Card (New) */}
            <div className="bg-[#150528]/80 backdrop-blur-xl p-6 rounded-[1.5rem] border border-pink-400/20 shadow-[0_0_30px_rgba(244,114,182,0.1)] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl -ml-10 -mt-10 pointer-events-none"></div>
              <div className="relative z-10 h-full flex flex-col justify-center">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-lg">🏛️</span>
                   <span className="text-pink-200/70 text-xs uppercase tracking-[0.2em]">命理映射 (Similar Historical Figure)</span>
                 </div>
                 <h4 className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-pink-200 to-purple-200 font-serif mb-2">{analysis.similarPerson.name}</h4>
                 <p className="text-gray-400 text-xs leading-relaxed border-l-2 border-pink-500/30 pl-3 line-clamp-3">
                    {analysis.similarPerson.description}
                 </p>
              </div>
            </div>
          </div>

          {/* Physiognomy Report */}
          <div className="bg-[#150528]/80 backdrop-blur-xl rounded-[1.5rem] border border-purple-500/10 overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5">
               <h3 className="font-serif text-xl text-purple-200 tracking-widest">面相运势报告</h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Face Reading (Full Width) */}
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-colors">
                <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  面相解析 (Face Reading)
                </h4>
                <p className="text-gray-400 text-sm leading-7">
                  {analysis.physiognomy.faceAnalysis}
                </p>
              </div>

              {/* Grid for Ear & Moles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-colors">
                  <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    耳相运势 (Ear Fortune)
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {analysis.physiognomy.earAnalysis}
                  </p>
                </div>
                <div className="bg-black/20 p-6 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-colors">
                  <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                    痣相寓意 (Mole Meanings)
                  </h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {analysis.physiognomy.moleAnalysis}
                  </p>
                </div>
              </div>
            </div>
          </div>

           {/* Yearly Fortune & Milestones */}
           <div className="grid grid-cols-1 gap-6">
              <div className="bg-[#150528]/80 backdrop-blur-xl p-8 rounded-[1.5rem] border border-yellow-500/10">
                <h3 className="text-lg font-serif text-yellow-200/80 mb-4 flex items-center gap-2">
                  <span className="text-xl">✦</span> 流年运势
                </h3>
                <p className="text-gray-300 leading-8">{analysis.yearlyFortune}</p>
              </div>

              <div className="bg-[#150528]/80 backdrop-blur-xl p-8 rounded-[1.5rem] border border-white/5">
                 <h3 className="text-lg font-serif text-white mb-6">未来重要节点</h3>
                 <div className="space-y-4">
                    {analysis.milestones.map((m, idx) => (
                      <div key={idx} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                           <div className="w-3 h-3 bg-purple-500 rounded-full ring-4 ring-purple-900/50 group-hover:bg-purple-400 transition-colors"></div>
                           <div className="w-0.5 h-full bg-purple-900/50 my-2 group-last:hidden"></div>
                        </div>
                        <div className="pb-6">
                           <span className="text-purple-400 text-xs font-bold tracking-wider uppercase bg-purple-900/30 px-2 py-1 rounded mb-2 inline-block">{m.timeframe}</span>
                           <h4 className="text-gray-200 font-serif mb-1">{m.prediction}</h4>
                           <p className="text-gray-500 text-sm">{m.advice}</p>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

        </div>

        {/* Right Column: Interactive Chat - Sidebar Style */}
        <div className="flex-1 min-w-[320px] max-w-md h-[calc(100vh-3rem)] sticky top-6 flex flex-col bg-[#0f0418]/90 backdrop-blur-2xl border border-purple-500/20 rounded-[1.5rem] shadow-2xl overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-gradient-to-r from-purple-900/20 to-transparent">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]"></div>
                <h3 className="font-serif text-white tracking-[0.2em] text-sm">星运对话 (ORACLE CHAT)</h3>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-black/20">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 text-sm leading-relaxed shadow-lg ${
                  msg.role === 'user' 
                    ? 'bg-purple-600 text-white rounded-2xl rounded-tr-none' 
                    : 'bg-[#1E0B36] text-gray-300 rounded-2xl rounded-tl-none border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
               <div className="flex justify-start">
                 <div className="bg-[#1E0B36] p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-2 items-center">
                   <span className="text-xs text-gray-500">星辰思考中</span>
                   <span className="flex gap-1">
                     <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce"></span>
                     <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-75"></span>
                     <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce delay-150"></span>
                   </span>
                 </div>
               </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-[#0B0216] border-t border-white/5">
            <div className="relative group">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                placeholder="向星辰提问..."
                className="w-full bg-[#1E0B36] border border-purple-500/20 rounded-xl pl-4 pr-12 py-4 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-[#250d42] transition-all"
              />
              <button 
                onClick={handleChatSend}
                disabled={!chatInput.trim()}
                className="absolute right-2 top-2 p-2 text-purple-400 hover:text-white disabled:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                   <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
      <StarryBackground />
      {view === 'input' && <InputView />}
      {view === 'loading' && <LoadingView />}
      {view === 'result' && <ResultView />}
    </div>
  );
};

export default App;