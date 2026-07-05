'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Headphones, Users, Globe, Mic, MicOff, Volume2,
  MessageSquare, Languages, Search, Plus
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  translatedText?: string;
  timestamp: Date;
  isSystem: boolean;
}

export default function ChannelsPage() {
  const { channels } = useAppStore();
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: '系统', text: '欢迎来到开黑频道！请保持友善交流。', timestamp: new Date(), isSystem: true },
    { id: '2', sender: '暗夜猎手', text: '有人一起排位吗？钻石局', timestamp: new Date(Date.now() - 60000), isSystem: false },
    { id: '3', sender: '甜心小鹿', text: '我来！等我一下', timestamp: new Date(Date.now() - 30000), isSystem: false },
    { id: '4', sender: '雷霆战神', text: 'GG! 刚才那波团战太精彩了', timestamp: new Date(Date.now() - 10000), isSystem: false, translatedText: 'GG! That team fight was amazing!' },
  ]);
  const [inputText, setInputText] = useState('');

  const currentChannel = channels.find(c => c.id === activeChannel);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: '我',
      text: inputText,
      timestamp: new Date(),
      isSystem: false,
      translatedText: showTranslation ? `[Translation] ${inputText}` : undefined,
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  if (activeChannel && currentChannel) {
    return (
      <div className="flex flex-col h-screen">
        {/* Channel Header */}
        <div className="px-4 pt-6 pb-3 glass-card border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveChannel(null)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-white/10"
              >
                ←
              </button>
              <div>
                <h2 className="text-sm font-bold text-white">{currentChannel.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{currentChannel.gameName}</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    {currentChannel.members}/{currentChannel.maxMembers}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  showTranslation ? 'gradient-primary text-white' : 'bg-white/5 text-muted-foreground'
                }`}
              >
                <Languages className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Voice Members */}
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Headphones className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-muted-foreground">语音频道</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {Array.from({ length: currentChannel.members }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  i === 0 ? 'bg-purple-500/20 ring-2 ring-purple-500/50' : 'bg-white/5'
                }`}>
                  {['🎮', '🦊', '🌟', '⚡', '🌸'][i % 5]}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {i === 0 ? '我' : `玩家${i}`}
                </span>
                {currentChannel.isSpeaking && i === 1 && (
                  <div className="flex items-end gap-0.5 h-3">
                    {[1,2,3].map(j => (
                      <div key={j} className="w-0.5 bg-emerald-400 rounded-full waveform-bar" />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: currentChannel.maxMembers - currentChannel.members }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full border border-dashed border-white/10 flex items-center justify-center">
                  <span className="text-white/20 text-xs">+</span>
                </div>
                <span className="text-[10px] text-white/20">空位</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map(msg => (
            <div key={msg.id} className={`animate-slide-up ${msg.isSystem ? 'text-center' : ''}`}>
              {msg.isSystem ? (
                <span className="text-[10px] text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
                  {msg.text}
                </span>
              ) : (
                <div className={`flex flex-col ${msg.sender === '我' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-muted-foreground mb-1">{msg.sender}</span>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs ${
                    msg.sender === '我'
                      ? 'gradient-primary text-white rounded-br-md'
                      : 'glass-card text-white rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.translatedText && showTranslation && (
                    <div className="flex items-center gap-1 mt-1">
                      <Languages className="w-3 h-3 text-blue-400" />
                      <span className="text-[10px] text-blue-400/70 italic">{msg.translatedText}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input & Controls */}
        <div className="px-4 py-3 glass-card border-t border-white/5 bottom-nav-safe">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isMuted ? 'bg-red-500/20 text-red-400' : 'gradient-primary text-white'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <div className="flex-1 relative">
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="输入消息..."
                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 pr-10 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white">
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
            <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-white/10">
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">开黑频道</h1>
            <p className="text-xs text-muted-foreground mt-1">
              实时语音 · 自动翻译 · 畅快沟通
            </p>
          </div>
          <button className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索频道..."
            className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
          />
        </div>
      </div>

      {/* Translation Banner */}
      <div className="px-4 mb-4">
        <div className="glass-card rounded-2xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-white">实时翻译已开启</p>
            <p className="text-[10px] text-muted-foreground">支持中/英/日/韩等多语言实时翻译</p>
          </div>
          <div className="flex items-center gap-1">
            <Languages className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] text-purple-400">ON</span>
          </div>
        </div>
      </div>

      {/* Channel List */}
      <div className="px-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-white">
            热门频道 <span className="text-muted-foreground text-xs">({channels.length})</span>
          </h2>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {channels.reduce((sum, c) => sum + c.members, 0)} 人在线
            </span>
          </div>
        </div>

        <div className="space-y-3 pb-4">
          {channels.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.id)}
              className="w-full glass-card rounded-2xl p-4 text-left hover:bg-white/8 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{channel.name}</span>
                    {channel.isSpeaking && (
                      <div className="flex items-end gap-0.5 h-3">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-0.5 bg-emerald-400 rounded-full waveform-bar" />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{channel.gameName}</span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      {channel.members}/{channel.maxMembers}
                    </span>
                    <span className="text-[10px] text-blue-400 flex items-center gap-0.5">
                      <Languages className="w-3 h-3" />
                      {channel.language}
                    </span>
                  </div>
                  <div className="flex gap-1 mt-1.5">
                    {channel.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <Button className="h-8 px-4 gradient-primary text-white rounded-lg text-xs">
                    加入
                  </Button>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
