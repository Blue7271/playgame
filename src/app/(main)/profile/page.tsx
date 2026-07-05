'use client';

import { useAppStore } from '@/lib/store';
import { GAMES } from '@/lib/games';
import { Button } from '@/components/ui/button';
import {
  Settings, ChevronRight, Star, Gamepad2,
  Headphones, CreditCard, HelpCircle, LogOut, Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAppStore();
  const router = useRouter();

  const userGames = user?.selectedGames
    ? GAMES.filter(g => user.selectedGames.includes(g.id))
    : [];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const menuItems = [
    { icon: CreditCard, label: '我的钱包', value: '¥256.00' },
    { icon: Star, label: '我的订单', value: '12单' },
    { icon: Headphones, label: '我的频道', value: '3个' },
    { icon: Shield, label: '账号安全', value: '' },
    { icon: HelpCircle, label: '帮助中心', value: '' },
    { icon: Settings, label: '设置', value: '' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Profile Header */}
      <div className="px-4 pt-8 pb-6">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-3xl neon-glow">
              {user?.avatar || '🎮'}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{user?.nickname || '玩家'}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                ID: {user?.id || '---'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                  VIP会员
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  在线
                </span>
              </div>
            </div>
            <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground">
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-white/5">
            <div className="text-center">
              <div className="text-lg font-bold text-white">12</div>
              <div className="text-[10px] text-muted-foreground">总订单</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">5</div>
              <div className="text-[10px] text-muted-foreground">常玩陪玩</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">4.8</div>
              <div className="text-[10px] text-muted-foreground">平均评分</div>
            </div>
          </div>
        </div>
      </div>

      {/* My Games */}
      <div className="px-4 mb-4">
        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-purple-400" />
          我的游戏
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {userGames.map(game => (
            <div key={game.id} className="glass-card rounded-xl px-3 py-2 flex items-center gap-2 flex-shrink-0">
              <span className="text-lg">{game.icon}</span>
              <div>
                <div className="text-xs text-white font-medium">{game.name}</div>
                <div className="text-[10px] text-muted-foreground">{(game.onlineCount / 1000).toFixed(1)}k在线</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 flex-1">
        <div className="glass-card rounded-2xl overflow-hidden">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-all ${
                  i < menuItems.length - 1 ? 'border-b border-white/5' : ''
                }`}
              >
                <Icon className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white flex-1 text-left">{item.label}</span>
                {item.value && (
                  <span className="text-xs text-muted-foreground">{item.value}</span>
                )}
                <ChevronRight className="w-4 h-4 text-white/20" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          className="w-full h-11 mt-6 bg-red-500/10 text-red-400 rounded-xl text-sm hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </Button>
      </div>
    </div>
  );
}
