export default function DashboardPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-2 border-dashed border-secondary-300 bg-secondary-50 rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold text-primary-800 mb-4">
            Welcome to Coffee Scheduler
          </h1>
          <p className="text-lg font-body text-neutral-600 mb-8">
            Brew perfect connections with intelligent scheduling across time zones
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md border border-secondary-200 hover:shadow-lg transition-shadow">
              <div className="text-accent-600 text-3xl mb-3">📱</div>
              <h3 className="text-lg font-display font-semibold text-primary-800 mb-2">Contacts</h3>
              <p className="font-body text-neutral-600 mb-4">Manage your coffee chat network and contact preferences</p>
              <a href="/dashboard/contacts" className="inline-flex items-center font-medium text-primary-600 hover:text-primary-700 transition-colors">
                View Contacts 
                <span className="ml-1 text-accent-500">→</span>
              </a>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-secondary-200 hover:shadow-lg transition-shadow">
              <div className="text-accent-600 text-3xl mb-3">⚡</div>
              <h3 className="text-lg font-display font-semibold text-primary-800 mb-2">Smart Scheduling</h3>
              <p className="font-body text-neutral-600 mb-4">AI-powered batch scheduling for optimal meeting times</p>
              <a href="/dashboard/scheduling" className="inline-flex items-center font-medium text-primary-600 hover:text-primary-700 transition-colors">
                Start Brewing 
                <span className="ml-1 text-accent-500">→</span>
              </a>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md border border-secondary-200 hover:shadow-lg transition-shadow">
              <div className="text-accent-600 text-3xl mb-3">📊</div>
              <h3 className="text-lg font-display font-semibold text-primary-800 mb-2">Results</h3>
              <p className="font-body text-neutral-600 mb-4">Track scheduling success and connection insights</p>
              <a href="/dashboard/results" className="inline-flex items-center font-medium text-primary-600 hover:text-primary-700 transition-colors">
                View Results 
                <span className="ml-1 text-accent-500">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}