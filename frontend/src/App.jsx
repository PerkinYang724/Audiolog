import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  connectAuthEmulator
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  serverTimestamp, 
  updateDoc,
  getDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { 
  getFunctions, 
  httpsCallable,
  connectFunctionsEmulator
} from 'firebase/functions';
import { 
  Mic, Square, Play, Pause, Calendar, Users, Flame, MessageCircle, 
  TrendingUp, ChevronRight, Headphones, Settings, Plus, Star, Zap, 
  Heart, Sparkles, Trophy, Target, Wand2, Lightbulb, BookOpen, 
  RefreshCw, User, ShieldCheck, Award, BarChart3, Clock, Dices, 
  Palette, Check, Send, ArrowRight, Code, Languages, Dumbbell, 
  Music, Camera, Coffee, Sun, Feather
} from 'lucide-react';
import { firebaseConfig, appId, USE_EMULATORS } from './firebaseConfig';

// --- CONFIGURATION ---
// SET THIS TO TRUE WHEN YOU DEPLOY THE CLOUD FUNCTIONS
const USE_BACKEND = true; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to emulators if in development
if (USE_EMULATORS && import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    // Emulators already connected
    console.log('Emulators connection:', error.message);
  }
}

const apiKey = ""; // API Key for Demo Mode only

