'use client';

import { useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import TrackingScriptModal from '@/components/TrackingScriptModal';
import InstallationChecker from '@/components/InstallationChecker';

export default function SettingsPage() {
  const [showScriptModal, setShowScriptModal] = useState(false);

  function handleExport() {
    // This will be called from the parent, but we'll implement it here
    fetch('/api/visitors')
      .then(res => res.json())
      .then(data => {
        const jsonData = JSON.stringify({
          visitors: data.visitors,
          exportedAt: new Date().toISOString()
        }, null, 2);
        
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leadtracker_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('Export failed:', err);
        alert('Export failed. Please try again.');
      });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ⚙️ Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your LeadTracker installation and configuration
          </p>
        </div>

        <div className="space-y-6">
          {/* Tracking Script Section */}
          <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  📜 Tracking Script
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Get the tracking code to install on your website
                </p>
              </div>
              <button
                onClick={() => setShowScriptModal(true)}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Get Script
              </button>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Installation Options:
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                  <span><strong>Basic Tracking:</strong> Visitor identification and analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                  <span><strong>Advanced Analytics:</strong> Session recording, heatmaps, and funnels</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Installation Checker Section */}
          <section>
            <InstallationChecker />
          </section>

          {/* Data Export Section */}
          <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  💾 Data Export
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Export all visitor data as JSON
                </p>
              </div>
              <button
                onClick={handleExport}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Data
              </button>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Export includes:
              </h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  All visitor IP addresses
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Company names and location data
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Visit timestamps and page views
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ISP and bot detection flags
                </li>
              </ul>
            </div>
          </section>

          {/* API Information Section */}
          <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              🔌 API Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  API Endpoint:
                </h3>
                <code className="block bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/track
                </code>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Features:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Real-time visitor tracking
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    IP geolocation & ISP detection
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Bot & VPN detection
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    24h intelligent caching
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Modals */}
      {showScriptModal && (
        <TrackingScriptModal onClose={() => setShowScriptModal(false)} />
      )}
    </div>
  );
}
