import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, TextBox, useToast } from 'glubox'
import { api } from '../../lib/api'
import { useSessionStore } from '../../store/session'

export function RegisterPage() {
  const navigate = useNavigate()
  const { show } = useToast()
  const setUser = useSessionStore((s) => s.setUser)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      const { user } = await api.auth.register({ name, email, password })
      setUser(user)
      show({ title: 'Cuenta creada', message: user.email, variant: 'success' })
      navigate('/', { replace: true })
    } catch (e) {
      show({
        title: 'No se pudo registrar',
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
          <h1>Crear cuenta</h1>
          <p>Registro local en tu instancia.</p>
        </div>
        <TextBox
          label="Nombre"
          labelPosition="outlined"
          width="100%"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          helperText="Mínimo 8 caracteres"
        />
        <Button type="submit" variant="primary" disabled={busy}>
          Registrarme
        </Button>
        <p className="muted">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  )
}
