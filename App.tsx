import React, { useState, useEffect, useCallback, memo, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CITIES, AUTO_REFRESH_INTERVAL } from './constants';
import { OutageInfo, PowerStatus } from './types';
import { fetchOutageInfo } from './services/geminiService';
import CitySelector from './components/CitySelector';
import StatusDisplay from './components/StatusDisplay';
import AdBanner from './components/AdBanner';

interface ErrorBoundaryProps { children?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState { 
    return { hasError: true }; 
  }

  handleRetry = () => { 
    this.setState({ hasError: false }); 
    window.location.reload(); 
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-md bg-zinc-900/60 backdrop-blur-2xl border border-red-500/20 rounded-[2rem] p-8 text-center flex flex-col items-center animate-slide-up shadow-2xl">
          <div className="w-16 h-16 mb-4 text-red-500 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><path d="M12 9V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="18" r="1" fill="currentColor"/><path d="M12 3L2 21H22L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Щось пішло не так</h2>
          <button onClick={this.handleRetry} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 text-sm">Перезавантажити</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MemoizedCitySelector = memo(CitySelector);
const MemoizedStatusDisplay = memo(StatusDisplay);
const MemoizedAdBanner = memo(AdBanner);

const AutoRefreshIndicator: React.FC<{ onRefreshTrigger: () => void; isActive: boolean; }> = ({ onRefreshTrigger, isActive }) => {
  const totalTime = AUTO_REFRESH_INTERVAL / 1000;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  
  useEffect(() => { if (isActive) setTimeLeft(totalTime); }, [isActive, totalTime]);
  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => {
      setTimeLeft(p => { if (p <= 1) { onRefreshTrigger(); return totalTime; } return p - 1; });
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, onRefreshTrigger, totalTime]);

  if (!isActive) return null;

  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const dashoffset = circumference * (1 - progress);

  return (
      <div className="flex items-center gap-2 bg-zinc-900/80 rounded-full px-2 py-1 border border-zinc-700">
          <div className="relative w-4 h-4 -rotate-90 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r={radius} fill="none" stroke="#3f3f46" strokeWidth="2" />
                  <circle cx="10" cy="10" r={radius} fill="none" stroke="#ef4444" strokeWidth="2" className="transition-all duration-1000 ease-linear" strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeLinecap="round" />
              </svg>
          </div>
          <span className="text-[10px] font-mono font-bold text-zinc-400 tabular-nums w-8 text-center">
            {Math.floor(timeLeft / 60)}:{String(Math.floor(timeLeft % 60)).padStart(2, '0')}
          </span>
      </div>
  );
};

const RedThunderstorm = memo(() => {
  return (
    <div className="fixed inset-0 z-[1] pointer-events-none select-none overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[70%] opacity-80 mix-blend-hard-light">
             <div className="absolute top-[-20%] left-[10%] w-[60%] h-[60%] bg-red-600 rounded-full blur-[150px] animate-lightning"></div>
             <div className="absolute top-[-10%] right-[10%] w-[50%] h-[50%] bg-red-500 rounded-full blur-[120px] animate-lightning" style={{animationDelay: '1.5s', animationDuration: '7s'}}></div>
             <div className="absolute top-[-30%] left-[30%] w-[40%] h-[40%] bg-red-700 rounded-full blur-[100px] animate-lightning" style={{animationDelay: '3s', animationDuration: '5s'}}></div>
        </div>

        <div className="absolute top-0 left-0 w-full h-full opacity-30 mix-blend-overlay">
             <div className="absolute inset-0 animate-cloud-drift bg-repeat"
                  style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.005' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
                      backgroundSize: '400px 400px'
                  }}>
             </div>
             <div className="absolute inset-0 animate-cloud-drift"
                  style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
                      backgroundSize: '500px 500px',
                      animationDirection: 'reverse',
                      animationDuration: '150s'
                  }}>
             </div>
        </div>
    </div>
  );
});

