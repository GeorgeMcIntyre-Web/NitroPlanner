import React, { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  ViewColumnsIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  UserIcon,
  BellIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const OptimizedNavigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Memoized navigation items
  const navigation = useMemo<NavigationItem[]>(() => [
    { name: 'Dashboard', href: '/', icon: HomeIcon, description: 'Overview and key metrics' },
    { name: 'Digital Twin', href: '/digital-twin', icon: UserIcon, description: 'Your digital profile' },
    { name: 'Team Capacity', href: '/team-capacity', icon: UserGroupIcon, description: 'Team workload and availability' },
    { name: 'Work Units', href: '/work-units', icon: DocumentChartBarIcon, description: 'Browse and manage work units' },
    { name: 'Projects', href: '/projects', icon: ViewColumnsIcon, description: 'Project management' },
    { name: 'Kanban', href: '/kanban', icon: ViewColumnsIcon, description: 'Kanban board view' },
    { name: 'Gantt', href: '/gantt', icon: CalendarIcon, description: 'Gantt chart timeline' },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, description: 'Performance analytics' },
    { name: 'Settings', href: '/settings', icon: CogIcon, description: 'Application settings' },
  ], []);

  // Memoized breadcrumbs
  const breadcrumbs = useMemo(() => {
    const pathSegments = router.pathname.split('/').filter(Boolean);
    return pathSegments.map((segment, index) => ({
      name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: '/' + pathSegments.slice(0, index + 1).join('/'),
      current: index === pathSegments.length - 1
    }));
  }, [router.pathname]);

  // Memoized active state check
  const isActive = useCallback((href: string) => {
    return router.pathname === href;
  }, [router.pathname]);

  // Keyboard navigation handlers
  const handleKeyDown = useCallback((event: React.KeyboardEvent, href: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      router.push(href);
      setIsOpen(false);
    }
  }, [router]);

  const toggleMenu = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-700">NitroPlanner</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigation.slice(0, 4).map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, item.href)}
                  title={item.description}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User menu and mobile button */}
          <div className="flex items-center">
            {/* Desktop User Menu */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              <button 
                className="p-2 text-gray-400 hover:text-gray-500 relative focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                aria-label="Notifications"
              >
                <BellIcon className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
              
              <div className="relative">
                <button 
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <span className="hidden lg:block text-sm font-medium">User</span>
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded={isOpen}
                aria-label="Toggle navigation menu"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4 py-3">
                <li>
                  <Link 
                    href="/" 
                    className="text-gray-400 hover:text-gray-500 flex items-center"
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyDown(e, '/')}
                  >
                    <HomeIcon className="h-4 w-4" />
                    <span className="sr-only">Home</span>
                  </Link>
                </li>
                {breadcrumbs.map((breadcrumb, index) => (
                  <li key={breadcrumb.href} className="flex items-center">
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                    {breadcrumb.current ? (
                      <span className="ml-4 text-sm font-medium text-gray-500" aria-current="page">
                        {breadcrumb.name}
                      </span>
                    ) : (
                      <Link
                        href={breadcrumb.href}
                        className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                        tabIndex={0}
                        onKeyDown={(e) => handleKeyDown(e, breadcrumb.href)}
                      >
                        {breadcrumb.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2 text-base font-medium transition-colors duration-200 ${
                isActive(item.href)
                  ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
              onClick={() => setIsOpen(false)}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, item.href)}
              title={item.description}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </div>
        
        {/* Mobile user menu */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">User</div>
              <div className="text-sm font-medium text-gray-500">user@example.com</div>
            </div>
            <button 
              className="ml-auto flex-shrink-0 p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              aria-label="Notifications"
            >
              <BellIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(OptimizedNavigation); 