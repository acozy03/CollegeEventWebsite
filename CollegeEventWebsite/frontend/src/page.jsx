import UserManagement from './components/UserManagement'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <UserManagement />
    </main>
  )
}