import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Bell, Menu, X, ChevronDown, 
  LogOut, User, Settings, LayoutDashboard,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const navLinks = [
  { label: 'Dashboard', href: '/dashboard', roles: ['citizen', 'admin', 'official'] },
  { label: 'Issues', href: '/issues', roles: ['citizen', 'admin', 'official'] },
  { label: 'Admin Panel', href: '/admin', roles: ['admin', 'official'] },
];

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled || menuOpen
        ? 'bg-bg-secondary/95 backdrop-blur-xl border-b border-border shadow-elevated'
        : 'bg-transparent'
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-8 h-8 bg-amber rounded-lg flex items-center justify-center glow-amber transition-all group-hover:scale-110">
                <MapPin size={16} className="text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-cyan-400 rounded-full border-2 border-bg-primary animate-pulse-slow" />
            </div>
            <span className="font-display text-xl font-bold tracking-wider text-white">
              CROWD<span className="text-amber">SENSE</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks
                .filter(l => !user || l.roles.includes(user.role))
                .map(link => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={clsx(
                      'px-4 py-1.5 rounded-lg text-sm font-body font-600 transition-all duration-200',
                      'uppercase tracking-widest text-xs font-display font-semibold',
                      isActive(link.href)
                        ? 'bg-amber/10 text-amber border border-amber/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Report Issue CTA */}
                <Link
                  to="/report"
                  className="hidden sm:flex items-center gap-2 btn-primary px-4 py-2 rounded-lg text-sm"
                >
                  <AlertTriangle size={14} />
                  Report Issue
                </Link>

                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(p => !p)}
                    className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-severity-critical rounded-full" />
                  </button>
                  <AnimatePresence>
                    {notifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 w-80 glass rounded-xl border border-border shadow-elevated overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                          <span className="font-display text-sm font-semibold uppercase tracking-widest text-white">Notifications</span>
                          <span className="text-xs text-gray-400">3 new</span>
                        </div>
                        {[
                          { text: 'Your issue #1048 was assigned to an official', time: '2m ago', dot: 'bg-cyan-400' },
                          { text: 'Issue #1032 near you has been resolved', time: '1h ago', dot: 'bg-severity-low' },
                          { text: 'Critical pothole detected on MG Road', time: '3h ago', dot: 'bg-severity-critical' },
                        ].map((n, i) => (
                          <div key={i} className="px-4 py-3 hover:bg-white/5 transition cursor-pointer flex gap-3">
                            <div className={clsx('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', n.dot)} />
                            <div>
                              <p className="text-sm text-gray-300 leading-snug">{n.text}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(p => !p)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-bg-elevated border border-border hover:border-amber/30 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber/20 border border-amber/30 flex items-center justify-center text-amber font-display font-bold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-body font-600 text-gray-300 hidden sm:block">{user?.name?.split(' ')[0]}</span>
                    <ChevronDown size={12} className={clsx('text-gray-500 transition-transform', profileOpen && 'rotate-180')} />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 top-full mt-2 w-52 glass rounded-xl border border-border shadow-elevated overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-sm font-semibold text-white">{user?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-display uppercase tracking-wider bg-amber/10 text-amber border border-amber/20">
                            {user?.role}
                          </span>
                        </div>
                        {[
                          { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
                          { icon: User, label: 'Profile', href: '/profile' },
                          { icon: Settings, label: 'Settings', href: '/settings' },
                        ].map(item => (
                          <Link
                            key={item.href}
                            to={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition"
                          >
                            <item.icon size={15} />
                            {item.label}
                          </Link>
                        ))}
                        <div className="border-t border-border">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/5 transition"
                          >
                            <LogOut size={15} />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn-secondary px-5 py-2 rounded-lg text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary px-5 py-2 rounded-lg text-sm"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMenuOpen(p => !p)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border py-4 space-y-1"
            >
              {isAuthenticated
                ? navLinks
                    .filter(l => !user || l.roles.includes(user.role))
                    .map(link => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className={clsx(
                          'block px-4 py-3 rounded-lg text-sm font-display uppercase tracking-widest transition',
                          isActive(link.href)
                            ? 'bg-amber/10 text-amber'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {link.label}
                      </Link>
                    ))
                : (
                  <div className="flex flex-col gap-2 pt-2">
                    <Link to="/login" className="btn-secondary px-4 py-2.5 rounded-lg text-center text-sm">Login</Link>
                    <Link to="/register" className="btn-primary px-4 py-2.5 rounded-lg text-center text-sm">Get Started</Link>
                  </div>
                )
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
