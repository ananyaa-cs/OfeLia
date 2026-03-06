'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithOfeLia } from '@/lib/ai';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import styles from './ChatPanel.module.css';

interface ChatPanelProps {
    onClose: () => void;
    userName: string;
}

export default function ChatPanel({ onClose, userName }: ChatPanelProps) {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [greeted, setGreeted] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const messages = useLiveQuery(() =>
        db.messages.orderBy('timestamp').toArray()
    ) || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send greeting only once
    useEffect(() => {
        if (greeted) return;
        const sendGreeting = async () => {
            const count = await db.messages.count();
            if (count === 0) {
                await db.messages.add({
                    role: 'ofelia',
                    content: `Alright ${userName}, let's design your day 💪 Tell me everything you need to get done today. Don't hold back!`,
                    timestamp: new Date()
                });
            }
            setGreeted(true);
        };
        sendGreeting();
    }, [greeted, userName]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        setInput('');
        setIsLoading(true);

        // Save user message
        await db.messages.add({
            role: 'user',
            content: text,
            timestamp: new Date()
        });

        try {
            const recentMessages = await db.messages.orderBy('timestamp').reverse().limit(10).toArray();
            const response = await chatWithOfeLia(text, recentMessages.reverse());

            // Save OfeLia's response
            await db.messages.add({
                role: 'ofelia',
                content: response.message,
                timestamp: new Date()
            });

            // Create tasks if AI extracted any
            if (response.tasks && response.tasks.length > 0) {
                for (const task of response.tasks) {
                    await db.tasks.add({
                        text: task.text,
                        scheduledTime: task.scheduledTime,
                        estimatedMinutes: task.estimatedMinutes,
                        status: 'pending',
                        aiMessage: response.message,
                        createdAt: new Date()
                    });
                }
            }
        } catch {
            await db.messages.add({
                role: 'ofelia',
                content: "Hmm, something went wrong on my end 🫠 Try again?",
                timestamp: new Date()
            });
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.overlay}
        >
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className={styles.panel}
            >
                <div className={styles.header}>
                    <div>
                        <h3 className={styles.headerTitle}>OfeLia</h3>
                        <p className={styles.headerSub}>Your accountability buddy</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div className={styles.messages}>
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.ofeliaBubble}`}
                            >
                                {msg.role === 'ofelia' && <span className={styles.avatar}>🔥</span>}
                                <p>{msg.content}</p>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <div className={`${styles.bubble} ${styles.ofeliaBubble}`}>
                            <span className={styles.avatar}>🔥</span>
                            <div className={styles.typing}>
                                <span /><span /><span />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className={styles.inputBar} onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Tell me your tasks..."
                        className={styles.input}
                        autoFocus
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!input.trim() || isLoading}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}
