'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Bot, X, Send, Sparkles, ChevronRight } from 'lucide-react';

interface AIMessage {
  id: string;
  type: 'bot' | 'user';
  text: string;
  options?: { label: string; action: string }[];
}

const AI_FLOW: Record<string, AIMessage> = {
  start: {
    id: 'start',
    type: 'bot',
    text: '你好！我是 PlayMate 智能助手，24小时为你服务。请问需要什么帮助？',
    options: [
      { label: '🎮 我想找陪玩', action: 'find_player' },
      { label: '🎧 我想开黑', action: 'join_channel' },
      { label: '💰 怎么充值', action: 'recharge' },
      { label: '❓ 其他问题', action: 'other' },
    ],
  },
  find_player: {
    id: 'find_player',
    type: 'bot',
    text: '找陪玩很简单！你想怎么选择？',
    options: [
      { label: '🔍 自己筛选', action: 'manual_dispatch' },
      { label: '⚡ 一键自动派单', action: 'auto_dispatch' },
      { label: '← 返回上一步', action: 'start' },
    ],
  },
  manual_dispatch: {
    id: 'manual_dispatch',
    type: 'bot',
    text: '手动筛选步骤：\n1. 在派单大厅点击筛选按钮\n2. 选择游戏、性别、价格等条件\n3. 浏览陪玩师列表\n4. 点击心仪的陪玩师查看详情\n5. 点击"立即下单"',
    options: [
      { label: '👉 带我去派单大厅', action: 'go_dispatch' },
      { label: '← 返回上一步', action: 'find_player' },
    ],
  },
  auto_dispatch: {
    id: 'auto_dispatch',
    type: 'bot',
    text: '一键自动派单超方便！\n\n系统会根据你的偏好，自动匹配最合适的陪玩师。只需：\n1. 点击"一键自动派单"按钮\n2. 等待系统匹配（约2-3秒）\n3. 确认匹配结果即可开始',
    options: [
      { label: '⚡ 去试试自动派单', action: 'go_dispatch' },
      { label: '← 返回上一步', action: 'find_player' },
    ],
  },
  go_dispatch: {
    id: 'go_dispatch',
    type: 'bot',
    text: '好的，正在为你跳转到派单大厅！',
    options: [
      { label: '🏠 回到首页', action: 'start' },
    ],
  },
  join_channel: {
    id: 'join_channel',
    type: 'bot',
    text: '开黑频道支持实时语音和自动翻译！',
    options: [
      { label: '📋 浏览频道列表', action: 'go_channels' },
      { label: '🌐 翻译功能怎么用', action: 'translation_help' },
      { label: '← 返回上一步', action: 'start' },
    ],
  },
  go_channels: {
    id: 'go_channels',
    type: 'bot',
    text: '正在跳转到开黑频道页面！\n\n在频道中你可以：\n- 实时语音交流\n- 发送文字消息\n- 使用翻译功能\n- 邀请好友组队',
    options: [
      { label: '🏠 回到首页', action: 'start' },
    ],
  },
  translation_help: {
    id: 'translation_help',
    type: 'bot',
    text: '翻译功能使用说明：\n\n1. 频道右上角点击翻译图标可开关翻译\n2. 开启后，外语消息会自动翻译成中文\n3. 你发送的中文也会自动翻译成对方语言\n4. 支持中/英/日/韩等多种语言',
    options: [
      { label: '📋 浏览频道列表', action: 'go_channels' },
      { label: '← 返回上一步', action: 'join_channel' },
    ],
  },
  recharge: {
    id: 'recharge',
    type: 'bot',
    text: '充值方式：\n\n1. 进入"我的"页面\n2. 点击"我的钱包"\n3. 选择充值金额\n4. 完成支付\n\n支持微信支付、支付宝等多种支付方式。',
    options: [
      { label: '💰 去充值', action: 'go_profile' },
      { label: '← 返回上一步', action: 'start' },
    ],
  },
  go_profile: {
    id: 'go_profile',
    type: 'bot',
    text: '正在跳转到个人中心！',
    options: [
      { label: '🏠 回到首页', action: 'start' },
    ],
  },
  other: {
    id: 'other',
    type: 'bot',
    text: '你可以问我以下问题：',
    options: [
      { label: '🔒 如何修改密码', action: 'change_password' },
      { label: '📱 如何更换手机号', action: 'change_phone' },
      { label: '💬 如何联系客服', action: 'contact_service' },
      { label: '← 返回上一步', action: 'start' },
    ],
  },
  change_password: {
    id: 'change_password',
    type: 'bot',
    text: '修改密码步骤：\n1. 进入"我的" → "设置"\n2. 点击"账号安全"\n3. 选择"修改密码"\n4. 输入新密码并确认',
    options: [
      { label: '← 返回上一步', action: 'other' },
      { label: '🏠 回到首页', action: 'start' },
    ],
  },
  change_phone: {
    id: 'change_phone',
    type: 'bot',
    text: '更换手机号：\n1. 进入"我的" → "设置"\n2. 点击"账号安全"\n3. 选择"更换手机号"\n4. 验证原手机号后绑定新号码',
    options: [
      { label: '← 返回上一步', action: 'other' },
      { label: '🏠 回到首页', action: 'start' },
    ],
  },
  contact_service: {
    id: 'contact_service',
    type: 'bot',
    text: '联系客服方式：\n\n- 在线客服：就是我啦！24小时在线\n- 客服电话：400-888-0000\n- 工作时间：全天24小时\n- 邮箱：support@playmate.com',
    options: [
      { label: '← 返回上一步', action: 'other' },
      { label: '🏠 回到首页', action: 'start' },
    ],
  },
};

