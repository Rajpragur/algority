#!/usr/bin/env node
import 'dotenv/config'
import { Command } from 'commander'
import Table from 'cli-table3'
import { loadAllResults } from '../lib/storage'
import {
  generateAggregateReportFromResults,
  filterResultsByDate,
} from '../lib/stats'
import { getSessionDifficulties } from '../lib/supabase'
import type { AggregateReport, EvalResult } from '../lib/types'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const
type Difficulty = typeof DIFFICULTIES[number]

const program = new Command()

program
  .name('eval-report')
  .description('Generate evaluation summary report')
  .option('--since <date>', 'Include sessions after this date (YYYY-MM-DD)')
  .option('-f, --format <format>', 'Output format: table, markdown', 'table')
  .option('-j, --json', 'Output as JSON')
  .option('-d, --by-difficulty', 'Segment results by problem difficulty')
  .action(async (options) => {
    try {
      // Load all results
      let results = loadAllResults()

      if (results.length === 0) {
        console.error('No evaluation results found. Run eval:check first.')
        process.exit(1)
      }

      // Apply date filter if provided
      if (options.since) {
        const sinceDate = new Date(options.since)
        if (isNaN(sinceDate.getTime())) {
          console.error(`Invalid date format: ${options.since}. Use YYYY-MM-DD`)
          process.exit(1)
        }
        results = filterResultsByDate(results, sinceDate)

        if (results.length === 0) {
          console.error(`No results found after ${options.since}`)
          process.exit(1)
        }
      }

      // Add date range info
      const dates = results.map(r => new Date(r.evaluatedAt))
      const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

      // Handle by-difficulty segmentation
      if (options.byDifficulty) {
        await outputByDifficulty(results, minDate, maxDate, options)
        return
      }

      // Generate aggregate report
      const report = generateAggregateReportFromResults(results)

      // Output in requested format
      if (options.json) {
        outputJson(report, minDate, maxDate)
      } else if (options.format === 'markdown') {
        outputMarkdown(report, minDate, maxDate)
      } else {
        outputTable(report, minDate, maxDate)
      }
    } catch (error) {
      console.error('Report generation failed:', (error as Error).message)
      process.exit(1)
    }
  })

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Group results by difficulty
async function groupByDifficulty(
  results: EvalResult[]
): Promise<Map<Difficulty, EvalResult[]>> {
  const sessionIds = results.map(r => r.sessionId)
  const difficulties = await getSessionDifficulties(sessionIds)

  const grouped = new Map<Difficulty, EvalResult[]>()
  for (const diff of DIFFICULTIES) {
    grouped.set(diff, [])
  }

  for (const result of results) {
    const difficulty = difficulties.get(result.sessionId) as Difficulty | undefined
    if (difficulty && DIFFICULTIES.includes(difficulty)) {
      grouped.get(difficulty)!.push(result)
    }
  }

  return grouped
}

