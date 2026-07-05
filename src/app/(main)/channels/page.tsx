'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Send, Languages, Plus, X, ChevronDown,
  UserPlus, Volume2, MoreHorizontal
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
    '大家好，一起开黑吗？': 'Hey everyone, wanna play together?',
    '好的，我玩射手': 'OK, I\'ll play marksman',
    '我选蔡文姬跟你，放心交给我': 'I\'ll pick Cai Wenji to support you, leave it to me!',
    'GG！刚才那波团战太精彩了': 'GG! That team fight was amazing!',
    '等等我，马上到': 'Wait for me, I\'ll be right there',
    '开团开团！': 'Let\'s team fight! Let\'s go!',
    'Hello everyone! Ready to start?': 'Hello everyone! Ready to start?',
    'I\'ll play support, don\'t worry': 'I\'ll play support, don\'t worry',
  },
  'ja': {
    '大家好，一起开黑吗？': 'みんな、一緒にプレイしない？',
    '好的，我玩射手': 'わかった、私はマークスマンやるよ',
    '我选蔡文姬跟你，放心交给我': '蔡文姫ピックしてサポートするよ、任せて！',
    'GG！刚才那波团战太精彩了': 'GG！さっきのチームファイト最高だった！',
  },
  'ko': {
    '大家好，一起开黑吗？': '다 같이 게임할까?',
    '好的，我玩射手': '좋아, 내가 원딜 할게',
    '我选蔡文姬跟你，放心交给我': '채문기 픽해서 서포트할게, 나한테 맡겨!',
  },
};

function getTranslation(text: string, targetLang: string): string | undefined {
  if (targetLang === 'zh') return undefined;
  const langMap = MOCK_TRANSLATIONS[targetLang];
  if (langMap && langMap[text]) return langMap[text];
  return `[${TRANSLATION_LANGUAGES.find(l => l.code === targetLang)?.flag || ''}] ${text}`;
}

export default function ChannelsPage() {
  const { user } = useAppStore();
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

  // Group members
  const [members, setMembers] = useState<Member[]>([
    { id: 'me', nickname: user?.nickname || '我', avatar: user?.avatar || '🎮', isOnline: true, role: 'owner' },
    { id: 'c1', nickname: '甜心小鹿', avatar: '🦌', isOnline: true, role: 'companion' },
    { id: 'c2', nickname: '暗夜猎手', avatar: '🐺', isOnline: true, role: 'member' },
    { id: 'c3', nickname: '星辰大海', avatar: '🌟', isOnline: true, role: 'member' },
    { id: 'c4', nickname: 'Moonlight', avatar: '🌙', isOnline: false, role: 'member' },
  ]);

  // Available players to invite
  const availableToInvite = [
    { id: 'inv1', nickname: '雷霆战神', avatar: '⚡' },
    { id: 'inv2', nickname: '樱花酱', avatar: '🌸' },
    { id: 'inv3', nickname: '孤狼', avatar: '🦊' },
    { id: 'inv4', nickname: '风暴骑士', avatar: '🛡️' },
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: '1', sender: '甜心小鹿', avatar: '🦌',
      text: '大家好，一起开黑吗？', originalLang: 'zh',
      timestamp: 1720000000000, isMe: false,
    },
    {
      id: '2', sender: '暗夜猎手', avatar: '🐺',
      text: 'Hello everyone! Ready to start?', originalLang: 'en',
      timestamp: 1720000030000, isMe: false,
    },
    {
      id: '3', sender: user?.nickname || '我', avatar: user?.avatar || '🎮',
      text: '好的，我玩射手', originalLang: 'zh',
      timestamp: 1720000060000, isMe: true,
    },
    {
      id: '4', sender: '甜心小鹿', avatar: '🦌',
      text: '我选蔡文姬跟你，放心交给我', originalLang: 'zh',
      timestamp: 1720000090000, isMe: false,
    },
    {
      id: '5', sender: '星辰大海', avatar: '🌟',
      text: 'GG！刚才那波团战太精彩了', originalLang: 'zh',
      timestamp: 1720000120000, isMe: false,
    },
    {
      id: '6', sender: '暗夜猎手', avatar: '🐺',
      text: 'I\'ll play support, don\'t worry', originalLang: 'en',
      timestamp: 1720000150000, isMe: false,
    },
  ]);

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
    // Add system message
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

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 glass-card border-b border-white/5 relative z-30">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white truncate">王者荣耀开黑群</h2>
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
              <Volume2 className="w-4 h-4" />
            </button>

            {/* More */}
            <button
              onClick={() => { setShowInvite(!showInvite); setShowMembers(false); }}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-white/10"
            >
              <MoreHorizontal className="w-4 h-4" />
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