// --- API WRAPPER (Switches between Demo & Production) ---
const api = {
  processAudio: async (base64, mimeType) => {
    if (USE_BACKEND) {
      const fn = httpsCallable(functions, 'processAudioLog');
      const res = await fn({ audioBase64: base64, mimeType });
      return res.data;
    } else {
      // Demo Mode: Client-side Call
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Transcribe JSON: { \"transcript\": string, \"milestone\": boolean, \"summary\": string }" }, { inlineData: { mimeType: mimeType.includes('mp4') ? 'audio/mp4' : 'audio/webm', data: base64 } }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });
      const data = await res.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    }
  },
  magicTitle: async (logs) => {
    if (USE_BACKEND) {
      const fn = httpsCallable(functions, 'generateMagicTitle');
      const res = await fn({ logs });
      return res.data;
    } else {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Suggest creative title/subtitle JSON: { "title": string, "subtitle": string }. Logs: ${logs}` }] }], generationConfig: { responseMimeType: "application/json" } })
      });
      const data = await res.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    }
  },
  recap: async (logs) => {
    if (USE_BACKEND) {
      const fn = httpsCallable(functions, 'generateRecap');
      const res = await fn({ logs });
      return res.data.text;
    } else {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Inspirational summary: ${logs}` }] }] })
      });
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }
  },
  insight: async (transcript) => {
    if (USE_BACKEND) {
      const fn = httpsCallable(functions, 'getAIInsight');
      const res = await fn({ transcript });
      return res.data.text;
    } else {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `One sentence warm advice for: "${transcript}"` }] }] })
      });
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }
  },
  persona: async (logs) => {
    if (USE_BACKEND) {
      const fn = httpsCallable(functions, 'analyzePersona');
      const res = await fn({ logs });
      return res.data.text;
    } else {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Learning persona summary for: ${logs}` }] }] })
      });
      const data = await res.json();
      return data.candidates[0].content.parts[0].text;
    }
  }
};

// --- AVATAR COMPONENT ---
const CuteAvatar = ({ config, size = "md" }) => {
  const { bg = 'bg-[#FF9F85]', eyes = 'dots', mouth = 'smile', accessory = 'none' } = config || {};
  const sizeClasses = { sm: "w-10 h-10", md: "w-14 h-14", lg: "w-32 h-32" };

  return (
    <div className={`${sizeClasses[size]} ${bg} rounded-full relative flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,0.05)] border-2 border-white transform transition-all duration-500 hover:rotate-3 active:scale-95 group overflow-hidden`}>
      <div className="absolute inset-0 bg-white/10 opacity-50 rounded-full pointer-events-none mix-blend-overlay" />
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" className="relative z-10 drop-shadow-sm text-[#4A4238]">
        {accessory === 'sprout' && <g transform="translate(40, 5) scale(0.6)"><path d="M10 20 Q 20 0 40 10 Q 30 30 10 20" fill="#88B04B" /><path d="M10 20 Q 0 0 -20 10 Q -10 30 10 20" fill="#6A8E3D" /><rect x="8" y="15" width="4" height="15" fill="#8D6E63" /></g>}
        {accessory === 'headphones' && <g transform="translate(0, 30)"><path d="M15 10 A 35 35 0 0 1 85 10" stroke="white" strokeWidth="6" fill="none" /><rect x="5" y="5" width="15" height="25" rx="5" fill="white" /><rect x="80" y="5" width="15" height="25" rx="5" fill="white" /></g>}
        {accessory === 'bow' && <g transform="translate(20, 15) rotate(-15)"><path d="M0 0 L20 10 L0 20 Z" fill="#E07A5F" /><path d="M40 0 L20 10 L40 20 Z" fill="#E07A5F" /><circle cx="20" cy="10" r="4" fill="#D1495B" /></g>}
        <g transform="translate(0, 45)">
          {eyes === 'dots' && <><circle cx="35" cy="0" r="5" fill="currentColor" /><circle cx="65" cy="0" r="5" fill="currentColor" /></>}
          {eyes === 'wink' && <><path d="M30 -5 Q 35 5 40 -5" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" /><circle cx="65" cy="0" r="5" fill="currentColor" /></>}
          {eyes === 'stars' && <><path d="M35 -10 L38 -3 L45 -3 L40 2 L42 9 L35 5 L28 9 L30 2 L25 -3 L32 -3 Z" fill="#F4D35E" /><path d="M65 -10 L68 -3 L75 -3 L70 2 L72 9 L65 5 L58 9 L60 2 L55 -3 L62 -3 Z" fill="#F4D35E" /></>}
          {eyes === 'glasses' && <g><circle cx="35" cy="0" r="10" stroke="currentColor" strokeWidth="3" fill="white/40" /><circle cx="65" cy="0" r="10" stroke="currentColor" strokeWidth="3" fill="white/40" /><line x1="45" y1="0" x2="55" y2="0" stroke="currentColor" strokeWidth="3" /></g>}
        </g>
        <g transform="translate(50, 65)">
          {mouth === 'smile' && <path d="M-15 0 Q 0 10 15 0" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />}
          {mouth === 'oh' && <circle cx="0" cy="5" r="6" fill="currentColor" />}
          {mouth === 'cat' && <path d="M-10 0 Q -5 5 0 0 Q 5 5 10 0" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />}
          {mouth === 'tongue' && <g><path d="M-10 0 Q 0 5 10 0" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M-5 4 Q 0 15 5 4" fill="#E07A5F" /></g>}
        </g>
        <circle cx="25" cy="60" r="5" fill="#E07A5F" fillOpacity="0.3" /><circle cx="75" cy="60" r="5" fill="#E07A5F" fillOpacity="0.3" />
      </svg>
    </div>
  );
};

// --- LOG CARD ---
const LogCard = ({ log, userId, onInsight, userAvatar }) => {
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLiking, setIsLiking] = useState(false);

  const userLiked = log.likes?.includes(userId);
  const likeCount = log.likes?.length || 0;
  const isOwnLog = log.userId === userId;

  useEffect(() => {
    if (!showComments) return;
    const commentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'logs', log.id, 'comments');
    const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
      setComments(fetched);
    });
    return () => unsubscribe();
  }, [showComments, log.id]);

  const handleLike = async () => {
    if (!userId || isLiking) return;
    setIsLiking(true);
    try {
      const logRef = doc(db, 'artifacts', appId, 'public', 'data', 'logs', log.id);
      await updateDoc(logRef, { likes: userLiked ? arrayRemove(userId) : arrayUnion(userId) });
    } catch (e) { console.error(e); } finally { setIsLiking(false); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userId) return;
    try {
      const commentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'logs', log.id, 'comments');
      await addDoc(commentsRef, { userId, userName: `Maker ${userId.slice(0, 4)}`, text: newComment.trim(), timestamp: serverTimestamp() });
      setNewComment("");
    } catch (e) { console.error(e); }
  };

  return (
    <div className={`relative p-6 rounded-[2rem] mb-6 border transition-all duration-300 ${log.milestone ? 'bg-[#FFFAF0] border-[#F4D35E]' : 'bg-white border-[#EBE0D6] shadow-[4px_4px_0px_rgba(235,224,214,0.5)]'}`}>
      <div className="flex justify-between items-start mb-4">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F5EBE0] flex items-center justify-center text-[10px] font-bold text-[#8D6E63] border border-[#EBE0D6]">{log.userName?.split(' ')[1] || '??'}</div>
            <div className="flex flex-col"><span className="text-[10px] font-black text-[#81B29A] uppercase tracking-widest">{isOwnLog ? 'Your Story' : log.userName}</span><span className="text-[9px] font-bold text-[#B09E99] uppercase tracking-tighter">Day {log.dayNumber}</span></div>
         </div>
         {log.milestone && <span className="bg-[#F4D35E]/20 text-[#B89824] px-2 py-1 rounded-full text-[9px] font-bold flex items-center gap-1"><Star size={10} fill="currentColor" /> Breakthrough</span>}
      </div>
      <p className="text-base font-serif text-[#4A4238] italic mb-6 leading-relaxed">"{log.transcript}"</p>
      {log.aiInsight && <div className="bg-[#FDF6F0] p-4 rounded-xl mb-4 border border-[#EBE0D6] animate-in fade-in slide-in-from-top-2"><div className="flex items-center gap-2 mb-1"><Feather size={12} className="text-[#E07A5F]" /><span className="text-[9px] font-bold text-[#E07A5F] uppercase">A Gentle Nudge</span></div><p className="text-sm text-[#5D554D] leading-relaxed font-serif">{log.aiInsight}</p></div>}
      <div className="flex justify-between items-center">
         <button onClick={() => new Audio(log.audioData).play()} className="bg-[#4A4238] text-[#FDF6F0] px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#2D2A26] transition-all active:scale-95 shadow-md"><Play size={14} fill="currentColor" /> Listen</button>
         <div className="flex gap-4 items-center">
            {isOwnLog && !log.aiInsight && (
              <button onClick={() => { setLoadingInsight(true); onInsight(log.id, log.transcript).finally(() => setLoadingInsight(false)); }} className="text-[10px] font-bold uppercase text-[#E07A5F] hover:text-[#D1495B] flex items-center gap-1">
                  {loadingInsight ? <RefreshCw size={12} className="animate-spin" /> : <><Sparkles size={12} /> Ask Advice</>}
              </button>
            )}
            <button onClick={handleLike} className={`flex items-center gap-1 transition-all active:scale-125 ${userLiked ? 'text-[#E07A5F]' : 'text-[#B09E99] hover:text-[#E07A5F]'}`}><Heart size={20} fill={userLiked ? "currentColor" : "none"} strokeWidth={2} />{likeCount > 0 && <span className="text-xs font-bold font-serif">{likeCount}</span>}</button>
            <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-1 transition-all ${showComments ? 'text-[#81B29A]' : 'text-[#B09E99] hover:text-[#81B29A]'}`}><MessageCircle size={20} strokeWidth={2} />{comments.length > 0 && <span className="text-xs font-bold font-serif">{comments.length}</span>}</button>
         </div>
      </div>
      {showComments && (
        <div className="mt-6 pt-6 border-t border-[#F5EBE0] animate-in fade-in slide-in-from-top-4">
          <div className="space-y-4 max-h-48 overflow-y-auto pr-2 no-scrollbar mb-4">
            {comments.length === 0 ? <p className="text-xs text-[#B09E99] text-center font-serif italic">The circle is quiet. Share some warmth.</p> : comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F5EBE0] flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-[#8D6E63]">{c.userName.slice(6, 8)}</div>
                <div className="flex-1"><p className="text-[10px] font-bold text-[#8D6E63]">{c.userName}</p><p className="text-sm text-[#4A4238] font-serif leading-snug">{c.text}</p></div>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddComment} className="relative flex items-center">
            <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a kind note..." className="w-full bg-[#FDF6F0] border border-[#EBE0D6] rounded-xl px-4 py-3 text-sm font-serif placeholder:text-[#B09E99] focus:ring-1 focus:ring-[#81B29A] focus:outline-none transition-all pr-10" />
            <button type="submit" className="absolute right-2 text-[#81B29A] hover:text-[#6A9E80]"><Send size={16} /></button>
          </form>
        </div>
      )}
    </div>
  );
};

