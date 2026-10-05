export function InstallmentsPage() {
  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Diferidos</h1>
          <p>
            Aquí irán los planes cuota a cuota (capital pendiente, cuotas restantes). Por ahora el
            saldo diferido solo se ve en el Dashboard / estados importados.
          </p>
        </div>
      </header>
      <div className="panel empty">
        Aún no hay gestión de planes diferidos. El Excel de Produbanco ya muestra el saldo diferido
        total; la vista detalle llega en la siguiente fase.
      </div>
    </div>
  )
}