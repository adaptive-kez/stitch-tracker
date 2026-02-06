import { useState, useEffect, lazy, Suspense } from 'react'
import { Header } from './components/layout/Header'
import { TabBar, type TabType } from './components/layout/TabBar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { TaskSkeleton, HabitSkeleton, GoalSkeleton } from './components/Skeleton'
import { CalendarModal } from './components/ui/CalendarModal'
import { motion, AnimatePresence } from 'framer-motion'
import { useTelegram } from './hooks/useTelegram'
import { useTasks } from './hooks/useTasks'
import { useHabits } from './hooks/useHabits'
import { useHabitLogs } from './hooks/useHabitLogs'
import { useGoals } from './hooks/useGoals'
import { useJournal } from './hooks/useJournal'
import { useUser } from './hooks/useUser'
import { tg } from './lib/telegram'
import { scheduleNotification } from './lib/notifications'
import type { JournalType, RecurrenceRule } from './types'

// M4: Code splitting with lazy loading
const TasksScreen = lazy(() => import('./screens/TasksScreen').then(m => ({ default: m.TasksScreen })))
const HabitsScreen = lazy(() => import('./screens/HabitsScreen').then(m => ({ default: m.HabitsScreen })))
const GoalsScreen = lazy(() => import('./screens/GoalsScreen').then(m => ({ default: m.GoalsScreen })))
const AnalyticsScreen = lazy(() => import('./screens/AnalyticsScreen').then(m => ({ default: m.AnalyticsScreen })))
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })))

