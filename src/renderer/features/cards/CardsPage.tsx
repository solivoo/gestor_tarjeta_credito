import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, DataGrid, NumberBox, Select, TextBox, useToast, type ColumnDef } from 'glubox'
import {
  createCreditCardSchema,
  type CreateCreditCardInput,
} from '../../../shared/schemas/card'
import { MinimumPaymentRuleKind, RateMethod } from '../../../shared/types/enums'
import type { CreditCard } from '../../../shared/types/entities'
import { getApi } from '../../lib/api'
import { formatUsd } from '../../lib/format'
import { useSessionStore } from '../../store/session'

type CardRow = CreditCard & Record<string, unknown>

const defaults: CreateCreditCardInput = {
  name: '',
  issuer: 'Produbanco',
  maskedNumber: null,
  creditLimit: '3180.98',
  currency: 'USD',
  annualInterestRate: '0.1677',
  monthlyInterestRate: null,
  rateMethod: RateMethod.EFFECTIVE_TO_MONTHLY,
  minimumPaymentRule: {
    kind: MinimumPaymentRuleKind.GREATER_OF,
    percentage: '0.05',
    fixedAmount: '20',
  },
  cutoffDay: 15,
  paymentDueDay: 5,
}

function toFormValues(card: CreditCard): CreateCreditCardInput {
  return {
    name: card.name,
    issuer: card.issuer,
    maskedNumber: card.maskedNumber,
    creditLimit: card.creditLimit,
    currency: card.currency,
    annualInterestRate: card.annualInterestRate,
    monthlyInterestRate: card.monthlyInterestRate,
    rateMethod: card.rateMethod,
    minimumPaymentRule: card.minimumPaymentRule,
    cutoffDay: card.cutoffDay,
    paymentDueDay: card.paymentDueDay,
  }
}

export function CardsPage() {
  const { show } = useToast()
  const [cards, setCards] = useState<CardRow[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const setSelectedCardId = useSessionStore((s) => s.setSelectedCardId)
  const { control, handleSubmit, reset, formState } = useForm<CreateCreditCardInput>({
    resolver: zodResolver(createCreditCardSchema),
    defaultValues: defaults,
  })

  async function reload() {
    setCards((await getApi().cards.list()) as CardRow[])
  }

  useEffect(() => {
    void reload()
  }, [])

  function startEdit(card: CardRow) {
    setEditingId(card.id)
    reset(toFormValues(card))
    setSelectedCardId(card.id)
  }

  function cancelEdit() {
    setEditingId(null)
    reset(defaults)
  }

  const onSubmit = handleSubmit(async (values) => {
    if (editingId) {
      const card = await getApi().cards.update(editingId, values)
      setSelectedCardId(card.id)
      setEditingId(null)
      reset(defaults)
      await reload()
      show({
        title: 'Tarjeta actualizada',
        message: card.name,
        variant: 'success',
      })
      return
    }

    const card = await getApi().cards.create(values)
    setSelectedCardId(card.id)
    reset(defaults)
    await reload()
    show({
      title: 'Tarjeta guardada',
      message: card.name,
      variant: 'success',
    })
  })

  const columns: ColumnDef<CardRow>[] = useMemo(
    () => [
      { key: 'name', header: 'Nombre', sortable: true },
      { key: 'issuer', header: 'Emisor', sortable: true },
      {
        key: 'creditLimit',
        header: 'Cupo',
        align: 'right',
        renderCell: (value) => formatUsd(String(value)),
      },
      {
        key: 'rateMethod',
        header: 'Método',
        renderCell: (_v, row) =>
          `${row.annualInterestRate ?? row.monthlyInterestRate} (${row.rateMethod})`,
      },
      {
        key: 'id',
        header: 'Acciones',
        width: 200,
        renderCell: (_v, row) => (
          <div className="row" style={{ gap: '0.4rem' }}>
            <Button
              size="sm"
              variant={editingId === row.id ? 'primary' : 'outline'}
              onClick={() => startEdit(row)}
            >
              Editar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedCardId(row.id)}>
              Usar
            </Button>
          </div>
        ),
      },
    ],
    [editingId, setSelectedCardId],
  )

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Mis tarjetas</h1>
          <p>Crea o edita tasas y regla de mínimo por emisor.</p>
        </div>
      </header>

      <div className="panel">
        <h2>{editingId ? 'Editar tarjeta' : 'Nueva tarjeta'}</h2>
        <form className="stack" onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-field">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextBox
                    label="Nombre"
                    labelPosition="outlined"
                    width="100%"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </div>
            <div className="form-field">
              <Controller
                name="issuer"
                control={control}
                render={({ field }) => (
                  <TextBox
                    label="Emisor"
                    labelPosition="outlined"
                    width="100%"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </div>
            <div className="form-field">
              <Controller
                name="creditLimit"
                control={control}
                render={({ field }) => (
                  <TextBox
                    label="Cupo"
                    labelPosition="outlined"
                    width="100%"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <Controller
                name="cutoffDay"
                control={control}
                render={({ field }) => (
                  <NumberBox
                    label="Día de corte"
                    labelPosition="outlined"
                    width="100%"
                    min={1}
                    max={31}
                    step={1}
                    value={String(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </div>
            <div className="form-field">
              <Controller
                name="paymentDueDay"
                control={control}
                render={({ field }) => (
                  <NumberBox
                    label="Día de pago"
                    labelPosition="outlined"
                    width="100%"
                    min={1}
                    max={31}
                    step={1}
                    value={String(field.value)}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </div>
            <div className="form-field">
              <Controller
                name="annualInterestRate"
                control={control}
                render={({ field }) => (
                  <TextBox
                    label="Tasa anual"
                    labelPosition="outlined"
                    width="100%"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
            </div>
            <div className="form-field">
              <Controller
                name="rateMethod"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Método de tasa"
                    labelPosition="outlined"
                    width="100%"
                    value={field.value}
                    onChange={field.onChange}
                    options={[
                      { value: RateMethod.NOMINAL_DIV_12, label: 'Nominal / 12' },
                      {
                        value: RateMethod.EFFECTIVE_TO_MONTHLY,
                        label: 'Efectiva → mensual',
                      },
                      { value: RateMethod.MONTHLY_DIRECT, label: 'Mensual directa' },
                    ]}
                  />
                )}
              />
            </div>
          </div>
          {(formState.errors.name || formState.errors.issuer) && (
            <p className="alert">
              {formState.errors.name?.message ?? formState.errors.issuer?.message}
            </p>
          )}
          <div className="row">
            <Button type="submit" variant="primary">
              {editingId ? 'Guardar cambios' : 'Guardar tarjeta'}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="panel">
        {cards.length ? (
          <DataGrid dataSource={cards} keyExpr="id" columns={columns} />
        ) : (
          <div className="empty">Sin tarjetas todavía.</div>
        )}
      </div>
    </div>
  )
}
