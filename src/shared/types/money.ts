import type { Provenance } from './enums'

/** Serialized money amount as decimal string for IPC / persistence. */
export type MoneyString = string

export interface ExplainedMoney {
  amount: MoneyString
  currency: string
  provenance: Provenance
  formulaId?: string
  inputs?: Record<string, MoneyString | number | string | boolean>
  note?: string
}
