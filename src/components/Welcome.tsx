'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import styles from './Welcome.module.css';

interface WelcomeProps {
    onComplete: (name: string) => void;
}

export default function Welcome({ onComplete }: WelcomeProps) {
    const [name, setName] = useState('');
    const [stage, setStage] = useState<'greeting' | 'name'>('greeting');

    const handleSubmit = async () => {
        if (!name.trim()) return;

        await db.profile.put({
            id: 'profile',
            name: name.trim(),
            onboardingDone: true,
            tutorialDone: false,
            createdAt: new Date()
        });

        onComplete(name.trim());
    };

    return (
        <div className={styles.container}>
            <div className={styles.glow} />

            {stage === 'greeting' && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className={styles.content}
                >
                    <h1 className={styles.title}>OfeLia</h1>
                    <p className={styles.subtitle}>
                        I'm the friend who actually holds you accountable.
                    </p>
                    <p className={styles.description}>
                        Tell me your tasks. I'll schedule your day.<br />
                        Skip something? I'm not going away 😤<br />
                        Done? Show me the proof 📸
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={styles.primaryBtn}
                        onClick={() => setStage('name')}
                    >
                        Let's do this
                    </motion.button>
                </motion.div>
            )}

            {stage === 'name' && (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className={styles.content}
                >
                    <h2 className={styles.question}>What should I call you?</h2>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="Your name"
                        className={styles.input}
                        autoFocus
                    />
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={styles.primaryBtn}
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                    >
                        Nice to meet you →
                    </motion.button>
                </motion.div>
            )}
        </div>
    );
}
