import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  RotateCcw,
  ShoppingBag,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  User as UserIcon,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [testMenuOpen, setTestMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickSwitch = async (preset: 'admin' | 'alice' | 'bob' | 'diana') => {
    await quickLogin(preset);
    setTestMenuOpen(false);
    if (preset === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/orders');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Main Nav */}
          <div className="flex items-center">
            <Link
              to={isAdmin ? '/admin/dashboard' : '/orders'}
              data-testid="navbar-logo"
              className="flex items-center gap-2.5 font-bold text-xl text-slate-900 tracking-tight"
            >
              <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <RotateCcw className="w-5 h-5" />
              </div>
              <span>Return<span className="text-brand-600">Flow</span></span>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:flex ml-8 space-x-1">
                {!isAdmin ? (
                  <>
                    <Link
                      to="/orders"
                      data-testid="nav-orders"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/orders')
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4" />
                        My Orders
                      </span>
                    </Link>
                    <Link
                      to="/returns"
                      data-testid="nav-returns"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/returns')
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <RotateCcw className="w-4 h-4" />
                        My Returns
                      </span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/admin/dashboard"
                      data-testid="nav-admin-dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/admin/dashboard')
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </span>
                    </Link>
                    <Link
                      to="/admin/returns"
                      data-testid="nav-admin-queue"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/admin/returns')
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <ListOrdered className="w-4 h-4" />
                        Returns Queue
                      </span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right actions: Role pill, Test Switcher, Profile/Logout */}
          <div className="flex items-center gap-3">
            {/* Quick Test Role Switcher (Portfolio Feature) */}
            <div className="relative">
              <button
                data-testid="quick-switch-btn"
                onClick={() => setTestMenuOpen(!testMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
                title="Switch test accounts with 1 click"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Test Switcher</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {testMenuOpen && (
                <div
                  data-testid="quick-switch-dropdown"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95"
                >
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Login Switcher
                  </div>
                  <button
                    data-testid="switch-admin"
                    onClick={() => handleQuickSwitch('admin')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 flex items-center justify-between"
                  >
                    <span>🛡️ <strong>Admin</strong> (Reviewer)</span>
                    <span className="text-[10px] text-slate-400">admin@</span>
                  </button>
                  <button
                    data-testid="switch-alice"
                    onClick={() => handleQuickSwitch('alice')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>👤 <strong>Alice</strong> (Customer)</span>
                    <span className="text-[10px] text-slate-400">alice@</span>
                  </button>
                  <button
                    data-testid="switch-bob"
                    onClick={() => handleQuickSwitch('bob')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>👤 <strong>Bob</strong> (Customer)</span>
                    <span className="text-[10px] text-slate-400">bob@</span>
                  </button>
                  <button
                    data-testid="switch-diana"
                    onClick={() => handleQuickSwitch('diana')}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>👤 <strong>Diana</strong> (Customer)</span>
                    <span className="text-[10px] text-slate-400">diana@</span>
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span
                  data-testid="user-role-badge"
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                    isAdmin
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {user?.role}
                </span>

                <div className="hidden sm:block text-right">
                  <div className="text-xs font-medium text-slate-900">{user?.name}</div>
                  <div className="text-[11px] text-slate-500">{user?.email}</div>
                </div>

                <button
                  data-testid="logout-btn"
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  data-testid="nav-login-btn"
                  className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  data-testid="nav-register-btn"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

