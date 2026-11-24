export type ClipStatus = 'unclaimed' | 'licensed' | 'removing'

export interface Clip {
  id: string
  title: string
  show: string
  length: string
  lead: string
  quote: string
  status: ClipStatus
}

export const CLIPS: Clip[] = [
  { id: 'a', title: 'Why sleep debt is real', show: 'The Long Answer', length: '0:48', lead: "Here's the thing,", quote: "you can't pay back sleep on a Saturday.", status: 'licensed' },
  { id: 'b', title: 'The one habit behind compounding', show: 'The Long Answer', length: '0:52', lead: "It isn't clever.", quote: 'Small, boring, every single day.', status: 'licensed' },
  { id: 'c', title: 'What nobody tells you about grants', show: 'The Long Answer', length: '0:37', lead: 'Honestly,', quote: 'the deadline is the easy part.', status: 'unclaimed' },
  { id: 'd', title: 'Is coffee actually bad?', show: 'Maya Rao', length: '1:04', lead: 'One cup is fine.', quote: "It's the third cup that gets you.", status: 'unclaimed' },
  { id: 'e', title: 'How labs pick what to study', show: 'Maya Rao', length: '0:44', lead: 'Want the truth?', quote: 'Follow the funding, not the question.', status: 'unclaimed' },
  { id: 'f', title: 'Inflation, in one minute', show: 'The Long Answer', length: '0:59', lead: 'Same salary,', quote: 'and it buys less every month.', status: 'removing' },
]

export const ARC_CLIPS = [
  { show: 'Science', lead: "Here's the thing,", quote: "you can't pay back sleep on a Saturday.", tone: 'red' },
  { show: 'Money', lead: "It isn't clever.", quote: 'Small, boring, every single day.', tone: 'yel' },
  { show: 'Health', lead: 'One cup is fine.', quote: "It's the third cup that gets you.", tone: 'cya' },
  { show: 'Ideas', lead: 'Want the truth?', quote: 'Follow the funding, not the question.', tone: 'cre' },
  { show: 'News', lead: 'Same salary,', quote: 'and it buys less every month.', tone: 'red' },
  { show: 'Business', lead: 'Honestly,', quote: 'the deadline is the easy part.', tone: 'yel' },
  { show: 'Comedy', lead: 'My mum asked,', quote: '"is a podcast like radio but sadder?"', tone: 'cya' },
  { show: 'History', lead: 'Nobody remembers', quote: 'the second person to do it.', tone: 'cre' },
  { show: 'Tech', lead: 'The trick is,', quote: 'ship it before you love it.', tone: 'red' },
] as const

export const TOPICS = ['Science', 'Business', 'Comedy', 'News', 'Health', 'History', 'Tech', 'Sport', 'Ideas', 'Culture', 'Money', 'Faith']
