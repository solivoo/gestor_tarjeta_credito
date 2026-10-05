import type { CreateCreditCardInput, UpdateCreditCardInput } from '../../shared/schemas/card'
import { createCreditCardSchema, updateCreditCardSchema } from '../../shared/schemas/card'
import type { CreditCard } from '../../shared/types/entities'
import { CreditCardRepository } from '../repositories'

export class CardService {
  private readonly repo = new CreditCardRepository()

  list(userId: string): Promise<CreditCard[]> {
    return this.repo.list(userId)
  }

  get(userId: string, id: string): Promise<CreditCard | null> {
    return this.repo.getById(id, userId)
  }

  create(userId: string, input: CreateCreditCardInput): Promise<CreditCard> {
    const parsed = createCreditCardSchema.parse(input)
    return this.repo.create(userId, parsed)
  }

  update(userId: string, id: string, input: UpdateCreditCardInput): Promise<CreditCard> {
    const parsed = updateCreditCardSchema.parse(input)
    return this.repo.update(id, userId, parsed)
  }

  delete(userId: string, id: string): Promise<void> {
    return this.repo.delete(id, userId)
  }
}
