import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-och-midnight flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-och-mint">OCH Platform</h1>
        <div className="space-x-4">
          <Link href="/login" className="text-och-defender hover:text-och-mint transition">
            Login
          </Link>
          <Link href="/signup" className="text-och-defender hover:text-och-mint transition">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

