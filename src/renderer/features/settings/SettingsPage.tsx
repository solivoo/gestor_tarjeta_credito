import { Button, useToast } from 'glubox'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useSessionStore } from '../../store/session'

export function SettingsPage() {
  const { show } = useToast()
  const navigate = useNavigate()
  const user = useSessionStore((s) => s.user)
  const setUser = useSessionStore((s) => s.setUser)
  const setSelectedCardId = useSessionStore((s) => s.setSelectedCardId)

  async function logout() {
    try {
      await api.auth.logout()
      setUser(null)
      setSelectedCardId(null)
      navigate('/login', { replace: true })
    } catch (e) {
      show({
        title: 'Error',
        message: e instanceof Error ? e.message : 'No se pudo cerrar sesión',
        variant: 'error',
      })
    }
  }

  return (
    <div className="stack">
      <header className="page-header">
        <div>
          <h1>Configuración</h1>
          <p>Cuenta y privacidad de tu instancia.</p>
        </div>
      </header>
      <div className="panel stack">
        <h2>Cuenta</h2>
        <p>
          <strong>{user?.name}</strong>
          <br />
          <span className="muted">{user?.email}</span>
        </p>
        <div className="row">
          <Button variant="outline" onClick={() => void logout()}>
            Cerrar sesión
          </Button>
        </div>
      </div>
      <div className="panel">
        <h2>Privacidad</h2>
        <p>
          Los datos viven en tu Postgres del stack (Portainer). No hay telemetría. Cada usuario
          solo ve sus propias tarjetas e importaciones.
        </p>
      </div>
    </div>
  )
}
