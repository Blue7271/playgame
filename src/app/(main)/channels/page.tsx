'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import {
  Send, Languages, Plus, X, ChevronDown,
  UserPlus, MoreHorizontal, Loader2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  originalLang: string;
  translatedText?: string;
  timestamp: number;
  isMe: boolean;
}

interface Member {
  id: string;
  nickname: string;
  avatar: string;
  isOnline: boolean;
  role: 'owner' | 'companion' | 'member';
}

const TRANSLATION_LANGUAGES = [
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
];

// Mock translations for demo
const MOCK_TRANSLATIONS: Record<string, Record<string, string>> = {
  'en': {
    '你好呀，我来了！这局我打什么位置？': 'Hey, I\'m here! What position should I play?',
    '我玩射手，你辅助我': 'I\'ll play marksman, you support me',
    '好的，我选蔡文姬跟你，放心交给我': 'OK, I\'ll pick Cai Wenji to support you, leave it to me!',
    '开团开团！': 'Let\'s team fight! Let\'s go!',
    'GG！刚才那波团战太精彩了': 'GG! That team fight was amazing!',
    '等等我，马上到': 'Wait for me, I\'ll be right there',
    '好的，我玩射手': 'OK, I\'ll play marksman',
    '大家好，一起开黑吗？': 'Hey everyone, wanna play together?',
  },
  'ja': {
    '你好呀，我来了！这局我打什么位置？': 'やっほー、来たよ！今日はどのポジションやる？',
    '我玩射手，你辅助我': '私がマークスマンやるから、サポートして',
    '好的，我选蔡文姬跟你，放心交给我': 'わかった、蔡文姫ピックしてサポートするよ、任せて！',
  },
  'ko': {
    '你好呀，我来了！这局我打什么位置？': '안녕, 나 왔어! 이번 판 어떤 포지션 할까?',
    '我玩射手，你辅助我': '내가 원딜 할게, 너 서포트 해줘',
  },
};

function getTranslation(text: string, targetLang: string): string | undefined {
  if (targetLang === 'zh') return undefined;
  const langMap = MOCK_TRANSLATIONS[targetLang];
  if (langMap && langMap[text]) return langMap[text];
  return `[${TRANSLATION_LANGUAGES.find(l => l.code === targetLang)?.flag || ''}] ${text}`;
}

