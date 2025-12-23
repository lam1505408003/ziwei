
import React, { useState, useRef, useEffect } from 'react';
import StarryBackground from './components/StarryBackground';
import FileUpload from './components/FileUpload';
import { UserProfile, FortuneAnalysis, ChatMessage } from './types';
import { generateFortuneAnalysis, initializeChat, sendMessageToChat } from './services/geminiService';

const getZodiacSign = (dateString: string): string => {
  if (!dateString) return "";
  const parts = dateString.split('-');
  if (parts.length !== 3) return "";
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const signs = [
    { name: "白羊座", start: [3, 21], end: [4, 19] },
    { name: "金牛座", start: [4, 20], end: [5, 20] },
    { name: "双子座", start: [5, 21], end: [6, 21] },
    { name: "巨蟹座", start: [6, 22], end: [7, 22] },
    { name: "狮子座", start: [7, 23], end: [8, 22] },
    { name: "处女座", start: [8, 23], end: [9, 22] },
    { name: "天秤座", start: [9, 23], end: [10, 23] },
    { name: "天蝎座", start: [10, 24], end: [11, 22] },
    { name: "射手座", start: [11, 23], end: [12, 21] },
    { name: "摩羯座", start: [12, 22], end: [1, 19] },
    { name: "水瓶座", start: [1, 20], end: [2, 18] },
    { name: "双鱼座", start: [2, 19], end: [3, 20] }
  ];
  const sign = signs.find(s => {
    const [sm, sd] = s.start;
    const [em, ed] = s.end;
    if (month === sm && day >= sd) return true;
    if (month === em && day <= ed) return true;
    return false;
  });
  return sign ? sign.name : "未知";
};

// 意境插画组件：用于展示本命底色
const CosmicOrb = ({ color }: { color: string }) => (
  <div className="relative w-full h-full min-h-[140px] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-900/5">
    <div className="absolute inset-0 opacity-40 blur-3xl animate-pulse" style={{ background: color }}></div>
    <div className="relative w-24 h-24 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.4)] transition-transform duration-1000 group-hover:scale-110 overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}, white, #f0f4ff)` }}>
       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.8),transparent_60%)]"></div>
       <div className="absolute bottom-[-20%] right-[-20%] w-[120%] h-[120%] bg-[conic-gradient(from_0deg,transparent,rgba(0,0,0,0.1),transparent)] animate-spin-slow"></div>
    </div>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
       <div className="w-full h-[1px] bg-white/20 rotate-45"></div>
       <div className="w-full h-[1px] bg-white/20 -rotate-45"></div>
    </div>
  </div>
);

