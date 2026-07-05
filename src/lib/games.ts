export interface Game {
  id: string;
  name: string;
  icon: string;
  category: string;
  onlineCount: number;
  color: string;
}

export const GAMES: Game[] = [
  { id: 'lol', name: '英雄联盟', icon: '🎮', category: 'MOBA', onlineCount: 12580, color: '#C89B3C' },
  { id: 'wzry', name: '王者荣耀', icon: '👑', category: 'MOBA', onlineCount: 28340, color: '#E85D04' },
  { id: 'pubg', name: '和平精英', icon: '🔫', category: '射击', onlineCount: 15670, color: '#FFBA08' },
  { id: 'csgo', name: 'CS2', icon: '💣', category: 'FPS', onlineCount: 8920, color: '#F48C06' },
  { id: 'valorant', name: '瓦罗兰特', icon: '🎯', category: 'FPS', onlineCount: 6750, color: '#FF477E' },
  { id: 'apex', name: 'Apex英雄', icon: '🦅', category: '射击', onlineCount: 5430, color: '#D00000' },
  { id: 'genshin', name: '原神', icon: '⭐', category: 'RPG', onlineCount: 9870, color: '#6BCBFF' },
  { id: 'hsr', name: '崩坏:星穹铁道', icon: '🚂', category: 'RPG', onlineCount: 7650, color: '#9B5DE5' },
  { id: 'zzz', name: '绝区零', icon: '📺', category: '动作', onlineCount: 4320, color: '#F15BB5' },
  { id: 'dnf', name: '地下城与勇士', icon: '⚔️', category: '格斗', onlineCount: 6890, color: '#00BBF9' },
  { id: 'naraka', name: '永劫无间', icon: '🗡️', category: '动作', onlineCount: 5120, color: '#00F5D4' },
  { id: 'tf', name: '云顶之弈', icon: '♟️', category: '策略', onlineCount: 4560, color: '#FEE440' },
  { id: 'dg', name: '金铲铲之战', icon: '🏆', category: '策略', onlineCount: 7890, color: '#9B5DE5' },
  { id: 'fifa', name: 'FC Online', icon: '⚽', category: '体育', onlineCount: 3210, color: '#00BBF9' },
  { id: 'nba', name: 'NBA2K', icon: '🏀', category: '体育', onlineCount: 2100, color: '#F77F00' },
  { id: 'mc', name: '我的世界', icon: '🧱', category: '沙盒', onlineCount: 3870, color: '#55A630' },
  { id: 'eggy', name: '蛋仔派对', icon: '🥚', category: '休闲', onlineCount: 11200, color: '#FFBE0B' },
  { id: 'among', name: '太空杀', icon: '🚀', category: '社交', onlineCount: 2890, color: '#3A86FF' },
];

export const GAME_CATEGORIES = ['全部', 'MOBA', '射击', 'FPS', 'RPG', '动作', '策略', '格斗', '体育', '沙盒', '休闲', '社交'];

export const RANKS = ['青铜', '白银', '黄金', '铂金', '钻石', '大师', '王者'];

export const VOICE_TAGS = ['甜美', '御姐', '萝莉', '低音炮', '温柔', '活泼', '磁性', '清冷'];
