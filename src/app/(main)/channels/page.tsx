'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Send, Languages, Plus, X, ChevronDown,
  UserPlus, MoreHorizontal, Loader2, Mic, MicOff,
  Volume2, VolumeX
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
  voiceDuration?: number;
}

interface RoomMember {
  id: string;
  nickname: string;
  avatar: string;
  isOnline: boolean;
  isSpeaking: boolean;
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

const MOCK_COMPANIONS = [
  { id: 'comp1', nickname: '小鹿', avatar: '🦌', rank: '黄金', price: 30 },
  { id: 'comp2', nickname: '雷霆战神', avatar: '⚡', rank: '钻石', price: 50 },
  { id: 'comp3', nickname: '樱花酱', avatar: '🌸', rank: '铂金', price: 35 },
];

const VOICE_MESSAGES = [
  { text: '老板好，我是你的陪玩，马上上线', duration: 3 },
  { text: '你好呀，我来了！这局我打什么位置？', duration: 4 },
  { text: '我玩射手，你辅助我', duration: 2 },
  { text: '好的，我选蔡文姬跟你，放心交给我', duration: 4 },
  { text: '开团开团！', duration: 2 },
  { text: 'GG！刚才那波团战太精彩了', duration: 3 },
];

export default function ChannelsPage() {
  const { user, roomStatus, matchedCompanion, setRoomStatus } = useAppStore();
  const idCounterRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Room state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [targetLang, setTargetLang] = useState('en');

  // Mic & speaker controls
  const [micOn, setMicOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  // Members in room
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Companion join simulation
  const joinedRef = useRef(false);
  const msgIndexRef = useRef(0);

  const genId = useCallback(() => {
    idCounterRef.current += 1;
    return `msg-${Date.now()}-${idCounterRef.current}`;
  }, []);

  // Reset join state when roomStatus changes to waiting (new session)
  useEffect(() => {
    if (roomStatus === 'waiting') {
      joinedRef.current = false;
      msgIndexRef.current = 0;
      setMessages([]);
      setMembers([]);
    }
  }, [roomStatus]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect system language
  useEffect(() => {
    try {
      const browserLang = navigator.language?.slice(0, 2) || 'zh';
      const match = TRANSLATION_LANGUAGES.find(l => l.code === browserLang);
      if (match && match.code !== 'zh') setTargetLang(match.code);
    } catch {
      // ignore
    }
  }, []);

  // Initialize room when companion is matched
  useEffect(() => {
    if (roomStatus === 'waiting' && matchedCompanion && !joinedRef.current) {
      joinedRef.current = true;

      // Set initial members (player + matched companion)
      const initialMembers: RoomMember[] = [
        {
          id: 'player',
          nickname: user?.nickname || '我',
          avatar: user?.avatar || '🎮',
          isOnline: true,
          isSpeaking: false,
          role: 'owner',
        },
        {
          id: matchedCompanion.id,
          nickname: matchedCompanion.nickname,
          avatar: matchedCompanion.avatar,
          isOnline: true,
          isSpeaking: false,
          role: 'companion',
        },
      ];
      setMembers(initialMembers);

      // Simulate companions joining one by one
      const otherCompanions = MOCK_COMPANIONS.filter(c => c.id !== matchedCompanion.id);

      // First companion speaks after 3s
      const t1 = setTimeout(() => {
        const firstMsg = VOICE_MESSAGES[0];
        setSpeakingId(matchedCompanion.id);
        setMembers(prev => prev.map(m =>
          m.id === matchedCompanion.id ? { ...m, isSpeaking: true } : m
        ));
        setMessages(prev => [...prev, {
          id: genId(),
          sender: matchedCompanion.nickname,
          avatar: matchedCompanion.avatar,
          text: firstMsg.text,
          originalLang: 'zh',
          translatedText: getTranslation(firstMsg.text, targetLang),
          timestamp: Date.now(),
          isMe: false,
          isVoice: true,
          voiceDuration: firstMsg.duration,
        }]);
      }, 3000);

      // Stop speaking after first message
      const t1s = setTimeout(() => {
        setSpeakingId(null);
        setMembers(prev => prev.map(m => ({ ...m, isSpeaking: false })));
      }, 5500);

      // Second companion joins after 6s
      const t2 = setTimeout(() => {
        if (otherCompanions.length > 0) {
          const c2 = otherCompanions[0];
          setMembers(prev => [...prev, {
            id: c2.id,
            nickname: c2.nickname,
            avatar: c2.avatar,
            isOnline: true,
            isSpeaking: false,
            role: 'companion',
          }]);
          setMessages(prev => [...prev, {
            id: genId(),
            sender: '系统',
            avatar: '🔔',
            text: `${c2.nickname} 加入了房间`,
            originalLang: 'zh',
            timestamp: Date.now(),
            isMe: false,
          }]);
        }
      }, 6000);

      // Second companion speaks after 7.5s
      const t3 = setTimeout(() => {
        if (otherCompanions.length > 0) {
          const c2 = otherCompanions[0];
          const msg = VOICE_MESSAGES[1];
          setSpeakingId(c2.id);
          setMembers(prev => prev.map(m =>
            m.id === c2.id ? { ...m, isSpeaking: true } : m
          ));
          setMessages(prev => [...prev, {
            id: genId(),
            sender: c2.nickname,
            avatar: c2.avatar,
            text: msg.text,
            originalLang: 'zh',
            translatedText: getTranslation(msg.text, targetLang),
            timestamp: Date.now(),
            isMe: false,
            isVoice: true,
            voiceDuration: msg.duration,
          }]);
        }
      }, 7500);

      // Stop second speaking
      const t3s = setTimeout(() => {
        setSpeakingId(null);
        setMembers(prev => prev.map(m => ({ ...m, isSpeaking: false })));
      }, 10000);

      // Third companion joins after 10s
      const t4 = setTimeout(() => {
        if (otherCompanions.length > 1) {
          const c3 = otherCompanions[1];
          setMembers(prev => [...prev, {
            id: c3.id,
            nickname: c3.nickname,
            avatar: c3.avatar,
            isOnline: true,
            isSpeaking: false,
            role: 'companion',
          }]);
          setMessages(prev => [...prev, {
            id: genId(),
            sender: '系统',
            avatar: '🔔',
            text: `${c3.nickname} 加入了房间`,
            originalLang: 'zh',
            timestamp: Date.now(),
            isMe: false,
          }]);
        }
        setRoomStatus('active');
      }, 10000);

      // Third companion speaks after 12s
      const t5 = setTimeout(() => {
        if (otherCompanions.length > 1) {
          const c3 = otherCompanions[1];
          const msg = VOICE_MESSAGES[2];
          setSpeakingId(c3.id);
          setMembers(prev => prev.map(m =>
            m.id === c3.id ? { ...m, isSpeaking: true } : m
          ));
          setMessages(prev => [...prev, {
            id: genId(),
            sender: c3.nickname,
            avatar: c3.avatar,
            text: msg.text,
            originalLang: 'zh',
            translatedText: getTranslation(msg.text, targetLang),
            timestamp: Date.now(),
            isMe: false,
            isVoice: true,
            voiceDuration: msg.duration,
          }]);
        }
      }, 12000);

      const t5s = setTimeout(() => {
        setSpeakingId(null);
        setMembers(prev => prev.map(m => ({ ...m, isSpeaking: false })));
      }, 14500);

      return () => {
        clearTimeout(t1); clearTimeout(t1s); clearTimeout(t2);
        clearTimeout(t3); clearTimeout(t3s); clearTimeout(t4);
        clearTimeout(t5); clearTimeout(t5s);
      };
    }
  }, [roomStatus, matchedCompanion, user, genId, setRoomStatus, targetLang]);

  // Update translations when targetLang changes
  useEffect(() => {
    if (targetLang === 'zh') {
      setMessages(prev => prev.map(m => ({ ...m, translatedText: undefined })));
    } else {
      setMessages(prev => prev.map(m =>
        m.isVoice ? { ...m, translatedText: getTranslation(m.text, targetLang) } : m
      ));
    }
  }, [targetLang]);

  // Send text message
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setMessages(prev => [...prev, {
      id: genId(),
      sender: user?.nickname || '我',
      avatar: user?.avatar || '🎮',
      text,
      originalLang: 'zh',
      timestamp: Date.now(),
      isMe: true,
    }]);
    setInputText('');
  }, [inputText, user, genId]);

  // Simulate companion reply
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last.isMe) return;

