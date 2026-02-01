'use client';

import { useState } from 'react';
import DashboardNav from '@/components/DashboardNav';
import HeatmapViewer from '@/components/HeatmapViewer';

export default function HeatmapsPage() {
  const [pageUrl, setPageUrl] = useState('');
  const [activePageUrl, setActivePageUrl] = useState('');
  const [days, setDays] = useState(7);

  const handleLoadHeatmap = () => {
    if (pageUrl.trim()) {
      setActivePageUrl(pageUrl.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardNav />
      
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
              Click & Scroll Heatmaps
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
              Visualize where users click and scroll on your pages
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page URL Input */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLoadHeatmap()}
              placeholder="Enter page URL..."
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-3 sm:px-4 py-2 sm:py-3 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button
              onClick={handleLoadHeatmap}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Load Heatmap
            </button>
          </div>
        </div>

        {/* Heatmap Viewer */}
        {activePageUrl ? (
          <HeatmapViewer pageUrl={activePageUrl} days={days} />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔥</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Enter a page URL to view heatmaps
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              See where your visitors are clicking and scrolling
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
