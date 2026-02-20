import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { TrustSection } from './components/TrustSection';
import { ServiceGrid } from './components/ServiceGrid';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-white dark:bg-slate-900 overflow-x-hidden font-display">
      <Header />
      <main className="flex-1 flex flex-col relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 pb-12">
        {/* Background Blobs */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary blur-[120px]"></div>
            <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary blur-[100px]"></div>
        </div>

        <Hero />
        <TrustSection />
        <ServiceGrid />
      </main>
      <Footer />
    </div>
  );
}