// Loading skeleton based on tab
function TabSkeleton({ tab }: { tab: TabType }) {
  switch (tab) {
    case 'tasks':
      return <TaskSkeleton />
    case 'habits':
      return <HabitSkeleton />
    case 'goals':
      return <GoalSkeleton />
    default:
      return <div className="animate-pulse h-64 bg-[var(--bg-card)] rounded-xl" />
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('tasks')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  // Telegram WebApp integration
  const { user: telegramUser } = useTelegram()
  // User profile with updateProfile function
  const { user: dbUser, updateProfile } = useUser(telegramUser)

  // Use Supabase user UUID (id) for all database operations
  const userId = dbUser?.id || null

  // M1: Supabase integration with proper hooks
  const {
    tasks,
    isLoading: tasksLoading,
    addTask,
    toggleTask
  } = useTasks(userId)

  const {
    habits,
    isLoading: habitsLoading,
    addHabit
  } = useHabits(userId)

  const {
    goals,
    isLoading: goalsLoading,
    addGoal,
    toggleGoal
  } = useGoals(userId)

  // Habit logs for tracking completion
  const {
    toggleHabitLog,
    isHabitCompleted,
  } = useHabitLogs(userId)

  // Journal integration
  const {
    entries: journalEntries,
    addEntry: addJournalEntry,
  } = useJournal(userId)

  // Handler for adding journal entries
  const handleAddJournalEntry = (type: JournalType, content: string) => {
    const dateISO = selectedDate.toISOString().split('T')[0]
    addJournalEntry(type, content, dateISO)
  }

  // Initialize Telegram WebApp
  useEffect(() => {
    tg.ready()
  }, [])

  // Transform Supabase data to screen format
  const selectedDateISO = selectedDate.toISOString().split('T')[0]

  const transformedTasks = tasks
    .filter(t => t.date === selectedDateISO) // Only show tasks for selected date
    .map(t => ({
      id: t.id,
      title: t.title,
      completed: t.is_completed,
      date: t.date,
      isImportant: t.is_important,
      hasNotification: t.has_notification,
    }))

  // Calculate completed days for each habit from logs
  const getCompletedDaysForHabit = (habitId: string): number[] => {
    // Get current week's dates
    const today = new Date()
    const startOfWeek = new Date(today)
    const dayOfWeek = today.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startOfWeek.setDate(today.getDate() - diffToMonday)
    startOfWeek.setHours(0, 0, 0, 0)

    const completedDays: number[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      if (isHabitCompleted(habitId, dateStr)) {
        completedDays.push(i)
      }
    }
    return completedDays
  }

  const transformedHabits = habits.map(h => ({
    id: h.id,
    title: h.title,
    completedDays: getCompletedDaysForHabit(h.id),
    startDate: h.start_date,
    endDate: h.end_date,
    hasNotification: h.has_notification,
    recurrenceRule: h.recurrence_rule,
  }))

  const transformedGoals = goals.map(g => ({
    id: g.id,
    title: g.title,
    year: g.year,
    deadline: g.deadline,
    isCompleted: g.is_completed,
  }))

  // Handlers now use Supabase hooks
  const handleAddTask = async (taskData: { title: string; date: string; isImportant: boolean; hasNotification: boolean; notificationTime?: string }) => {
    addTask(taskData.title, taskData.date)

    // Send notification if enabled
    if (taskData.hasNotification && telegramUser?.id) {
      const scheduledTime = taskData.notificationTime
        ? `${taskData.date}T${taskData.notificationTime}:00`
        : `${taskData.date}T09:00:00`

      await scheduleNotification({
        chatId: telegramUser.id,
        message: `📋 ${taskData.title}\n\nДата: ${taskData.date}`,
        type: 'task',
        scheduledTime,
      })
    }
  }

  const handleToggleTask = (id: string) => {
    toggleTask(id)
  }

  const handleAddHabit = (habitData: {
    title: string
    startDate: string
    endDate?: string
    hasNotification: boolean
    recurrenceRule?: RecurrenceRule
  }) => {
    addHabit(habitData.title)
  }

  const handleAddGoal = (goalData: { title: string; year: number; deadline?: string }) => {
    addGoal(goalData.title)
  }

  // Handle habit day toggle - convert day index to date and call toggleHabitLog
  const handleToggleHabitDay = (habitId: string, dayIndex: number) => {
    const today = new Date()
    const startOfWeek = new Date(today)
    const dayOfWeek = today.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startOfWeek.setDate(today.getDate() - diffToMonday)
    startOfWeek.setHours(0, 0, 0, 0)

    const targetDate = new Date(startOfWeek)
    targetDate.setDate(startOfWeek.getDate() + dayIndex)
    const dateStr = targetDate.toISOString().split('T')[0]

    toggleHabitLog(habitId, dateStr)
  }

  // Date navigation
  const goToPreviousDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    setSelectedDate(prev)
  }

  const goToNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    setSelectedDate(next)
  }

  // Loading state for current tab
  const isLoading =
    (activeTab === 'tasks' && tasksLoading) ||
    (activeTab === 'habits' && habitsLoading) ||
    (activeTab === 'goals' && goalsLoading)

  // Render active screen
  const renderScreen = () => {
    if (showSettings) {
      return (
        <Suspense fallback={<div className="p-4"><TaskSkeleton /></div>}>
          <SettingsScreen
            onClose={() => setShowSettings(false)}
            onUpdateProfile={updateProfile}
            userProfile={dbUser}
          />
        </Suspense>
      )
    }

    // Show skeleton while loading
    if (isLoading) {
      return (
        <div className="flex-1 px-4 space-y-4">
          <TabSkeleton tab={activeTab} />
        </div>
      )
    }

    switch (activeTab) {
      case 'tasks':
        return (
          <Suspense fallback={<div className="p-4"><TaskSkeleton /></div>}>
            <TasksScreen
              tasks={transformedTasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              selectedDate={selectedDate}
              journalEntries={journalEntries}
              onAddJournalEntry={handleAddJournalEntry}
            />
          </Suspense>
        )
      case 'habits':
        return (
          <Suspense fallback={<div className="p-4"><HabitSkeleton /></div>}>
            <HabitsScreen
              habits={transformedHabits}
              onAddHabit={handleAddHabit}
              onToggleHabitDay={handleToggleHabitDay}
              selectedDate={selectedDate}
            />
          </Suspense>
        )
      case 'goals':
        return (
          <Suspense fallback={<div className="p-4"><GoalSkeleton /></div>}>
            <GoalsScreen
              goals={transformedGoals}
              onAddGoal={handleAddGoal}
              onToggleGoal={toggleGoal}
            />
          </Suspense>
        )
      case 'analytics':
        return (
          <Suspense fallback={<div className="p-4"><TaskSkeleton /></div>}>
            <AnalyticsScreen
              tasks={transformedTasks}
              habits={transformedHabits}
            />
          </Suspense>
        )
      default:
        return null
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {!showSettings && (
          <Header
            title="Сегодня"
            subtitle={`Пт. ${selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`}
            showDateSelector={activeTab === 'tasks'}
            onPrevious={goToPreviousDay}
            onNext={goToNextDay}
            onCalendar={() => setShowCalendar(!showCalendar)}
            onSettings={() => setShowSettings(true)}
            user={telegramUser ? {
              firstName: dbUser?.first_name || telegramUser.first_name,
              photoUrl: dbUser?.photo_url || telegramUser.photo_url
            } : undefined}
          />
        )}

        {/* Calendar Modal */}
        <CalendarModal
          isOpen={showCalendar}
          onClose={() => setShowCalendar(false)}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          tasks={transformedTasks}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={showSettings ? 'settings' : activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </main>

        {!showSettings && (
          <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
