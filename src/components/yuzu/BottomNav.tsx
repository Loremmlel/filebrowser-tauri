import { ROUTES } from '@/constants/routes'
import { HomeIcon, StarIcon } from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid'
import { useLocation, useNavigate } from 'react-router-dom'

interface NavItem {
  route: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    route: ROUTES.MAIN,
    label: '主页',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    route: ROUTES.FAVORITE,
    label: '收藏',
    icon: StarIcon,
    activeIcon: StarIconSolid,
  },
]

export const BottomNav: React.FC = () => {
  const localtion = useLocation()
  const navigate = useNavigate()

  function handleNavigation(route: string) {
    navigate(route, { replace: true })
  }

  return (
    <nav className='w-full bg-blue-50 border-t border-blue-100'>
      <div className='flex items-center justify-around h-16'>
        {navItems.map(({ route, label, icon, activeIcon }) => {
          const isActive = localtion.pathname === route
          const IconComponent = isActive ? activeIcon : icon

          return (
            <button
              key={route}
              onClick={() => handleNavigation(route)}
              className={`
                flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-lg transition-colors duration-200
                ${isActive ? 'text-blue-600' : 'text-blue-400 hover:text-blue-500'}
            `}
            >
              <IconComponent className='w-6 h-6' />
              <span className='text-xs font-medium'>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
