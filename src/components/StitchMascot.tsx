import { motion } from 'framer-motion'
import type { StitchMood } from '@/types'
import type { Easing } from 'framer-motion'

interface StitchMascotProps {
    variant?: StitchMood
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const easeInOut: Easing = 'easeInOut'

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
    const earAnimation = {
        happy: {
            rotate: [0, 5, -5, 0],
            transition: { repeat: Infinity, duration: 2, ease: easeInOut }
        },
        excited: {
            rotate: [0, 15, -15, 0],
            transition: { repeat: Infinity, duration: 0.5, ease: easeInOut }
        },
        sleeping: {
            rotate: [0, -3, 0],
            transition: { repeat: Infinity, duration: 3, ease: easeInOut }
        },
        waiting: {
            rotate: [0, 2, -2, 0],
            transition: { repeat: Infinity, duration: 1.5, ease: easeInOut }
        },
        thinking: {
            rotate: [-5, -10, -5],
            transition: { repeat: Infinity, duration: 2, ease: easeInOut }
        }
    }

    const bodyAnimation = {
        happy: {
            y: [0, -3, 0],
            transition: { repeat: Infinity, duration: 1.5, ease: easeInOut }
        },
        excited: {
            y: [0, -8, 0],
            scale: [1, 1.05, 1],
            transition: { repeat: Infinity, duration: 0.4, ease: easeInOut }
        },
        sleeping: {
            y: [0, 2, 0],
            transition: { repeat: Infinity, duration: 3, ease: easeInOut }
        },
        waiting: {
            y: [0, -2, 0],
            transition: { repeat: Infinity, duration: 2, ease: easeInOut }
        },
        thinking: {
            rotate: [0, 3, 0],
            transition: { repeat: Infinity, duration: 2.5, ease: easeInOut }
        }
    }

    // Eye expressions based on mood
    const getEyeExpression = () => {
        switch (variant) {
            case 'sleeping':
                return (
                    <>
                        {/* Closed eyes */}
                        <path
                            d="M32 50 Q38 47 44 50"
                            stroke="#1a1a2e"
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                        />
                        <path
                            d="M56 50 Q62 47 68 50"
                            stroke="#1a1a2e"
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                        />
                        {/* Zzz */}
                        <motion.text
                            x="75"
                            y="35"
                            fontSize="12"
                            fill="#6366f1"
                            fontWeight="bold"
                            animate={{ opacity: [0, 1, 0], y: [35, 25, 35] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            z
                        </motion.text>
                        <motion.text
                            x="82"
                            y="28"
                            fontSize="10"
                            fill="#6366f1"
                            fontWeight="bold"
                            animate={{ opacity: [0, 1, 0], y: [28, 20, 28] }}
                            transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                        >
                            z
                        </motion.text>
                    </>
                )
            case 'excited':
                return (
                    <>
                        {/* Big sparkly eyes */}
                        <ellipse cx="38" cy="50" rx="7" ry="9" fill="#1a1a2e" />
                        <ellipse cx="62" cy="50" rx="7" ry="9" fill="#1a1a2e" />
                        <circle cx="36" cy="47" r="2.5" fill="white" />
                        <circle cx="60" cy="47" r="2.5" fill="white" />
                        <circle cx="40" cy="52" r="1.5" fill="white" />
                        <circle cx="64" cy="52" r="1.5" fill="white" />
                    </>
                )
            case 'thinking':
                return (
                    <>
                        {/* Eyes looking up */}
                        <ellipse cx="38" cy="48" rx="5" ry="6" fill="#1a1a2e" />
                        <ellipse cx="62" cy="48" rx="5" ry="6" fill="#1a1a2e" />
                        <circle cx="37" cy="45" r="2" fill="white" />
                        <circle cx="61" cy="45" r="2" fill="white" />
                        {/* Thought bubble */}
                        <motion.g
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <circle cx="80" cy="30" r="4" fill="#e2e8f0" />
                            <circle cx="85" cy="22" r="3" fill="#e2e8f0" />
                            <circle cx="88" cy="15" r="2" fill="#e2e8f0" />
                        </motion.g>
                    </>
                )
            default:
                return (
                    <>
                        {/* Normal happy eyes */}
                        <ellipse cx="38" cy="50" rx="5" ry="6" fill="#1a1a2e" />
                        <ellipse cx="62" cy="50" rx="5" ry="6" fill="#1a1a2e" />
                        <circle cx="36" cy="48" r="2" fill="white" />
                        <circle cx="60" cy="48" r="2" fill="white" />
                    </>
                )
        }
    }

    return (
        <motion.div
            className={`inline-flex items-center justify-center ${className}`}
            animate={bodyAnimation[variant]}
        >
            <svg
                width={s}
                height={s}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Ears */}
                <motion.g animate={earAnimation[variant]}>
                    {/* Left ear */}
                    <ellipse
                        cx="20"
                        cy="35"
                        rx="12"
                        ry="25"
                        fill="#5B8DEE"
                        transform="rotate(-20 20 35)"
                    />
                    <ellipse
                        cx="20"
                        cy="35"
                        rx="8"
                        ry="18"
                        fill="#8FB8FF"
                        transform="rotate(-20 20 35)"
                    />
                </motion.g>
                <motion.g animate={{ ...earAnimation[variant], rotate: earAnimation[variant].rotate.map((r: number) => -r) }}>
                    {/* Right ear */}
                    <ellipse
                        cx="80"
                        cy="35"
                        rx="12"
                        ry="25"
                        fill="#5B8DEE"
                        transform="rotate(20 80 35)"
                    />
                    <ellipse
                        cx="80"
                        cy="35"
                        rx="8"
                        ry="18"
                        fill="#8FB8FF"
                        transform="rotate(20 80 35)"
                    />
                </motion.g>

                {/* Head/Body */}
                <ellipse cx="50" cy="55" rx="35" ry="32" fill="#5B8DEE" />

                {/* Light belly area */}
                <ellipse cx="50" cy="62" rx="22" ry="18" fill="#8FB8FF" />

                {/* Eyes */}
                {getEyeExpression()}

                {/* Nose */}
                <ellipse cx="50" cy="58" rx="6" ry="4" fill="#2D4A8A" />
                <ellipse cx="49" cy="57" rx="2" ry="1" fill="#8FB8FF" opacity="0.5" />

                {/* Mouth */}
                {variant === 'happy' || variant === 'excited' ? (
                    <path
                        d="M42 66 Q50 74 58 66"
                        stroke="#1a1a2e"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                    />
                ) : variant === 'sleeping' ? (
                    <path
                        d="M45 67 Q50 69 55 67"
                        stroke="#1a1a2e"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                    />
                ) : (
                    <path
                        d="M44 67 L56 67"
                        stroke="#1a1a2e"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                )}

                {/* Spots on head */}
                <circle cx="30" cy="40" r="3" fill="#2D4A8A" />
                <circle cx="70" cy="40" r="3" fill="#2D4A8A" />
                <circle cx="50" cy="35" r="2" fill="#2D4A8A" />
            </svg>
        </motion.div>
    )
}
