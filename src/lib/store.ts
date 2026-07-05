import { create } from 'zustand';

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  phone?: string;
  email?: string;
  gender: 'male' | 'female';
  selectedGames: string[];
  isOnline: boolean;
}

interface PlayerCompanion {
  id: string;
  nickname: string;
  avatar: string;
  gender: 'male' | 'female';
  gameId: string;
  rank: string;
  price: number;
  voiceTag: string;
  tags: string[];
  rating: number;
  orderCount: number;
  isOnline: boolean;
  voiceUrl?: string;
}

interface VoiceChannel {
  id: string;
  name: string;
  gameId: string;
  gameName: string;
  members: number;
  maxMembers: number;
  tags: string[];
  isSpeaking: boolean;
  language: string;
}

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  hasSelectedGames: boolean;

  // Navigation
  currentPage: string;

  // Dispatch
  dispatchGameId: string | null;
  dispatchGender: 'male' | 'female' | null;
  dispatchPriceRange: [number, number];
  dispatchRank: string | null;
  dispatchVoiceTag: string | null;
  dispatchNote: string;

  // Players
  players: PlayerCompanion[];

  // Channels
  channels: VoiceChannel[];

  // Matched companion & room state
  matchedCompanion: PlayerCompanion | null;
  roomStatus: 'idle' | 'waiting' | 'active';

  // AI Assistant
  isAIAssistantOpen: boolean;

  // Actions
  setUser: (user: User) => void;
  setSelectedGames: (games: string[]) => void;
  setCurrentPage: (page: string) => void;
  setDispatchFilters: (filters: Partial<{
    gameId: string;
    gender: 'male' | 'female';
    priceRange: [number, number];
    rank: string;
    voiceTag: string;
    note: string;
  }>) => void;
  setMatchedCompanion: (companion: PlayerCompanion | null) => void;
  setRoomStatus: (status: 'idle' | 'waiting' | 'active') => void;
  toggleAIAssistant: () => void;
  logout: () => void;
}

const MOCK_PLAYERS: PlayerCompanion[] = [
  { id: 'p1', nickname: '甜心小鹿', avatar: '🦌', gender: 'female', gameId: 'wzry', rank: '王者', price: 30, voiceTag: '甜美', tags: ['声音好听', '有耐心', '会教学'], rating: 4.9, orderCount: 1256, isOnline: true },
  { id: 'p2', nickname: '暗夜猎手', avatar: '🐺', gender: 'male', gameId: 'wzry', rank: '王者', price: 25, voiceTag: '低音炮', tags: ['技术流', '上分快', '幽默'], rating: 4.8, orderCount: 892, isOnline: true },
  { id: 'p3', nickname: '星辰大海', avatar: '🌟', gender: 'female', gameId: 'lol', rank: '钻石', price: 20, voiceTag: '御姐', tags: ['温柔', '配合好', '不挂机'], rating: 4.7, orderCount: 645, isOnline: true },
  { id: 'p4', nickname: '雷霆战神', avatar: '⚡', gender: 'male', gameId: 'lol', rank: '大师', price: 35, voiceTag: '磁性', tags: ['职业选手', 'carry全场', '教学'], rating: 4.9, orderCount: 2034, isOnline: true },
  { id: 'p5', nickname: '棉花糖', avatar: '🍬', gender: 'female', gameId: 'pubg', rank: '铂金', price: 15, voiceTag: '萝莉', tags: ['可爱', '报点准', '娱乐局'], rating: 4.6, orderCount: 423, isOnline: true },
  { id: 'p6', nickname: '孤狼', avatar: '🦊', gender: 'male', gameId: 'pubg', rank: '钻石', price: 28, voiceTag: '清冷', tags: ['枪法准', '吃鸡率高', '安静'], rating: 4.8, orderCount: 1567, isOnline: false },
  { id: 'p7', nickname: '樱花酱', avatar: '🌸', gender: 'female', gameId: 'genshin', rank: '满级', price: 18, voiceTag: '甜美', tags: ['全角色', '深渊满星', '剧情党'], rating: 4.9, orderCount: 789, isOnline: true },
  { id: 'p8', nickname: '剑圣', avatar: '🗡️', gender: 'male', gameId: 'naraka', rank: '金刚', price: 22, voiceTag: '活泼', tags: ['连招秀', '带飞', '搞笑'], rating: 4.7, orderCount: 534, isOnline: true },
  { id: 'p9', nickname: '月光女神', avatar: '🌙', gender: 'female', gameId: 'valorant', rank: '不朽', price: 32, voiceTag: '御姐', tags: ['爆头率高', '指挥', '稳'], rating: 4.8, orderCount: 1123, isOnline: true },
  { id: 'p10', nickname: '风暴骑士', avatar: '🛡️', gender: 'male', gameId: 'csgo', rank: '全球精英', price: 40, voiceTag: '磁性', tags: ['前职业', '教学', '上分'], rating: 5.0, orderCount: 3210, isOnline: true },
];

