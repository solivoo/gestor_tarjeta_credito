import type { Transaction } from '../../shared/types/entities'
import { TransactionRepository } from '../repositories'

export class TransactionService {
  private readonly repo = new TransactionRepository()

  list(
    userId: string,
    filters?: { creditCardId?: string; statementId?: string },
  ): Promise<Transaction[]> {
    return this.repo.list(userId, filters)
  }
}
