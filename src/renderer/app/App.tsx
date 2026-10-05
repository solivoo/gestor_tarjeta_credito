import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { CardsPage } from '../features/cards/CardsPage'
import { StatementsPage } from '../features/statements/StatementsPage'
import { TransactionsPage } from '../features/transactions/TransactionsPage'
import { InstallmentsPage } from '../features/installments/InstallmentsPage'
import { SimulatorPage } from '../features/simulator/SimulatorPage'
import { ExitPlanPage } from '../features/exit-plan/ExitPlanPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { ImportPage } from '../features/import/ImportPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { api } from '../lib/api'
import { useSessionStore } from '../store/session'

function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useSessionStore((s) => s.user)
  const authReady = useSessionStore((s) => s.authReady)
  if (!authReady) {
    return <div className="auth-page muted">Cargando sesión…</div>
  }
  if (!user) return <Navigate to="/login" replace />
  return children
}

function GuestGate({ children }: { children: React.ReactNode }) {
  const user = useSessionStore((s) => s.user)
  const authReady = useSessionStore((s) => s.authReady)
  if (!authReady) {
    return <div className="auth-page muted">Cargando sesión…</div>
  }
  if (user) return <Navigate to="/" replace />
  return children
}

export function App() {
  const setUser = useSessionStore((s) => s.setUser)
  const setAuthReady = useSessionStore((s) => s.setAuthReady)

  useEffect(() => {
    void (async () => {
      try {
        const { user } = await api.auth.me()
        setUser(user)
      } catch {
        setUser(null)
      } finally {
        setAuthReady(true)
      }
    })()
  }, [setUser, setAuthReady])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <GuestGate>
              <LoginPage />
            </GuestGate>
          }
        />
        <Route
          path="/register"
          element={
            <GuestGate>
              <RegisterPage />
            </GuestGate>
          }
        />
        <Route
          element={
            <AuthGate>
              <AppLayout />
            </AuthGate>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="cards" element={<CardsPage />} />
          <Route path="statements" element={<StatementsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="installments" element={<InstallmentsPage />} />
          <Route path="simulator" element={<SimulatorPage />} />
          <Route path="exit-plan" element={<ExitPlanPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
