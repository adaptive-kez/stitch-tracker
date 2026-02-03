import { motion } from 'framer-motion'
import type { StitchMood } from '@/types'

interface StitchMascotProps {
    variant?: StitchMood
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function StitchMascot({
    variant = 'happy',
    size = 'md',
    className = ''
}: StitchMascotProps) {
    const sizeMap = {
        sm: 64,
        md: 100,
        lg: 140
    }

    const s = sizeMap[size]

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
        switch (variant) {
            case 'sleeping':
                return 'brightness(0.8) saturate(0.7)'
            case 'excited':
                return 'brightness(1.1) saturate(1.2)'
            default:
                return 'none'
        }
    }

    return (
        <motion.div
            className={`inline-flex items-center justify-center ${className}`}
            animate={bodyAnimation[variant]}
            style={{ position: 'relative' }}
        >
            <motion.img
                src="/stitch/stitch-main.png"
                alt="Stitch"
                width={s}
                height={s}
                style={{
                    filter: getFilter(),
                    objectFit: 'contain'
                }}
                draggable={false}
            />

            {/* Zzz for sleeping */}
            {variant === 'sleeping' && (
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
            {variant === 'excited' && (
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
                </>
            )}

            {/* Thought bubble for thinking */}
            {variant === 'thinking' && (
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
                    <span style={{ fontSize: '10px' }}>💭</span>
                </motion.div>
            )}
        </motion.div>
    )
}
