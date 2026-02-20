import { getProblems, getPatterns, getProblemSets } from '@/lib/data'
import { LandingPage } from '@/components/landing'

export default async function Home() {
  const [problems, patterns, problemSets] = await Promise.all([
    getProblems(100),
    getPatterns(),
    getProblemSets(),
  ])

  return <LandingPage problems={problems} patterns={patterns} problemSets={problemSets} />
}
