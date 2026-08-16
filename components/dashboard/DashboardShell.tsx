import { ReactNode } from 'react'

export type DashboardTab = 'home' | 'library' | 'timeline' | 'justApply' | 'myApplications' | 'candidateBoard' | 'settings'

interface NavItem {
  tab: DashboardTab
  label: string
  icon: ReactNode
  badge?: number
}

interface DashboardShellProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
  onSignOut: () => void
  hasComponents: boolean
  applicationsCount: number
  children: ReactNode
}

function NavIcon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="flex-shrink-0">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NavButton({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
        isActive ? 'bg-primary text-white' : 'text-navy-200 hover:bg-navy-800 hover:text-white'
      }`}
    >
      {item.icon}
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge ? (
        <span
          className={`text-xs rounded-full px-1.5 py-0.5 ${
            isActive ? 'bg-white/20 text-white' : 'bg-navy-700 text-navy-200'
          }`}
        >
          {item.badge}
        </span>
      ) : null}
    </button>
  )
}

export function DashboardShell({
  activeTab,
  onTabChange,
  onSignOut,
  hasComponents,
  applicationsCount,
  children,
}: DashboardShellProps) {
  // Core CRUD features: free, always available.
  const coreNavItems: NavItem[] = [
    { tab: 'home', label: 'Home', icon: <NavIcon path="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" /> },
    { tab: 'library', label: 'Components', icon: <NavIcon path="M4 6h16M4 12h16M4 18h7" /> },
    { tab: 'timeline', label: 'Timeline', icon: <NavIcon path="M5 4v16M5 8h5a3 3 0 0 1 0 6H5m0 6h5a3 3 0 0 0 0-6" /> },
    {
      tab: 'myApplications',
      label: 'Applications',
      icon: <NavIcon path="M7 4h7l5 5v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Zm7 0v5h5" />,
      badge: applicationsCount || undefined,
    },
    {
      tab: 'candidateBoard',
      label: 'Tracker',
      icon: <NavIcon path="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1ZM5 7h14v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7Z" />,
    },
  ]

  // AI-powered feature: uses generation credits. Kept visually distinct so
  // it's ready to be gated behind a paid plan later without a UI reshuffle.
  const aiNavItems: NavItem[] = [
    { tab: 'justApply', label: 'Just Apply', icon: <NavIcon path="M13 4 21 12 13 20M3 12h18" /> },
  ]

  return (
    <div className="min-h-screen bg-navy-900 flex">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-navy-700 flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="px-5 py-6">
          <img src="/logo-dark.svg" alt="justapply" className="h-8" />
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {coreNavItems.map((item) => {
            if ((item.tab === 'library' || item.tab === 'timeline') && !hasComponents) return null
            if ((item.tab === 'myApplications' || item.tab === 'candidateBoard') && !applicationsCount) return null
            return <NavButton key={item.tab} item={item} isActive={activeTab === item.tab} onClick={() => onTabChange(item.tab)} />
          })}

          <div className="pt-4 mt-3 border-t border-navy-700">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400 flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6Z" />
              </svg>
              AI-Powered
            </p>
            {aiNavItems.map((item) => (
              <NavButton key={item.tab} item={item} isActive={activeTab === item.tab} onClick={() => onTabChange(item.tab)} />
            ))}
          </div>
        </nav>

        <div className="px-3 py-4 border-t border-navy-700 space-y-1">
          <button
            onClick={() => onTabChange('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'settings' ? 'bg-primary text-white' : 'text-navy-200 hover:bg-navy-800 hover:text-white'
            }`}
          >
            <NavIcon path="M10.325 4.317a1.724 1.724 0 0 1 3.35 0 1.724 1.724 0 0 0 2.573 1.066 1.724 1.724 0 0 1 2.37 2.37 1.724 1.724 0 0 0 1.065 2.572 1.724 1.724 0 0 1 0 3.35 1.724 1.724 0 0 0-1.066 2.573 1.724 1.724 0 0 1-2.37 2.37 1.724 1.724 0 0 0-2.572 1.065 1.724 1.724 0 0 1-3.35 0 1.724 1.724 0 0 0-2.573-1.066 1.724 1.724 0 0 1-2.37-2.37 1.724 1.724 0 0 0-1.065-2.572 1.724 1.724 0 0 1 0-3.35 1.724 1.724 0 0 0 1.066-2.573 1.724 1.724 0 0 1 2.37-2.37c1 .608 2.296.07 2.572-1.065ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            Settings
          </button>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-navy-300 hover:bg-navy-800 hover:text-red-300 transition"
          >
            <NavIcon path="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-60 min-h-screen bg-navy-900">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8">{children}</div>
      </main>
    </div>
  )
}
