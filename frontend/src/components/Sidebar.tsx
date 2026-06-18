'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  FolderKanban, 
  Cpu, 
  History, 
  LogOut, 
  Shield,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { name: 'Projects', href: '/dashboard', icon: FolderKanban },
    { name: 'AI Providers', href: '/settings', icon: Cpu },
    { name: 'Review History', href: '/reviews', icon: History },
  ];

  return (
    <div className="w-64 bg-neutral-950/80 backdrop-blur-md border-r border-white/5 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/5 flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white">ANTIGRAVITY</h1>
          <p className="text-[10px] text-gray-500 font-semibold tracking-widest">REVIEWER</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 shadow-md shadow-emerald-500/5'
                  : 'border border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
                <span>{link.name}</span>
              </div>
              {isActive && <ChevronRight className="h-3 w-3 text-emerald-400 animate-pulse" />}
            </Link>
          );
        })}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-white/5 space-y-4">
        {user && (
          <div className="flex items-center space-x-3 px-2">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm border border-white/10 shadow-md">
              {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user.name || 'Developer'}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium border border-transparent text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
