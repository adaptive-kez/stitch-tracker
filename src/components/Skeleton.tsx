import { motion } from 'framer-motion'

interface SkeletonProps {
    className?: string
    variant?: 'text' | 'circular' | 'rectangular'
    width?: string | number
    height?: string | number
}

export function Skeleton({
    className = '',
    variant = 'rectangular',
    width,
    height
}: SkeletonProps) {
    const baseClasses = 'animate-pulse bg-[var(--bg-button)]'

    const variantClasses = {
        text: 'h-4 rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-xl'
    }

    const style = {
        width: width || (variant === 'circular' ? '40px' : '100%'),
        height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '100%')
    }

    return (
        <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    )
}

// Pre-built skeleton layouts
export function TaskSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-card)]">
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" className="flex-1" height={16} />
                </div>
            ))}
        </div>
    )
}

export function HabitSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-[var(--bg-card)]">
                    <Skeleton variant="text" className="w-3/4 mb-3" height={18} />
                    <div className="flex justify-between gap-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                            <div key={d} className="flex flex-col items-center gap-1">
                                <Skeleton variant="circular" width={32} height={32} />
                                <Skeleton variant="text" width={24} height={12} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}

export function GoalSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-[var(--bg-card)]">
                    <Skeleton variant="text" className="w-2/3" height={18} />
                    <Skeleton variant="text" className="w-1/3 mt-2" height={14} />
                </div>
            ))}
        </div>
    )
}
