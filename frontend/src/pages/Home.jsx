import UploadZone from "../components/UploadZone"

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-dark text-white relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(124,110,250,0.20) 0%, transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(124,110,250,0.10) 0%, transparent 60%)",
        }}
      />

      <header className="relative z-10 px-8 py-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m22 8-6 4 6 4V8Z" />
            <rect x="2" y="6" width="14" height="12" rx="2" ry="2" />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight">
          AI Caption Studio
        </span>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-10 pb-24 min-h-[calc(100vh-80px)]">
        <h1 className="text-4xl md:text-5xl font-semibold text-center tracking-tight max-w-3xl">
          Add captions to any video in seconds
        </h1>
        <p className="mt-3 text-white/60 text-center text-base">
          Powered by Gemini AI
        </p>

        <div className="mt-12 w-full">
          <UploadZone />
        </div>
      </main>
    </div>
  )
}
