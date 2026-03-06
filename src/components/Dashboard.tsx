'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, Task } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { requestNotificationPermission, startReminderLoop } from '@/lib/notifications';
import styles from './Dashboard.module.css';

interface DashboardProps {
    userName: string;
    onOpenChat: () => void;
}

export default function Dashboard({ userName, onOpenChat }: DashboardProps) {
    const tasks = useLiveQuery(() => db.tasks.orderBy('scheduledTime').toArray()) || [];
    const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

    // Start notifications on mount
    useEffect(() => {
        requestNotificationPermission().then((granted) => {
            if (granted) startReminderLoop();
        });
    }, []);

    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const doneTasks = tasks.filter(t => t.status === 'done');

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const handlePhotoUpload = async (taskId: number, file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target?.result as string;
            await db.tasks.update(taskId, {
                status: 'done',
                photoProofUrl: dataUrl,
                completedAt: new Date()
            });
        };
        reader.readAsDataURL(file);
    };

    const triggerFileInput = (taskId: number) => {
        fileInputRefs.current[taskId]?.click();
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div>
                    <p className={styles.greetingSmall}>{getGreeting()}</p>
                    <h1 className={styles.greeting}>{userName} 👋</h1>
                </div>
                <div className={styles.stats}>
                    <span className={styles.statNumber}>{doneTasks.length}</span>
                    <span className={styles.statLabel}>/ {tasks.length} done</span>
                </div>
            </header>

            {/* Task List */}
            <section className={styles.taskSection}>
                <h2 className={styles.sectionTitle}>Today's Tasks</h2>

                {pendingTasks.length === 0 && doneTasks.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.emptyState}
                    >
                        <span className={styles.emptyEmoji}>🎯</span>
                        <p>No tasks yet. Tap below to plan your day!</p>
                    </motion.div>
                )}

                <AnimatePresence>
                    {pendingTasks.map((task, i) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ delay: i * 0.05 }}
                            className={styles.taskCard}
                        >
                            <div className={styles.taskInfo}>
                                <span className={styles.taskTime}>{task.scheduledTime}</span>
                                <p className={styles.taskText}>{task.text}</p>
                                {task.estimatedMinutes && (
                                    <span className={styles.taskDuration}>{task.estimatedMinutes} min</span>
                                )}
                            </div>
                            <button
                                className={styles.proofBtn}
                                onClick={() => triggerFileInput(task.id!)}
                            >
                                📸 Prove it
                            </button>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                ref={(el) => { fileInputRefs.current[task.id!] = el; }}
                                className={styles.hiddenInput}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && task.id) handlePhotoUpload(task.id, file);
                                }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Completed Tasks */}
                {doneTasks.length > 0 && (
                    <>
                        <h2 className={`${styles.sectionTitle} ${styles.doneTitle}`}>
                            ✅ Completed ({doneTasks.length})
                        </h2>
                        {doneTasks.map((task) => (
                            <div key={task.id} className={`${styles.taskCard} ${styles.doneCard}`}>
                                <div className={styles.taskInfo}>
                                    <span className={styles.taskTime}>{task.scheduledTime}</span>
                                    <p className={`${styles.taskText} ${styles.doneText}`}>{task.text}</p>
                                </div>
                                {task.photoProofUrl && (
                                    <img src={task.photoProofUrl} alt="Proof" className={styles.proofThumb} />
                                )}
                            </div>
                        ))}
                    </>
                )}
            </section>

            {/* Design My Day Button */}
            <div className={styles.bottomBar}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className={styles.designBtn}
                    onClick={onOpenChat}
                >
                    💬 Design my day with OfeLia
                </motion.button>
            </div>
        </div>
    );
}
