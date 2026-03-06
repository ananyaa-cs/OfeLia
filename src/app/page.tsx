'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import Welcome from '@/components/Welcome';
import Tutorial from '@/components/Tutorial';
import Dashboard from '@/components/Dashboard';
import ChatPanel from '@/components/ChatPanel';

type Screen = 'loading' | 'welcome' | 'tutorial' | 'dashboard';

export default function OfeLia() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [chatOpen, setChatOpen] = useState(false);
  const [userName, setUserName] = useState('');

  // Check profile on mount
  useEffect(() => {
    async function checkProfile() {
      try {
        const profile = await db.profile.get('profile');
        if (!profile) {
          setScreen('welcome');
        } else if (!profile.tutorialDone) {
          setUserName(profile.name);
          setScreen('tutorial');
        } else {
          setUserName(profile.name);
          setScreen('dashboard');
        }
      } catch {
        setScreen('welcome');
      }
    }
    checkProfile();
  }, []);

  const handleWelcomeComplete = (name: string) => {
    setUserName(name);
    setScreen('tutorial');
  };

  const handleTutorialComplete = async () => {
    await db.profile.update('profile', { tutorialDone: true });
    setScreen('dashboard');
  };

  if (screen === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: 'rgba(255,255,255,0.3)',
        fontFamily: "'Playfair Display', serif",
        fontSize: '2rem'
      }}>
        OfeLia
      </div>
    );
  }

  return (
    <>
      {screen === 'welcome' && (
        <Welcome onComplete={handleWelcomeComplete} />
      )}

      {screen === 'tutorial' && (
        <Tutorial onComplete={handleTutorialComplete} />
      )}

      {screen === 'dashboard' && (
        <Dashboard
          userName={userName}
          onOpenChat={() => setChatOpen(true)}
        />
      )}

      <AnimatePresence>
        {chatOpen && (
          <ChatPanel
            onClose={() => setChatOpen(false)}
            userName={userName}
          />
        )}
      </AnimatePresence>
    </>
  );
}
