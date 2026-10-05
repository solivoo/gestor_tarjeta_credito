import { useEffect, useMemo, useState } from 'react'
import { Select } from 'glubox'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CreditCard, Statement } from '../../../shared/types/entities'
import { getApi } from '../../lib/api'
import { formatUsd } from '../../lib/format'
import { useSessionStore } from '../../store/session'

export function DashboardPage() {
  const selectedCardId = useSessionStore((s) => s.selectedCardId)
  const setSelectedCardId = useSessionStore((s) => s.setSelectedCardId)
  const [cards, setCards] = useState<CreditCard[]>([])
  const [statements, setStatements] = useState<Statement[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const list = await getApi().cards.list()
        setCards(list)
        if (!selectedCardId && list[0]) setSelectedCardId(list[0].id)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar')
      }
    })()
  }, [selectedCardId, setSelectedCardId])

  useEffect(() => {
    if (!selectedCardId) return
    void (async () => {
      setStatements(await getApi().statements.list(selectedCardId))
    })()
  }, [selectedCardId])

  const latest = statements[0]
  const previous = statements[1]
  const delta =
    latest && previous ? Number(latest.totalDebt) - Number(previous.totalDebt) : null
  const deltaPct =
    latest && previous && Number(previous.totalDebt) !== 0
      ? (delta! / Number(previous.totalDebt)) * 100
      : null

  const card = cards.find((c) => c.id === selectedCardId)
  const utilization =
    latest && (latest.creditLimit || card?.creditLimit)
      ? (Number(latest.totalDebt) / Number(latest.creditLimit || card?.creditLimit || 1)) *
        100
      : null

  const debtHistory = useMemo(
    () =>
      [...statements]
        .reverse()
        .map((s) => ({
          mes: s.statementDate,
          deuda: Number(s.totalDebt),
          diferido: Number(s.deferredBalance),
          corriente: Number(s.currentBalance),
        })),
    [statements],
  )

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Resumen de tu situación. Los totales del banco se muestran como REAL.</p>
        </div>
        <Select
          label="Tarjeta"
          labelPosition="outlined"
          placeholder="Seleccionar…"
          width={260}
          value={selectedCardId ?? ''}
          onChange={(value) => setSelectedCardId(value || null)}
          options={cards.map((c) => ({ value: c.id, label: c.name }))}
        />
      </header>

      {error && <div className="alert">{error}</div>}

      {!latest ? (
        <div className="panel empty">
          Aún no hay estados de cuenta. Crea una tarjeta e importa un Excel mes a mes.
        </div>
      ) : (
        <>
          <div className="metric-grid">
            <div className="panel metric">
              <div className="label">Deuda total</div>
              <div className="metric-row">
                <div className="value">{formatUsd(latest.totalDebt)}</div>
                <span className="badge real">REAL</span>
              </div>
            </div>
            <div className="panel metric">
              <div className="label">Cambio mensual</div>
              <div className="metric-row">
                <div className="value">
                  {delta == null ? '—' : `${delta >= 0 ? '+' : ''}${formatUsd(delta)}`}
                </div>
                <span className="muted metric-meta">
                  {deltaPct == null ? 'Sin anterior' : `${deltaPct.toFixed(1)}%`}
                </span>
              </div>
            </div>
            <div className="panel metric">
              <div className="label">Pago mínimo</div>
              <div className="metric-row">
                <div className="value">{formatUsd(latest.minimumPayment)}</div>
                <span className="badge real">REAL</span>
              </div>
            </div>
            <div className="panel metric">
              <div className="label">Interés último mes</div>
              <div className="metric-row">
                <div className="value">{formatUsd(latest.interestCharged)}</div>
                <span className="badge real">REAL</span>
              </div>
            </div>
            <div className="panel metric">
              <div className="label">Diferido pendiente</div>
              <div className="metric-row">
                <div className="value">{formatUsd(latest.deferredBalance)}</div>
              </div>
            </div>
            <div className="panel metric">
              <div className="label">Uso de cupo</div>
              <div className="metric-row">
                <div className="value">
                  {utilization == null ? '—' : `${utilization.toFixed(1)}%`}
                </div>
              </div>
            </div>
          </div>

          <div className="panel chart-panel">
            <h2>Evolución de deuda</h2>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={debtHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7e0ea" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatUsd(Number(value))} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="deuda"
                  name="Deuda total"
                  stroke="#0f5c4c"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="diferido"
                  name="Diferido"
                  stroke="#8a4b12"
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="corriente"
                  name="Corriente"
                  stroke="#1d4f91"
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="panel">
            <h2>Durante este período</h2>
            <p>
              Ingresaron {formatUsd(latest.newPurchases)} en nuevos cargos mientras se
              recibieron pagos por {formatUsd(latest.paymentsReceived)}. Interés cobrado
              por el banco: {formatUsd(latest.interestCharged)}.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
