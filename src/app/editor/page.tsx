import { getProblems, getUserSessions } from '@/lib/data'
import { EditorDashboard } from '@/components/editor-dashboard'

export default async function EditorIndexPage() {
  const [problems, sessions] = await Promise.all([
    getProblems(100),
    getUserSessions().catch(() => []), // Gracefully handle unauthenticated users
  ])

  // Extract unique problems from sessions with their most recent access time
  const recentFromCoaching = sessions
    .map((session) => ({
      problemId: session.problem.id,
      lastAccessed: session.updatedAt || session.startedAt,
    }))
    // Deduplicate by problem ID, keeping the most recent
    .reduce(
      (acc, curr) => {
        const existing = acc.find((a) => a.problemId === curr.problemId)
        if (!existing) {
          acc.push(curr)
        } else if (new Date(curr.lastAccessed) > new Date(existing.lastAccessed)) {
          existing.lastAccessed = curr.lastAccessed
        }
        return acc
      },
      [] as Array<{ problemId: number; lastAccessed: string }>
    )
    // Sort by most recent first
    .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())

  return <EditorDashboard problems={problems} recentFromCoaching={recentFromCoaching} />
}