// Output by difficulty segmentation
async function outputByDifficulty(
  results: EvalResult[],
  minDate: Date,
  maxDate: Date,
  options: { json?: boolean; format?: string }
): Promise<void> {
  const grouped = await groupByDifficulty(results)

  // Build segmented reports
  const segmentedReports: Record<string, AggregateReport | null> = {}
  for (const difficulty of DIFFICULTIES) {
    const diffResults = grouped.get(difficulty)!
    segmentedReports[difficulty] = diffResults.length > 0
      ? generateAggregateReportFromResults(diffResults)
      : null
  }

  // JSON output
  if (options.json) {
    const output = {
      generatedAt: new Date().toISOString(),
      totalSessions: results.length,
      dateRange: {
        from: formatDate(minDate),
        to: formatDate(maxDate),
      },
      byDifficulty: Object.fromEntries(
        DIFFICULTIES.map(d => [
          d,
          segmentedReports[d] ? {
            sessionCount: segmentedReports[d]!.sessionCount,
            overallStats: segmentedReports[d]!.overallStats,
            criterionStats: segmentedReports[d]!.criterionStats,
          } : null,
        ])
      ),
    }
    console.log(JSON.stringify(output, null, 2))
    return
  }

  // Markdown output
  if (options.format === 'markdown') {
    console.log('# Evaluation Report (By Difficulty)\n')
    console.log(`- **Total Sessions:** ${results.length}`)
    console.log(`- **Date Range:** ${formatDate(minDate)} to ${formatDate(maxDate)}`)
    console.log(`- **Generated:** ${new Date().toISOString()}\n`)

    for (const difficulty of DIFFICULTIES) {
      const report = segmentedReports[difficulty]
      console.log(`## ${difficulty}\n`)

      if (!report) {
        console.log('*No data*\n')
        continue
      }

      console.log(`**Sessions:** ${report.sessionCount}\n`)
      console.log('| Criterion | Mean | Median | StdDev |')
      console.log('|-----------|------|--------|--------|')

      for (const stat of report.criterionStats) {
        console.log(
          `| ${stat.criterion} | ${stat.mean.toFixed(3)} | ${stat.median.toFixed(3)} | ${stat.stddev.toFixed(3)} |`
        )
      }
      console.log(
        `| **Overall** | ${report.overallStats.mean.toFixed(3)} | ${report.overallStats.median.toFixed(3)} | ${report.overallStats.stddev.toFixed(3)} |`
      )
      console.log('')
    }
    return
  }

  // Table output (default)
  console.log('\nEvaluation Report (By Difficulty)')
  console.log('==================================')
  console.log(`Total Sessions: ${results.length}`)
  console.log(`Date Range: ${formatDate(minDate)} to ${formatDate(maxDate)}`)

  for (const difficulty of DIFFICULTIES) {
    const report = segmentedReports[difficulty]
    console.log(`\n${difficulty}`)
    console.log('-'.repeat(difficulty.length))

    if (!report) {
      console.log('No data')
      continue
    }

    console.log(`Sessions: ${report.sessionCount}`)

    const table = new Table({
      head: ['Criterion', 'Mean', 'Median', 'StdDev'],
      colWidths: [28, 10, 10, 10],
    })

    for (const stat of report.criterionStats) {
      table.push([
        stat.criterion,
        stat.mean.toFixed(3),
        stat.median.toFixed(3),
        stat.stddev.toFixed(3),
      ])
    }

    table.push([
      'OVERALL',
      report.overallStats.mean.toFixed(3),
      report.overallStats.median.toFixed(3),
      report.overallStats.stddev.toFixed(3),
    ])

    console.log(table.toString())
  }

  console.log(`\nGenerated: ${new Date().toISOString()}`)
}

function outputTable(report: AggregateReport, minDate: Date, maxDate: Date): void {
  console.log('\nEvaluation Report')
  console.log('=================')
  console.log(`Sessions: ${report.sessionCount}`)
  console.log(`Date Range: ${formatDate(minDate)} to ${formatDate(maxDate)}`)

  // Overall statistics table
  console.log('\nOverall Statistics')
  const overallTable = new Table({
    head: ['Metric', 'Mean', 'Median', 'StdDev'],
    colWidths: [12, 10, 10, 10],
  })

  overallTable.push([
    'Overall',
    report.overallStats.mean.toFixed(3),
    report.overallStats.median.toFixed(3),
    report.overallStats.stddev.toFixed(3),
  ])

  console.log(overallTable.toString())

  // Per-criterion breakdown table
  console.log('\nPer-Criterion Breakdown')
  const criterionTable = new Table({
    head: ['Criterion', 'Mean', 'Median', 'StdDev', 'Count'],
    colWidths: [28, 10, 10, 10, 8],
  })

  for (const stat of report.criterionStats) {
    criterionTable.push([
      stat.criterion,
      stat.mean.toFixed(3),
      stat.median.toFixed(3),
      stat.stddev.toFixed(3),
      stat.count.toString(),
    ])
  }

  console.log(criterionTable.toString())
  console.log(`\nGenerated: ${report.generatedAt}`)
}

function outputMarkdown(report: AggregateReport, minDate: Date, maxDate: Date): void {
  console.log('# Evaluation Report\n')
  console.log(`- **Sessions:** ${report.sessionCount}`)
  console.log(`- **Date Range:** ${formatDate(minDate)} to ${formatDate(maxDate)}`)
  console.log(`- **Generated:** ${report.generatedAt}\n`)

  console.log('## Overall Statistics\n')
  console.log('| Metric | Mean | Median | StdDev |')
  console.log('|--------|------|--------|--------|')
  console.log(
    `| Overall | ${report.overallStats.mean.toFixed(3)} | ${report.overallStats.median.toFixed(3)} | ${report.overallStats.stddev.toFixed(3)} |`
  )

  console.log('\n## Per-Criterion Breakdown\n')
  console.log('| Criterion | Mean | Median | StdDev | Count |')
  console.log('|-----------|------|--------|--------|-------|')

  for (const stat of report.criterionStats) {
    console.log(
      `| ${stat.criterion} | ${stat.mean.toFixed(3)} | ${stat.median.toFixed(3)} | ${stat.stddev.toFixed(3)} | ${stat.count} |`
    )
  }
}

function outputJson(report: AggregateReport, minDate: Date, maxDate: Date): void {
  const output = {
    ...report,
    dateRange: {
      from: formatDate(minDate),
      to: formatDate(maxDate),
    },
  }
  console.log(JSON.stringify(output, null, 2))
}

program.parse()
