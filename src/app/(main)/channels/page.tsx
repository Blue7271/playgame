'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Send, Languages, Plus, X, ChevronDown,
  UserPlus, MoreHorizontal, Loader2, Mic, Volume2
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
  isVoice?: boolean;
  voiceDuration?: number; // seconds
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
    '老板好，我是你的陪玩，马上上线': 'Hey boss, I\'m your companion, logging in now',
    '我打打野，帮你抓人': 'I\'ll jungle, help you gank',
    '收到，我配合你': 'Got it, I\'ll follow your lead',
  },
  'ja': {
    '你好呀，我来了！这局我打什么位置？': 'やっほー、来たよ！今日はどのポジションやる？',
    '我玩射手，你辅助我': '私がマークスマンやるから、サポートして',
    '好的，我选蔡文姬跟你，放心交给我': 'わかった、蔡文姫ピックしてサポートするよ、任せて！',
    '老板好，我是你的陪玩，马上上线': 'ボスこんにちは、あなたの付き添いです、すぐオンラインします',
  },
  'ko': {
    '你好呀，我来了！这局我打什么位置？': '안녕, 나 왔어! 이번 판 어떤 포지션 할까?',
    '我玩射手，你辅助我': '내가 원딜 할게, 너 서포트 해줘',
    '老板好，我是你的陪玩，马上上线': '보스 안녕하세요, 당신의 컴패니언입니다, 바로 온라인 할게요',
  },
};

function getTranslation(text: string, targetLang: string): string | undefined {
  if (targetLang === 'zh') return undefined;
  const langMap = MOCK_TRANSLATIONS[targetLang];
  if (langMap && langMap[text]) return langMap[text];
  return `[${TRANSLATION_LANGUAGES.find(l => l.code === targetLang)?.flag || ''}] ${text}`;
}

// Mock companions that will join the room
const MOCK_COMPANIONS = [
  { id: 'comp1', nickname: '小鹿', avatar: '🦌', rank: '黄金', price: 30 },
  { id: 'comp2', nickname: '雷霆战神', avatar: '⚡', rank: '钻石', price: 50 },
  { id: 'comp3', nickname: '樱花酱', avatar: '🌸', rank: '铂金', price: 35 },
];

// Voice messages that companions will send
const VOICE_MESSAGES = [
  { text: '老板好，我是你的陪玩，马上上线', duration: 3 },
  { text: '你好呀，我来了！这局我打什么位置？', duration: 4 },
  { text: '我玩射手，你辅助我', duration: 2 },
  { text: '好的，我选蔡文姬跟你，放心交给我', duration: 4 },
  { text: '开团开团！', duration: 2 },
  { text: 'GG！刚才那波团战太精彩了', duration: 3 },
];

