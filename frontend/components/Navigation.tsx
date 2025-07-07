import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  HomeIcon,
  ViewColumnsIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Kanban Board', href: '/kanban', icon: ViewColumnsIcon },
    { name: 'Gantt Chart', href: '/gantt', icon: CalendarIcon },
    { name: 'Work Units', href: '/work-units', icon: DocumentChartBarIcon },
    { name: 'Simulation', href: '/simulation', icon: DocumentChartBarIcon },
    { name: 'Projects', href: '/projects', icon: UserGroupIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ]

  const isActive = (href: string) => {
    return router.pathname === href
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600"
        >
          {isOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg rounded-lg mt-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-base font-medium rounded-md`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon
                  className={`${
                    isActive(item.href) ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-4 h-6 w-6`}
                />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Desktop navigation */}
      <nav className="hidden lg:flex lg:space-x-8">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`${
              isActive(item.href)
                ? 'border-blue-500 text-gray-900'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <item.icon className="h-5 w-5 mr-2" />
            {item.name}
          </Link>
        ))}
      </nav>
    </>
  )
}

export default Navigation 