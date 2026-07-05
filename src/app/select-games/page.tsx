'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { GAMES, GAME_CATEGORIES } from '@/lib/games';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

const MAX_GAMES = 6;

export default function SelectGamesPage() {
  const router = useRouter();
  const { setSelectedGames, user } = useAppStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('全部');

  const filteredGames = activeCategory === '全部'
    ? GAMES
    : GAMES.filter(g => g.category === activeCategory);

  const toggleGame = (gameId: string) => {
    setSelected(prev => {
      if (prev.includes(gameId)) {
        return prev.filter(id => id !== gameId);
      }
      if (prev.length >= MAX_GAMES) return prev;
      return [...prev, gameId];
    });
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    setSelectedGames(selected);
    router.push('/dispatch');
  };

  return (
    <div className="min-h-screen flex flex-col px-4 pt-8 pb-32">
      {/* Header */}
      <div className="text-center mb-8 animate-slide-up">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center neon-glow">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">选择你喜欢的游戏</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          最多选择 {MAX_GAMES} 个游戏，已选 <span className="text-purple-400 font-bold">{selected.length}</span>/{MAX_GAMES}
        </p>
        {user && (
          <p className="text-muted-foreground text-xs mt-1">
            欢迎你，{user.nickname}
          </p>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {GAME_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'gradient-primary text-white shadow-lg'
                : 'bg-white/5 text-muted-foreground hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Game Grid */}
      <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {filteredGames.map(game => {
          const isSelected = selected.includes(game.id);
          const isDisabled = !isSelected && selected.length >= MAX_GAMES;
          return (
            <button
              key={game.id}
              onClick={() => !isDisabled && toggleGame(game.id)}
              disabled={isDisabled}
              className={`relative flex flex-col items-center p-4 rounded-2xl transition-all ${
                isSelected
                  ? 'glass-card border-purple-500/50 neon-glow'
                  : isDisabled
                  ? 'bg-white/3 opacity-40 cursor-not-allowed'
                  : 'glass-card hover:bg-white/10'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-3xl mb-2">{game.icon}</span>
              <span className="text-xs text-white font-medium text-center leading-tight">{game.name}</span>
              <span className="text-[10px] text-muted-foreground mt-1">
                {(game.onlineCount / 1000).toFixed(1)}k 在线
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] p-4 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F] to-transparent">
        <Button
          onClick={handleConfirm}
          disabled={selected.length === 0}
          className="w-full h-12 gradient-primary text-white rounded-xl text-base font-medium neon-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
        >
          确认选择 ({selected.length})
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
