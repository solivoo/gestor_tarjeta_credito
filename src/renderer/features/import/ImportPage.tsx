import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  CheckButton,
  DataGrid,
  Popup,
  Select,
  useToast,
  type ColumnDef,
} from 'glubox'
import type { CreditCard, ImportBatch } from '../../../shared/types/entities'
import type { ImportPreviewResult } from '../../../shared/types/import'
import { getApi } from '../../lib/api'
import { formatUsd } from '../../lib/format'
import { useSessionStore } from '../../store/session'

type BatchRow = ImportBatch & Record<string, unknown>

export function ImportPage() {
  const { show } = useToast()
  const selectedCardId = useSessionStore((s) => s.selectedCardId)
  const setSelectedCardId = useSessionStore((s) => s.setSelectedCardId)
  const [cards, setCards] = useState<CreditCard[]>([])
  const [batches, setBatches] = useState<BatchRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null)
  const [acceptDuplicates, setAcceptDuplicates] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [batchToDelete, setBatchToDelete] = useState<BatchRow | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reloadBatches = useCallback(async () => {
    if (!selectedCardId) {
      setBatches([])
      return
    }
    setBatches((await getApi().import.listBatches(selectedCardId)) as BatchRow[])
  }, [selectedCardId])

  useEffect(() => {
    void (async () => {
      const list = await getApi().cards.list()
      setCards(list)
      if (!selectedCardId && list[0]) setSelectedCardId(list[0].id)
    })()
  }, [selectedCardId, setSelectedCardId])

  useEffect(() => {
    void reloadBatches()
  }, [reloadBatches])

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setFileName(file.name)
    setBusy(true)
    try {
      const result = await getApi().import.preview(file, selectedCardId ?? undefined)
      setPreview(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al previsualizar')
      setPreview(null)
    } finally {
      setBusy(false)
    }
  }

  async function confirmImport() {
    if (!preview || !selectedCardId) return
    setBusy(true)
    setError(null)
    try {
      const result = await getApi().import.commit({
        draftId: preview.draft.draftId,
        creditCardId: selectedCardId,
        acceptDuplicates,
      })
      show({
        title: 'Importación confirmada',
        message: `${result.rowsImported} movimientos · duplicados ignorados: ${result.duplicatesIgnored}`,
        variant: 'success',
      })
      setPreview(null)
      setFileName(null)
      await reloadBatches()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al importar'
      setError(msg)
      show({ title: 'No se pudo importar', message: msg, variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  async function confirmDeleteBatch() {
    if (!batchToDelete) return
    setBusy(true)
    try {
      const result = await getApi().import.deleteBatch(batchToDelete.id)
      show({
        title: 'Importación eliminada',
        message: `${result.deletedStatements} estado(s) de cuenta borrados`,
        variant: 'success',
      })
      setBatchToDelete(null)
      await reloadBatches()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo eliminar'
      setError(msg)
      show({ title: 'Error', message: msg, variant: 'error' })
    } finally {
      setBusy(false)
    }
  }

  const columns: ColumnDef<BatchRow>[] = useMemo(
    () => [
      { key: 'statementPeriod', header: 'Período', width: 120 },
      { key: 'filename', header: 'Archivo', minWidth: 180 },
      {
        key: 'importDate',
        header: 'Importado',
        width: 170,
        renderCell: (v) => String(v).slice(0, 19).replace('T', ' '),
      },
      {
        key: 'rowsImported',
        header: 'Movimientos',
        width: 120,
        align: 'right',
      },
      {
        key: 'id',
        header: 'Acciones',
        width: 140,
        renderCell: (_v, row) => (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => setBatchToDelete(row)}
          >
            Eliminar
          </Button>
        ),
      },
    ],
    [busy],
  )

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Importar Excel</h1>
          <p>
            Cada archivo se guarda solo en la tarjeta destino. Si te equivocas, elimina el lote.
          </p>
        </div>
      </header>

      <div className="panel stack">
        <div className="row">
          <Select
            label="Tarjeta destino"
            labelPosition="outlined"
            width={280}
            placeholder="Seleccionar…"
            value={selectedCardId ?? ''}
            onChange={(value) => setSelectedCardId(value || null)}
            options={cards.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Button
            variant="primary"
            disabled={busy}
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            Seleccionar .xlsx
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            hidden
            disabled={busy}
            onChange={(e) => void onFileChange(e)}
          />
        </div>
        {fileName && <p className="muted">Archivo: {fileName}</p>}
      </div>

      {error && <div className="alert">{error}</div>}

      {preview && (
        <div className="panel stack">
          <h2>Detectamos lo siguiente</h2>
          <div className="card-grid">
            <div>
              <div className="label">Fecha corte</div>
              <div>{preview.summary.statementDate ?? '—'}</div>
            </div>
            <div>
              <div className="label">Saldo actual</div>
              <div>{formatUsd(preview.summary.currentBalance)}</div>
            </div>
            <div>
              <div className="label">Saldo diferido</div>
              <div>{formatUsd(preview.summary.deferredBalance)}</div>
            </div>
            <div>
              <div className="label">Pago mínimo</div>
              <div>{formatUsd(preview.summary.minimumPayment)}</div>
            </div>
            <div>
              <div className="label">Pago total</div>
              <div>{formatUsd(preview.summary.totalPaymentDue)}</div>
            </div>
            <div>
              <div className="label">Intereses</div>
              <div>{formatUsd(preview.summary.interestCharged)}</div>
            </div>
            <div>
              <div className="label">Compras</div>
              <div>{formatUsd(preview.summary.newPurchases)}</div>
            </div>
            <div>
              <div className="label">Pagos</div>
              <div>{formatUsd(preview.summary.paymentsReceived)}</div>
            </div>
          </div>

          {preview.draft.warnings.map((w) => (
            <div key={w} className="alert">
              {w}
            </div>
          ))}

          {preview.existingFileHash && (
            <div className="alert">
              Este archivo ya fue importado (mismo hash). Marca aceptar duplicados si deseas
              continuar.
            </div>
          )}

          <CheckButton
            checked={acceptDuplicates}
            onChange={setAcceptDuplicates}
            variant="outline"
          >
            Aceptar posibles duplicados
          </CheckButton>

          <p className="muted">
            Movimientos detectados: {preview.draft.transactions.length}. Emisor:{' '}
            {preview.draft.issuer ?? 'generic'}.
          </p>

          <Button
            variant="primary"
            disabled={busy || !selectedCardId}
            onClick={() => void confirmImport()}
          >
            Confirmar importación
          </Button>
        </div>
      )}

      <div className="panel stack">
        <h2>Importaciones de esta tarjeta</h2>
        <p className="muted">
          Lo «activo» en Dashboard es el estado de cuenta más reciente de la tarjeta
          seleccionada.
        </p>
        {batches.length ? (
          <DataGrid
            dataSource={batches}
            keyExpr="id"
            columns={columns}
            paging={{ enabled: true, pageSize: 10 }}
          />
        ) : (
          <div className="empty">Sin importaciones para esta tarjeta.</div>
        )}
      </div>

      <Popup
        open={Boolean(batchToDelete)}
        onClose={() => setBatchToDelete(null)}
        title="Eliminar importación"
        width={440}
        actions={[
          {
            id: 'cancel',
            label: 'Cancelar',
            variant: 'outline',
            onClick: () => setBatchToDelete(null),
          },
          {
            id: 'delete',
            label: 'Eliminar',
            variant: 'primary',
            loading: busy,
            onClick: () => void confirmDeleteBatch(),
          },
        ]}
      >
        {batchToDelete && (
          <p>
            ¿Eliminar «{batchToDelete.filename}» (
            {batchToDelete.statementPeriod ?? 'sin período'})? Se borrarán el estado de
            cuenta y sus movimientos de esta tarjeta.
          </p>
        )}
      </Popup>
    </div>
  )
}
