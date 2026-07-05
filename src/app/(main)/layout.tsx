'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Home, Headphones, User } from 'lucide-react';
import AIAssistant from '@/components/ai-assistant';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, hasSelectedGames, currentPage, setCurrentPage } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    } else if (!hasSelectedGames) {
      router.push('/select-games');
    }
  }, [isAuthenticated, hasSelectedGames, router]);

  if (!isAuthenticated) return null;

  const navItems = [
    { id: 'dispatch', label: '派单', icon: Home },
    { id: 'channels', label: '开黑', icon: Headphones },
    { id: 'profile', label: '我的', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <div className="flex-1 pb-20">
        {children}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] glass-card border-t border-white/5 bottom-nav-safe z-40">
        <div className="flex items-center justify-around py-2">
          {navItems.map(item => {
            const isActive = currentPage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  router.push(`/${item.id === 'dispatch' ? 'dispatch' : item.id}`);
                }}
                className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-purple-400'
                    : 'text-muted-foreground hover:text-white/70'
                }`}
              >
                <div className={`relative ${isActive ? 'neon-text' : ''}`}>
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}
