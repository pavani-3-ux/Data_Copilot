import { ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  Upload,
  Database,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  FileText,
  Menu,
  X,
  ChevronLeft,
} from 'lucide-react';
import { classNames } from '../utils/helpers';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Data', icon: Upload },
  { id: 'data', label: 'Data Explorer', icon: Database },
  { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'forecasts', label: 'Forecasts', icon: TrendingUp },
  { id: 'reports', label: 'Reports', icon: FileText },
];

function Sidebar({ currentView, onViewChange, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={classNames(
        'fixed left-0 top-0 h-screen bg-gradient-to-b from-secondary-900 to-secondary-950 border-r border-secondary-800',
        'transition-all duration-300 z-40 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo/Brand */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-secondary-800">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">DataCopilot</h1>
              <p className="text-secondary-400 text-xs">AI Analytics</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-secondary-800 text-secondary-400 hover:text-white transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={classNames(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-glow'
                  : 'text-secondary-400 hover:text-white hover:bg-secondary-800'
              )}
            >
              <Icon className={classNames('w-5 h-5 flex-shrink-0', isActive && 'text-white')} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-secondary-800">
          <div className="bg-gradient-to-r from-primary-600/20 to-accent-600/20 rounded-lg p-3">
            <p className="text-white text-xs font-medium">Pro Tip</p>
            <p className="text-secondary-400 text-xs mt-1">
              Use natural language to query your data. Ask questions like "Show top products by revenue"
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  datasetName?: string;
}

export default function Layout({ children, currentView, onViewChange, datasetName }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary-950">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-secondary-900 border-b border-secondary-800 z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-secondary-800 text-secondary-400"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold">DataCopilot</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={classNames(
          'lg:hidden fixed left-0 top-16 bottom-0 w-64 bg-secondary-900 z-50 transition-transform duration-300',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={classNames(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white'
                    : 'text-secondary-400 hover:text-white hover:bg-secondary-800'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentView={currentView}
          onViewChange={onViewChange}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content */}
      <main
        className={classNames(
          'min-h-screen transition-all duration-300',
          'pt-16 lg:pt-0',
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        )}
      >
        {/* Top Bar */}
        {datasetName && (
          <div className="sticky top-0 lg:top-0 z-30 bg-secondary-900/80 backdrop-blur-sm border-b border-secondary-800">
            <div className="flex items-center justify-between px-4 lg:px-6 h-14">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-accent-500" />
                <span className="text-sm text-secondary-400">Active Dataset:</span>
                <span className="text-sm font-medium text-white">{datasetName}</span>
              </div>
            </div>
          </div>
        )}
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