const CHALLENGES = [
  { id: 'code', label: 'Code & Coffee', icon: Code, color: 'bg-[#81B29A]', members: '4.2k' },
  { id: 'fitness', label: 'Morning Movers', icon: Sun, color: 'bg-[#F2CC8F]', members: '1.8k' },
  { id: 'language', label: 'The Polyglot Cafe', icon: Coffee, color: 'bg-[#E07A5F]', members: '2.5k' },
  { id: 'creative', label: 'Daily Creators', icon: Feather, color: 'bg-[#3D405B]', members: '900' },
  { id: 'music', label: 'Bedroom Musicians', icon: Music, color: 'bg-[#D1495B]', members: '1.1k' }
];

const Onboarding = ({ onComplete }) => {
  const [selected, setSelected] = useState(null);
  return (
    <div className="fixed inset-0 bg-[#FDF6F0] z-[300] p-8 flex flex-col items-center justify-center animate-in fade-in">
       <div className="w-16 h-16 bg-[#E07A5F] rounded-full flex items-center justify-center shadow-lg mb-8"><BookOpen className="text-[#FDF6F0]" size={32} /></div>
       <h2 className="text-4xl font-serif text-[#2D2A26] text-center mb-2">Find Your Circle</h2>
       <p className="text-[#8D6E63] text-base text-center mb-10 font-serif italic">What journey are you walking today?</p>
       <div className="w-full max-w-sm space-y-3 mb-10 overflow-y-auto max-h-[50vh] no-scrollbar">
          {CHALLENGES.map(c => (
            <button key={c.id} onClick={() => setSelected(c)} className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 ${selected?.id === c.id ? 'bg-white border-[#E07A5F] shadow-md scale-[1.02]' : 'bg-[#FDF6F0] border-[#EBE0D6] text-[#4A4238] hover:bg-white'}`}>
               <div className={`${selected?.id === c.id ? c.color : 'bg-[#F5EBE0] text-[#8D6E63]'} w-12 h-12 rounded-full flex items-center justify-center transition-colors text-white`}><c.icon size={20} /></div>
               <div className="flex-1 text-left"><p className="font-bold text-[#4A4238]">{c.label}</p><p className="text-xs text-[#8D6E63] font-serif italic">{c.members} people here</p></div>
               {selected?.id === c.id && <Check size={20} className="text-[#E07A5F]" />}
            </button>
          ))}
       </div>
       <button disabled={!selected} onClick={() => onComplete(selected)} className="w-full max-w-sm py-4 bg-[#2D2A26] text-[#FDF6F0] rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#4A4238] disabled:opacity-50 transition-all shadow-lg">Begin Journey <ArrowRight size={18} /></button>
    </div>
  );
};

const ProfilePage = ({ user, logs, journeySettings, onAvatarUpdate, onRandomize, onAnalyzePersona, isAnalyzingPersona, aiPersona, onSwitchSquad }) => {
  const myLogs = logs.filter(l => l.userId === user?.uid);
  const [showCustomizer, setShowCustomizer] = useState(false);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col items-center mb-8 pt-4">
        <CuteAvatar config={journeySettings.avatar} size="lg" />
        <h2 className="text-3xl font-serif text-[#2D2A26] mt-6">Maker {user?.uid.slice(0, 4)}</h2>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setShowCustomizer(!showCustomizer)} className={`flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${showCustomizer ? 'bg-[#2D2A26] text-[#FDF6F0]' : 'bg-[#E07A5F] text-[#FDF6F0] shadow-md hover:bg-[#D1495B]'}`}>
            {showCustomizer ? <Check size={12} /> : <Palette size={12} />} {showCustomizer ? "Done" : "Change Look"}
          </button>
          <button onClick={onSwitchSquad} className="bg-[#F5EBE0] text-[#8D6E63] px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-[#EBE0D6]">Switch Circle</button>
        </div>
      </div>
      {showCustomizer && (
        <div className="bg-white p-6 rounded-[2rem] border border-[#EBE0D6] shadow-sm mb-8 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase text-[#8D6E63] tracking-widest">Your Style</h3>
            <button onClick={onRandomize} className="p-2 text-[#E07A5F] hover:bg-[#FDF6F0] rounded-full transition-colors"><Dices size={18} /></button>
          </div>
          <div className="space-y-6">
            <div><span className="text-[10px] font-bold uppercase text-[#B09E99] block mb-2 px-1">Palette</span><div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">{['bg-[#FF9F85]', 'bg-[#81B29A]', 'bg-[#F2CC8F]', 'bg-[#E07A5F]', 'bg-[#3D405B]', 'bg-[#D1495B]', 'bg-[#8D6E63]', 'bg-[#F4F1DE]'].map(c => (<button key={c} onClick={() => onAvatarUpdate({ bg: c })} className={`${c} w-8 h-8 rounded-full border-2 ${journeySettings.avatar?.bg === c ? 'border-[#2D2A26] scale-110' : 'border-white'} transition-all flex-shrink-0 shadow-sm`} />))}</div></div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-[10px] font-bold uppercase text-[#B09E99] block mb-2 px-1">Eyes</span><div className="flex gap-2 flex-wrap">{['dots', 'wink', 'stars', 'glasses'].map(e => (<button key={e} onClick={() => onAvatarUpdate({ eyes: e })} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${journeySettings.avatar?.eyes === e ? 'bg-[#2D2A26] text-[#FDF6F0] border-[#2D2A26]' : 'bg-[#FDF6F0] text-[#8D6E63] border-[#EBE0D6]'}`}>{e}</button>))}</div></div>
              <div><span className="text-[10px] font-bold uppercase text-[#B09E99] block mb-2 px-1">Smile</span><div className="flex gap-2 flex-wrap">{['smile', 'oh', 'cat', 'tongue'].map(m => (<button key={m} onClick={() => onAvatarUpdate({ mouth: m })} className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${journeySettings.avatar?.mouth === m ? 'bg-[#2D2A26] text-[#FDF6F0] border-[#2D2A26]' : 'bg-[#FDF6F0] text-[#8D6E63] border-[#EBE0D6]'}`}>{m}</button>))}</div></div>
            </div>
            <div><span className="text-[10px] font-bold uppercase text-[#B09E99] block mb-2 px-1">Accessory</span><div className="flex gap-2">{['none', 'sprout', 'headphones', 'bow'].map(a => (<button key={a} onClick={() => onAvatarUpdate({ accessory: a })} className={`px-4 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${journeySettings.avatar?.accessory === a ? 'bg-[#2D2A26] text-[#FDF6F0] border-[#2D2A26]' : 'bg-[#FDF6F0] text-[#8D6E63] border-[#EBE0D6]'}`}>{a}</button>))}</div></div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-[2rem] border border-[#EBE0D6] shadow-sm"><Clock className="text-[#81B29A] mb-2" size={20} /><p className="text-3xl font-serif text-[#2D2A26]">{myLogs.length}</p><span className="text-[10px] font-bold text-[#B09E99] uppercase tracking-widest">Entries</span></div>
        <div className="bg-white p-6 rounded-[2rem] border border-[#EBE0D6] shadow-sm"><Star className="text-[#F2CC8F] mb-2" size={20} /><p className="text-3xl font-serif text-[#2D2A26]">{myLogs.filter(l => l.milestone).length}</p><span className="text-[10px] font-bold text-[#B09E99] uppercase tracking-widest">Breakthroughs</span></div>
      </div>
      <div className="bg-[#2D2A26] rounded-[2rem] p-6 text-[#FDF6F0] mb-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-5 -mr-4 -mt-4"><Lightbulb size={120} /></div>
        <div className="flex justify-between items-center mb-4"><h3 className="text-[10px] font-bold tracking-widest uppercase text-[#81B29A]">Your Creative Vibe</h3><button onClick={onAnalyzePersona} className="text-[#81B29A] hover:text-[#FDF6F0] transition-colors"><RefreshCw size={16} className={isAnalyzingPersona ? 'animate-spin' : ''} /></button></div>
        <p className="text-sm font-serif italic text-[#EBE0D6] leading-relaxed">{aiPersona || "Let the AI read your journal and discover your unique learning style."}</p>
      </div>
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [journeySettings, setJourneySettings] = useState({ title: "My Journey", description: "Sequential Documenting", category: null, avatar: { bg: 'bg-[#FF9F85]', eyes: 'dots', mouth: 'smile', accessory: 'none' } });
  const [activeTab, setActiveTab] = useState('journey');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessingTitle, setIsProcessingTitle] = useState(false);
  const [weeklyRecap, setWeeklyRecap] = useState(null);
  const [isGeneratingRecap, setIsGeneratingRecap] = useState(false);
  const [aiPersona, setAiPersona] = useState(null);
  const [isAnalyzingPersona, setIsAnalyzingPersona] = useState(false);
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const initAuth = async () => {
      try { 
        await signInAnonymously(auth); 
      } catch (err) { 
        console.error('Auth error:', err); 
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'logs');
    const unsubscribeLogs = onSnapshot(q, (snapshot) => { setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))); });
    const settingsRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'journey');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => { 
      if (docSnap.exists()) { 
        const data = docSnap.data(); 
        setJourneySettings(prev => ({ 
          ...prev, 
          ...data,
          avatar: data.avatar || prev.avatar || { bg: 'bg-[#FF9F85]', eyes: 'dots', mouth: 'smile', accessory: 'none' }
        })); 
        if (data.aiPersona) setAiPersona(data.aiPersona); 
      }
    });
    return () => { unsubscribeLogs(); unsubscribeSettings(); };
  }, [user]);

  const updateAvatar = async (newParts) => { 
    if (!user) return; 
    const defaultAvatar = { bg: 'bg-[#FF9F85]', eyes: 'dots', mouth: 'smile', accessory: 'none' };
    const currentAvatar = journeySettings.avatar || defaultAvatar;
    const newAvatar = { ...currentAvatar, ...newParts }; 
    
    // Update local state immediately for responsive UI
    setJourneySettings(prev => ({ 
      ...prev, 
      avatar: newAvatar 
    })); 
    
    // Save to Firestore
    try {
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'journey'), { avatar: newAvatar }, { merge: true });
    } catch (error) {
      console.error('Error updating avatar:', error);
      // Revert on error
      setJourneySettings(prev => ({ ...prev, avatar: currentAvatar }));
    }
  };
  const randomizeAvatar = () => { const colors = ['bg-[#FF9F85]', 'bg-[#81B29A]', 'bg-[#F2CC8F]', 'bg-[#E07A5F]', 'bg-[#3D405B]', 'bg-[#D1495B]', 'bg-[#8D6E63]', 'bg-[#F4F1DE]']; const eyes = ['dots', 'wink', 'stars', 'glasses']; const mouths = ['smile', 'oh', 'cat', 'tongue']; const accessories = ['none', 'sprout', 'headphones', 'bow']; updateAvatar({ bg: colors[Math.floor(Math.random() * colors.length)], eyes: eyes[Math.floor(Math.random() * eyes.length)], mouth: mouths[Math.floor(Math.random() * mouths.length)], accessory: accessories[Math.floor(Math.random() * accessories.length)] }); };
  
  // AI WRAPPERS
  const generateMagicTitle = async () => { setIsProcessingTitle(true); const myLogs = logs.filter(l => l.userId === user.uid).slice(0, 10).map(l => l.transcript).join(" "); try { const suggestions = await api.magicTitle(myLogs); await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'journey'), { title: suggestions.title, description: suggestions.subtitle }, { merge: true }); } catch (err) { console.error(err); } finally { setIsProcessingTitle(false); } };
  const generateRecap = async () => { setIsGeneratingRecap(true); const recentLogs = logs.filter(l => l.userId === user.uid).slice(0, 7).map(l => l.transcript).join("\n\n"); try { const text = await api.recap(recentLogs); setWeeklyRecap(text); } catch (err) { console.error(err); } finally { setIsGeneratingRecap(false); } };
  const analyzePersona = async () => { const myLogs = logs.filter(l => l.userId === user?.uid); if (myLogs.length === 0) return; setIsAnalyzingPersona(true); try { const text = await api.persona(myLogs.map(l => l.transcript).join("\n")); setAiPersona(text); await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'journey'), { aiPersona: text }, { merge: true }); } catch (err) { console.error(err); } finally { setIsAnalyzingPersona(false); } };
  const getAIInsight = async (logId, transcript) => { try { const text = await api.insight(transcript); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'logs', logId), { aiInsight: text }); } catch (e) { console.error(e); } };

  const startRecording = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'; mediaRecorderRef.current = new MediaRecorder(stream, { mimeType }); audioChunksRef.current = []; mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); }; mediaRecorderRef.current.onstop = async () => { const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType }); const reader = new FileReader(); reader.readAsDataURL(blob); reader.onloadend = async () => { await processAudio(reader.result, mediaRecorderRef.current.mimeType); }; }; mediaRecorderRef.current.start(); setIsRecording(true); setRecordingTime(0); timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000); } catch (err) { console.error(err); } };
  const stopRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); clearInterval(timerRef.current); mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); } };
  const processAudio = async (base64Audio, mimeType) => { setIsTranscribing(true); try { const analysis = await api.processAudio(base64Audio.split(',')[1], mimeType); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), { userId: user.uid, transcript: analysis.transcript, milestone: analysis.milestone, summary: analysis.summary, audioData: base64Audio, dayNumber: logs.filter(l => l.userId === user.uid).length + 1, timestamp: serverTimestamp(), userName: `Maker ${user.uid.slice(0, 4)}`, category: journeySettings.category, likes: [] }); } catch (err) { console.error(err); } finally { setIsTranscribing(false); } };

  const squadLogs = logs.filter(l => l.category === journeySettings.category);

  return (
    <div className="min-h-screen bg-[#FDF6F0] text-[#2D2A26] font-sans pb-40">
      {user && !journeySettings.category && <Onboarding onComplete={(c) => { const settings = { category: c.id, title: c.label, description: `Documenting ${c.label}` }; setJourneySettings(p => ({...p, ...settings})); setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'journey'), settings, { merge: true }); }} />}
      <header className="sticky top-0 z-50 bg-[#FDF6F0]/90 backdrop-blur-md border-b border-[#EBE0D6] px-6 py-4 flex justify-between items-center">
        <button onClick={() => setActiveTab('journey')} className="flex items-center gap-3 group"><div className="w-10 h-10 bg-[#E07A5F] rounded-full flex items-center justify-center shadow-md transform transition-transform hover:scale-105"><Headphones className="text-white" size={20} /></div><h1 className="text-xl font-serif font-bold text-[#2D2A26] italic">AudioLog</h1></button>
        <button onClick={() => setActiveTab('profile')} className="ring-2 ring-[#E07A5F] ring-offset-2 ring-offset-[#FDF6F0] rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"><CuteAvatar config={journeySettings.avatar} size="md" /></button>
      </header>
      <main className="max-w-md mx-auto px-6 pt-8">
        <div className="relative mb-8 bg-white p-6 rounded-[2rem] border border-[#EBE0D6] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4"><div className="w-12 h-12 bg-[#F5EBE0] rounded-full flex items-center justify-center text-[#E07A5F]">{journeySettings.category ? React.createElement(CHALLENGES.find(c => c.id === journeySettings.category)?.icon || Target, { size: 24 }) : <Target size={24} />}</div><div><h2 className="text-xl font-serif font-bold text-[#2D2A26]">{journeySettings.title}</h2><p className="text-[10px] font-bold text-[#8D6E63] uppercase tracking-widest">{journeySettings.category ? `${CHALLENGES.find(c => c.id === journeySettings.category)?.members} Members` : journeySettings.description}</p></div></div>
          <button onClick={generateMagicTitle} className={`p-2 bg-[#F5EBE0] text-[#8D6E63] rounded-full hover:bg-[#E07A5F] hover:text-white transition-colors ${isProcessingTitle ? 'animate-spin' : ''}`}><Wand2 size={18} /></button>
        </div>
        <div className="flex gap-2 mb-8 bg-[#EBE0D6] p-1.5 rounded-full">
           <button onClick={() => setActiveTab('journey')} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${activeTab === 'journey' ? 'bg-white text-[#E07A5F] shadow-sm' : 'text-[#8D6E63] hover:text-[#4A4238]'}`}>My Story</button>
           <button onClick={() => setActiveTab('squad')} className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all ${activeTab === 'squad' ? 'bg-white text-[#E07A5F] shadow-sm' : 'text-[#8D6E63] hover:text-[#4A4238]'}`}>Circle</button>
        </div>
        {activeTab === 'journey' && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{logs.filter(l => l.userId === user?.uid).map(log => (<LogCard key={log.id} log={log} userId={user?.uid} onInsight={getAIInsight} userAvatar={journeySettings.avatar} />))}{logs.filter(l => l.userId === user?.uid).length === 0 && <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-[#EBE0D6]"><Mic className="text-[#D3C4BC] mx-auto mb-4" size={48} /><p className="text-[#8D6E63] font-serif italic text-sm">The blank page is listening...</p></div>}</div>)}
        {activeTab === 'squad' && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">{squadLogs.map(log => (<LogCard key={log.id} log={log} userId={user?.uid} onInsight={getAIInsight} userAvatar={journeySettings.avatar} />))}{squadLogs.length === 0 && <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-[#EBE0D6]"><Users className="text-[#D3C4BC] mx-auto mb-4" size={48} /><p className="text-[#8D6E99] font-serif italic text-sm">Quiet in the circle today.</p></div>}</div>)}
        {activeTab === 'profile' && (<ProfilePage user={user} logs={logs} journeySettings={journeySettings} onAvatarUpdate={updateAvatar} onRandomize={randomizeAvatar} onAnalyzePersona={analyzePersona} isAnalyzingPersona={isAnalyzingPersona} aiPersona={aiPersona} onSwitchSquad={() => setJourneySettings(p => ({...p, category: null}))} />)}
      </main>
      <div className="fixed bottom-0 left-0 right-0 p-6 pointer-events-none z-[100]">
        <div className="max-w-md mx-auto flex flex-col items-center pointer-events-auto">
          {isTranscribing && <div className="mb-4 bg-[#2D2A26] text-[#FDF6F0] px-5 py-2 rounded-full shadow-lg animate-bounce flex items-center gap-2"><Feather size={12} /><span className="text-[10px] font-bold uppercase tracking-widest">Jotting that down...</span></div>}
          <nav className="w-full bg-white/90 backdrop-blur-xl shadow-xl rounded-full p-2 flex items-center justify-between border border-[#EBE0D6] px-6">
            <button onClick={() => setActiveTab('journey')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'journey' ? 'text-[#E07A5F]' : 'text-[#B09E99] hover:text-[#8D6E63]'}`}><BookOpen size={24} strokeWidth={2.5} /></button>
            <div className="relative -mt-16"><button onClick={isRecording ? stopRecording : startRecording} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isRecording ? 'bg-[#D1495B] scale-110 rotate-90 shadow-[#D1495B]/30' : 'bg-[#E07A5F] hover:bg-[#D66A4F] shadow-[#E07A5F]/30'}`}>{isRecording ? <Square fill="white" className="text-white" size={28} /> : <Mic className="text-white" size={32} strokeWidth={2.5} />}</button></div>
            <button onClick={() => setActiveTab('squad')} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'squad' ? 'text-[#E07A5F]' : 'text-[#B09E99] hover:text-[#8D6E63]'}`}><Users size={24} strokeWidth={2.5} /></button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default App;
