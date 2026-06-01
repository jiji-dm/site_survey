import { Routes, Route, Navigate } from 'react-router-dom'
import ProjectList from './pages/ProjectList'
import ProjectEdit from './pages/ProjectEdit'
import Login from './pages/Login'
import AppShell from './components/AppShell'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const auth = useAuth()

  // 認証チェック
  if (auth.status === 'loading') {
    return (
      <div className="min-h-full grid place-items-center text-ink-subtle">
        読み込み中...
      </div>
    )
  }
  if (auth.status === 'signed-out') {
    return <Login />
  }
  if (auth.status === 'unauthorized') {
    return <Login unauthorizedEmail={auth.email} />
  }
  // 'signed-in' or 'no-firebase' のときは通常のアプリを表示

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectEdit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
