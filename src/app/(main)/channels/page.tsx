'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Mic, MicOff, Volume2, Languages, PhoneOff,
  MessageSquare, Send, Headphones, User
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  translatedText?: string;
  timestamp: Date;
  isMe: boolean;
}

interface RoomMember {
  id: string;
  nickname: string;
  avatar: string;
  role: 'client' | 'companion';
  isSpeaking: boolean;
  isMuted: boolean;
}

export default function ChannelsPage() {
  const { user } = useAppStore();

  // Room members: client + companion
  const [members] = useState<RoomMember[]>([
    {
      id: 'me',
      nickname: user?.nickname || '我',
      avatar: user?.avatar || '🎮',
      role: 'client',
      isSpeaking: false,
      isMuted: false,
    },
    {
      id: 'companion',
      nickname: '甜心小鹿',
      avatar: '🦌',
      role: 'companion',
      isSpeaking: true,
      isMuted: false,
    },
  ]);

  const [isMuted, setIsMuted] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [inputText, setInputText] = useState('');
  const [callDuration, setCallDuration] = useState('02:35');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: '1',
      sender: '甜心小鹿',
      avatar: '🦌',
      text: '你好呀～我们开始吧！这局我打辅助保护你',
      timestamp: new Date(1720000000000),
      isMe: false,
    },
    {
      id: '2',
      sender: user?.nickname || '我',
      avatar: user?.avatar || '🎮',
      text: '好的，我玩射手',
      timestamp: new Date(1720000030000),
      isMe: true,
      translatedText: 'OK, I\'ll play marksman',
    },
    {
      id: '3',
      sender: '甜心小鹿',
      avatar: '🦌',
      text: '没问题！我选蔡文姬跟你，放心交给我',
      timestamp: new Date(1720000060000),
      isMe: false,
    },
  ]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: user?.nickname || '我',
      avatar: user?.avatar || '🎮',
      text: inputText,
      timestamp: new Date(),
      isMe: true,
      translatedText: showTranslation ? `[EN] ${inputText}` : undefined,
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  const companion = members.find(m => m.role === 'companion')!;
  const client = members.find(m => m.role === 'client')!;

  return (
    <div className="flex flex-col h-screen">
      {/* Room Header */}
      <div className="px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">王者荣耀 · 排位赛</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block pulse-glow" />
                  通话中
                </span>
                <span className="text-[10px] text-muted-foreground">{callDuration}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
              showTranslation ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-muted-foreground'
            }`}
          >
            <Languages className="w-3.5 h-3.5" />
            翻译{showTranslation ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Voice Room - Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Companion (打手) */}
        <div className="flex flex-col items-center mb-8">
          <div className={`relative w-24 h-24 rounded-full flex items-center justify-center text-5xl ${
            companion.isSpeaking
              ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 ring-4 ring-purple-500/40'
              : 'bg-white/5'
          } transition-all duration-300`}>
            {companion.avatar}
            {companion.isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-3 border-[#0A0A0F] flex items-center justify-center">
                  <Mic className="w-3 h-3 text-white" />
                </div>
              </>
            )}
          </div>
          <span className="text-base font-bold text-white mt-3">{companion.nickname}</span>
          <span className="text-xs text-purple-400 mt-0.5 flex items-center gap-1">
            <User className="w-3 h-3" />
            陪玩师 · 王者段位
          </span>
          {companion.isSpeaking && (
            <div className="flex items-end gap-0.5 h-4 mt-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-1 bg-purple-400 rounded-full waveform-bar" />
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-16 h-px bg-white/10 mb-8" />

        {/* Client (我) */}
        <div className="flex flex-col items-center">
          <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
            !isMuted ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 ring-2 ring-blue-500/30' : 'bg-white/5'
          } transition-all duration-300`}>
            {client.avatar}
            {!isMuted && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0A0A0F] flex items-center justify-center">
                <Mic className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            {isMuted && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0A0A0F] flex items-center justify-center">
                <MicOff className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <span className="text-sm font-medium text-white mt-2">{client.nickname}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">我</span>
        </div>
      </div>

      {/* Chat Panel (Toggle) */}
      {showChat && (
        <div className="mx-4 mb-2 glass-card rounded-2xl overflow-hidden animate-slide-up" style={{ maxHeight: '35vh' }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
            <span className="text-xs font-medium text-white flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              聊天消息
            </span>
            <button onClick={() => setShowChat(false)} className="text-muted-foreground text-xs">
              收起
            </button>
          </div>
          <div className="overflow-y-auto px-3 py-2 space-y-2.5" style={{ maxHeight: '22vh' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm">{msg.avatar}</span>
                  <span className="text-[10px] text-muted-foreground">{msg.sender}</span>
                </div>
                <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs ${
                  msg.isMe
                    ? 'gradient-primary text-white rounded-br-sm'
                    : 'bg-white/8 text-white rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                {msg.translatedText && showTranslation && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Languages className="w-2.5 h-2.5 text-blue-400/60" />
                    <span className="text-[10px] text-blue-400/60 italic">{msg.translatedText}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Chat Input */}
          <div className="px-3 py-2 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入消息..."
                className="flex-1 h-8 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
              />
              <button
                onClick={handleSendMessage}
                className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white flex-shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="px-6 py-4 glass-card border-t border-white/5 bottom-nav-safe">
        <div className="flex items-center justify-center gap-5">
          {/* Chat Toggle */}
          <button
            onClick={() => setShowChat(!showChat)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              showChat ? 'gradient-primary text-white' : 'bg-white/10 text-muted-foreground hover:bg-white/15'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/30'
                : 'gradient-primary text-white neon-glow'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Speaker */}
          <button className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground hover:bg-white/15 transition-all">
            <Volume2 className="w-5 h-5" />
          </button>

          {/* Hang Up */}
          <button className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-all">
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
