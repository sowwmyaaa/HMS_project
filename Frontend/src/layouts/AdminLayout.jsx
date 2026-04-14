import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  HomeIcon,
  DocumentTextIcon,
  UserPlusIcon,
  BuildingOffice2Icon,
  ClockIcon,
  CakeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  MoonIcon,
  SunIcon,
  BellIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { to: '/admin/application', label: 'Application Details', icon: DocumentTextIcon },
  { to: '/admin/registration', label: 'Registration', icon: UserPlusIcon },
  { to: '/admin/rooms', label: 'Room Details', icon: HomeIcon },
  { to: '/admin/room-allotment', label: 'Room Allotment', icon: BuildingOffice2Icon },
  { to: '/admin/outing-requests', label: 'Outing Requests', icon: ArrowRightOnRectangleIcon },
  { to: '/admin/outing-reports', label: 'Outing Reports', icon: ClockIcon },
  { to: '/admin/mess-menu', label: 'Mess Timetable', icon: CakeIcon },
  { to: '/admin/mess-bill', label: 'Mess Bill Details', icon: CurrencyDollarIcon },
  { to: '/admin/workers', label: 'Workers Details', icon: UserGroupIcon },
  { to: '/admin/doctor', label: 'Doctor Availability', icon: HeartIcon },
  { to: '/admin/complaints', label: 'Complaints', icon: ChatBubbleLeftRightIcon },
];

const titleMap = {
  '/admin/application': 'Application Details',
  '/admin/registration': 'Registration',
  '/admin/rooms': 'Room Details',
  '/admin/room-allotment': 'Room Allotment',
  '/admin/outing-requests': 'Outing Requests',
  '/admin/outing-reports': 'Outing Reports',
  '/admin/mess-bill': 'Mess Bill Details',
  '/admin/mess-menu': 'Mess Timetable',
  '/admin/doctor': 'Doctor Availability',
  '/admin/workers': 'Workers Details',
  '/admin/complaints': 'Complaints',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdown, setUserDropdown] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const pageTitle = titleMap[currentPath] || 'Application Details';

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* Sidebar — bright blue gradient (light) / deep slate + cyan accent (dark) */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 flex flex-col h-full overflow-y-auto overflow-x-hidden text-white transition-all duration-300 shadow-xl dark:shadow-black/40 bg-gradient-to-b from-[#1e3a5f] via-[#1d4ed8] to-[#0ea5e9] dark:from-slate-950 dark:via-[#0f172a] dark:to-slate-950 dark:border-r dark:border-slate-800/90`}
      >
        <div className="p-5 border-b border-white/10 dark:border-slate-700/80 flex items-center gap-3 min-w-[16rem]">
          <div className="w-12 h-12 rounded-xl bg-blue-400/90 dark:bg-cyan-500/15 dark:ring-1 dark:ring-cyan-400/35 flex items-center justify-center flex-shrink-0 shadow-inner">
            <HomeIcon className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg tracking-tight text-white">HMS</h1>
            <p className="text-xs text-white/90 dark:text-slate-400">Hostel System</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 min-w-[16rem]">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to + label}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-400/90 text-white shadow-md dark:bg-cyan-600/30 dark:text-white dark:shadow-none dark:ring-1 dark:ring-cyan-400/40'
                    : 'text-white/90 hover:bg-white/10 hover:text-white dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0 opacity-90 dark:opacity-100" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 dark:border-slate-700/80 min-w-[16rem]">
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-white/80 hover:bg-white/10 hover:text-white dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Top header bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 shadow-sm flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hostel Management System</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{pageTitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={() => toast.info('No new notifications. Alerts appear here when actions complete.', { autoClose: 4000 })}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Notifications"
              >
                <BellIcon className="w-5 h-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-3 pl-2 pr-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {(user?.email || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Admin</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{user?.email || ''}</p>
                  </div>
                  <ChevronDownIcon className="w-4 h-4 text-slate-500" />
                </button>
                {userDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserDropdown(false)} />
                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 py-1 z-20">
                      <p className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 truncate">{user?.email}</p>
                      <button
                        onClick={() => { setUserDropdown(false); logout(); navigate('/login'); }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content — only this region scrolls */}
        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6">
          <Outlet />
        </main>
      </div>

      {/* Reopen sidebar when closed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-[#2563eb] dark:bg-slate-800 dark:border dark:border-slate-600 dark:ring-1 dark:ring-cyan-500/25 text-white rounded-r-lg shadow-lg flex items-center justify-center"
          aria-label="Open sidebar"
        >
          <ChevronDownIcon className="w-5 h-5 rotate-[-90deg]" />
        </button>
      )}
    </div>
  );
}
