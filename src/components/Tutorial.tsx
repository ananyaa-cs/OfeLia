'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Tutorial.module.css';

interface TutorialProps {
    onComplete: () => void;
}

const slides = [
    {
        emoji: '💬',
        title: 'Talk to me naturally',
        description: 'Tell me everything you need to do today. I\'ll organize it into a schedule that actually makes sense.',
        example: '"I need to study, workout, finish the project, and call Mom"'
    },
    {
        emoji: '😤',
        title: 'I don\'t let you slack off',
        description: 'I\'ll remind you. And remind you again. And AGAIN. I literally won\'t stop until you get it done.',
        example: '"Show me the proof or I\'m not going away 📸"'
    },
    {
        emoji: '📸',
        title: 'Photo or it didn\'t happen',
        description: 'To mark a task as done, you upload a photo proving you did it. No shortcuts, no excuses.',
        example: 'Gym selfie? Study notes? Clean room pic? I want to see it!'
    }
];

export default function Tutorial({ onComplete }: TutorialProps) {
    const [current, setCurrent] = useState(0);

    const handleNext = () => {
        if (current < slides.length - 1) {
            setCurrent(current + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.progress}>
                {slides.map((_, i) => (
                    <div key={i} className={`${styles.dot} ${i <= current ? styles.active : ''}`} />
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, x: 60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -60 }}
                    transition={{ duration: 0.4 }}
                    className={styles.slide}
                >
                    <span className={styles.emoji}>{slides[current].emoji}</span>
                    <h2 className={styles.title}>{slides[current].title}</h2>
                    <p className={styles.description}>{slides[current].description}</p>
                    <div className={styles.exampleBubble}>
                        <p>{slides[current].example}</p>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className={styles.actions}>
                {current > 0 && (
                    <button className={styles.backBtn} onClick={() => setCurrent(current - 1)}>
                        Back
                    </button>
                )}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={styles.nextBtn}
                    onClick={handleNext}
                >
                    {current === slides.length - 1 ? "I'm ready, let's go! 🔥" : 'Next'}
                </motion.button>
            </div>
        </div>
    );
}
