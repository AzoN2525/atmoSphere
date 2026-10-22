import { CloudSun, Home, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

export function Navbar() {
  const [isVisible, setIsVisible] = useState(true)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollDifference = currentScrollY - lastScrollYRef.current

      if (currentScrollY < 16) {
        setIsVisible(true)
      } else if (scrollDifference > 8) {
        setIsVisible(false)
      } else if (scrollDifference < -8) {
        setIsVisible(true)
      }

      lastScrollYRef.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{
        backgroundColor: '#006948',
        borderColor: '#bccac0',
      }}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid min-h-16 grid-cols-3 items-center gap-4">

          {/* Logo */}
          <Link
            to="/"
            className="justify-self-start flex shrink-0 items-center gap-2.5 rounded-md px-0 text-white hover:scale-105 transition-transform"
            aria-label="AtmoSphere home"
          >
            <span
              className="flex items-center justify-center rounded-md p-2"
              style={{
                border: '1px solid rgba(255,255,255,0.25)',
                backgroundColor: 'rgba(255,255,255,0.15)',
              }}
            >
              <CloudSun className="size-5" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-tight sm:text-lg text-white">
                AtmoSphere
              </span>
              <span
                className="hidden text-[0.65rem] font-semibold uppercase tracking-widest sm:block"
                style={{ color: 'rgba(255,255,255,0.65)' }}
              >
                Weather intelligence
              </span>
            </span>
          </Link>

          {/* Nav links — centered */}
          <div className="flex justify-center">
            <div
              className="flex items-center gap-1 rounded-lg p-1"
              style={{
                border: '1px solid rgba(255,255,255,0.15)',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <Link
                to="/"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors hover:scale-105 transition-transform"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                activeProps={{
                  style: {
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    color: '#ffffff',
                    fontWeight: 800,
                  },
                }}
              >
                <Home className="size-4" aria-hidden="true" />
                Home
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors hover:scale-105 transition-transform"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                activeProps={{
                  style: {
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    color: '#ffffff',
                    fontWeight: 800,
                  },
                }}
              >
                Dashboard
              </Link>
              <Link
                to="/hotspots"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors hover:scale-105 transition-transform"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                activeProps={{
                  style: {
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    color: '#ffffff',
                    fontWeight: 800,
                  },
                }}
              >
                Hotspots
              </Link>
               <Link
                to="/alerts"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors hover:scale-105 transition-transform"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                activeProps={{
                  style: {
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    color: '#ffffff',
                    fontWeight: 800,
                  },
                }}
              >
                Alerts
              </Link>
            </div>
          </div>

          {/* User button */}
          <Button
            variant="ghost"
            size="sm"
            className="justify-self-end shrink-0 text-white hover:text-white  hover:scale-105 transition-transform"
            style={{
              border: '1px solid rgba(255,255,255,0.2)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={e =>
              (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')
            }
            onMouseLeave={e =>
              (e.currentTarget.style.backgroundColor = 'transparent')
            }
            aria-label="User account"
          >
            <User className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">User</span>
          </Button>

        </div>
      </div>
    </nav>
  )
}
