import { useEffect, useState } from 'react'
import { NumberBox, Select } from 'glubox'
import type { CreditCard, Statement } from '../../../shared/types/entities'
import type { ComparisonResult } from '../../../shared/types/simulation'
import { getApi } from '../../lib/api'
import { formatUsd } from '../../lib/format'
import { buildSimulationInput } from '../../lib/simulationInput'
import { useSessionStore } from '../../store/session'

export function ExitPlanPage() {
  const selectedCardId = useSessionStore((s) => s.selectedCardId)
  const setSelectedCardId = useSessionStore((s) => s.setSelectedCardId)
  const [cards, setCards] = useState<CreditCard[]>([])
  const [card, setCard] = useState<CreditCard | null>(null)
  const [statement, setStatement] = useState<Statement | null>(null)
  const [canPay, setCanPay] = useState('')
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const list = await getApi().cards.list()
      setCards(list)
      if (!selectedCardId && list[0]) setSelectedCardId(list[0].id)
    })()
  }, [selectedCardId, setSelectedCardId])

  useEffect(() => {
    if (!selectedCardId) return
    void (async () => {
      const api = getApi()
      setCard(await api.cards.get(selectedCardId))
      const statements = await api.statements.list(selectedCardId)
      setStatement(statements[0] ?? null)
    })()
  }, [selectedCardId])

  useEffect(() => {
    if (!card || !statement || !canPay) {
      setComparison(null)
      return
    }
    const min = Number(statement.minimumPayment)
    const pay = Number(canPay)
    if (!Number.isFinite(pay)) return
    const extra = Math.max(0, pay - min)

    try {
      const base = buildSimulationInput(card, statement)
      void (async () => {
        setError(null)
        setComparison(
          await getApi().simulate.compare({
            base,
            extraPayment: String(extra),
          }),
        )
      })()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error en plan de salida')
    }
  }, [card, statement, canPay])

  const min = statement ? Number(statement.minimumPayment) : 0
  const pay = Number(canPay)
  const extra = Number.isFinite(pay) && canPay !== '' ? Math.max(0, pay - min) : 0

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Plan de salida</h1>
          <p>
            Escribe cuánto puedes pagar este mes. Comparamos contra el mínimo sobre el saldo
            corriente.
          </p>
        </div>
        <Select
          label="Tarjeta"
          labelPosition="outlined"
          width={240}
          placeholder="Seleccionar…"
          value={selectedCardId ?? ''}
          onChange={(v) => setSelectedCardId(v || null)}
          options={cards.map((c) => ({ value: c.id, label: c.name }))}
        />
      </header>

      {!statement ? (
        <div className="panel empty">Necesitas un estado de cuenta para armar el plan.</div>
      ) : (
        <>
          {error && <div className="alert">{error}</div>}

          <div className="card-grid">
            <div className="panel">
              <div className="label">Deuda total (corriente + diferido)</div>
              <div className="value">{formatUsd(statement.totalDebt)}</div>
              <span className="badge real">REAL / estimado del estado</span>
            </div>
            <div className="panel">
              <div className="label">Saldo corriente (base de proyección)</div>
              <div className="value">{formatUsd(statement.currentBalance)}</div>
            </div>
            <div className="panel">
              <div className="label">Pago mínimo</div>
              <div className="value">{formatUsd(statement.minimumPayment)}</div>
            </div>
          </div>

          <div className="panel stack">
            <NumberBox
              label="¿Cuánto puedes pagar?"
              labelPosition="outlined"
              width={240}
              value={canPay}
              onChange={(e) => setCanPay(e.target.value)}
              placeholder={String(min + 50)}
              helperText="Pago total del mes (no solo el extra)"
            />
            {canPay !== '' && Number.isFinite(pay) && (
              <p>
                Pago adicional: +{formatUsd(extra)} · Pago total: {formatUsd(pay)}
              </p>
            )}
          </div>

          {comparison && (
            <div className="card-grid">
              <div className="panel">
                <h2>Solo mínimo</h2>
                <p>
                  {comparison.scenarioA.monthsToPayoff ?? '—'} meses
                  <br />
                  {formatUsd(comparison.scenarioA.totalInterest.amount)} intereses (EST.)
                </p>
              </div>
              <div className="panel">
                <h2>Tu pago</h2>
                <p>
                  {comparison.scenarioB.monthsToPayoff ?? '—'} meses
                  <br />
                  {formatUsd(comparison.scenarioB.totalInterest.amount)} intereses (EST.)
                </p>
              </div>
              <div className="panel">
                <h2>Ahorras</h2>
                <p>
                  {formatUsd(comparison.interestSaved.amount)}
                  <br />
                  {comparison.monthsSaved ?? '—'} meses
                </p>
                <span className="badge estimated">ESTIMADO</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
