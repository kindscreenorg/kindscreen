export const MILESTONES = [
  {
    id: 'launch',
    emoji: '🎯',
    amount: 0,
    label: 'Launch',
    description: 'Human-only parent review — live now.',
    reached: true,
  },
  {
    id: 'whisper',
    emoji: '🎙️',
    amount: 200,
    label: '€200 / month',
    description:
      'Add Whisper audio transcription to pre-screen videos before human review, catching bad language and adult content automatically.',
    reached: false,
  },
  {
    id: 'ai_vision',
    emoji: '🤖',
    amount: 500,
    label: '€500 / month',
    description:
      'Add AI frame analysis — a vision model inspects video frames for violence, scary content, and adult themes, giving reviewers a detailed pre-screening report.',
    reached: false,
  },
] as const

export type Milestone = typeof MILESTONES[number]

export function progressPercent(current: number, target: number): number {
  if (target === 0) return 100
  return Math.min(100, Math.round((current / target) * 100))
}
