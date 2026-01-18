
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
      setMessages([{ role: 'model', text: `推演报告已就绪。星盘显示，万事万物皆有两面，好的时机藏在智慧的抉择中。` }]);
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
      setMessages(prev => [...prev, { role: 'model', text: "链接异常，宇宙信号波动中。" }]);
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
        <h2 className="text-xl md:text-2xl font-black text-slate-700 tracking-tight mt-2">蒜蒜正在精准校准星盘中</h2>
        <p className="text-[10px] text-indigo-400 mt-2 font-black uppercase tracking-[0.2em] opacity-60">正在进行深度能量推演</p>
      </div>
    </div>
  );

  const InputView = () => (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="absolute top-12 left-12 hidden md:flex flex-col gap-2 opacity-60">
        <span className="text-[10px] font-black tracking-[0.3em] text-white">蒜蒜命理研究室</span>
        <span className="text-[10px] font-black tracking-[0.3em] text-white">洞察真相 预见机遇</span>
      </div>
      
      <div className="w-full max-w-xl floating-glass p-12 md:p-16 animate-float">
        <div className="text-center mb-10">
          <BrandHeader />
        </div>

        <div className="space-y-6">
          <input 
            type="text" 
            placeholder="姓名"
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
            开启精准推演
          </button>
        </div>
      </div>
    </div>
  );

  const ResultView = () => {
    if (!analysis) return null;

    const getElementColor = (el: string) => {
      if (el.includes('金')) return 'from-amber-50 to-amber-100/40';
      if (el.includes('木')) return 'from-emerald-50 to-emerald-100/40';
      if (el.includes('水')) return 'from-sky-50 to-sky-100/40';
      if (el.includes('火')) return 'from-rose-50 to-rose-100/40';
      if (el.includes('土')) return 'from-orange-50 to-orange-100/40';
      return 'from-slate-50 to-slate-100/40';
    };

    return (
      <div className="min-h-screen py-10 md:py-20 px-4 md:px-6 overflow-x-hidden">
        <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
          
          <div className="floating-glass p-8 md:p-10 text-center animate-float">
            <div className="flex justify-between items-center mb-6">
               <button 
                onClick={() => setView('input')} 
                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors"
               >
                 <span className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">←</span>
                 重填数据
               </button>
               <BrandHeader size="small" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter uppercase mb-4">{profile.name}</h2>
            <div className="flex justify-center flex-wrap gap-2 md:gap-3">
              <span className="px-5 py-1.5 bg-white/40 border border-white/60 rounded-full text-[11px] font-black text-slate-600 shadow-sm">{profile.zodiac}</span>
              <span className="px-5 py-1.5 bg-white/40 border border-white/60 rounded-full text-[11px] font-black text-slate-600 shadow-sm">{profile.birthDate}</span>
              <span className="px-5 py-1.5 bg-white/40 border border-white/60 rounded-full text-[11px] font-black text-slate-600 shadow-sm">{profile.birthTime || '未知时辰'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            
            <div className="md:col-span-4 floating-glass p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚡</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">2026 运势展望</span>
              </div>
              <h4 className="text-2xl font-black text-slate-800 mb-3">丙午流年：多维度推演</h4>
              <p className="text-sm font-bold text-slate-600 leading-relaxed opacity-90">{analysis.yearlyFortune}</p>
            </div>

            <div className="md:col-span-2 floating-glass p-8 flex flex-col items-center justify-center text-center bg-white/10">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block">命理映射</span>
              <h4 className="text-xl font-black text-slate-700 mb-2">{analysis.similarPerson.name}</h4>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic line-clamp-3">"{analysis.similarPerson.description}"</p>
            </div>

            {/* 五行核心能量：针对多维分析进行了排版优化 */}
            <div className={`md:col-span-6 floating-glass p-8 md:p-12 bg-gradient-to-r ${getElementColor(analysis.fiveElements.element)}`}>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-10">
                  <span className="text-xl">☯️</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">五行核心能量 (深度校验)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
                  <div className="flex flex-col items-center md:items-start md:col-span-1">
                    <div className="text-4xl md:text-5xl font-black text-slate-800 mb-2 tracking-tighter">
                      {analysis.fiveElements.element}
                    </div>
                    <div className="text-sm font-black text-indigo-500 mb-3 tracking-widest">{analysis.fiveElements.strength}</div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/40 px-3 py-1 rounded">经校验日主</span>
                  </div>

                  <div className="space-y-4 md:col-span-1">
                    <h5 className="text-[11px] font-black uppercase text-emerald-600 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      性格核心与优势
                    </h5>
                    <p className="text-[12px] font-bold text-slate-600 leading-loose text-justify whitespace-pre-wrap">{analysis.fiveElements.nature}</p>
                  </div>

                  <div className="space-y-4 md:col-span-1">
                    <h5 className="text-[11px] font-black uppercase text-indigo-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-300"></span>
                      增运深度补救
                    </h5>
                    <p className="text-[12px] font-bold text-slate-600 leading-loose text-justify whitespace-pre-wrap">{analysis.fiveElements.supplement}</p>
                  </div>

                  <div className="space-y-4 md:col-span-1">
                    <h5 className="text-[11px] font-black uppercase text-red-500 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      重点生存避坑
                    </h5>
                    <p className="text-[12px] font-bold text-slate-600 leading-loose text-justify whitespace-pre-wrap">{analysis.fiveElements.taboos}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 floating-glass p-8 bg-white/10">
              <h5 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">事业机遇与挑战</h5>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">{analysis.natalChart.career}</p>
            </div>
            <div className="md:col-span-3 floating-glass p-8 bg-white/10">
              <h5 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">感情转机与避坑</h5>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">{analysis.natalChart.love}</p>
            </div>

            <div className="md:col-span-3 floating-glass p-8 bg-gradient-to-br from-white/10 to-indigo-50/20">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xl">👥</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">人际图谱</span>
              </div>
              <div className="space-y-5">
                <div>
                  <h6 className="text-[9px] font-black uppercase text-slate-400 mb-1">社交底色</h6>
                  <p className="text-xs font-bold text-slate-700">{analysis.interpersonal.style}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h6 className="text-[9px] font-black uppercase text-emerald-500 mb-1">潜在助力</h6>
                    <p className="text-[10px] font-bold text-slate-500">{analysis.interpersonal.connection}</p>
                  </div>
                  <div>
                    <h6 className="text-[9px] font-black uppercase text-rose-500 mb-1">沟通风险</h6>
                    <p className="text-[10px] font-bold text-slate-500">{analysis.interpersonal.caution}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-3 floating-glass p-8 bg-white/10">
              <h5 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">财富潜能与漏洞</h5>
              <p className="text-sm font-bold text-slate-600 leading-relaxed">{analysis.natalChart.wealth}</p>
            </div>

            <div className="md:col-span-6 floating-glass p-8 bg-slate-800/5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-6 block">核心里程碑节点</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {analysis.milestones.map((m, idx) => (
                  <div key={idx} className="p-5 bg-white/40 rounded-2xl border border-white/60 shadow-sm">
                    <span className="text-[11px] font-black text-indigo-500 mb-2 block">{m.timeframe}</span>
                    <h5 className="font-black text-slate-800 mb-2">{m.prediction}</h5>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed">指南：{m.advice}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-6 floating-glass p-8 bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">面相实时推演</span>
                {profile.faceImage && <div className="w-10 h-10 rounded-full overflow-hidden border border-white/80"><img src={profile.faceImage} className="w-full h-full object-cover" /></div>}
              </div>
              <p className="text-sm font-bold text-slate-600 leading-loose">"{analysis.physiognomy.faceAnalysis}"</p>
            </div>
          </div>

          <div className="text-center py-12 opacity-30">
            <p className="text-[9px] font-black tracking-[0.5em] uppercase text-slate-900">蒜蒜命理 - 遇见更好的自己</p>
          </div>
        </div>

        <button 
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 md:bottom-12 md:right-12 w-20 h-20 floating-glass !rounded-full flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer z-50 bg-white/60 border border-white"
        >
          <span className="text-3xl">💬</span>
        </button>

        {isChatOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-xl">
            <div className="w-full max-w-xl h-[80vh] flex flex-col floating-glass shadow-2xl overflow-hidden bg-white/80">
              <div className="p-8 border-b border-white/40 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-lg text-slate-800">深度对话</h3>
                  <p className="text-[9px] font-black uppercase text-indigo-400">避坑指引</p>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/20">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-5 rounded-3xl ${
                      msg.role === 'user' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-700 shadow-sm'
                    }`}>
                      <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isChatLoading && <div className="p-4 text-[10px] font-black text-slate-300 animate-pulse">蒜蒜正在排盘...</div>}
                <div ref={chatEndRef} />
              </div>
              <div className="p-6 bg-white/50 border-t border-white/40">
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                    placeholder="针对分析提出疑问..."
                    className="flex-1 !bg-white/80"
                  />
                  <button onClick={handleChatSend} className="halo-button px-6 py-2 uppercase text-[10px] tracking-widest">发送</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      <StarryBackground />
      <div className="relative z-10">
        {view === 'input' && <InputView />}
        {view === 'loading' && <LoadingView />}
        {view === 'result' && <ResultView />}
      </div>
    </div>
  );
};

export default App;
