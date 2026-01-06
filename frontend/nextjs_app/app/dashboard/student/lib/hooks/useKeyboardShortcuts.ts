'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useKeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            router.push('/dashboard/student')
            break
          case '2':
            e.preventDefault()
            router.push('/dashboard/student/curriculum')
            break
          case '3':
            e.preventDefault()
            router.push('/dashboard/student/missions')
            break
          case '4':
            e.preventDefault()
            router.push('/dashboard/student/portfolio')
            break
          case '5':
            e.preventDefault()
            router.push('/dashboard/student/mentorship')
            break
          case '6':
            e.preventDefault()
            router.push('/dashboard/student/settings')
            break
          case 'k':
            e.preventDefault()
            const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
            if (searchInput) {
              searchInput.focus()
            }
            break
        }
      }

      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[role="dialog"]')
        if (modals.length > 0) {
          const lastModal = modals[modals.length - 1] as HTMLElement
          const closeButton = lastModal.querySelector('[aria-label*="close"], [aria-label*="Close"]') as HTMLElement
          if (closeButton) {
            closeButton.click()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])
}

