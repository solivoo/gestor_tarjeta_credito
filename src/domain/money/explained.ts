import type { ExplainedMoney } from '../../shared/types/money'
import type { Provenance } from '../../shared/types/enums'
import { Provenance as ProvenanceEnum } from '../../shared/types/enums'
import type { Decimal } from './decimal'
import { moneyString } from './decimal'

export function explained(
  amount: Decimal,
  opts: {
    currency?: string
    provenance: Provenance
    formulaId?: string
    inputs?: ExplainedMoney['inputs']
    note?: string
  },
): ExplainedMoney {
  return {
    amount: moneyString(amount),
    currency: opts.currency ?? 'USD',
    provenance: opts.provenance,
    formulaId: opts.formulaId,
    inputs: opts.inputs,
    note: opts.note,
  }
}

export function estimated(
  amount: Decimal,
  formulaId: string,
  inputs?: ExplainedMoney['inputs'],
  note?: string,
): ExplainedMoney {
  return explained(amount, {
    provenance: ProvenanceEnum.ESTIMATED,
    formulaId,
    inputs,
    note,
  })
}

export function real(amount: Decimal, note?: string): ExplainedMoney {
  return explained(amount, {
    provenance: ProvenanceEnum.REAL,
    note,
  })
}
