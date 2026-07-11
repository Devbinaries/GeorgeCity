import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CircleUserRound } from 'lucide-react'
import Logo from "./Logo"
import  {useAuth}  from '../hooks/useAuth'

const DEFAULT_AVATAR = 'https://via.placeholder.com/40/cccccc/969696?text=User'

export default function Header() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = () => {
    logout()
    setShowMenu(false)
    navigate('/')
  }

  const profilePhoto = user?.photo ? user.photo : DEFAULT_AVATAR
  const userName = user?.firstName || user?.first_name || user?.username || 'User'

  return (
    <header className="fixed top-0  w-full bg-white px-4 py-3 ">
      <div className="flex items-center justify-between">
        <div className="flex-shrink-0">
          <Logo />
        </div>

        {isAuthenticated ? (
          <div>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center  px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
            >
              <div className='rounded-full w-16 h-16 flex items-center justify-center'><CircleUserRound/></div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {userName}
              </span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                <Link
                  to={`/${user?.username}`}
                  onClick={() => setShowMenu(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowMenu(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Settings
                </Link>
                <Link
                  to="/"
                  onClick={() => setShowMenu(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Dashboard
                </Link>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Link
              to="/signup"
              className="px-3 py-2 border border-green-500 text-green-500 text-center rounded-lg hover:bg-green-50 transition-colors"
            >
              Sign Up
            </Link>
            <Link
              to="/signin"
              className="px-3 py-2 bg-green-500 rounded-lg text-white hover:bg-green-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
