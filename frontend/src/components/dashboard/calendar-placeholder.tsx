export const CalendarPlaceholder = () => {
  return (
    <div className="bg-white border border-secondary-200 rounded-lg p-8 h-96 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-display font-semibold text-neutral-900 mb-2">
          Calendar Integration
        </h3>
        <p className="font-body text-neutral-600">
          Your calendar will appear here
        </p>
      </div>
    </div>
  );
};