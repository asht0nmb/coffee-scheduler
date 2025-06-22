export default function DashboardPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Coffee Scheduler
          </h1>
          <p className="text-gray-600 mb-8">
            Manage your contacts and schedule coffee chats across time zones
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Contacts</h3>
              <p className="text-gray-600 mb-4">Manage your coffee chat contacts</p>
              <a href="/dashboard/contacts" className="text-blue-600 hover:text-blue-800">
                View Contacts →
              </a>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Scheduling</h3>
              <p className="text-gray-600 mb-4">Schedule batch coffee chats</p>
              <a href="/dashboard/scheduling" className="text-blue-600 hover:text-blue-800">
                Start Scheduling →
              </a>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Results</h3>
              <p className="text-gray-600 mb-4">View scheduling results</p>
              <a href="/dashboard/results" className="text-blue-600 hover:text-blue-800">
                View Results →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}