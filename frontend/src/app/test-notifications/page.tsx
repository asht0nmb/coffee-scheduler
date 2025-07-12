'use client';

import { useState } from 'react';
import { SimplePopup } from '@/components/ui/simple-popup';
import { Button } from '@/components/ui/button';

export default function TestNotifications() {
  const [showWarning, setShowWarning] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showModalExample, setShowModalExample] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-neutral-900 mb-2">
            Simple Popup Test
          </h1>
          <p className="text-neutral-600 font-body">
            Testing our simple auto-dismiss popup notifications.
          </p>
        </div>

        {/* Control Buttons */}
        <div className="bg-white p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-display font-semibold">Test Controls</h2>
          <p className="text-sm text-neutral-600">
            Each popup auto-dismisses after 3 seconds. Click to test different types.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button onClick={() => setShowWarning(true)}>
              Warning Popup
            </Button>
            <Button onClick={() => setShowError(true)}>
              Error Popup
            </Button>
            <Button onClick={() => setShowSuccess(true)}>
              Success Popup
            </Button>
            <Button onClick={() => setShowInfo(true)}>
              Info Popup
            </Button>
            <Button onClick={() => setShowModalExample(!showModalExample)}>
              Test Modal + Popup
            </Button>
          </div>
        </div>

        {/* Demo Description */}
        <div className="bg-white p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-display font-semibold">How It Works</h2>
          <div className="space-y-2 text-sm text-neutral-600">
            <p>• Click any button above to trigger a popup</p>
            <p>• Popup appears instantly with smooth animation</p>
            <p>• Auto-dismisses after 3 seconds</p>
            <p>• No manual interaction required</p>
            <p>• Perfect for quick feedback and warnings</p>
          </div>
        </div>
      </div>

      {/* Simple Popup Examples */}
      <SimplePopup
        show={showWarning}
        onHide={() => setShowWarning(false)}
        title="Missing contacts"
        message="Please add at least one contact to continue with scheduling."
        type="warning"
        duration={3000}
      />

      <SimplePopup
        show={showError}
        onHide={() => setShowError(false)}
        title="Upload failed"
        message="The file you selected is too large. Please choose a file under 10MB."
        type="error"
        duration={3000}
      />

      <SimplePopup
        show={showSuccess}
        onHide={() => setShowSuccess(false)}
        title="Schedule created!"
        message="Your coffee chat has been scheduled successfully."
        type="success"
        duration={3000}
      />

      <SimplePopup
        show={showInfo}
        onHide={() => setShowInfo(false)}
        title="Pro tip"
        message="You can schedule up to 10 contacts in a single batch for optimal results."
        type="info"
        duration={3000}
      />

      {/* Modal + Popup Example */}
      {showModalExample && (
        <>
          {/* Mock Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowModalExample(false)} />
            <div className="relative bg-white p-6 rounded-lg border max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">Example Modal</h3>
              <p className="text-neutral-600 mb-4">This modal demonstrates how popup notifications appear above modals and auto-dismiss.</p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowWarning(true)}
                  size="sm"
                >
                  Show Auto-Dismiss Popup
                </Button>
                <Button 
                  onClick={() => setShowModalExample(false)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}