import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  FileCheck,
  DollarSign,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Store,
  ClipboardList,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import AIAgent from './AIAgent';

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/', icon: LayoutDashboard, label: 'Dashboard' }],
  },
  {
    label: 'Management',
    items: [
      { to: '/users', icon: Users, label: 'Users' },
      { to: '/rides', icon: Car, label: 'Rides' },
      { to: '/kyc', icon: FileCheck, label: 'KYC Management' },
    ],
  },
  {
    label: 'Finance',
    items: [{ to: '/financials', icon: DollarSign, label: 'Financials' }],
  },
  {
    label: 'Restaurant',
    items: [
      { to: '/restaurant/dashboard', icon: Store, label: 'Dashboard' },
      { to: '/restaurant/orders', icon: ClipboardList, label: 'Orders' },
      { to: '/restaurant/menu', icon: UtensilsCrossed, label: 'Menu' },
    ],
  },
];

export default function Layout() {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = admin?.name ?? 'Admin';
  const displayRole = admin?.role ? admin.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Administrator';
  const initial = (displayName || 'A').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#fafaf9] flex">
      <aside
        className={`
          fixed h-full z-20 transition-transform duration-200 ease-in-out
          w-56 bg-white border-r border-stone-200/80
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="py-5 px-5 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Car className="text-stone-800" size={24} strokeWidth={1.8} />
            <span className="text-lg font-semibold text-stone-900 tracking-tight">Xigoa</span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-stone-400 hover:text-stone-600 p-1"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="py-4 px-3 flex flex-col gap-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[11px] font-medium uppercase tracking-wider text-stone-400 px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-stone-100 text-stone-900 font-medium'
                          : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                      }`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon size={17} className="text-stone-500 shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-stone-200/80 bg-stone-50/50">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-md bg-stone-200 flex items-center justify-center text-stone-700 font-medium text-sm shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-900 truncate">{displayName}</p>
              <p className="text-xs text-stone-500 truncate">{displayRole}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full rounded-md px-3 py-2 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
          >
            <LogOut size={17} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-56 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-stone-200/80">
          <div className="flex items-center justify-between gap-4 px-6 py-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-stone-600 p-2 hover:bg-stone-100 rounded-md"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <nav className="hidden md:flex items-center gap-1 text-sm text-stone-600">
              {navGroups.flatMap((g) => g.items).slice(0, 6).map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md transition-colors ${isActive ? 'text-stone-900 font-medium bg-stone-100' : 'hover:text-stone-900 hover:bg-stone-50'}`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2 ml-auto">
              <div className="hidden sm:block relative max-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-stone-300 focus:border-stone-300"
                />
              </div>
              <button
                type="button"
                className="relative p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
              </button>
              <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-stone-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-stone-900">{displayName}</p>
                  <p className="text-xs text-stone-500">{displayRole}</p>
                </div>
                <div className="w-8 h-8 rounded-md bg-stone-200 flex items-center justify-center text-stone-700 font-medium text-sm">
                  {initial}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <AIAgent />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/40 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
    </div>
  );
}
