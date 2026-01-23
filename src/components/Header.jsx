import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  User,
  ChevronDown,
  LogOut,
  Settings,
  HelpCircle,
  Search,
  Sun,
  Moon,
  Truck,
  Shield,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';

const Header = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    setShowDropdown(false);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Mock notifications data
  const notifications = [
    { id: 1, title: 'New Shipment', message: 'Shipment #1234 has been assigned to you', time: '5 min ago', read: false },
    { id: 2, title: 'Payment Received', message: 'Payment of $1,250 received', time: '1 hour ago', read: true },
    { id: 3, title: 'Maintenance Due', message: 'Vehicle #TRK-789 needs maintenance', time: '2 hours ago', read: true },
    { id: 4, title: 'Route Updated', message: 'Route optimization complete', time: '1 day ago', read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;


  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl">
        <div className="h-22 flex items-center justify-between px-4 md:px-6 lg:px-8">
          {/* Left: Logo & Navigation */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* Logo */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30 group-hover:ring-white/50 transition-all duration-300">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
              </div>
              <div className="hidden md:block">
                <h1 className="text-xl font-bold tracking-tight">HTC Transport</h1>
                <p className="text-xs text-blue-100 font-medium">Logistics & Transport</p>
              </div>
            </div>
          </div>

          {/* Right: Search & Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Search Bar */}
            <div className="hidden md:block relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search shipments, vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 lg:w-64 pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all duration-200"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-200" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-yellow-300" />
              ) : (
                <Moon className="w-5 h-5 text-blue-200" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        Mark all as read
                      </button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${notification.read ? 'bg-gray-100' : 'bg-blue-100'
                            }`}>
                            <Bell className={`w-4 h-4 ${notification.read ? 'text-gray-600' : 'text-blue-600'
                              }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className={`font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'
                                }`}>
                                {notification.title}
                              </h4>
                              <span className="text-xs text-gray-500">{notification.time}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 py-3 border-t border-gray-100">
                    <button
                      onClick={() => navigate('/notifications')}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200 group"
                aria-label="User menu"
              >
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-semibold leading-tight">
                    {user?.fullName || user?.firstName || 'User'}
                  </p>
                  <p className="text-xs text-blue-200 leading-tight">
                    {user?.role || 'Member'}
                  </p>
                </div>
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center ring-2 ring-white/30 group-hover:ring-white/50 transition-all duration-300">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold">
                        {getInitials(user?.fullName || user?.firstName)}
                      </span>
                    )}
                  </div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''
                  }`} />
              </button>

              {/* User Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                  {/* User Info */}
                  <div className="px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {getInitials(user?.fullName || user?.firstName)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {user?.fullName || user?.firstName || 'User'}
                        </p>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          <Shield className="w-3 h-3" />
                          {user?.role || 'Member'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                    >
                      <User className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                        navigate('/settings');
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                    >
                      <Settings className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                      Settings
                    </button>

                    <button
                      onClick={() => {
                        navigate('/help');
                        setShowDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors group"
                    >
                      <HelpCircle className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                      Help & Support
                    </button>

                    <div className="mx-4 my-2 border-t border-gray-100"></div>

                    <div className="mx-4 my-2 border-t border-gray-100"></div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <p className="text-xs text-gray-500">
                      HTC Transport v2.0
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Space for fixed header */}
      <div className="h-28 lg:h-16"></div>
    </>
  );
};

export default Header;