const MOCK_CHANNELS: VoiceChannel[] = [
  { id: 'c1', name: '王者荣耀开黑房', gameId: 'wzry', gameName: '王者荣耀', members: 4, maxMembers: 5, tags: ['排位', '钻石局'], isSpeaking: true, language: '中文' },
  { id: 'c2', name: 'LOL五排车队', gameId: 'lol', gameName: '英雄联盟', members: 3, maxMembers: 5, tags: ['匹配', '娱乐'], isSpeaking: true, language: '中文' },
  { id: 'c3', name: '和平精英四排', gameId: 'pubg', gameName: '和平精英', members: 2, maxMembers: 4, tags: ['经典', '排位'], isSpeaking: false, language: '中文' },
  { id: 'c4', name: 'International Squad', gameId: 'valorant', gameName: '瓦罗兰特', members: 3, maxMembers: 5, tags: ['Ranked', 'Fun'], isSpeaking: true, language: 'English' },
  { id: 'c5', name: '原神联机探索', gameId: 'genshin', gameName: '原神', members: 2, maxMembers: 4, tags: ['深渊', '探索'], isSpeaking: false, language: '中文' },
  { id: 'c6', name: '永劫无间三排', gameId: 'naraka', gameName: '永劫无间', members: 2, maxMembers: 3, tags: ['排位', '金刚'], isSpeaking: true, language: '中文' },
];

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  hasSelectedGames: false,
  currentPage: 'dispatch',
  dispatchGameId: null,
  dispatchGender: null,
  dispatchPriceRange: [0, 100],
  dispatchRank: null,
  dispatchVoiceTag: null,
  dispatchNote: '',
  players: MOCK_PLAYERS,
  channels: MOCK_CHANNELS,
  matchedCompanion: null,
  roomStatus: 'idle',
  isAIAssistantOpen: false,

  setUser: (user) => set({ user, isAuthenticated: true }),
  setSelectedGames: (games) => set((state) => ({
    hasSelectedGames: games.length > 0,
    user: state.user ? { ...state.user, selectedGames: games } : null,
  })),
  setCurrentPage: (page) => set({ currentPage: page }),
  setDispatchFilters: (filters) => set((state) => ({
    dispatchGameId: filters.gameId ?? state.dispatchGameId,
    dispatchGender: filters.gender ?? state.dispatchGender,
    dispatchPriceRange: filters.priceRange ?? state.dispatchPriceRange,
    dispatchRank: filters.rank ?? state.dispatchRank,
    dispatchVoiceTag: filters.voiceTag ?? state.dispatchVoiceTag,
    dispatchNote: filters.note ?? state.dispatchNote,
  })),
  setMatchedCompanion: (companion) => set({ matchedCompanion: companion }),
  setRoomStatus: (status) => set({ roomStatus: status }),
  toggleAIAssistant: () => set((state) => ({ isAIAssistantOpen: !state.isAIAssistantOpen })),
  logout: () => set({
    user: null,
    isAuthenticated: false,
    hasSelectedGames: false,
    currentPage: 'dispatch',
    dispatchGameId: null,
    dispatchGender: null,
    dispatchPriceRange: [0, 100],
    dispatchRank: null,
    dispatchVoiceTag: null,
    dispatchNote: '',
    matchedCompanion: null,
    roomStatus: 'idle',
    isAIAssistantOpen: false,
  }),
}));
