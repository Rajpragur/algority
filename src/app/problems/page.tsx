import { getProblems, getPatterns, getProblemSets } from '@/lib/data'
import { ProblemWorkspace } from '@/components/problem-workspace'

interface ProblemsPageProps {
  searchParams: Promise<{ set?: string }>
}

export default async function ProblemsPage({ searchParams }: ProblemsPageProps) {
  const params = await searchParams
  const [problems, patterns, problemSets] = await Promise.all([
    getProblems(100),
    getPatterns(),
    getProblemSets(),
  ])

  return (
    <ProblemWorkspace
      problems={problems}
      patterns={patterns}
      problemSets={problemSets}
      initialProblemSet={params.set || null}
    />
  )
}
