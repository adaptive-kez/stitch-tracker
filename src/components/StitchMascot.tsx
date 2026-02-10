import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { StitchMood } from '@/types'
import { hapticFeedback } from '@/lib/telegram'

interface StitchMascotProps {
    variant?: StitchMood
    size?: 'sm' | 'md' | 'lg'
    className?: string
    interactive?: boolean
}

// All available moods for cycling
const MOODS: StitchMood[] = ['happy', 'excited', 'thinking', 'sleeping', 'waiting']

// Mood labels for the speech bubble
const MOOD_LABELS: Record<StitchMood, string> = {
    happy: '😊 Привет!',
    excited: '🎉 Ура!',
    thinking: '🤔 Хмм...',
    sleeping: '😴 Zzz...',
    waiting: '👋 Тут!',
}

export function StitchMascot({
    variant = 'happy',
    size = 'md',
    className = '',
    interactive = false,
}: StitchMascotProps) {
    const [currentMood, setCurrentMood] = useState<StitchMood>(variant)
    const [showBubble, setShowBubble] = useState(false)
    const [tapCount, setTapCount] = useState(0)

    const sizeMap = {
        sm: 64,
        md: 100,
        lg: 140
    }

    const s = sizeMap[size]
    const activeMood = interactive ? currentMood : variant

    // Handle tap to cycle mood
    const handleTap = useCallback(() => {
        if (!interactive) return

        hapticFeedback.impact('light')

        const currentIndex = MOODS.indexOf(currentMood)
        const nextIndex = (currentIndex + 1) % MOODS.length
        setCurrentMood(MOODS[nextIndex])
        setTapCount(prev => prev + 1)

        // Show speech bubble briefly
        setShowBubble(true)
        setTimeout(() => setShowBubble(false), 2000)
    }, [interactive, currentMood])

    // Animation variants for different moods
    const bodyAnimation = {
        happy: {
            y: [0, -5, 0],
            rotate: [0, 2, -2, 0],
            transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' as const }
        },
        excited: {
            y: [0, -10, 0],
            scale: [1, 1.08, 1],
            transition: { repeat: Infinity, duration: 0.5, ease: 'easeInOut' as const }
        },
        sleeping: {
            y: [0, 3, 0],
            rotate: [0, -5, 0],
            transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' as const }
        },
        waiting: {
            y: [0, -3, 0],
            transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' as const }
        },
        thinking: {
            rotate: [0, 5, 0, -5, 0],
            transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' as const }
        }
    }

    // Filter based on mood
    const getFilter = () => {
        switch (activeMood) {
            case 'sleeping':
                return 'brightness(0.8) saturate(0.7)'
            case 'excited':
                return 'brightness(1.1) saturate(1.3) drop-shadow(0 0 8px rgba(99,102,241,0.5))'
            case 'thinking':
                return 'hue-rotate(10deg) brightness(1.05)'
            default:
                return 'none'
        }
    }

    return (
        <motion.div
            className={`inline-flex items-center justify-center ${interactive ? 'cursor-pointer select-none' : ''} ${className}`}
            animate={bodyAnimation[activeMood]}
            style={{ position: 'relative' }}
            onClick={handleTap}
            whileTap={interactive ? { scale: 0.9 } : undefined}
        >
            {/* Main Stitch image */}
            <motion.img
                key={activeMood}
                src="/stitch/stitch-main.png"
                alt="Stitch"
                width={s}
                height={s}
                initial={interactive ? { scale: 0.8, rotate: -10 } : false}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                style={{
                    filter: getFilter(),
                    objectFit: 'contain'
                }}
                draggable={false}
            />

            {/* Speech bubble on tap */}
            <AnimatePresence>
                {interactive && showBubble && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.5 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.5 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        style={{
                            position: 'absolute',
                            top: '-35px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                        }}
                        className="px-3 py-1.5 bg-[var(--bg-card)] rounded-full text-xs font-medium shadow-lg border border-[var(--border-subtle)]"
                    >
                        {MOOD_LABELS[activeMood]}
                        {/* Bubble tail */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '50%',
                                transform: 'translateX(-50%) rotate(45deg)',
                                width: '8px',
                                height: '8px',
                            }}
                            className="bg-[var(--bg-card)] border-r border-b border-[var(--border-subtle)]"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Zzz for sleeping */}
            {activeMood === 'sleeping' && (
                <>
                    <motion.span
                        style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-5px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#6366f1'
                        }}
                        animate={{ opacity: [0, 1, 0], y: [-5, -15, -5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        z
                    </motion.span>
                    <motion.span
                        style={{
                            position: 'absolute',
                            top: '-20px',
                            right: '-15px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: '#6366f1'
                        }}
                        animate={{ opacity: [0, 1, 0], y: [-5, -12, -5] }}
                        transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                    >
                        z
                    </motion.span>
                </>
            )}

            {/* Sparkles for excited */}
            {activeMood === 'excited' && (
                <>
                    <motion.span
                        style={{
                            position: 'absolute',
                            top: '-5px',
                            left: '-5px',
                            fontSize: '14px'
                        }}
                        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                        ✨
                    </motion.span>
                    <motion.span
                        style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            fontSize: '12px'
                        }}
                        animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                    >
                        ⭐
                    </motion.span>
                    <motion.span
                        style={{
                            position: 'absolute',
                            bottom: '-5px',
                            left: '50%',
                            fontSize: '10px',
                        }}
                        animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0], y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    >
                        🎉
                    </motion.span>
                </>
            )}

            {/* Thought bubble for thinking */}
            {activeMood === 'thinking' && (
                <motion.div
                    style={{
                        position: 'absolute',
                        top: '-15px',
                        right: '-20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                >
                    <span style={{ fontSize: '14px' }}>💭</span>
                </motion.div>
            )}

            {/* Hearts for happy */}
            {activeMood === 'happy' && interactive && tapCount > 0 && (
                <motion.span
                    key={tapCount}
                    style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        fontSize: '14px',
                        pointerEvents: 'none',
                    }}
                    initial={{ scale: 0, y: 0 }}
                    animate={{ scale: [0, 1.2, 0], y: [0, -20, -30], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8 }}
                >
                    💙
                </motion.span>
            )}

            {/* Wave for waiting */}
            {activeMood === 'waiting' && interactive && (
                <motion.span
                    style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-15px',
                        fontSize: '16px',
                    }}
                    animate={{ rotate: [0, 20, -20, 20, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                >
                    👋
                </motion.span>
            )}
        </motion.div>
    )
}
