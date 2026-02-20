import React from 'react';
import { Star } from 'lucide-react';

export const TrustSection: React.FC = () => {
  return (
    <div className="w-full mb-20 relative z-10">
      <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 shadow-2xl">
        <div className="grid md:grid-cols-2 h-auto md:h-80">
          <div className="relative h-64 md:h-full order-2 md:order-1">
            <img 
              alt="Smiling service provider shaking hands with client" 
              className="absolute inset-0 w-full h-full object-cover object-center" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAT5_YGy6TcpcWv-ME-jtfu-BkCNJxCNwCMactEeRUNqeiVhDNlqqPeanfaf5i1nnqB1AFVNfx2pheYU3dDr7jgTMfrFxZksv8ozO370U2McXrGkJJbvdFLStHRVrCnYEGzLiQyqvTKYg0_V0tiBYyQ4lF4Yv6ilpkWIrRU_vAdsQiXJ76mo2-HOT80PsG26QYfiE1w-loSWjqgmhW00BXg9DX35R1zjGWgENqVdn197HL6h2Fcj7ZShrIuHIGbkDmMI5UA4DE7D9XX" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-transparent"></div>
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center bg-slate-50 dark:bg-slate-800 order-1 md:order-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-primary text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Trusted</span>
              <div className="flex text-yellow-400 gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
            </div>
            <p className="text-slate-900 dark:text-white font-bold text-2xl md:text-3xl leading-tight mb-4">
              "Found an amazing plumber in 5 minutes! The verified reviews made it so easy."
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              Join 10,000+ neighbors building a better community together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};