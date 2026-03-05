export interface Badge {
  id: string
  emoji: string
  label: string
  description: string
  earned: boolean
}

export function computeBadges(reviewCount: number, isTrusted: boolean): Badge[] {
  return [
    {
      id: 'first_review',
      emoji: '🌱',
      label: 'First Steps',
      description: 'Submit your first review',
      earned: reviewCount >= 1,
    },
    {
      id: 'ten_reviews',
      emoji: '🔟',
      label: '10 Reviews',
      description: 'Review 10 videos',
      earned: reviewCount >= 10,
    },
    {
      id: 'fifty_reviews',
      emoji: '🏅',
      label: '50 Reviews',
      description: 'Review 50 videos',
      earned: reviewCount >= 50,
    },
    {
      id: 'century',
      emoji: '💯',
      label: 'Century',
      description: 'Review 100 videos',
      earned: reviewCount >= 100,
    },
    {
      id: 'trusted',
      emoji: '⭐',
      label: 'Trusted Reviewer',
      description: 'Earned through consistent, high-quality reviews',
      earned: isTrusted,
    },
  ]
}
