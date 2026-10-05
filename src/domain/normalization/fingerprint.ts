import { normalizeDescription } from './rules'

export function transactionFingerprint(params: {
  date: string
  description: string
  amount: string
  cardId: string
}): string {
  const normalized = normalizeDescription(params.description)
  return `${params.cardId}|${params.date}|${normalized}|${params.amount}`
}
