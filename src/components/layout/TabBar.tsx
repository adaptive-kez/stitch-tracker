import { ListTodo, CheckSquare, TrendingUp, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

export type TabType = 'tasks' | 'habits' | 'goals' | 'analytics'

interface TabBarProps {
    activeTab: TabType
    onTabChange: (tab: TabType) => void
}

const tabs: { id: TabType; label: string; icon: typeof ListTodo }[] = [
    { id: 'tasks', label: 'Задачи', icon: ListTodo },
    { id: 'habits', label: 'Привычки', icon: CheckSquare },
    { id: 'goals', label: 'Цели на год', icon: TrendingUp },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
]

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 flex justify-around items-center py-2 pb-[max(var(--safe-bottom),12px)] bg-[var(--bg-primary)] border-t border-[var(--border-subtle)]"
        >
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                const Icon = tab.icon

                return (
                    <motion.button
                        key={tab.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onTabChange(tab.id)}
                        className="flex flex-col items-center gap-1 px-3 py-1"
                    >
                        <Icon
                            size={22}
                            className={isActive ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'}
                        />
                        <span
                            className={`text-[10px] font-medium ${isActive ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'
                                }`}
                        >
                            {tab.label}
                        </span>
                    </motion.button>
                )
            })}
        </nav>
    )
}
