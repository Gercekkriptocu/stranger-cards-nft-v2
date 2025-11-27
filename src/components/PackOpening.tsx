"use client";

import { useState, useEffect, useRef } from 'react';

// IPFS Helper
const ipfsToHttp = (uri: string): string => {
  if (!uri) return '';
  if (uri.startsWith('ipfs://')) return uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  return uri;
};

type PackOpeningProps = {
  cardImage: string;
  cardNumber?: number;
  totalCards?: number;
  onAnimationComplete: () => void;
  onSkip?: () => void;
};

export default function PackOpening({ 
  cardImage, 
  cardNumber = 1, 
  totalCards = 1, 
  onAnimationComplete,
  onSkip 
}: PackOpeningProps): JSX.Element {
  // Aşamalar: Summon -> Entangle -> Reveal
  const [stage, setStage] = useState<'summon' | 'entangle' | 'reveal'>('summon');
  const [imgLoaded, setImgLoaded] = useState(false);
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Timer Ref (Temizlik için)
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  // Callback referansını güncel tut
  const onCompleteRef = useRef(onAnimationComplete);
  useEffect(() => { onCompleteRef.current = onAnimationComplete; }, [onAnimationComplete]);

  // Kart değiştiğinde resmi yükle
  useEffect(() => {
    setImgLoaded(false); // Yeni kart gelince yükleniyor'a çek
    const img = new Image();
    img.src = ipfsToHttp(cardImage);
    img.onload = () => setImgLoaded(true);
    img.onerror = () => setImgLoaded(true);
  }, [cardImage]);

  // --- SES MOTORU ---
  const playSound = (type: 'ambient' | 'entangle' | 'reveal') => {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    
    // Context yoksa veya kapalıysa oluştur/başlat
    if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    if (type === 'ambient') {
        // Derin Atmosfer
        osc.type = 'sine';
        osc.frequency.setValueAtTime(40, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 1);
        gain.gain.linearRampToValueAtTime(0, t + 4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 4);

    } else if (type === 'entangle') {
        // 🌿 Sarmaşık Sesi (Organik Sürtünme)
        // Testere dişi dalgası + Bandpass filtre hareketi
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, t); // Düşük frekans
        
        // Filtre hareketi (Sarmaşığın büyümesi gibi)
        filter.type = 'bandpass';
        filter.Q.value = 5;
        filter.frequency.setValueAtTime(100, t);
        filter.frequency.linearRampToValueAtTime(800, t + 3); // Filtre açılıyor
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 1);
        gain.gain.linearRampToValueAtTime(0, t + 3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 3);

        // Ekstra: Hafif çıtırtı (Noise simülasyonu için modülasyon)
        const lfo = ctx.createOscillator();
        lfo.type = 'square';
        lfo.frequency.value = 15;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 500;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        lfo.start(t);
        lfo.stop(t + 3);

    } else if (type === 'reveal') {
        // ✨ Reveal Sesi (Büyülü Çınlama)
        // C Major Akoru
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'triangle'; // Daha yumuşak ton
            o.frequency.value = freq;
            
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.1, t + 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, t + 3);

            o.connect(g);
            g.connect(ctx.destination);
            o.start(t);
            o.stop(t + 3);
        });
    }
  };

  // --- ANİMASYON DÖNGÜSÜ ---
  // `cardImage` veya `cardNumber` değiştiğinde bu efekt çalışır.
  // Bu sayede çoklu pakette her yeni kart geldiğinde animasyon sıfırlanır.
  useEffect(() => {
    // 1. Önceki zamanlayıcıları temizle
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    // 2. State'i başa al (Bu, "üst üste binme" sorununu çözer)
    setStage('summon'); 
    
    // 3. Ses ve Animasyon Akışını Başlat
    playSound('ambient');

    // 1.5s: Entangle (Sarmaşıklar ve Ses)
    const t1 = setTimeout(() => {
        setStage('entangle');
        playSound('entangle');
    }, 1500);

    // 4.5s: Reveal (Kart ve Ses)
    const t2 = setTimeout(() => {
        setStage('reveal');
        playSound('reveal');
    }, 4500);

    // 8.5s: Bitiş
    const t3 = setTimeout(() => {
      if (onCompleteRef.current) onCompleteRef.current();
    }, 8500);

    // Timerları referansa ekle
    timersRef.current.push(t1, t2, t3);

    // Cleanup
    return () => {
        timersRef.current.forEach(clearTimeout);
    };
  }, [cardImage, cardNumber]); // Kart değiştiğinde burası tetiklenir

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl font-sans overflow-hidden">
      
      {/* SKIP BUTTON (Only for multiple packs) - Small Bottom Right Corner */}
      {totalCards > 1 && onSkip && (
        <button
          onClick={onSkip}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[101] px-2 py-1 bg-red-900/80 border border-red-500/50 text-white text-[8px] font-semibold tracking-wider uppercase hover:bg-red-600 hover:scale-105 hover:shadow-[0_0_16px_rgba(255,0,0,0.5)] transition-all duration-300 backdrop-blur-sm rounded shadow-lg"
        >
          SKIP ALL
        </button>
      )}
      
      {/* Arka Plan */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1a0000_0%,#000000_80%)] opacity-80"></div>
           {[...Array(20)].map((_, i) => (
              <div key={i} className="absolute bg-white/30 rounded-full animate-float" 
                   style={{
                       width: Math.random() * 3 + 'px', height: Math.random() * 3 + 'px',
                       top: Math.random() * 100 + '%', left: Math.random() * 100 + '%',
                       animationDuration: 10 + Math.random() * 10 + 's'
                   }} 
              />
          ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full perspective-container">
        
        {/* === KUTU & SARMAŞIK AŞAMASI === */}
        {/* Reveal aşamasında opacity-0 yaparak yumuşak geçiş sağlıyoruz (DOM'dan silmiyoruz ki animasyon kopmasın) */}
        <div className={`absolute transition-all duration-1000 ease-in-out flex items-center justify-center
            ${stage === 'summon' ? 'scale-100 opacity-100 translate-y-0' : ''}
            ${stage === 'entangle' ? 'scale-110 opacity-100' : ''}
            ${stage === 'reveal' ? 'scale-150 opacity-0 blur-xl pointer-events-none' : ''}
        `}>
            {/* 3D Kutu */}
            <div className="relative w-60 h-80 bg-[#0f0f0f] border-2 border-red-900/40 rounded-lg shadow-[0_0_40px_rgba(200,0,0,0.1)] flex items-center justify-center overflow-visible animate-hover">
                
                <div className="z-10 text-center">
                    <h1 className="text-3xl font-bold text-red-700 tracking-tighter" style={{fontFamily: 'ITC Benguiat, serif'}}>STRANGER</h1>
                    <p className="text-red-900/60 text-[10px] tracking-[0.4em] mt-1.5">CONFIDENTIAL</p>
                </div>

                {/* 🌿 SARMAŞIKLAR - YATAY ÇİZGİ KALDIRILDI */}
                <svg className="absolute -inset-10 w-[140%] h-[140%] pointer-events-none z-20" viewBox="0 0 200 300">
                    <path d="M0,300 Q50,250 40,200 T80,150" fill="none" stroke="#2a0505" strokeWidth="6" strokeLinecap="round"
                          className={`vine-grow ${stage === 'entangle' ? 'grow-active' : ''}`} />
                    <path d="M0,300 Q50,250 40,200 T80,150" fill="none" stroke="#3d0a0a" strokeWidth="2" strokeLinecap="round"
                          className={`vine-grow ${stage === 'entangle' ? 'grow-active' : ''}`} style={{transitionDelay: '0.1s'}} />

                    <path d="M200,0 Q150,50 160,100 T120,150" fill="none" stroke="#2a0505" strokeWidth="6" strokeLinecap="round"
                          className={`vine-grow ${stage === 'entangle' ? 'grow-active' : ''}`} style={{transitionDelay: '0.5s'}} />
                     <path d="M200,0 Q150,50 160,100 T120,150" fill="none" stroke="#3d0a0a" strokeWidth="2" strokeLinecap="round"
                          className={`vine-grow ${stage === 'entangle' ? 'grow-active' : ''}`} style={{transitionDelay: '0.6s'}} />
                </svg>
                
                {/* Entangle Glow */}
                <div className={`absolute inset-0 bg-red-900/20 blur-xl transition-opacity duration-2000 ${stage === 'entangle' ? 'opacity-100' : 'opacity-0'}`}></div>
            </div>
        </div>

        {/* === KART AÇILMA AŞAMASI (REVEAL) === */}
        {stage === 'reveal' && (
            <div className="relative flex flex-col items-center animate-card-appear z-20">
                <div className="absolute -inset-16 bg-red-600/10 blur-[64px] rounded-full"></div>
                
                <div className="relative w-[260px] h-[390px] bg-black rounded-xl p-1 shadow-[0_0_32px_rgba(200,0,0,0.3)] border border-red-900/50">
                    {!imgLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-gray-900 rounded-lg">
                            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <img 
                        src={ipfsToHttp(cardImage)} 
                        alt="NFT" 
                        className={`w-full h-full object-cover rounded-lg transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-lg"></div>
                </div>

                <div className="mt-6 text-center animate-slide-up">
                    <div className="inline-block px-3 py-1.5 bg-black/80 border border-red-900/30 rounded backdrop-blur-md">
                         <span className="text-red-500 font-bold text-lg tracking-widest" style={{fontFamily: 'ITC Benguiat, serif'}}>
                            #{cardNumber.toString().padStart(4, '0')} RECOVERED
                         </span>
                    </div>
                    <div className="text-gray-500 text-[8px] mt-1.5 tracking-[0.24em] uppercase">
                        Hawkins Lab • Asset Verified
                    </div>
                </div>
            </div>
        )}
      </div>

      <style jsx>{`
        .perspective-container { perspective: 1000px; }
        
        .vine-grow {
            stroke-dasharray: 300;
            stroke-dashoffset: 300;
            transition: stroke-dashoffset 3s ease-out;
        }
        .grow-active {
            stroke-dashoffset: 0;
        }

        @keyframes hover {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .animate-hover { animation: hover 4s ease-in-out infinite; }

        @keyframes card-appear {
            0% { transform: scale(0.8) translateY(20px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-card-appear { animation: card-appear 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }

        @keyframes float {
            0% { transform: translateY(0) rotate(0deg); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: translateY(-100px) rotate(180deg); opacity: 0; }
        }
        .animate-float { animation: float linear infinite; }

        @keyframes slide-up {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 1s ease-out 0.5s forwards; opacity: 0; }
      `}</style>
    </div>
  );
}
