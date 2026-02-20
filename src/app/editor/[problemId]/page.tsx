import { notFound } from 'next/navigation'
import { getProblemWithTestData, getCoachingInsightsForProblem } from '@/lib/data'
import { EditorClient } from '@/components/code-editor/EditorClient'

export default async function EditorPage({
  params,
}: {
  params: Promise<{ problemId: string }>
}) {
  const { problemId } = await params
  const id = parseInt(problemId, 10)

  if (isNaN(id)) {
    notFound()
  }

  // Fetch problem (with test data for code execution) and coaching insights in parallel
  const [problem, insights] = await Promise.all([
    getProblemWithTestData(id),
    getCoachingInsightsForProblem(id),
  ])

  if (!problem) {
    notFound()
  }

  return <EditorClient problem={problem} insights={insights} />
}
