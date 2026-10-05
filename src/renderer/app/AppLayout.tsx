import { Sidebar } from 'glubox'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { appMenu, ALL_PERMISSIONS } from './navigation'
import { renderMenuIcon } from './renderMenuIcon'

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="app-brand">
      <strong>{collapsed ? 'Gc' : 'Gestor de crédito'}</strong>
      {!collapsed && <span>Local · privada · clara</span>}
    </div>
  )
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const activePath = location.pathname === '' ? '/' : location.pathname

  return (
    <div className="app-shell">
      <Sidebar
        menu={appMenu}
        userPermissions={ALL_PERMISSIONS}
        brand={Brand}
        activePath={activePath}
        onNavigate={(path) => {
          const to = path.startsWith('/') ? path : `/${path}`
          if (to !== activePath) navigate(to)
        }}
        renderIcon={renderMenuIcon}
        collapseOthersOnSelect
        width={260}
      />
      <main className="content" key={activePath}>
        <Outlet />
      </main>
    </div>
  )
}
