import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Video, 
  Send, 
  User, 
  Bot 
} from 'lucide-react';
import { motion } from 'motion/react';
import { CHAT_TRANSCRIPT } from '../constants';

const InterviewView = () => {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-slate-50 relative z-10 pb-20 md:pb-0">
      {/* Main Video Area */}
      <div className="flex-none md:flex-1 h-[35vh] md:h-auto flex flex-col relative p-4 md:p-6 z-10">
        <div className="flex-1 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex items-center justify-center group">
          {/* Ambient Glow inside Video Area */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>
          <div className="absolute top-[-20%] left-[20%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-indigo-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none"></div>

          <div className="absolute top-4 left-4 md:top-8 md:left-8 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center gap-2 z-20">
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            <span className="text-[10px] md:text-xs font-bold text-white tracking-wide">LIVE SESSION</span>
          </div>

          {/* AI Avatar / Visualization */}
          <div className="relative z-10 flex flex-col items-center scale-75 md:scale-100">
            <div className="relative w-32 h-32 md:w-56 md:h-56 rounded-full bg-slate-800/50 backdrop-blur-md border border-white/10 flex items-center justify-center mb-6 md:mb-10 shadow-[0_0_50px_rgba(79,70,229,0.15)]">
              <Bot className="w-16 h-16 md:w-20 md:h-20 text-indigo-300 relative z-10 drop-shadow-[0_0_15px_rgba(165,180,252,0.5)]" />
              
              {/* Voice Waves Animation */}
              <motion.div 
                className="absolute inset-0 rounded-full border-2 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full border border-indigo-400/20 shadow-[0_0_30px_rgba(129,140,248,0.2)]"
                animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
              />
              <motion.div 
                className="absolute inset-0 rounded-full bg-indigo-500/5 blur-xl"
                animate={{ scale: [0.8, 1.2], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <p className="text-indigo-200/80 font-medium animate-pulse text-sm md:text-lg tracking-wide">AI Interviewer is speaking...</p>
          </div>

          {/* User Camera Preview (PiP) */}
          <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-24 h-16 md:w-56 md:h-40 bg-slate-800/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-2xl border border-white/10 overflow-hidden group-hover:scale-105 transition-transform duration-500">
            <div className="w-full h-full flex items-center justify-center relative">
              <User className="w-6 h-6 md:w-10 md:h-10 text-slate-500" />
              <div className="absolute bottom-1 left-1 md:bottom-3 md:left-3 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-1 rounded-md text-[8px] md:text-[10px] font-bold text-white">YOU</div>
            </div>
          </div>
        </div>

        {/* Controls (Desktop Only) */}
        <div className="hidden md:flex h-24 items-center justify-center gap-8 mt-4">
          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl border transition-all duration-300 ${
              isRecording 
                ? 'bg-white text-slate-900 border-white shadow-indigo-500/20' 
                : 'bg-white/40 text-slate-600 border-white/40 hover:bg-white hover:scale-110'
            }`}
          >
            {isRecording ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
          </button>
          
          <button className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-500/30 hover:bg-red-600 hover:scale-110 transition-all duration-300 border-4 border-slate-50">
            <PhoneOff className="w-8 h-8" />
          </button>

          <button className="w-16 h-16 rounded-full bg-white/40 backdrop-blur-xl text-slate-600 border border-white/40 flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all duration-300">
            <Video className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Transcript Sidebar */}
      <div className="flex-1 md:w-[400px] md:flex-none bg-white/60 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-white/40 flex flex-col h-full shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-20">
        <div className="p-4 md:p-6 border-b border-white/20 bg-white/40 backdrop-blur-md flex-shrink-0">
          <h3 className="font-bold text-slate-900 text-base md:text-lg">Transcript</h3>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-0.5 md:mt-1">Real-time speech-to-text</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-8 pb-24 md:pb-6">
          {CHAT_TRANSCRIPT.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[90%] p-3 md:p-5 rounded-2xl text-xs md:text-sm leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-500/20' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none shadow-slate-200/50'
              }`}>
                {msg.text}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 md:mt-2 px-1 font-medium uppercase tracking-wider">
                {msg.sender === 'user' ? 'You' : 'Interviewer'} • 10:23 AM
              </span>
            </div>
          ))}
        </div>

        <div className="hidden md:block p-6 border-t border-white/20 bg-white/40 backdrop-blur-md">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Type a message..." 
              className="w-full pl-6 pr-12 py-4 bg-white/80 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm group-hover:shadow-md"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:scale-105">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Floating Controls */}
      <div className="md:hidden fixed bottom-20 left-0 w-full flex justify-center gap-6 z-50 pointer-events-none">
        <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-xl p-2 rounded-full border border-white/10 shadow-2xl pointer-events-auto">
          <button 
            onClick={() => setIsRecording(!isRecording)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isRecording 
                ? 'bg-white text-slate-900' 
                : 'bg-white/20 text-white'
            }`}
          >
            {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          <button className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
            <PhoneOff className="w-6 h-6" />
          </button>

          <button className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center">
            <Video className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewView;
