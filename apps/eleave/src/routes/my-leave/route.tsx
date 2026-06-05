import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/my-leave')({
  component: MyLeaveLayout,
})

function MyLeaveLayout() {
  return <Outlet />
}
