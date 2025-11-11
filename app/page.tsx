export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-8">
          Bingo Caller 3000
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Professional Bingo Calling System
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/admin/dashboard"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Admin Dashboard
          </a>
          <a
            href="/login"
            className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Login
          </a>
        </div>
      </div>
    </main>
  )
}