export default function ChannelsPage() {
  const { user, roomStatus, roomMode, matchedCompanion, setRoomStatus } = useAppStore();
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

  // Build initial members - only the player
  const [members, setMembers] = useState<Member[]>(() => [
    { id: 'me', nickname: user?.nickname || '我', avatar: user?.avatar || '🎮', isOnline: true, role: 'owner' },
  ]);

  // Available players to invite
  const availableToInvite = [
    { id: 'inv1', nickname: '风暴骑士', avatar: '🛡️' },
    { id: 'inv2', nickname: '孤狼', avatar: '🦊' },
    { id: 'inv3', nickname: '月光女神', avatar: '🌙' },
    { id: 'inv4', nickname: '烈焰法师', avatar: '🔥' },
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

  // Simulate multiple companions joining one by one
  useEffect(() => {
    if (roomStatus !== 'waiting' || !matchedCompanion) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // First companion joins after 3s (the matched one)
    timers.push(setTimeout(() => {
      setMembers(prev => [...prev, {
        id: matchedCompanion.id,
        nickname: matchedCompanion.nickname,
        avatar: matchedCompanion.avatar,
        isOnline: true,
        role: 'companion',
      }]);

      setMessages([{
        id: nextId(),
        sender: '系统',
        avatar: '📢',
        text: `陪玩 ${matchedCompanion.nickname} 已加入房间`,
        originalLang: 'zh',
        timestamp: nextTs(),
        isMe: false,
      }]);

      // First companion sends voice message after 2s
      timers.push(setTimeout(() => {
        const voiceText = VOICE_MESSAGES[0].text;
        setMessages(prev => [...prev, {
          id: nextId(),
          sender: matchedCompanion.nickname,
          avatar: matchedCompanion.avatar,
          text: voiceText,
          originalLang: 'zh',
          translatedText: getTranslation(voiceText, targetLang),
          timestamp: nextTs(),
          isMe: false,
          isVoice: true,
          voiceDuration: VOICE_MESSAGES[0].duration,
        }]);
      }, 2000));
    }, 3000));

    // Second companion joins after 6s
    timers.push(setTimeout(() => {
      const comp2 = MOCK_COMPANIONS[1];
      setMembers(prev => [...prev, {
        id: comp2.id,
        nickname: comp2.nickname,
        avatar: comp2.avatar,
        isOnline: true,
        role: 'companion',
      }]);

      setMessages(prev => [...prev, {
        id: nextId(),
        sender: '系统',
        avatar: '📢',
        text: `陪玩 ${comp2.nickname} 已加入房间`,
        originalLang: 'zh',
        timestamp: nextTs(),
        isMe: false,
      }]);

      // Second companion sends voice message after 1.5s
      timers.push(setTimeout(() => {
        const voiceText = VOICE_MESSAGES[1].text;
        setMessages(prev => [...prev, {
          id: nextId(),
          sender: comp2.nickname,
          avatar: comp2.avatar,
          text: voiceText,
          originalLang: 'zh',
          translatedText: getTranslation(voiceText, targetLang),
          timestamp: nextTs(),
          isMe: false,
          isVoice: true,
          voiceDuration: VOICE_MESSAGES[1].duration,
        }]);
      }, 1500));
    }, 6000));

    // Third companion joins after 10s
    timers.push(setTimeout(() => {
      const comp3 = MOCK_COMPANIONS[2];
      setMembers(prev => [...prev, {
        id: comp3.id,
        nickname: comp3.nickname,
        avatar: comp3.avatar,
        isOnline: true,
        role: 'companion',
      }]);

      setMessages(prev => [...prev, {
        id: nextId(),
        sender: '系统',
        avatar: '📢',
        text: `陪玩 ${comp3.nickname} 已加入房间`,
        originalLang: 'zh',
        timestamp: nextTs(),
        isMe: false,
      }]);

      // Third companion sends voice message after 2s
      timers.push(setTimeout(() => {
        const voiceText = VOICE_MESSAGES[2].text;
        setMessages(prev => [...prev, {
          id: nextId(),
          sender: comp3.nickname,
          avatar: comp3.avatar,
          text: voiceText,
          originalLang: 'zh',
          translatedText: getTranslation(voiceText, targetLang),
          timestamp: nextTs(),
          isMe: false,
          isVoice: true,
          voiceDuration: VOICE_MESSAGES[2].duration,
        }]);
      }, 2000));
    }, 10000));

    // Update room status to active after first companion joins
    timers.push(setTimeout(() => {
      setRoomStatus('active');
    }, 3000));

    return () => timers.forEach(clearTimeout);
  }, [roomStatus, matchedCompanion, setRoomStatus, nextId, nextTs, targetLang]);

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

    // Simulate companion reply with voice message after 2s
    if (matchedCompanion && roomStatus === 'active') {
      setTimeout(() => {
        const voiceIdx = Math.min(3 + Math.floor(Math.random() * 3), VOICE_MESSAGES.length - 1);
        const voiceText = VOICE_MESSAGES[voiceIdx].text;
        setMessages(prev => [...prev, {
          id: nextId(),
          sender: matchedCompanion.nickname,
          avatar: matchedCompanion.avatar,
          text: voiceText,
          originalLang: 'zh',
          translatedText: getTranslation(voiceText, targetLang),
          timestamp: nextTs(),
          isMe: false,
          isVoice: true,
          voiceDuration: VOICE_MESSAGES[voiceIdx].duration,
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
  const roomTitle = '开黑聊天室';

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

  // ========== FREE MIC MODE ==========
  if (roomMode === 'freemic') {
    return <FreeMicMode />;
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
            <span className="text-xs text-muted-foreground">群成员</span>
            <span className="text-[10px] text-white/40">({members.length})</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {members.map(m => (
              <div key={m.id} className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
                    {m.avatar}
                  </div>
                  {m.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#12121F]" />
                  )}
                </div>
                <span className="text-[10px] text-white/60 max-w-[48px] truncate">{m.nickname}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => {
          // System message
          if (msg.sender === '系统') {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-[10px] text-white/30 bg-white/5 px-3 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isMe = msg.isMe;
          const translated = !isMe && targetLang !== 'zh'
            ? getTranslation(msg.text, targetLang)
            : undefined;

          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-base flex-shrink-0">
                {msg.avatar}
              </div>

              {/* Message */}
              <div className={`max-w-[75%] ${isMe ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-1.5 mb-0.5 ${isMe ? 'justify-end' : ''}`}>
                  <span className="text-[10px] text-white/40">{msg.sender}</span>
                  <span className="text-[10px] text-white/20">{formatTime(msg.timestamp)}</span>
                </div>

                {/* Voice message bubble */}
                {msg.isVoice ? (
                  <div className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl ${
                    isMe
                      ? 'gradient-primary text-white rounded-tr-sm'
                      : 'glass-card text-white rounded-tl-sm'
                  }`}>
                    <Volume2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <div className="flex items-center gap-0.5">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-0.5 rounded-full ${isMe ? 'bg-white/60' : 'bg-purple-400/60'}`}
                          style={{
                            height: `${8 + Math.sin(i * 0.8) * 8 + Math.random() * 4}px`,
                            animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] opacity-60">{msg.voiceDuration}&quot;</span>
                  </div>
                ) : (
                  <div className={`inline-block px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'gradient-primary text-white rounded-tr-sm'
                      : 'glass-card text-white rounded-tl-sm'
                  }`}>
                    {msg.text}
                  </div>
                )}

                {/* Translation below message */}
                {translated && (
                  <div className={`mt-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/15 inline-block`}>
                    <p className="text-[11px] text-blue-300/80 leading-relaxed">
                      <Languages className="w-3 h-3 inline mr-1 -mt-0.5" />
                      {translated}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="px-4 py-3 glass-card border-t border-white/5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入消息..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/40 transition-colors"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-xl gradient-primary text-white flex-shrink-0 disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ========== FREE MIC MODE COMPONENT ==========
function FreeMicMode() {
  const { user, roomStatus, matchedCompanion, setRoomStatus } = useAppStore();

  const [micOn, setMicOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [waitingDots, setWaitingDots] = useState('');
  const [companions, setCompanions] = useState<Array<{
    id: string;
    nickname: string;
    avatar: string;
    isSpeaking: boolean;
    joinedAt: number;
  }>>([]);
  const [elapsed, setElapsed] = useState(0);

  // Waiting animation
  useEffect(() => {
    if (roomStatus !== 'waiting') return;
    const interval = setInterval(() => {
      setWaitingDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [roomStatus]);

  // Timer
  useEffect(() => {
    if (roomStatus !== 'active') return;
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [roomStatus]);

  // Simulate companions joining
  useEffect(() => {
    if (roomStatus !== 'waiting' || !matchedCompanion) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // First companion joins after 3s
    timers.push(setTimeout(() => {
      setCompanions([{
        id: matchedCompanion.id,
        nickname: matchedCompanion.nickname,
        avatar: matchedCompanion.avatar,
        isSpeaking: true,
        joinedAt: Date.now(),
      }]);
      setRoomStatus('active');
    }, 3000));

    // Second companion joins after 6s
    timers.push(setTimeout(() => {
      setCompanions(prev => [...prev, {
        id: 'comp2',
        nickname: '雷霆战神',
        avatar: '⚡',
        isSpeaking: true,
        joinedAt: Date.now(),
      }]);
    }, 6000));

    // Third companion joins after 10s
    timers.push(setTimeout(() => {
      setCompanions(prev => [...prev, {
        id: 'comp3',
        nickname: '樱花酱',
        avatar: '🌸',
        isSpeaking: false,
        joinedAt: Date.now(),
      }]);
    }, 10000));

    return () => timers.forEach(clearTimeout);
  }, [roomStatus, matchedCompanion, setRoomStatus]);

  // Simulate speaking status changes
  useEffect(() => {
    if (roomStatus !== 'active') return;
    const interval = setInterval(() => {
      setCompanions(prev => prev.map(c => ({
        ...c,
        isSpeaking: Math.random() > 0.4,
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, [roomStatus]);

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ========== WAITING STATE ==========
  if (roomStatus === 'waiting') {
    return (
      <div className="flex flex-col h-screen items-center justify-center px-6">
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 rounded-full border-2 border-pink-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-pink-500/20 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full glass-card flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
            </div>
          </div>
        </div>

        <h2 className="text-lg font-bold text-white mb-2">正在等待打手加入{waitingDots}</h2>
        <p className="text-sm text-muted-foreground text-center mb-2">自由麦模式 · 打手将直接开麦语音</p>
        <p className="text-xs text-muted-foreground text-center mb-6">匹配成功后将自动进入语音房间</p>

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

  // ========== ACTIVE FREE MIC STATE ==========
  const allParticipants = [
    {
      id: 'me',
      nickname: user?.nickname || '我',
      avatar: user?.avatar || '🎮',
      isSpeaking: micOn,
      isMe: true,
    },
    ...companions.map(c => ({ ...c, isMe: false })),
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 glass-card border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">自由麦开黑</h2>
              <span className="text-[10px] text-muted-foreground">{allParticipants.length}人</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-[10px] text-emerald-400">{formatElapsed(elapsed)}</span>
              <span className="text-[10px] text-muted-foreground ml-1">自由麦模式</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded-lg bg-pink-500/15 border border-pink-500/25 text-pink-400 text-[10px]">
              🎙️ 全程开麦
            </span>
          </div>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {allParticipants.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-2xl p-4 flex flex-col items-center transition-all ${
                p.isSpeaking
                  ? 'glass-card border border-purple-500/30'
                  : 'glass-card border border-white/5'
              } ${p.isMe ? 'ring-1 ring-purple-500/20' : ''}`}
            >
              {/* Speaking indicator ring */}
              {p.isSpeaking && (
                <div className="absolute inset-0 rounded-2xl border-2 border-purple-500/40 animate-pulse" />
              )}

              {/* Avatar */}
              <div className={`relative w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 ${
                p.isSpeaking ? 'gradient-primary' : 'bg-white/10'
              }`}>
                {p.avatar}
                {p.isSpeaking && (
                  <div className="absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/90">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-white rounded-full"
                        style={{
                          height: `${6 + Math.sin(i * 1.5) * 4}px`,
                          animation: `pulse 0.8s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
                {!p.isSpeaking && !p.isMe && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                    <Mic className="w-3 h-3 text-white/40" />
                  </div>
                )}
                {p.isMe && micOn && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Mic className="w-3 h-3 text-white" />
                  </div>
                )}
                {p.isMe && !micOn && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                    <Mic className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Name */}
              <p className="text-xs font-medium text-white text-center">{p.nickname}</p>
              {p.isMe && (
                <span className="text-[10px] text-purple-400 mt-0.5">我</span>
              )}
              {!p.isMe && 'rank' in p && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {(p as typeof companions[number] & { rank?: string }).rank || '陪玩'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="px-4 py-4 glass-card border-t border-white/5">
        <div className="flex items-center justify-center gap-6">
          {/* Speaker */}
          <button
            onClick={() => setSpeakerOn(!speakerOn)}
            className={`flex flex-col items-center gap-1`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              speakerOn ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-400'
            }`}>
              <Volume2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {speakerOn ? '关闭声音' : '开启声音'}
            </span>
          </button>

          {/* Mic */}
          <button
            onClick={() => setMicOn(!micOn)}
            className={`flex flex-col items-center gap-1`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              micOn ? 'gradient-primary text-white neon-glow' : 'bg-white/10 text-muted-foreground'
            }`}>
              <Mic className="w-6 h-6" />
            </div>
            <span className={`text-[10px] font-medium ${micOn ? 'text-purple-400' : 'text-muted-foreground'}`}>
              {micOn ? '闭麦' : '开麦'}
            </span>
          </button>

          {/* Hang up */}
          <button
            onClick={() => {
              setRoomStatus('idle');
              window.history.back();
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white">
              <X className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-red-400">挂断</span>
          </button>
        </div>
      </div>
    </div>
  );
}
