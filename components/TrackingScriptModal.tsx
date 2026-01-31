'use client';

import { useState } from 'react';

interface TrackingScriptModalProps {
  onClose: () => void;
}

export default function TrackingScriptModal({ onClose }: TrackingScriptModalProps) {
  const [copied, setCopied] = useState(false);

  // Generate script for current domain
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const scriptCode = `<script src="${baseUrl}/track.js" data-api="${baseUrl}/api/track" async></script>`;

  function copyToClipboard() {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Install Tracking Script
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Step 1: Copy the Script
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Copy this tracking script and paste it in your website's HTML, just before the closing <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">&lt;/body&gt;</code> tag.
            </p>
            <div className="relative">
              <pre className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto text-sm font-mono">
                {scriptCode}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-2 right-2 px-3 py-1 text-xs font-medium text-white bg-primary rounded hover:bg-blue-600 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Step 2: Verify Installation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              After installing the script:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Visit your website from a different device or browser</li>
              <li>Open your browser's developer console (F12)</li>
              <li>Look for successful tracking requests to <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">/api/track</code></li>
              <li>Check this dashboard - you should see your visit appear within seconds</li>
            </ul>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Privacy & Performance
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• The script is under 2KB and loads asynchronously (no impact on page speed)</li>
              <li>• Respects Do Not Track (DNT) browser settings</li>
              <li>• Only collects: page URL, referrer, user agent, and timestamp</li>
              <li>• No cookies or personal data tracking</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Common platforms:
            </p>
            <div className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <strong className="text-gray-900 dark:text-white">WordPress:</strong> Add to footer.php or use a plugin like "Insert Headers and Footers"
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Shopify:</strong> Theme → Edit Code → theme.liquid → Paste before <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">&lt;/body&gt;</code>
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">Webflow:</strong> Project Settings → Custom Code → Footer Code
              </div>
              <div>
                <strong className="text-gray-900 dark:text-white">HTML/Static:</strong> Add to your index.html before <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">&lt;/body&gt;</code>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
