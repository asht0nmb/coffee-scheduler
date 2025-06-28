export default function ContactsPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-display font-semibold text-neutral-900">Contacts</h1>
          <p className="mt-2 text-sm font-body text-neutral-600">
            Manage your professional network and meeting preferences.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto transition-colors"
          >
            Add Contact
          </button>
        </div>
      </div>
      
      <div className="mt-8 border-2 border-dashed border-secondary-200 bg-secondary-50 rounded-lg p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-primary-500 text-4xl mb-4">
            📱
          </div>
          <h3 className="mt-2 text-sm font-display font-medium text-neutral-900">No contacts yet</h3>
          <p className="mt-1 text-sm font-body text-neutral-500">
            Start building your professional network by adding your first contact.
          </p>
        </div>
      </div>
    </div>
  );
}