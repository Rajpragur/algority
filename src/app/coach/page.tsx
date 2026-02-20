import { getUserSessions, getPatterns } from '@/lib/data'
import { SessionsDashboard } from '@/components/socratic-coach/SessionsDashboard'

export default async function CoachIndexPage() {
  const [sessions, patterns] = await Promise.all([
    getUserSessions(),
    getPatterns(),
  ])

  return <SessionsDashboard sessions={sessions} patterns={patterns} />
}
