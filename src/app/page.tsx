'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Smartphone, Mail, ArrowRight, Gamepad2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = () => {
    if (mode === 'phone' && phone.length >= 11) {
      setCodeSent(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleLogin = () => {
    setUser({
      id: 'user_001',
      nickname: mode === 'phone' ? `玩家${phone.slice(-4)}` : `玩家${email.slice(0, 4)}`,
      avatar: '🎮',
      phone: mode === 'phone' ? phone : undefined,
      email: mode === 'email' ? email : undefined,
      gender: 'male',
      selectedGames: [],
      isOnline: true,
    });
    router.push('/select-games');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-purple-600/10 blur-3xl" />
      <div className="absolute bottom-40 right-10 w-40 h-40 rounded-full bg-blue-600/10 blur-3xl" />
      <div className="absolute top-1/3 right-20 w-24 h-24 rounded-full bg-pink-600/10 blur-3xl" />

      {/* Logo */}
      <div className="mb-12 text-center animate-slide-up">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center neon-glow">
          <Gamepad2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold gradient-text">PlayMate</h1>
        <p className="text-muted-foreground mt-2 text-sm">找到你的游戏搭档，一起开黑上分</p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {/* Tab Switch */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-6">
          <button
            onClick={() => setMode('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
              mode === 'phone'
                ? 'gradient-primary text-white shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            手机登录
          </button>
          <button
            onClick={() => setMode('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
              mode === 'email'
                ? 'gradient-primary text-white shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail className="w-4 h-4" />
            邮箱登录
          </button>
        </div>

        {/* Phone Login */}
        {mode === 'phone' && (
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-12"
                maxLength={11}
              />
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  maxLength={6}
                />
              </div>
              <Button
                onClick={handleSendCode}
                disabled={countdown > 0 || phone.length < 11}
                className="h-12 px-4 gradient-primary text-white rounded-xl min-w-[110px] disabled:opacity-50"
              >
                {countdown > 0 ? `${countdown}s` : codeSent ? '重新发送' : '获取验证码'}
              </Button>
            </div>
          </div>
        )}

        {/* Email Login */}
        {mode === 'email' && (
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="email"
                placeholder="请输入邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-12"
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            </div>
            <div className="relative">
              <Input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-12"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
        )}

        {/* Login Button */}
        <Button
          onClick={handleLogin}
          className="w-full h-12 mt-6 gradient-primary text-white rounded-xl text-base font-medium neon-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          登录 / 注册
          <ArrowRight className="w-4 h-4" />
        </Button>

        {/* Terms */}
        <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed">
          登录即表示同意
          <span className="text-purple-400 mx-1">《用户服务协议》</span>
          和
          <span className="text-purple-400 mx-1">《隐私政策》</span>
        </p>
      </div>
    </div>
  );
}
