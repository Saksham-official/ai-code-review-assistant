'use client';

import React from 'react';
import { Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="flex flex-col items-center space-y-4 animate-pulse">
        <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Shield className="h-12 w-12 animate-spin-slow" />
        </div>
        <div className="text-center">
          <h1 className="text-lg font-semibold tracking-wider text-gray-200">
            LOADING REVIEW VAULT
          </h1>
          <p className="text-xs text-gray-500">Redirecting to your dashboard...</p>
        </div>
      </div>
    </div>
  );
}
