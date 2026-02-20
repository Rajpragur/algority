import type { Phase } from '../types'

interface PhaseProgressProps {
  phases: Phase[]
  currentPhase: string
  onReviewPhase?: (phaseId: string) => void
}

export function PhaseProgress({ phases, currentPhase, onReviewPhase }: PhaseProgressProps) {
  return (
    <div className="px-4 py-3 sm:px-6 border-t border-slate-100 dark:border-slate-800/50">
      <div className="max-w-4xl mx-auto">
        {/* Mobile: Compact view */}
        <div className="sm:hidden">
          <MobilePhaseView phases={phases} currentPhase={currentPhase} onReviewPhase={onReviewPhase} />
        </div>

        {/* Desktop: Full progress bar */}
        <div className="hidden sm:block">
          <DesktopPhaseView phases={phases} currentPhase={currentPhase} onReviewPhase={onReviewPhase} />
        </div>
      </div>
    </div>
  )
}

function MobilePhaseView({ phases, currentPhase, onReviewPhase }: PhaseProgressProps) {
  const activePhase = phases.find(p => p.status === 'active') || phases.find(p => p.id === currentPhase)

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={`w-2 h-2 rounded-full ${
                phase.status === 'completed'
                  ? 'bg-emerald-500'
                  : phase.status === 'active'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-slate-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {activePhase?.title || 'Complete'}
        </span>
      </div>
      {activePhase && (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {activePhase.questionsCompleted}/{activePhase.questionsTotal}
        </span>
      )}
    </div>
  )
}

function DesktopPhaseView({ phases, currentPhase, onReviewPhase }: PhaseProgressProps) {
  return (
    <div className="flex items-center gap-2">
      {phases.map((phase, idx) => (
        <div key={phase.id} className="flex items-center flex-1">
          <button
            onClick={() => phase.status === 'completed' && onReviewPhase?.(phase.id)}
            disabled={phase.status === 'locked'}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all w-full ${
              phase.status === 'completed'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 cursor-pointer'
                : phase.status === 'active'
                ? 'bg-emerald-100 dark:bg-emerald-900/40 ring-2 ring-emerald-500/50'
                : 'bg-slate-50 dark:bg-slate-800/50 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              phase.status === 'completed'
                ? 'bg-emerald-500 text-white'
                : phase.status === 'active'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
            }`}>
              {phase.status === 'completed' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : phase.status === 'active' ? (
                <span className="text-xs font-bold">{idx + 1}</span>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0 text-left">
              <p className={`text-xs font-medium truncate ${
                phase.status === 'locked'
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {phase.title}
              </p>
              {phase.status === 'active' && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {phase.questionsCompleted}/{phase.questionsTotal} questions
                </p>
              )}
            </div>
          </button>

          {idx < phases.length - 1 && (
            <div className={`w-4 h-0.5 shrink-0 ${
              phases[idx + 1].status !== 'locked'
                ? 'bg-emerald-400 dark:bg-emerald-600'
                : 'bg-slate-200 dark:bg-slate-700'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}
