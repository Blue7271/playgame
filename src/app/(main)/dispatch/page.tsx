'use client';

import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { GAMES, RANKS, VOICE_TAGS } from '@/lib/games';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Search, SlidersHorizontal, Zap, Star, Volume2, Mic
} from 'lucide-react';

export default function DispatchPage() {
  const { user, players, dispatchGameId, dispatchGender, dispatchPriceRange, dispatchNote, setDispatchFilters } = useAppStore();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isAutoMatching, setIsAutoMatching] = useState(false);

  const userGames = useMemo(() => {
    if (!user?.selectedGames) return [];
    return GAMES.filter(g => user.selectedGames.includes(g.id));
  }, [user]);

  const filteredPlayers = useMemo(() => {
    let result = players;
    if (dispatchGameId) {
      result = result.filter(p => p.gameId === dispatchGameId);
    }
    if (dispatchGender) {
      result = result.filter(p => p.gender === dispatchGender);
    }
    result = result.filter(p => p.price >= dispatchPriceRange[0] && p.price <= dispatchPriceRange[1]);
    if (searchQuery) {
      result = result.filter(p =>
        p.nickname.includes(searchQuery) ||
        p.tags.some(t => t.includes(searchQuery))
      );
    }
    return result;
  }, [players, dispatchGameId, dispatchGender, dispatchPriceRange, searchQuery]);

  const handleAutoMatch = () => {
    setIsAutoMatching(true);
    setTimeout(() => {
      setIsAutoMatching(false);
      const onlinePlayers = players.filter(p => p.isOnline);
      if (onlinePlayers.length > 0) {
        const randomPlayer = onlinePlayers[Math.floor(Math.random() * onlinePlayers.length)];
        setSelectedPlayer(randomPlayer.id);
      }
    }, 2500);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">派单大厅</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {players.filter(p => p.isOnline).length} 位陪玩在线
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              showFilters ? 'gradient-primary text-white' : 'glass-card text-muted-foreground'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="搜索陪玩师或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 pl-10 rounded-xl"
          />
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="px-4 pb-4 animate-slide-up">
          <div className="glass-card rounded-2xl p-4 space-y-5">
            {/* Game Selection */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">选择游戏</label>
              <div className="flex flex-wrap gap-2">
                {userGames.map(game => (
                  <button
                    key={game.id}
                    onClick={() => setDispatchFilters({ gameId: dispatchGameId === game.id ? '' : game.id })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      dispatchGameId === game.id
                        ? 'gradient-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    {game.icon} {game.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">性别偏好</label>
              <div className="flex gap-2">
                {(['male', 'female'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setDispatchFilters({ gender: dispatchGender === g ? undefined : g })}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      dispatchGender === g
                        ? 'gradient-primary text-white'
                        : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    {g === 'male' ? '♂ 男' : '♀ 女'}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">
                价格区间: ¥{dispatchPriceRange[0]} - ¥{dispatchPriceRange[1]}/局
              </label>
              <Slider
                value={dispatchPriceRange}
                onValueChange={(val: number[]) => setDispatchFilters({ priceRange: [val[0], val[1]] })}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>

            {/* Rank */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">段位要求</label>
              <div className="flex flex-wrap gap-2">
                {RANKS.map(rank => (
                  <button
                    key={rank}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-muted-foreground hover:bg-white/10 transition-all"
                  >
                    {rank}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Tag */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">声音偏好</label>
              <div className="flex flex-wrap gap-2">
                {VOICE_TAGS.map(tag => (
                  <button
                    key={tag}
                    className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-muted-foreground hover:bg-white/10 transition-all"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">备注</label>
              <Input
                placeholder="对陪玩师的要求或备注..."
                value={dispatchNote}
                onChange={(e) => setDispatchFilters({ note: e.target.value })}
                className="h-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Auto Match Button */}
      <div className="px-4 pb-4">
        <Button
          onClick={handleAutoMatch}
          disabled={isAutoMatching}
          className="w-full h-12 gradient-pink text-white rounded-xl text-sm font-bold neon-glow hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isAutoMatching ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              正在智能匹配中...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              一键自动派单
            </>
          )}
        </Button>
      </div>

      {/* Player List */}
      <div className="px-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-white">
            推荐陪玩 <span className="text-muted-foreground text-xs">({filteredPlayers.length})</span>
          </h2>
        </div>

        <div className="space-y-3 pb-4">
          {filteredPlayers.map(player => {
            const game = GAMES.find(g => g.id === player.gameId);
            const isSelected = selectedPlayer === player.id;
            return (
              <div
                key={player.id}
                onClick={() => setSelectedPlayer(isSelected ? null : player.id)}
                className={`glass-card rounded-2xl p-4 transition-all cursor-pointer ${
                  isSelected ? 'border-purple-500/50 neon-glow' : 'hover:bg-white/8'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-2xl">
                      {player.avatar}
                    </div>
                    {player.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0A0A0F] pulse-glow" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{player.nickname}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        player.gender === 'female' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {player.gender === 'female' ? '♀' : '♂'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                        {player.voiceTag}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] text-muted-foreground">{game?.icon} {game?.name}</span>
                      <span className="text-[10px] text-yellow-400">⭐ {player.rank}</span>
                    </div>

                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                      {player.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price & Rating */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold text-white">
                      ¥<span className="text-purple-400">{player.price}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">/局</div>
                    <div className="flex items-center gap-0.5 mt-1 justify-end">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-yellow-400">{player.rating}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">{player.orderCount}单</div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-white/5 animate-slide-up">
                    <div className="flex items-center gap-2 mb-3">
                      <Volume2 className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-muted-foreground">声音试听</span>
                      <div className="flex items-end gap-0.5 h-4 ml-2">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="w-1 bg-purple-400 rounded-full waveform-bar" style={{ height: `${4 + Math.random() * 12}px` }} />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 h-9 gradient-primary text-white rounded-lg text-xs">
                        <Mic className="w-3 h-3 mr-1" /> 语音通话
                      </Button>
                      <Button className="flex-1 h-9 bg-white/10 text-white rounded-lg text-xs hover:bg-white/15">
                        立即下单
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
