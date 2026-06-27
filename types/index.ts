// types/index.ts

export type TechType = 'sql' | 'python' | 'bi' | 'ai' | 'git' | 'js' | 'design' | 'other'

export interface TechItem {
  name: string
  type: TechType
}

export interface Resource {
  name: string
  url: string
}

export interface Task {
  id: string
  roadmapId: string
  projectId?: string | null
  day: number
  title: string
  description?: string | null
  techStack?: TechItem[] | null
  resources?: Resource[] | null
  done: boolean
  doneAt?: Date | null
  notes?: string | null
  createdAt: Date
  project?: Project | null
}

export interface Project {
  id: string
  roadmapId: string
  name: string
  color: string
  order: number
  startDay: number
  endDay: number
  tasks?: Task[]
}

export interface Reminder {
  id: string
  roadmapId: string
  time: string
  enabled: boolean
  message?: string | null
  days: number[]
}

export interface Roadmap {
  id: string
  userId: string
  title: string
  goal: string
  description?: string | null
  totalDays: number
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'PAUSED'
  createdBy: 'MANUAL' | 'AI'
  color: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date | null
  projects?: Project[]
  tasks?: Task[]
  reminders?: Reminder[]
  report?: Report | null
}

export interface Report {
  id: string
  roadmapId: string
  totalDays: number
  completedDays: number
  completionRate: number
  streakMax: number
  avgDailyTime?: number | null
  topSkills: string[]
  projectsData: ProjectReportData[]
  timelineData: TimelinePoint[]
  generatedAt: Date
  summary?: string | null
}

export interface ProjectReportData {
  name: string
  completed: number
  total: number
  color: string
}

export interface TimelinePoint {
  day: number
  done: boolean
  doneAt?: string
}

export interface Settings {
  id: string
  userId: string
  notificationsEnabled: boolean
  defaultReminderTime: string
  timezone: string
  theme: string
}

// AI Generator types
export interface AIRoadmapInput {
  goal: string
  background: string
  days: number
  hoursPerDay: number
  focusAreas?: string
}

export interface AIGeneratedRoadmap {
  title: string
  goal: string
  description: string
  days: number
  projects: {
    name: string
    color: string
    startDay: number
    endDay: number
  }[]
  tasks: {
    day: number
    projectIndex: number
    title: string
    description: string
    techStack: TechItem[]
    resources: Resource[]
  }[]
}

// Dashboard stats
export interface DashboardStats {
  totalRoadmaps: number
  activeRoadmaps: number
  completedRoadmaps: number
  totalTasksDoneToday: number
  currentStreak: number
  todayTasks: Task[]
}
