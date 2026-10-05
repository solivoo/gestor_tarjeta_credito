import type { CreatePaymentInput } from '../../shared/ipc/api'
import type { Payment } from '../../shared/types/entities'
import { PaymentRepository } from '../repositories'

export class PaymentService {
  private readonly repo = new PaymentRepository()

  list(userId: string, creditCardId?: string): Promise<Payment[]> {
    return this.repo.list(userId, creditCardId)
  }

  create(userId: string, input: CreatePaymentInput): Promise<Payment> {
    return this.repo.create(userId, input)
  }
}
