import type { ReactNode } from 'react'
import {
  CalendarRange,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  LineChart,
  List,
  Settings,
  Target,
  Upload,
} from 'lucide-react'

const icons: Record<string, ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={18} />,
  CreditCard: <CreditCard size={18} />,
  FileSpreadsheet: <FileSpreadsheet size={18} />,
  List: <List size={18} />,
  CalendarRange: <CalendarRange size={18} />,
  Upload: <Upload size={18} />,
  LineChart: <LineChart size={18} />,
  Target: <Target size={18} />,
  Settings: <Settings size={18} />,
}

export function renderMenuIcon(name: string): ReactNode {
  return icons[name] ?? null
}