export default function ChannelsPage() {
  const { user, roomStatus, matchedCompanion, setRoomStatus } = useAppStore();
  const idCounterRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const tsRef = useRef(1720000200000);

  const nextId = useCallback(() => {
    idCounterRef.current += 1;
    return String(idCounterRef.current);
  }, []);

  const nextTs = useCallback(() => {
    tsRef.current += 30000;
    return tsRef.current;
  }, []);

  // Detect device language as default translation target
  const [targetLang, setTargetLang] = useState<string>(() => {
    if (typeof navigator !== 'undefined') {
      const lang = navigator.language?.slice(0, 2) || 'zh';
      return TRANSLATION_LANGUAGES.find(l => l.code === lang) ? lang : 'en';
    }
    return 'zh';
  });

  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inputText, setInputText] = useState('');
  const [waitingDots, setWaitingDots] = useState('');

  // Build initial members based on whether we came from auto-dispatch
  const [members, setMembers] = useState<Member[]>(() => {
    const base: Member[] = [
      { id: 'me', nickname: user?.nickname || '我', avatar: user?.avatar || '🎮', isOnline: true, role: 'owner' },
    ];
    // If we have a matched companion and room is active, add them
    if (matchedCompanion && roomStatus === 'active') {
      base.push({
        id: matchedCompanion.id,
        nickname: matchedCompanion.nickname,
        avatar: matchedCompanion.avatar,
        isOnline: true,
        role: 'companion',
      });
    }
    return base;
  });

  // Available players to invite
  const availableToInvite = [
    { id: 'inv1', nickname: '雷霆战神', avatar: '⚡' },
    { id: 'inv2', nickname: '樱花酱', avatar: '🌸' },
    { id: 'inv3', nickname: '孤狼', avatar: '🦊' },
    { id: 'inv4', nickname: '风暴骑士', avatar: '🛡️' },
  ];

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Waiting animation dots
  useEffect(() => {
    if (roomStatus !== 'waiting') return;
    const interval = setInterval(() => {
      setWaitingDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [roomStatus]);

  // Simulate companion joining after waiting
  useEffect(() => {
    if (roomStatus !== 'waiting' || !matchedCompanion) return;

    const timer = setTimeout(() => {
      // Add companion to members
      setMembers(prev => [...prev, {
        id: matchedCompanion.id,
        nickname: matchedCompanion.nickname,
        avatar: matchedCompanion.avatar,
        isOnline: true,
        role: 'companion',
      }]);

      // Update room status to active
      setRoomStatus('active');

      // Add system message
      setMessages([{
        id: nextId(),
        sender: '系统',
        avatar: '📢',
        text: `陪玩 ${matchedCompanion.nickname} 已加入房间`,
        originalLang: 'zh',
        timestamp: nextTs(),
        isMe: false,
      }]);

      // Companion sends a greeting after 1.5s
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: nextId(),
          sender: matchedCompanion.nickname,
          avatar: matchedCompanion.avatar,
          text: '你好呀，我来了！这局我打什么位置？',
          originalLang: 'zh',
          timestamp: nextTs(),
          isMe: false,
        }]);
      }, 1500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [roomStatus, matchedCompanion, setRoomStatus, nextId, nextTs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMsg: ChatMessage = {
      id: nextId(),
      sender: user?.nickname || '我',
      avatar: user?.avatar || '🎮',
      text: inputText,
      originalLang: 'zh',
      timestamp: nextTs(),
      isMe: true,
    };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    // Simulate companion reply after 2s
    if (matchedCompanion && roomStatus === 'active') {
      setTimeout(() => {
        const replies = [
          '好的，我选蔡文姬跟你，放心交给我',
          '开团开团！',
          'GG！刚才那波团战太精彩了',
        ];
        setMessages(prev => [...prev, {
          id: nextId(),
          sender: matchedCompanion.nickname,
          avatar: matchedCompanion.avatar,
          text: replies[Math.floor(Math.random() * replies.length)],
          originalLang: 'zh',
          timestamp: nextTs(),
          isMe: false,
        }]);
      }, 2000);
    }
  };

  const handleInvite = (invitee: { id: string; nickname: string; avatar: string }) => {
    if (members.find(m => m.id === invitee.id)) return;
    setMembers(prev => [...prev, {
      id: invitee.id,
      nickname: invitee.nickname,
      avatar: invitee.avatar,
      isOnline: true,
      role: 'member',
    }]);
    const sysMsg: ChatMessage = {
      id: nextId(),
      sender: '系统',
      avatar: '📢',
      text: `${invitee.nickname} 加入了群聊`,
      originalLang: 'zh',
      timestamp: nextTs(),
      isMe: false,
    };
    setMessages(prev => [...prev, sysMsg]);
  };

  const currentLang = TRANSLATION_LANGUAGES.find(l => l.code === targetLang);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Room title
  const roomTitle = matchedCompanion
    ? `${matchedCompanion.nickname}的开黑房间`
    : '开黑聊天室';

  // ========== WAITING STATE ==========
  if (roomStatus === 'waiting') {
    return (
      <div className="flex flex-col h-screen items-center justify-center px-6">
        {/* Pulsing ring animation */}
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-purple-500/20 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full glass-card flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-white mb-2">正在等待打手加入{waitingDots}</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          已为您匹配到合适的陪玩，正在等待对方进入房间
        </p>

        {/* Matched companion preview */}
        {matchedCompanion && (
          <div className="glass-card rounded-2xl p-4 w-full max-w-xs text-center">
            <div className="w-14 h-14 rounded-full mx-auto mb-2 gradient-primary flex items-center justify-center text-2xl">
              {matchedCompanion.avatar}
            </div>
            <p className="text-sm font-bold text-white">{matchedCompanion.nickname}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {matchedCompanion.rank} · ¥{matchedCompanion.price}/局
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] text-amber-400">正在连接中</span>
            </div>
          </div>
        )}

        {/* Cancel button */}
        <button
          onClick={() => {
            setRoomStatus('idle');
            window.history.back();
          }}
          className="mt-8 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:bg-white/10 transition-all"
        >
          取消等待
        </button>
      </div>
    );
  }

  // ========== EMPTY STATE (no order) ==========
  if (!matchedCompanion && roomStatus === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-8">
        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
          <Mic className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/40 text-sm text-center leading-relaxed">
          下单后会自动进入房间
        </p>
        <p className="text-white/25 text-xs mt-2 text-center">
          在派单页面选择陪玩师，匹配成功后将自动进入开黑房间
        </p>
      </div>
    );
  }

  // ========== CHAT STATE ==========
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 glass-card border-b border-white/5 relative z-30">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white truncate">{roomTitle}</h2>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {members.length}人
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-[10px] text-emerald-400">
                {members.filter(m => m.isOnline).length}人在线
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <button
              onClick={() => setShowLangPicker(!showLangPicker)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs hover:bg-blue-500/25 transition-all"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{currentLang?.flag} {currentLang?.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Members Toggle */}
            <button
              onClick={() => { setShowMembers(!showMembers); setShowInvite(false); }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                showMembers ? 'gradient-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* More / Invite */}
            <button
              onClick={() => { setShowInvite(!showInvite); setShowMembers(false); }}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-white/10"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Language Picker Dropdown */}
        {showLangPicker && (
          <div className="absolute top-full right-4 mt-1 w-56 glass-card rounded-xl border border-white/10 overflow-hidden z-50 animate-slide-up">
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-xs text-muted-foreground">翻译为</span>
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              {TRANSLATION_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => { setTargetLang(lang.code); setShowLangPicker(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-all ${
                    targetLang === lang.code
                      ? 'bg-purple-500/15 text-purple-400'
                      : 'text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1">{lang.label}</span>
                  {targetLang === lang.code && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Invite Panel */}
        {showInvite && (
          <div className="absolute top-full right-4 mt-1 w-64 glass-card rounded-xl border border-white/10 overflow-hidden z-50 animate-slide-up">
            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">邀请好友加入</span>
              <button onClick={() => setShowInvite(false)} className="text-white/40 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="py-1">
              {availableToInvite.map(inv => {
                const isAlready = members.some(m => m.nickname === inv.nickname);
                return (
                  <button
                    key={inv.id}
                    onClick={() => !isAlready && handleInvite(inv)}
                    disabled={isAlready}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${
                      isAlready ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className="text-xl">{inv.avatar}</span>
                    <span className="text-xs text-white flex-1">{inv.nickname}</span>
                    {isAlready ? (
                      <span className="text-[10px] text-muted-foreground">已在群内</span>
                    ) : (
                      <span className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
                        <UserPlus className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Members Sidebar */}
      {showMembers && (
        <div className="px-4 py-3 glass-card border-b border-white/5 animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-white">群成员</span>
            <button
              onClick={() => { setShowInvite(true); setShowMembers(false); }}
              className="ml-auto flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
            >
              <Plus className="w-3 h-3" /> 邀请
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {members.map(m => (
              <div key={m.id} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                    {m.avatar}
                  </div>
                  {m.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#0A0A0F]" />
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground max-w-[48px] truncate">
                  {m.nickname}
                </span>
                {m.role === 'companion' && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">陪玩</span>
                )}
              </div>
            ))}
            {/* Invite placeholder */}
            <button
              onClick={() => { setShowInvite(true); setShowMembers(false); }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-xl border border-dashed border-white/15 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white/30" />
              </div>
              <span className="text-[10px] text-white/20">邀请</span>
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 && roomStatus === 'active' && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">房间已就绪，开始聊天吧！</p>
          </div>
        )}
        {messages.map((msg, idx) => {
          const isSystem = msg.sender === '系统';
          const translated = targetLang !== 'zh' ? getTranslation(msg.text, targetLang) : undefined;

          // Show time separator if gap > 3 min
          const showTimeSep = idx === 0 || (msg.timestamp - messages[idx - 1].timestamp > 180000);

          return (
            <div key={msg.id}>
              {showTimeSep && (
                <div className="text-center py-2">
                  <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              )}

              {isSystem ? (
                <div className="text-center py-1.5">
                  <span className="text-[10px] text-muted-foreground bg-white/5 px-3 py-1 rounded-full">
                    {msg.text}
                  </span>
                </div>
              ) : (
                <div className={`flex gap-2.5 mb-3 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-lg flex-shrink-0">
                    {msg.avatar}
                  </div>

                  {/* Bubble */}
                  <div className={`max-w-[72%] flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{msg.sender}</span>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                      msg.isMe
                        ? 'gradient-primary text-white rounded-tr-sm'
                        : 'glass-card text-white rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>

                    {/* Translation */}
                    {translated && (
                      <div className={`flex items-start gap-1 mt-1 px-1 max-w-full ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                        <Languages className="w-3 h-3 text-blue-400/50 flex-shrink-0 mt-0.5" />
                        <span className="text-[11px] text-blue-400/60 italic leading-relaxed break-words">
                          {translated}
                        </span>
                      </div>
                    )}

                    {/* Time */}
                    <span className="text-[9px] text-white/15 mt-0.5 px-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="px-4 py-3 glass-card border-t border-white/5 bottom-nav-safe">
        <div className="flex items-center gap-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            placeholder="输入消息..."
            className="flex-1 h-10 bg-white/5 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 transition-colors"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="h-10 w-10 p-0 gradient-primary text-white rounded-xl flex-shrink-0 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {targetLang !== 'zh' && (
          <div className="flex items-center gap-1 mt-1.5 px-1">
            <Languages className="w-3 h-3 text-blue-400/40" />
            <span className="text-[10px] text-blue-400/40">
              消息将自动翻译为 {currentLang?.flag} {currentLang?.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