    const timer = setTimeout(() => {
      msgIndexRef.current = (msgIndexRef.current + 1) % VOICE_MESSAGES.length;
      const reply = VOICE_MESSAGES[msgIndexRef.current];
      const companion = matchedCompanion || MOCK_COMPANIONS[0];
      setSpeakingId(companion.id);
      setMembers(prev => prev.map(m =>
        m.id === companion.id ? { ...m, isSpeaking: true } : m
      ));
      setMessages(prev => [...prev, {
        id: genId(),
        sender: companion.nickname,
        avatar: companion.avatar,
        text: reply.text,
        originalLang: 'zh',
        translatedText: getTranslation(reply.text, targetLang),
        timestamp: Date.now(),
        isMe: false,
        isVoice: true,
        voiceDuration: reply.duration,
      }]);
      setTimeout(() => {
        setSpeakingId(null);
        setMembers(prev => prev.map(m => ({ ...m, isSpeaking: false })));
      }, 2500);
    }, 1500);
    return () => clearTimeout(timer);
  }, [messages, matchedCompanion, genId, targetLang]);

  const currentLang = TRANSLATION_LANGUAGES.find(l => l.code === targetLang);
  const roomTitle = matchedCompanion
    ? `${matchedCompanion.nickname} 的房间`
    : '开黑房间';

  // ========== EMPTY STATE (no order) ==========
  if (!matchedCompanion && roomStatus === 'idle') {
    return (
      <div className="flex flex-col h-screen items-center justify-center px-6">
        <div className="w-20 h-20 rounded-2xl glass-card flex items-center justify-center mb-6">
          <Mic className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">开黑频道</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          下单后会自动进入房间
        </p>
        <div className="glass-card rounded-2xl p-4 w-full max-w-xs">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            在「派单」页面选择游戏和陪玩，匹配成功后将自动进入语音房间，与打手实时沟通
          </p>
        </div>
      </div>
    );
  }

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

        <h2 className="text-lg font-bold text-white mb-2">正在等待打手加入...</h2>
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
          </div>
        )}
      </div>
    );
  }

  // ========== ACTIVE ROOM (unified: text + voice) ==========
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
          </div>
        </div>

        {/* Language picker dropdown */}
        {showLangPicker && (
          <div className="absolute top-full right-4 mt-2 glass-card rounded-xl p-2 z-50 min-w-[160px] shadow-xl">
            <p className="text-[10px] text-muted-foreground px-2 py-1 mb-1">翻译为</p>
            {TRANSLATION_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => { setTargetLang(lang.code); setShowLangPicker(false); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2 ${
                  targetLang === lang.code
                    ? 'gradient-primary text-white'
                    : 'text-foreground hover:bg-white/5'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Participants bar */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {members.map(member => (
            <div key={member.id} className="flex flex-col items-center flex-shrink-0">
              <div className="relative">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg ${
                  member.role === 'owner' ? 'gradient-primary' : 'bg-white/10'
                } ${member.isSpeaking ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-[#0A0A0F]' : ''}`}>
                  {member.avatar}
                </div>
                {/* Speaking indicator */}
                {member.isSpeaking && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                    <div className="w-0.5 h-2 bg-purple-400 rounded-full animate-pulse" />
                    <div className="w-0.5 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                    <div className="w-0.5 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                )}
                {/* Mic status for player */}
                {member.role === 'owner' && !micOn && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <MicOff className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                {member.role === 'owner' && micOn && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Mic className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                {/* Online dot */}
                <div className={`absolute top-0 right-0 w-3 h-3 rounded-full border-2 border-[#0A0A0F] ${
                  member.isOnline ? 'bg-emerald-400' : 'bg-gray-500'
                }`} />
              </div>
              <span className="text-[10px] text-muted-foreground mt-1.5 max-w-[48px] truncate">
                {member.nickname}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl glass-card mx-auto mb-3 flex items-center justify-center">
              <Mic className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-sm text-muted-foreground">房间已就绪，等待打手开麦...</p>
            <p className="text-xs text-muted-foreground/60 mt-1">你也可以打字或开麦交流</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base ${
              msg.sender === '系统' ? 'bg-white/10' : msg.isMe ? 'gradient-primary' : 'bg-white/10'
            }`}>
              {msg.avatar}
            </div>
            <div className={`flex-1 max-w-[75%] ${msg.isMe ? 'text-right' : ''}`}>
              <div className={`flex items-center gap-1.5 mb-0.5 ${msg.isMe ? 'justify-end' : ''}`}>
                <span className="text-[11px] font-medium text-muted-foreground">{msg.sender}</span>
                <span className="text-[10px] text-muted-foreground/50">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Voice message bubble */}
              {msg.isVoice ? (
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl ${
                  msg.isMe ? 'gradient-primary text-white' : 'glass-card text-foreground'
                }`}>
                  <div className="flex items-center gap-0.5">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-0.5 rounded-full ${msg.isMe ? 'bg-white/70' : 'bg-purple-400'}`}
                        style={{
                          height: `${8 + Math.random() * 10}px`,
                          animation: speakingId === msg.sender ? 'pulse 0.8s ease-in-out infinite' : 'none',
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs opacity-70">{msg.voiceDuration}&quot;</span>
                </div>
              ) : (
                <div className={`inline-block px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === '系统'
                    ? 'bg-blue-500/10 text-blue-400 text-xs'
                    : msg.isMe
                    ? 'gradient-primary text-white'
                    : 'glass-card text-foreground'
                }`}>
                  {msg.text}
                </div>
              )}

              {/* Translation below voice messages */}
              {msg.isVoice && msg.translatedText && (
                <div className={`mt-1 text-xs text-blue-400/80 italic ${msg.isMe ? 'text-right' : ''}`}>
                  {currentLang?.flag} {msg.translatedText}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom input bar with mic controls */}
      <div className="px-4 pb-6 pt-2 glass-card border-t border-white/5">
        <div className="flex items-center gap-2">
          {/* Speaker toggle */}
          <button
            onClick={() => setSpeakerOn(!speakerOn)}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              speakerOn ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-400'
            }`}
          >
            {speakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Text input */}
          <div className="flex-1 flex items-center gap-2 glass-card rounded-full px-4 py-2.5">
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="输入消息..."
              className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-muted-foreground"
            />
            {inputText.trim() && (
              <button onClick={handleSend} className="text-purple-400 hover:text-purple-300 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mic toggle */}
          <button
            onClick={() => setMicOn(!micOn)}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              micOn
                ? 'gradient-primary text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-muted-foreground'
            }`}
          >
            {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
