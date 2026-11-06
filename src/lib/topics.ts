export const topics = [
  { slug: 'anxiety', name: 'Anxiety', description: 'Make a little room around worry, uncertainty, and a busy mind.', icon: 'waves' },
  { slug: 'low-mood', name: 'Low mood', description: 'Gentle ways to understand difficult days and find support.', icon: 'window' },
  { slug: 'stress-burnout', name: 'Stress & burnout', description: 'Notice your limits and explore a more sustainable pace.', icon: 'plant' },
  { slug: 'relationships', name: 'Relationships', description: 'Connection, communication, and the boundaries we need.', icon: 'paths' },
  { slug: 'sleep', name: 'Sleep', description: 'A calmer relationship with rest, one evening at a time.', icon: 'moon' },
  { slug: 'self-esteem', name: 'Self-esteem', description: 'Meet yourself with less judgment and more understanding.', icon: 'stones' },
  { slug: 'grief-loss', name: 'Grief & loss', description: 'Space for loss, change, and your own way through.', icon: 'window' },
  { slug: 'habits-growth', name: 'Habits & growth', description: 'Small, thoughtful changes that fit your everyday life.', icon: 'plant' },
] as const;
export type TopicSlug = (typeof topics)[number]['slug'];
export const topicBySlug = (slug: string) => topics.find((topic) => topic.slug === slug)!;
