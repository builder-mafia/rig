import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center gap-8 px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight">ALLIN</h1>
      <p className="max-w-xl text-lg text-gray-600 dark:text-gray-400">
        An open-source AI all-in-one kit with chat interface and extensible features.
      </p>
      <div className="flex gap-4">
        <Link
          href="/docs"
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Get Started
        </Link>
        <a
          href="https://github.com/your-username/allin"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          GitHub
        </a>
      </div>
    </div>
  )
}
