export default function SchedulingPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-display font-semibold text-primary-800">Smart Scheduling</h1>
          <p className="mt-2 text-sm font-body text-neutral-600">
            Brew perfect meetings with AI-powered scheduling across time zones.
          </p>
        </div>
      </div>
      
      <div className="mt-8 border-2 border-dashed border-secondary-300 bg-white rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-accent-500 text-4xl mb-4">
            ⚙️
          </div>
          <h3 className="mt-2 text-lg font-display font-semibold text-primary-800">Intelligent Batch Scheduling</h3>
          <p className="mt-2 text-sm font-body text-neutral-600 max-w-md mx-auto">
            Our advanced 3-phase algorithm finds optimal meeting times, considering time zones, preferences, and availability patterns.
          </p>
          <div className="mt-6">
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Start Brewing Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}