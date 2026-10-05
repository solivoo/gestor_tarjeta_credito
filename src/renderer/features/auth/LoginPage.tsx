import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, TextBox, useToast } from 'glubox'
import { api } from '../../lib/api'
import { useSessionStore } from '../../store/session'

export function LoginPage() {
  const navigate = useNavigate()
  const { show } = useToast()
  const setUser = useSessionStore((s) => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      const { user } = await api.auth.login({ email, password })
      setUser(user)
      show({ title: 'Sesión iniciada', message: user.email, variant: 'success' })
      navigate('/', { replace: true })
    } catch (e) {
      show({
        title: 'No se pudo iniciar sesión',
        message: e instanceof Error ? e.message : 'Error',
        variant: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="panel auth-card stack" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <h1>Iniciar sesión</h1>
          <p>Accede a tu gestor de crédito.</p>
        </div>
        <TextBox
          label="Email"
          labelPosition="outlined"
          width="100%"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextBox
          label="Contraseña"
          labelPosition="outlined"
          width="100%"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="primary" disabled={busy}>
          Entrar
        </Button>
        <p className="muted">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </form>
    </div>
  )
}
