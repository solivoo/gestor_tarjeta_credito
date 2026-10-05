import type { CreateStatementInput } from '../../shared/ipc/api'
import type { Statement } from '../../shared/types/entities'
import { StatementRepository } from '../repositories'

export class StatementService {
  private readonly repo = new StatementRepository()

  list(userId: string, creditCardId?: string): Promise<Statement[]> {
    return this.repo.list(userId, creditCardId)
  }

  get(userId: string, id: string): Promise<Statement | null> {
    return this.repo.getById(id, userId)
  }

  create(userId: string, input: CreateStatementInput): Promise<Statement> {
    return this.repo.create(userId, input)
  }
}