const UpsideDownSpores = memo(() => {
  const spores = React.useMemo(() => [...Array(60)].map((_, i) => ({
    id: i, 
    left: `${Math.random() * 100}%`, 
    animationDuration: `${Math.random() * 15 + 10}s`, 
    animationDelay: `-${Math.random() * 20}s`, 
    opacity: Math.random() * 0.5 + 0.4, 
    size: `${Math.random() * 4 + 2}px`
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[3] overflow-hidden" aria-hidden="true">
      {spores.map((spore) => (
        <div 
            key={spore.id} 
            className="absolute bg-white rounded-full blur-[0.5px] shadow-[0_0_5px_white]" 
            style={{ 
                left: spore.left, 
                bottom: '-20px', 
                width: spore.size, 
                height: spore.size, 
                opacity: spore.opacity, 
                animation: `floatUp ${spore.animationDuration} linear infinite`, 
                animationDelay: spore.animationDelay 
            }} 
        />
      ))}
    </div>
  );
});

const HawkinsSilhouette = memo(() => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1] pointer-events-none opacity-80 mix-blend-overlay">
       <svg className="w-full h-auto min-h-[150px]" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <defs>
             <linearGradient id="silhouetteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                 <stop offset="0%" stopColor="#1a0505" stopOpacity="0.8" />
                 <stop offset="100%" stopColor="#000000" stopOpacity="1" />
             </linearGradient>
             <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
               <feGaussianBlur stdDeviation="5" result="blur" />
               <feComposite in="SourceGraphic" in2="blur" operator="over" />
             </filter>
          </defs>
          <path 
            fill="url(#silhouetteGrad)" 
            d="M0,320L0,220L40,240L80,180L120,250L160,200L200,260L240,190L280,240L320,160L360,230L400,180L440,250L480,210L520,270L560,190L600,240L640,170L680,230L720,180L760,250L800,200L840,260L880,190L920,240L960,160L1000,230L1040,180L1080,250L1120,200L1160,260L1200,190L1240,240L1280,170L1320,230L1360,180L1400,250L1440,200L1440,320Z"
            filter="url(#glow)"
            className="drop-shadow-[0_-5px_15px_rgba(220,38,38,0.3)]"
          />
       </svg>
    </div>
  );
});

const IntroAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
        setExiting(true);
        setTimeout(onComplete, 600);
    }, 2000);

    return () => clearTimeout(exitTimer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-zinc-950 flex items-center justify-center transition-opacity duration-700 ease-in-out ${exiting ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative flex flex-col items-center gap-6 w-full max-w-[300px]">
          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_15px_red] opacity-0 animate-intro-line" style={{ animationDelay: '0.8s' }}></div>
          <h1 className="text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] opacity-0 animate-intro-text text-center scale-y-90" style={{ fontFamily: 'serif' }}>
              Svitlo<span className="text-red-600">.</span>Info
          </h1>
          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent shadow-[0_0_15px_red] opacity-0 animate-intro-line" style={{ animationDelay: '0.8s' }}></div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'about'>('home');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [outageData, setOutageData] = useState<OutageInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) { tg.ready(); tg.expand(); tg.setHeaderColor('#18181b'); tg.setBackgroundColor('#18181b'); }
    const saved = localStorage.getItem('svitlo_city_id');
    if (saved && CITIES.some(c => c.id === saved)) setSelectedCityId(saved);

    const preloadImage = new Image();
    preloadImage.src = 'https://ad.admitad.com/b/81ij5uqbfl4c128fa66ba76d99edd2/';
  }, []);

  const loadData = useCallback(async (cityId: string) => {
    if (!cityId) return;
    setLoading(true);
    const city = CITIES.find(c => c.id === cityId);
    if (city) setOutageData(await fetchOutageInfo(city.nameUk));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCityId) {
      localStorage.setItem('svitlo_city_id', selectedCityId);
      loadData(selectedCityId);
    }
  }, [selectedCityId, loadData]);

  let bgClass = 'from-zinc-800 via-zinc-900 to-zinc-950';
  if (outageData?.status === PowerStatus.ON) bgClass = 'from-emerald-950/40 via-zinc-900 to-zinc-950';
  if (outageData?.status === PowerStatus.OFF) bgClass = 'from-red-950/40 via-zinc-900 to-zinc-950';
  if (outageData?.status === PowerStatus.MAYBE) bgClass = 'from-yellow-950/40 via-zinc-900 to-zinc-950';

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-white flex flex-col relative font-sans overflow-hidden">
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
      
      <div className={`fixed inset-0 bg-gradient-to-b ${bgClass} transition-colors duration-1000 z-0`}></div>
      
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px] animate-aurora z-0 mix-blend-screen"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-zinc-800/20 rounded-full blur-[100px] animate-aurora z-0" style={{animationDelay: '-5s'}}></div>
      
      <RedThunderstorm />
      <HawkinsSilhouette />
      <UpsideDownSpores />

      <div className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-end items-center backdrop-blur-md bg-black/0">
          <div className="flex items-center gap-3">
             <a href="https://donatello.to/OneFrameStudio" target="_blank" className="bg-red-900/10 hover:bg-red-900/30 border border-red-500/20 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all group">
                <span className="text-[10px] font-bold text-red-500 uppercase group-hover:text-red-400">Підтримати</span>
            </a>
            <a href="https://t.me/SvitloInfo_news" target="_blank" className="bg-zinc-800/40 hover:bg-zinc-700/40 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white transition-all">Telegram</a>
          </div>
      </div>

      <main className="relative z-10 w-full flex-1 flex flex-col items-center px-4 pt-24 pb-32 max-w-lg mx-auto">
        
        <header className="mb-10 text-center animate-slide-up relative flex flex-col items-center">
            <h1 className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-red-500 to-red-900 drop-shadow-[0_0_25px_rgba(220,38,38,0.6)] mb-4 scale-y-90" style={{ fontFamily: 'serif', letterSpacing: '-0.05em' }}>
                Svitlo<span className="text-red-600">.</span>Info
            </h1>
            
            <div className="relative w-full max-w-[320px] flex flex-col items-center gap-2">
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-80 shadow-[0_0_10px_red]"></div>
                
                <p className="text-[10px] font-bold text-red-100/90 uppercase tracking-[0.3em] drop-shadow-[0_0_10px_rgba(220,38,38,0.8)] px-2 whitespace-nowrap">
                   Стан енергосистеми України
                </p>

                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-80 shadow-[0_0_10px_red]"></div>
            </div>
        </header>

        {activeTab === 'home' && (
            <div className="w-full flex flex-col items-center gap-6 animate-slide-up" style={{animationDelay: '0.1s'}}>
                <ErrorBoundary>
                    <MemoizedCitySelector selectedCityId={selectedCityId} onSelect={setSelectedCityId} disabled={loading} />
                    
                    {!selectedCityId ? (
                        <div className="w-full mt-4 p-8 bg-zinc-900/60 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center gap-4 backdrop-blur-xl shadow-2xl animate-fade-in relative overflow-hidden">
                             <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiAvPgo8cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDIwMjAyIiAvPjwvc3ZnPg==')] opacity-50 pointer-events-none"></div>

                             <div className="w-20 h-20 bg-gradient-to-br from-zinc-900 to-red-950 rounded-full flex items-center justify-center border border-red-900/40 shadow-[0_0_15px_rgba(220,38,38,0.2)] mb-2 relative overflow-visible">
                                <div className="absolute inset-0 bg-red-600/10 blur-xl rounded-full animate-pulse-slow"></div>
                                <svg className="w-10 h-10 text-red-600 relative z-10 drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]" fill="currentColor" viewBox="0 0 24 24">
                                   <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                                </svg>
                             </div>
                             <div className="relative z-10">
                                 <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Оберіть ваше місто</h3>
                                 <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-[200px] mx-auto">
                                     Щоб отримати актуальний графік відключень, вкажіть вашу локацію.
                                 </p>
                             </div>
                        </div>
                    ) : (
                        <>
                           <MemoizedStatusDisplay data={outageData} loading={loading && !outageData} cityName={CITIES.find(c=>c.id===selectedCityId)?.nameUk} />
                           
                           <div className="w-full mt-2 animate-slide-up" style={{animationDelay: '0.2s'}}>
                               <button 
                                   onClick={() => loadData(selectedCityId)} 
                                   disabled={loading}
                                   className="w-full group relative overflow-hidden bg-zinc-900 border border-white/10 text-white font-bold h-16 rounded-[1.5rem] shadow-lg active:scale-[0.98] transition-all flex items-center justify-between px-6 hover:bg-zinc-800 hover:border-red-500/30 hover:shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                               >
                                   <div className="flex flex-col items-start z-10">
                                       <span className="text-base font-extrabold uppercase tracking-wider text-white group-hover:text-red-400 transition-colors">Оновити дані</span>
                                       <span className="text-[10px] text-zinc-500 font-medium group-hover:text-zinc-400">Синхронізація з мережею</span>
                                   </div>
                                   
                                   <div className="flex items-center gap-3 z-10">
                                       {loading ? (
                                           <div className="w-6 h-6 border-2 border-zinc-600 border-t-red-500 rounded-full animate-spin"></div>
                                       ) : (
                                           <AutoRefreshIndicator onRefreshTrigger={() => loadData(selectedCityId)} isActive={true} />
                                       )}
                                   </div>
                               </button>
                               <p className="text-center text-[9px] text-zinc-600 mt-3 font-mono">
                                   Останнє оновлення: {outageData ? new Date(outageData.lastUpdated).toLocaleTimeString() : '--:--'}
                               </p>
                           </div>
                        </>
                    )}
                    
                    <div className="w-full">
                       <MemoizedAdBanner />
                    </div>

                </ErrorBoundary>
            </div>
        )}

        {activeTab === 'about' && (
            <div className="w-full animate-slide-up">
                <div className="bg-zinc-900/60 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent pointer-events-none"></div>
                    <div className="mb-6 flex justify-center relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-900 to-black rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/20 text-red-500 border border-red-500/20">
                            <svg className="w-8 h-8 drop-shadow-[0_0_5px_red]" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/></svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 relative z-10" style={{fontFamily: 'serif'}}>Svitlo Info</h2>
                    <p className="text-red-500/60 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">VERSION 1.3 GLOBAL</p>
                    
                    <div className="space-y-6 text-zinc-400 text-sm leading-relaxed font-medium relative z-10">
                        <p>Моніторинг енергосистеми України в реальному часі на базі AI.</p>
                        <p>Ми аналізуємо офіційні канали Обленерго за допомогою Google Gemini для надання найточніших прогнозів.</p>
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                             <p className="text-xs text-zinc-500">Дані носять інформаційний характер. Завжди перевіряйте першоджерела.</p>
                        </div>
                        
                        <div className="pt-8 border-t border-white/5 mt-8 flex flex-col items-center gap-4">
                             <span className="text-[10px] text-zinc-600 uppercase tracking-[0.3em] font-bold">Designed by</span>
                             <div className="group relative flex items-center justify-center gap-4 px-8 py-5 bg-[#0a0a0a] rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden transition-all hover:border-red-900/50">
                                <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 via-transparent to-purple-900/20 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                <div className="relative z-10 w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-inner border border-white/5">
                                     <span className="text-red-500 font-black text-lg tracking-tighter drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]">1F</span>
                                </div>
                                <div className="flex flex-col items-start relative z-10">
                                     <span className="text-base font-extrabold text-zinc-200 tracking-tight group-hover:text-white transition-colors">OneFrame Studio</span>
                                     <span className="text-[9px] text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800 font-bold uppercase tracking-widest">Digital Experience</span>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-auto">
        <div className="relative bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-full p-2 flex shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <div 
                className="absolute top-2 bottom-2 bg-zinc-800 rounded-full transition-all duration-500 cubic-bezier(0.25, 0.8, 0.25, 1) border border-white/5"
                style={{ 
                    left: activeTab === 'home' ? '8px' : 'calc(50% + 4px)',
                    width: 'calc(50% - 12px)',
                    boxShadow: activeTab === 'home' ? '0 0 10px rgba(220, 38, 38, 0.1)' : 'none'
                }}
            ></div>

            <button onClick={() => setActiveTab('home')} className={`relative z-10 w-28 py-3 rounded-full transition-colors duration-300 ${activeTab === 'home' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
                <span className="text-xs font-bold uppercase tracking-wider">Головна</span>
            </button>
            <button onClick={() => setActiveTab('about')} className={`relative z-10 w-28 py-3 rounded-full transition-colors duration-300 ${activeTab === 'about' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}>
                <span className="text-xs font-bold uppercase tracking-wider">Інфо</span>
            </button>
        </div>
      </div>
      
      {loading && outageData && createPortal(
          <div className="fixed inset-0 z-[1000] bg-zinc-950/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
              <div className="w-16 h-16 border-4 border-white/10 border-t-red-600 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(220,38,38,0.4)]"></div>
              <p className="text-red-500 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Оновлення...</p>
          </div>,
          document.body
      )}
    </div>
  );
};
export default App;
