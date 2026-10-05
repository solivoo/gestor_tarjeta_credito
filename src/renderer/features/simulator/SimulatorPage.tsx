import { useEffect, useMemo, useState } from 'react'
import { NumberBox, Select } from 'glubox'
import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CreditCard, Statement } from '../../../shared/types/entities'
import type { ComparisonResult } from '../../../shared/types/simulation'
import { getApi } from '../../lib/api'
import { formatUsd } from '../../lib/format'
import { buildSimulationInput } from '../../lib/simulationInput'
import { useSessionStore } from '../../store/session'

export function SimulatorPage() {
  const selectedCardId = useSessionStore((s) => s.selectedCardId)
  const setSelectedCardId = useSessionStore((s) => s.setSelectedCardId)
  const [cards, setCards] = useState<CreditCard[]>([])
  const [card, setCard] = useState<CreditCard | null>(null)
  const [statement, setStatement] = useState<Statement | null>(null)
  const [comparison, setComparison] = useState<ComparisonResult | null>(null)
  const [canPay, setCanPay] = useState('')
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
      const nextCard = await api.cards.get(selectedCardId)
      const statements = await api.statements.list(selectedCardId)
      const latest = statements[0] ?? null
      setCard(nextCard)
      setStatement(latest)
      if (latest) {
        const min = Number(latest.minimumPayment)
        setCanPay(Number.isFinite(min) ? String(Math.round(min + 50)) : '')
      } else {
        setCanPay('')
        setComparison(null)
      }
    })()
  }, [selectedCardId])

  const minPay = statement ? Number(statement.minimumPayment) : 0
  const canPayNum = Number(canPay)
  const hasValidPay = canPay !== '' && Number.isFinite(canPayNum) && canPayNum >= 0
  const derivedExtra = hasValidPay ? Math.max(0, canPayNum - minPay) : 0

  const baseInput = useMemo(() => {
    if (!card || !statement) return null
    try {
      return buildSimulationInput(card, statement)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo armar la simulación')
      return null
    }
  }, [card, statement])

  useEffect(() => {
    if (!baseInput || !hasValidPay) {
      setComparison(null)
      return
    }
    void (async () => {
      try {
        setError(null)
        const result = await getApi().simulate.compare({
          base: baseInput,
          extraPayment: String(derivedExtra),
        })
        setComparison(result)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error de simulación')
        setComparison(null)
      }
    })()
  }, [baseInput, derivedExtra, hasValidPay])

  const monthOne = comparison?.scenarioB.months[0]

  const chartData = useMemo(() => {
    if (!comparison) return []
    const len = Math.max(
      comparison.scenarioA.months.length,
      comparison.scenarioB.months.length,
    )
    const rows = []
    for (let i = 0; i < len; i += 1) {
      rows.push({
        month: i + 1,
        minimo: comparison.scenarioA.months[i]
          ? Number(comparison.scenarioA.months[i].endingBalance.amount)
          : null,
        conExtra: comparison.scenarioB.months[i]
          ? Number(comparison.scenarioB.months[i].endingBalance.amount)
          : null,
      })
    }
    return rows
  }, [comparison])

  const placeholderPay = Number.isFinite(minPay) ? String(Math.round(minPay + 50)) : ''

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Simulador</h1>
          <p>
            Escribe cuánto puedes pagar este mes sobre el <strong>saldo corriente</strong>. El
            diferido no se capitaliza aquí.
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

      {!card || !statement ? (
        <div className="panel empty">
          Selecciona una tarjeta con al menos un estado de cuenta importado.
        </div>
      ) : (
        <>
          {error && <div className="alert">{error}</div>}

          <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <div className="panel metric">
              <div className="label">Saldo corriente</div>
              <div className="metric-row">
                <div className="value">{formatUsd(statement.currentBalance)}</div>
                <span className="badge real">REAL</span>
              </div>
            </div>
            <div className="panel metric">
              <div className="label">Diferido (fuera de proyección)</div>
              <div className="metric-row">
                <div className="value">{formatUsd(statement.deferredBalance)}</div>
              </div>
            </div>
            <div className="panel metric">
              <div className="label">Pago mínimo</div>
              <div className="metric-row">
                <div className="value">{formatUsd(statement.minimumPayment)}</div>
                <span className="badge real">REAL</span>
              </div>
            </div>
          </div>

          <div className="panel stack">
            <NumberBox
              label="Este mes puedo pagar"
              labelPosition="outlined"
              width={280}
              value={canPay}
              onChange={(e) => setCanPay(e.target.value)}
              placeholder={placeholderPay}
              helperText="Pago total del mes (no solo el extra)"
            />

            {hasValidPay && (
              <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <div className="panel metric">
                  <div className="label">Pago mínimo</div>
                  <div className="metric-row">
                    <div className="value">{formatUsd(minPay)}</div>
                    <span className="badge real">REAL</span>
                  </div>
                </div>
                <div className="panel metric">
                  <div className="label">Pago adicional</div>
                  <div className="metric-row">
                    <div className="value">+{formatUsd(derivedExtra)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {comparison && monthOne && (
            <>
              <div className="panel stack">
                <h2>Estimación de este mes</h2>
                <div
                  className="metric-grid"
                  style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
                >
                  <div className="panel metric">
                    <div className="label">Interés del período</div>
                    <div className="metric-row">
                      <div className="value">{formatUsd(monthOne.interest.amount)}</div>
                      <span className="badge estimated">EST.</span>
                    </div>
                  </div>
                  <div className="panel metric">
                    <div className="label">Capital amortizado</div>
                    <div className="metric-row">
                      <div className="value">{formatUsd(monthOne.principalPaid.amount)}</div>
                      <span className="badge estimated">EST.</span>
                    </div>
                  </div>
                  <div className="panel metric">
                    <div className="label">Nuevo saldo estimado</div>
                    <div className="metric-row">
                      <div className="value">{formatUsd(monthOne.endingBalance.amount)}</div>
                      <span className="badge estimated">EST.</span>
                    </div>
                  </div>
                </div>
                <p>
                  Este pago adicional podría ahorrarte aproximadamente{' '}
                  {formatUsd(comparison.interestSaved.amount)} de intereses futuros
                  {comparison.monthsSaved != null
                    ? ` y ${comparison.monthsSaved} meses`
                    : ''}
                  .
                </p>
              </div>

              <div className="card-grid">
                <div className="panel">
                  <h2>Solo mínimo</h2>
                  <p>
                    {comparison.scenarioA.monthsToPayoff ?? '600+'} meses
                    <br />
                    Intereses futuros (EST.):{' '}
                    {formatUsd(comparison.scenarioA.totalInterest.amount)}
                  </p>
                </div>
                <div className="panel">
                  <h2>Tu pago (+${derivedExtra})</h2>
                  <p>
                    {comparison.scenarioB.monthsToPayoff ?? '600+'} meses
                    <br />
                    Intereses futuros (EST.):{' '}
                    {formatUsd(comparison.scenarioB.totalInterest.amount)}
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

              <div className="panel chart-panel">
                <h2>¿Cómo baja tu saldo si pagas así?</h2>
                <p className="muted" style={{ marginBottom: '0.5rem' }}>
                  Eje X = meses hacia adelante. Eje Y = saldo corriente estimado. La línea que llega
                  antes a $0 es la que te saca más rápido. Esto es una proyección (ESTIMADO), no el
                  historial del banco.
                </p>
                <ResponsiveContainer width="100%" height="78%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      label={{ value: 'Mes', position: 'insideBottom', offset: -2 }}
                    />
                    <YAxis
                      tickFormatter={(v) => `$${Math.round(Number(v))}`}
                      width={64}
                    />
                    <Tooltip
                      formatter={(value) => formatUsd(Number(value))}
                      labelFormatter={(label) => `Mes ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="minimo"
                      name="Si solo pagas el mínimo"
                      stroke="#8a4b12"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="conExtra"
                      name={`Si pagas mínimo + $${derivedExtra}`}
                      stroke="#0f5c4c"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="panel">
                {comparison.scenarioB.assumptions.map((a) => (
                  <p key={a} className="muted">
                    {a}
                  </p>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