const BrandHeader = ({ size = "large" }: { size?: "small" | "large" }) => (
  <div className={`flex flex-col items-center group ${size === 'small' ? 'mb-4' : 'mb-6'}`}>
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 bg-white/40 blur-[40px] rounded-full scale-150 group-hover:scale-175 transition-transform duration-1000 opacity-80"></div>
      <div className="relative flex flex-col items-center">
        <svg viewBox="0 0 100 100" className={`${size === 'small' ? 'w-10 h-10' : 'w-20 h-20'} text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]`} fill="currentColor">
          <path d="M50 10 C65 10 80 30 80 55 C80 80 65 90 50 90 C35 90 20 80 20 55 C20 30 35 10 50 10 Z" />
          <path d="M50 10 C55 10 60 20 60 55 C60 80 55 90 50 90 C45 90 40 80 40 55 C40 20 45 10 50 10 Z" fill="rgba(255,255,255,0.4)" />
          <circle cx="50" cy="90" r="3" fill="white" />
        </svg>
        <h1 className={`neon-gradient-text ${size === 'small' ? 'text-2xl' : 'text-6xl'} font-black tracking-tighter transition-all duration-500 group-hover:tracking-normal`}>
          蒜蒜
        </h1>
      </div>
    </div>
  </div>
);

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof UserProfile, value: string | null) => {
    setProfile(prev => {
      const updated = { ...prev, [field]: value };
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
      setMessages([{ role: 'model', text: `星辰已归位，蒜蒜已为你推演完毕。` }]);
      setView('result');
    } catch (error) {
      console.error(error);
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
      setMessages(prev => [...prev, { role: 'model', text: "链接波动，请稍后再试。" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatOpen]);

  const LoadingView = () => (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="floating-glass w-72 h-72 md:w-96 md:h-96 !rounded-full flex flex-col items-center justify-center text-center animate-float p-12">
        <BrandHeader size="small" />
        <h2 className="text-xl md:text-2xl font-black text-slate-700 tracking-tight mt-2">蒜蒜正在和宇宙链接</h2>
        <p className="text-[9px] text-indigo-400 mt-2 font-bold uppercase tracking-widest opacity-60">Awaiting Cosmic Alignment</p>
      </div>
    </div>
  );

  const InputView = () => (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute top-12 left-12 hidden md:flex flex-col gap-2 opacity-60">
        <span className="text-[10px] font-black tracking-[0.3em] text-white">SUAN SUAN LAB</span>
        <span className="text-[10px] font-black tracking-[0.3em] text-white">FUTURE PLAN 2025</span>
      </div>
      
      <div className="w-full max-w-xl floating-glass p-12 md:p-16 animate-float">
        <div className="text-center mb-10">
          <BrandHeader />
        </div>

        <div className="space-y-6">
          <input 
            type="text" 
            placeholder="姓名 / NAME"
            value={profile.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="date" 
              value={profile.birthDate}
              onChange={(e) => handleInputChange('birthDate', e.target.value)}
              className="w-full"
            />
            <input 
              type="time" 
              value={profile.birthTime}
              onChange={(e) => handleInputChange('birthTime', e.target.value)}
              className="w-full"
            />
          </div>
          <FileUpload 
            label="" 
            currentImage={profile.faceImage}
            onChange={(val) => handleInputChange('faceImage', val)}
          />
          <button 
            onClick={startAnalysis}
            className="w-full halo-button py-5 text-lg mt-6 tracking-widest uppercase"
          >
            开启推演
          </button>
        </div>
      </div>
    </div>
  );

  const ResultView = () => {
    if (!analysis) return null;

    return (
      <div className="min-h-screen py-10 md:py-20 px-4 md:px-6 overflow-x-hidden">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          
          {/* Top Profile Card - Wide */}
          <div className="floating-glass p-8 md:p-10 text-center animate-float">
            <div className="flex justify-between items-center mb-6">
               <button 
                onClick={() => setView('input')} 
                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors"
               >
                 <span className="w-5 h-5 rounded-full border border-indigo-200 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">←</span>
                 BACK
               </button>
               <BrandHeader size="small" />
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-slate-800 tracking-tighter uppercase mb-4">{profile.name}</h2>
            <div className="flex justify-center flex-wrap gap-2 md:gap-3">
              <span className="px-5 py-1.5 bg-white/40 backdrop-blur border border-white/60 rounded-full text-[11px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">{profile.zodiac}</span>
              <span className="px-5 py-1.5 bg-white/40 backdrop-blur border border-white/60 rounded-full text-[11px] font-black uppercase tracking-widest text-pink-600 shadow-sm">{profile.birthDate}</span>
              <span className="px-5 py-1.5 bg-white/40 backdrop-blur border border-white/60 rounded-full text-[11px] font-black uppercase tracking-widest text-amber-600 shadow-sm">{profile.birthTime || '未知时辰'}</span>
            </div>
          </div>

          {/* Grid Layout - Mixed sizes */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            
            {/* 2025 Yearly - Wide Rect */}
            <div className="md:col-span-4 floating-glass p-8 group hover:bg-white/30 transition-all flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🌟</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">2025 年度总运 / YEARLY ORACLE</span>
              </div>
              <h4 className="text-3xl font-black text-slate-800 mb-3">乙巳蛇年</h4>
              <p className="text-sm font-bold text-slate-500 leading-loose opacity-90">{analysis.yearlyFortune}</p>
            </div>

            {/* Personality Color - Square */}
            <div className="md:col-span-2 floating-glass p-6 group flex flex-col text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block">本命底色 / SOUL COLOR</span>
              <CosmicOrb color={analysis.personalityColor.hex} />
              <div className="mt-4">
                <h4 className="text-xl font-black" style={{ color: analysis.personalityColor.hex }}>{analysis.personalityColor.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{analysis.personalityColor.meaning}</p>
              </div>
            </div>

            {/* Career - Rect */}
            <div className="md:col-span-3 floating-glass p-8 group border-l-4 border-indigo-400/30">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💼</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">事业轨迹 / CAREER PATH</span>
              </div>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">{analysis.natalChart.career}</p>
            </div>

            {/* Love - Rect */}
            <div className="md:col-span-3 floating-glass p-8 group border-l-4 border-pink-400/30">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">❤️</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400">情缘定数 / DESTINY LOVE</span>
              </div>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">{analysis.natalChart.love}</p>
            </div>

            {/* Wealth & Person - Two Squares/Small rects on mobile */}
            <div className="md:col-span-3 floating-glass p-8 group bg-gradient-to-br from-white/20 to-amber-50/20">
               <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💰</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">财富格局 / WEALTH FLOW</span>
              </div>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">{analysis.natalChart.wealth}</p>
            </div>

            <div className="md:col-span-3 floating-glass p-8 group">
               <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🧩</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">命理映射 / HISTORICAL ECHO</span>
              </div>
              <h4 className="text-lg font-black text-slate-700 mb-1">{analysis.similarPerson.name}</h4>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">{analysis.similarPerson.description}</p>
            </div>

            {/* Milestones - Wide (Now before Physiognomy) */}
            <div className="md:col-span-6 floating-glass p-8 group bg-slate-800/5">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">⏳</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">命运里程碑 / MILESTONES</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {analysis.milestones.map((m, idx) => (
                  <div key={idx} className="p-4 bg-white/40 rounded-2xl border border-white/60">
                    <span className="text-[10px] font-black text-indigo-400 mb-1 block">{m.timeframe}</span>
                    <h5 className="font-black text-slate-700 mb-2">{m.prediction}</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">建议：{m.advice}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Physiognomy - Wide (Now at the end) */}
            <div className="md:col-span-6 floating-glass p-8 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">面相解析 / PHYSIOGNOMY</span>
                </div>
                {profile.faceImage && <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm"><img src={profile.faceImage} className="w-full h-full object-cover" /></div>}
              </div>
              <p className="text-sm font-bold text-slate-600 leading-loose italic">"{analysis.physiognomy.faceAnalysis}"</p>
            </div>
          </div>

          <div className="text-center py-10 opacity-40">
            <p className="text-[10px] font-black tracking-[0.4em] uppercase text-slate-800">Suan Suan Wisdom - Future Decoded</p>
          </div>
        </div>

        {/* Floating AI Interaction */}
        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 md:bottom-12 md:right-12 w-20 h-20 md:w-24 md:h-24 floating-glass !rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all cursor-pointer group z-layer-2 bg-white/40 border-2 border-white/80"
        >
          <span className="text-4xl md:text-5xl group-hover:animate-bounce">💬</span>
          <div className="absolute inset-[-4px] rounded-full border-2 border-dashed border-indigo-400/20 animate-spin-slow"></div>
        </button>

        {isChatOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-indigo-900/10 backdrop-blur-3xl">
            <div className="w-full max-w-xl h-[85vh] md:h-[75vh] flex flex-col floating-glass shadow-[0_0_100px_rgba(255,255,255,0.4)] overflow-hidden">
              <div className="p-8 md:p-10 border-b border-white/20 flex justify-between items-center bg-white/10">
                <div className="flex flex-col">
                  <h3 className="font-black text-xl text-slate-700 tracking-tight">蒜蒜终端</h3>
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Suan Suan Oracle V2.5</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center font-bold text-slate-400 hover:bg-white/60 transition-colors shadow-sm">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar bg-white/5">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] p-6 rounded-3xl ${
                      msg.role === 'user' 
                        ? 'bg-indigo-500 text-white shadow-lg rounded-tr-none' 
                        : 'bg-white/80 border border-white text-slate-700 shadow-sm rounded-tl-none backdrop-blur-sm'
                    }`}>
                      <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-100"></div>
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-200"></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-6 md:p-8 bg-white/30 border-t border-white/20 backdrop-blur">
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                    placeholder="问问蒜蒜..."
                    className="flex-1 !bg-white/60"
                  />
                  <button onClick={handleChatSend} className="halo-button px-6 md:px-8 py-3 uppercase text-xs">Send</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen selection:bg-indigo-100 selection:text-indigo-600">
      <StarryBackground />
      <div className="relative z-layer-1">
        {view === 'input' && <InputView />}
        {view === 'loading' && <LoadingView />}
        {view === 'result' && <ResultView />}
      </div>
    </div>
  );
};

export default App;
