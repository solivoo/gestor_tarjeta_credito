import { useEffect, useState } from 'react'
import { DataGrid, type ColumnDef } from 'glubox'
import type { Transaction } from '../../../shared/types/entities'
import { getApi } from '../../lib/api'
import { formatUsd } from '../../lib/format'
import { useSessionStore } from '../../store/session'

type TxnRow = Transaction & Record<string, unknown>

const columns: ColumnDef<TxnRow>[] = [
  { key: 'date', header: 'Fecha', sortable: true, width: 120 },
  { key: 'description', header: 'Descripción', sortable: true, minWidth: 220 },
  { key: 'type', header: 'Tipo', sortable: true, width: 130 },
  {
    key: 'amount',
    header: 'Monto',
    sortable: true,
    width: 120,
    align: 'right',
    renderCell: (value) => formatUsd(String(value)),
  },
  { key: 'source', header: 'Origen', width: 100 },
]

export function TransactionsPage() {
  const selectedCardId = useSessionStore((s) => s.selectedCardId)
  const [rows, setRows] = useState<TxnRow[]>([])

  useEffect(() => {
    void (async () => {
      const list = await getApi().transactions.list(
        selectedCardId ? { creditCardId: selectedCardId } : undefined,
      )
      setRows(list as TxnRow[])
    })()
  }, [selectedCardId])

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Movimientos</h1>
          <p>Tipos normalizados; el texto original del banco se conserva.</p>
        </div>
      </header>
      <div className="panel">
        {rows.length ? (
          <DataGrid
            dataSource={rows}
            keyExpr="id"
            columns={columns}
            paging={{ enabled: true, pageSize: 15 }}
          />
        ) : (
          <div className="empty">Sin movimientos.</div>
        )}
      </div>
    </div>
  )
}
