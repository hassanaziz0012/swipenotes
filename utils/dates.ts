
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getNextReviewDate(lastSeen: Date | null, intervalDays: number): Date | null {
  if (!lastSeen) return null;
  const nextReview = new Date(lastSeen);
  nextReview.setDate(nextReview.getDate() + intervalDays);
  return nextReview;
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 1) return '1 day ago';
    if (absDays < 7) return `${absDays} days ago`;
    if (absDays < 14) return '1 week ago';
    if (absDays < 30) return `${Math.floor(absDays / 7)} weeks ago`;
    if (absDays < 60) return '1 month ago';
    return `${Math.floor(absDays / 30)} months ago`;
  }
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays < 7) return `${diffDays} days later`;
  if (diffDays < 14) return '1 week later';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks later`;
  if (diffDays < 60) return '1 month later';
  return `${Math.floor(diffDays / 30)} months later`;
}
