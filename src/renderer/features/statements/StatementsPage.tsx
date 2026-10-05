import { useEffect, useState } from 'react'
import { DataGrid, type ColumnDef } from 'glubox'
import type { Statement } from '../../../shared/types/entities'
import { getApi } from '../../lib/api'
import { formatUsd } from '../../lib/format'
import { useSessionStore } from '../../store/session'

type StatementRow = Statement & Record<string, unknown>

const columns: ColumnDef<StatementRow>[] = [
  { key: 'statementDate', header: 'Corte', sortable: true, width: 120 },
  {
    key: 'totalDebt',
    header: 'Deuda total',
    align: 'right',
    renderCell: (v) => formatUsd(String(v)),
  },
  {
    key: 'minimumPayment',
    header: 'Mínimo',
    align: 'right',
    renderCell: (v) => formatUsd(String(v)),
  },
  {
    key: 'interestCharged',
    header: 'Interés (REAL)',
    align: 'right',
    renderCell: (v) => formatUsd(String(v)),
  },
  {
    key: 'deferredBalance',
    header: 'Diferido',
    align: 'right',
    renderCell: (v) => formatUsd(String(v)),
  },
]

export function StatementsPage() {
  const selectedCardId = useSessionStore((s) => s.selectedCardId)
  const [statements, setStatements] = useState<StatementRow[]>([])

  useEffect(() => {
    void (async () => {
      setStatements(
        (await getApi().statements.list(selectedCardId ?? undefined)) as StatementRow[],
      )
    })()
  }, [selectedCardId])

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Estados de cuenta</h1>
          <p>Historial inmutable. Cada importación crea un nuevo período.</p>
        </div>
      </header>
      <div className="panel">
        {statements.length ? (
          <DataGrid
            dataSource={statements}
            keyExpr="id"
            columns={columns}
            paging={{ enabled: true, pageSize: 12 }}
          />
        ) : (
          <div className="empty">Sin estados de cuenta.</div>
        )}
      </div>
    </div>
  )
}
