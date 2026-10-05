import type { CreateCreditCardInput, UpdateCreditCardInput } from '../../shared/schemas/card'
import type {
  CreditCard,
  ImportBatch,
  Payment,
  Statement,
  Transaction,
} from '../../shared/types/entities'
import type {
  ImportCommitInput,
  ImportCommitResult,
  ImportPreviewResult,
} from '../../shared/types/import'
import type { ComparisonResult, SimulationInput } from '../../shared/types/simulation'

export type AuthUser = {
  id: string
  email: string
  name: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const data = (await response.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  auth: {
    me: () => request<{ user: AuthUser }>('/api/auth/me'),
    register: (input: { email: string; password: string; name: string }) =>
      request<{ user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    login: (input: { email: string; password: string }) =>
      request<{ user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  },
  cards: {
    list: () => request<CreditCard[]>('/api/cards'),
    get: (id: string) => request<CreditCard>(`/api/cards/${id}`),
    create: (input: CreateCreditCardInput) =>
      request<CreditCard>('/api/cards', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: string, input: UpdateCreditCardInput) =>
      request<CreditCard>(`/api/cards/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    delete: (id: string) =>
      request<{ ok: boolean }>(`/api/cards/${id}`, { method: 'DELETE' }),
  },
  statements: {
    list: (creditCardId?: string) => {
      const qs = creditCardId ? `?creditCardId=${encodeURIComponent(creditCardId)}` : ''
      return request<Statement[]>(`/api/statements${qs}`)
    },
  },
  transactions: {
    list: (filters?: { creditCardId?: string; statementId?: string }) => {
      const params = new URLSearchParams()
      if (filters?.creditCardId) params.set('creditCardId', filters.creditCardId)
      if (filters?.statementId) params.set('statementId', filters.statementId)
      const qs = params.toString()
      return request<Transaction[]>(`/api/transactions${qs ? `?${qs}` : ''}`)
    },
  },
  payments: {
    list: (creditCardId?: string) => {
      const qs = creditCardId ? `?creditCardId=${encodeURIComponent(creditCardId)}` : ''
      return request<Payment[]>(`/api/payments${qs}`)
    },
  },
  import: {
    listBatches: (creditCardId?: string) => {
      const qs = creditCardId ? `?creditCardId=${encodeURIComponent(creditCardId)}` : ''
      return request<ImportBatch[]>(`/api/import/batches${qs}`)
    },
    deleteBatch: (importBatchId: string) =>
      request<{ deletedStatements: number }>(`/api/import/batches/${importBatchId}`, {
        method: 'DELETE',
      }),
    preview: async (file: File, creditCardId?: string) => {
      const body = new FormData()
      body.append('file', file)
      if (creditCardId) body.append('creditCardId', creditCardId)
      return request<ImportPreviewResult>('/api/import/preview', { method: 'POST', body })
    },
    commit: (input: ImportCommitInput) =>
      request<ImportCommitResult>('/api/import/commit', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
  },
  simulate: {
    compare: (payload: { base: SimulationInput; extraPayment: string }) =>
      request<ComparisonResult>('/api/simulate/compare', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
}

/** Compat con páginas existentes. */
export function getApi() {
  return api
}
