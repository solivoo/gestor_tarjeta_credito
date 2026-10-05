import type { MenuConfig } from 'glubox'

export const appMenu: MenuConfig = {
  items: [
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/' },
    { id: 'cards', label: 'Mis tarjetas', icon: 'CreditCard', path: '/cards' },
    { id: 'statements', label: 'Estados de cuenta', icon: 'FileSpreadsheet', path: '/statements' },
    { id: 'transactions', label: 'Movimientos', icon: 'List', path: '/transactions' },
    { id: 'installments', label: 'Diferidos', icon: 'CalendarRange', path: '/installments' },
    { id: 'import', label: 'Importar', icon: 'Upload', path: '/import' },
    { id: 'simulator', label: 'Simulador', icon: 'LineChart', path: '/simulator' },
    { id: 'exit-plan', label: 'Plan de salida', icon: 'Target', path: '/exit-plan' },
    {
      id: 'settings',
      label: 'Configuración',
      icon: 'Settings',
      path: '/settings',
      position: 'bottom',
    },
  ],
}

export const ALL_PERMISSIONS = ['*']
