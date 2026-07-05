import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PlayMate - 游戏陪玩平台',
  description: '找到你的游戏搭档，一起开黑上分',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased">
        <div className="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
