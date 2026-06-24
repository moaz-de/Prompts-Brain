'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { BrainCircuit, LogOut, User, Plus, Sparkles, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface NavbarProps {
  onNewPrompt?: () => void;
}

export function Navbar({ onNewPrompt }: NavbarProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    let channel: any;

    const initData = async () => {
      try {
        // Fetch user exactly once to avoid Supabase auth lock collisions
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user || !isMounted) return;

        // 1. Fetch initial credits
        const { data } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single();

        if (data && isMounted) {
          setCredits(data.credits);
        }

        // 2. Setup real-time subscription for updates
        const channelName = `credits_${user.id}_${Math.random().toString(36).slice(2, 11)}`;
        
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            },
            (payload: any) => {
              if (isMounted && payload.new && typeof payload.new.credits === 'number') {
                setCredits(payload.new.credits);
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error('Failed to initialize user data:', err);
      }
    };

    initData();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);



  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-slate-950/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 group mr-2">
            <BrainCircuit className="h-6 w-6 text-violet-500 transition-transform group-hover:scale-110" />
            <span className="font-bold text-xl text-white tracking-tighter flex items-center gap-1">
              Zan<span className="text-violet-500">Zora</span>
            </span>
          </Link>
          <div className="h-6 w-[1px] bg-slate-800 hidden md:block"></div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/dashboard" 
              className={`font-medium transition-colors ${
                pathname === '/dashboard' ? 'text-violet-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Prompts Library
            </Link>
            <Link 
              href="/tools" 
              className={`font-medium transition-colors ${
                pathname === '/tools' ? 'text-violet-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              AI Tools
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          {/* Credit Indicator */}
          <div className="flex items-center gap-1.5 px-2 sm:px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-sm font-medium text-slate-300">
              <span className="text-violet-400 font-bold">{credits ?? '...'}</span> <span className="hidden sm:inline">Credits</span>
            </span>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {onNewPrompt && (
              <button 
                onClick={onNewPrompt}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-violet-500/20"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline">New Prompt</span>
              </button>
            )}
            
            <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden xs:block"></div>

            <Link 
              href="/profile"
              className={`p-2 rounded-full transition-all hidden md:flex ${
                pathname === '/profile' 
                  ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Profile Settings"
            >
              <User className="h-5 w-5" />
            </Link>

            <ThemeToggle />

            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors hidden md:flex"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

    </header>

      {/* Mobile Navigation Drawer - Moved outside header for better stacking */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[100] overflow-hidden">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-y-0 right-0 w-[300px] bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col p-0"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-6 w-6 text-violet-500" />
                  <span className="font-bold text-xl text-white">
                    Zan<span className="text-violet-500">Zora</span>
                  </span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <nav className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
                <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-4 px-2">Navigation</p>
                
                <Link 
                  href="/dashboard" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                    pathname === '/dashboard' 
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-lg shadow-violet-500/5' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${pathname === '/dashboard' ? 'bg-violet-500/20' : 'bg-slate-800'}`}>
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">Prompts Library</span>
                </Link>
                
                <Link 
                  href="/tools" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                    pathname === '/tools' 
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-lg shadow-violet-500/5' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${pathname === '/tools' ? 'bg-violet-500/20' : 'bg-slate-800'}`}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">AI Tools</span>
                </Link>

                <div className="h-px bg-white/5 my-6 mx-2"></div>
                
                <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-4 px-2">Account</p>

                <div className="flex items-center gap-3 px-4 py-3 mb-1">
                  <span className="text-xs font-semibold text-slate-400">Theme</span>
                  <ThemeToggle />
                </div>

                <Link 
                  href="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                    pathname === '/profile' 
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-lg shadow-violet-500/5' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${pathname === '/profile' ? 'bg-violet-500/20' : 'bg-slate-800'}`}>
                    <User className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">Profile Settings</span>
                </Link>

                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all text-left border border-transparent hover:border-red-500/20"
                >
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <span className="font-semibold">Sign Out</span>
                </button>
              </nav>

              <div className="p-6 bg-slate-950/50 border-t border-white/5">
                <div className="p-5 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/5 border border-violet-500/20 rounded-3xl text-center shadow-inner">
                  <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-1">Available Credits</p>
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <p className="text-2xl font-black text-white">{credits ?? '...'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
