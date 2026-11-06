export interface ReadingPath {
  id: string;
  title: string;
  description: string;
  articles: string[];
}

/** Article slugs in suggested reading order. Draft articles are omitted by the page. */
export const readingPaths: ReadingPath[] = [
  {
    id: 'anxiety',
    title: 'I feel anxious',
    description:
      'Begin with busy thoughts, then make a little space around worry.',
    articles: ['when-your-mind-wont-slow-down', 'making-room-for-worry'],
  },
  {
    id: 'sleep',
    title: 'I can’t sleep',
    description:
      'Explore a gentler evening and a kinder response to a difficult night.',
    articles: ['a-gentler-way-to-end-your-day', 'when-sleep-doesnt-come'],
  },
  {
    id: 'low-mood',
    title: 'I feel low',
    description:
      'Keep the next step small, and leave room for the support you need.',
    articles: [
      'small-steps-on-low-days',
      'speaking-to-yourself-with-more-care',
      'rest-is-part-of-the-work',
    ],
  },
  {
    id: 'stress',
    title: 'I’m feeling overwhelmed',
    description:
      'Notice the demands on you and consider what a pause or a limit could look like.',
    articles: [
      'noticing-your-stress-signals',
      'rest-is-part-of-the-work',
      'boundaries-that-leave-room-for-kindness',
    ],
  },
  {
    id: 'self-kindness',
    title: 'I want to be kinder to myself',
    description: 'Try words and expectations that leave room for being human.',
    articles: [
      'speaking-to-yourself-with-more-care',
      'a-habit-small-enough-to-keep',
      'starting-again-is-part-of-change',
    ],
  },
];