export default function AIAssistant() {
  const { isAIAssistantOpen, toggleAIAssistant } = useAppStore();
  const [messages, setMessages] = useState<AIMessage[]>([AI_FLOW.start]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleOptionClick = (action: string) => {
    const optionData = AI_FLOW[action];
    if (!optionData) return;

    // Add user message
    const userMsg: AIMessage = {
      id: String(Date.now()),
      type: 'user',
      text: optionData.options?.find(o => o.action === action)?.label || action,
    };

    setIsTyping(true);
    setMessages(prev => [...prev, userMsg]);

    // Simulate bot typing delay
    setTimeout(() => {
      setMessages(prev => [...prev, optionData]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      {!isAIAssistantOpen && (
        <button
          onClick={toggleAIAssistant}
          className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full gradient-primary flex items-center justify-center neon-glow pulse-glow shadow-2xl transition-transform hover:scale-110"
        >
          <Bot className="w-7 h-7 text-white" />
        </button>
      )}

      {/* AI Panel */}
      {isAIAssistantOpen && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 flex flex-col animate-slide-up" style={{ maxHeight: '85vh' }}>
          {/* Header */}
          <div className="glass-card border-b border-white/5 rounded-t-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white">AI 智能助手</h3>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                24小时在线
              </p>
            </div>
            <button
              onClick={toggleAIAssistant}
              className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#0A0A0F]/95" style={{ maxHeight: '50vh' }}>
            {messages.map(msg => (
              <div key={msg.id} className={`animate-slide-up ${msg.type === 'user' ? 'flex justify-end' : ''}`}>
                {msg.type === 'bot' ? (
                  <div className="max-w-[85%]">
                    <div className="glass-card rounded-2xl rounded-bl-md px-3 py-2.5">
                      <p className="text-xs text-white whitespace-pre-line leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.options && (
                      <div className="mt-2 space-y-1.5">
                        {msg.options.map(opt => (
                          <button
                            key={opt.action}
                            onClick={() => handleOptionClick(opt.action)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 hover:bg-purple-500/20 transition-all text-left"
                          >
                            <span className="flex-1">{opt.label}</span>
                            <ChevronRight className="w-3 h-3 text-purple-400/50" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[75%] px-3 py-2 rounded-2xl rounded-br-md gradient-primary">
                    <p className="text-xs text-white">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 animate-slide-up">
                <div className="glass-card rounded-2xl rounded-bl-md px-3 py-2.5">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="glass-card border-t border-white/5 px-4 py-3 rounded-b-none">
            <div className="flex items-center gap-2">
              <input
                placeholder="输入你的问题..."
                className="flex-1 h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const text = (e.target as HTMLInputElement).value;
                    if (text.trim()) {
                      setMessages(prev => [...prev, { id: String(Date.now()), type: 'user', text }]);
                      (e.target as HTMLInputElement).value = '';
                      setIsTyping(true);
                      setTimeout(() => {
                        setMessages(prev => [...prev, {
                          id: String(Date.now() + 1),
                          type: 'bot',
                          text: '我正在理解你的问题，请点击上方选项按钮获取更精准的帮助哦！',
                          options: [
                            { label: '🏠 回到首页', action: 'start' },
                            { label: '🎮 找陪玩', action: 'find_player' },
                            { label: '🎧 开黑频道', action: 'join_channel' },
                          ],
                        }]);
                        setIsTyping(false);
                      }, 800);
                    }
                  }
                }}
              />
              <Button className="h-9 w-9 p-0 gradient-primary text-white rounded-xl flex-shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
