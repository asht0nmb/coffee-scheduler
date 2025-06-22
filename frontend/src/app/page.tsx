export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ☕ Coffee Scheduler
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Smart coffee chat scheduling across time zones
        </p>
        
        <div className="space-y-4">
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </a>
          
          <div className="text-sm text-gray-500">
            <p>🌍 Intelligent timezone handling</p>
            <p>📅 Advanced scheduling algorithms</p>
            <p>⚡ Seamless Google Calendar integration</p>
          </div>
        </div>
      </div>
    </div>
  );
}