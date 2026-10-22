import { createFileRoute } from '@tanstack/react-router'
import { AlertsDashboard } from '@/components/ui/alerts/AlertsDashboard'

export const Route = createFileRoute('/alerts')({
  component: RouteComponent,
})

function RouteComponent() {
  return <AlertsDashboard />
}
