"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart3, 
  GraduationCap, 
  Trophy, 
  History, 
  Settings,
  Zap,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: GraduationCap, label: 'Learning Hub', href: '/learning' },
  { icon: Trophy, label: 'Competitions', href: '/competitions' },
  { icon: History, label: 'Trade History', href: '/history' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export const SidebarNav: React.FC = () => {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-xl border-r border-primary/20 w-64 p-4 space-y-8">
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(42,90,159,0.6)]">
          <Zap className="text-white fill-current" />
        </div>
        <span className="font-headline font-bold text-xl tracking-tighter text-white">
          CANDLE<span className="text-primary">VISION</span>
        </span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-headline text-sm uppercase tracking-wider",
                isActive 
                  ? "bg-primary/20 text-primary border-l-4 border-primary" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
          <p className="text-xs font-headline text-primary mb-2">PRO STATUS</p>
          <p className="text-sm font-medium">Operator Mode Active</p>
          <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-3/4" />
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 font-headline text-xs uppercase tracking-wider text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20"
        >
          <LogOut className="w-4 h-4" />
          Sign Out Terminal
        </button>
      </div>
    </div>
  );
};
