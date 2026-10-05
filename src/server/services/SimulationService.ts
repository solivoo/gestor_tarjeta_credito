import {
  compareScenarios,
  simulateDebt,
  simulateNewPurchaseImpact,
} from '../../domain/simulations'
import type {
  ComparisonResult,
  PurchaseImpactInput,
  PurchaseImpactResult,
  SimulationInput,
  SimulationResult,
} from '../../shared/types/simulation'

export class SimulationService {
  debt(input: SimulationInput): SimulationResult {
    return simulateDebt(input)
  }

  compare(base: SimulationInput, extraPayment: string): ComparisonResult {
    return compareScenarios(base, extraPayment)
  }

  purchaseImpact(input: PurchaseImpactInput): PurchaseImpactResult {
    return simulateNewPurchaseImpact(input)
  }
}
