'use client';

import { useEffect, useState } from 'react';
import type { FunnelAnalytics } from '@/lib/types';

interface FunnelVisualizationProps {
  funnelId: number;
  days?: number;
}

export default function FunnelVisualization({ funnelId, days = 30 }: FunnelVisualizationProps) {
  const [analytics, setAnalytics] = useState<FunnelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [funnelId, days]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const res = await fetch(`/api/funnels/${funnelId}/analytics?days=${days}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load funnel analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (ms: number | null) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Failed to load analytics
      </div>
    );
  }

  const maxCount = Math.max(...analytics.steps.map(s => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Entries</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {analytics.total_entries.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Completions</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {analytics.total_completions.toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Conversion Rate</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {analytics.conversion_rate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg Time to Convert</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {formatTime(analytics.avg_time_to_convert)}
          </div>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {analytics.funnel.name}
        </h3>

        <div className="space-y-4">
          {analytics.steps.map((step, index) => {
            const widthPercent = (step.count / maxCount) * 100;
            const nextStep = analytics.steps[index + 1];
            const dropoffCount = nextStep ? step.count - nextStep.count : 0;

            return (
              <div key={index}>
                {/* Step Bar */}
                <div className="relative">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 transition-all duration-300"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <div className="font-semibold">{step.name}</div>
                        <div className="text-sm opacity-90 mt-1">
                          {step.count.toLocaleString()} visitors
                        </div>
                      </div>
                      {nextStep && (
                        <div className="text-right">
                          <div className="text-sm opacity-90">Drop-off</div>
                          <div className="font-semibold">{step.dropoff_rate.toFixed(1)}%</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Absolute positioned count */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-4 text-sm font-medium text-gray-600 dark:text-gray-400"
                       style={{ left: `${widthPercent}%`, marginLeft: '8px' }}>
                    {((step.count / analytics.total_entries) * 100).toFixed(1)}%
                  </div>
                </div>

                {/* Drop-off indicator */}
                {nextStep && dropoffCount > 0 && (
                  <div className="flex items-center gap-2 mt-2 ml-4 text-sm text-red-600 dark:text-red-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                    </svg>
                    <span>{dropoffCount.toLocaleString()} visitors dropped off</span>
                    {step.avg_time_to_next && (
                      <span className="text-gray-500 dark:text-gray-400">
                        • Avg time: {formatTime(step.avg_time_to_next)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Details Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Step
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Visitors
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Conversion Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Drop-off Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Avg Time to Next
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {analytics.steps.map((step, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {index + 1}. {step.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {step.count.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {((step.count / analytics.total_entries) * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={step.dropoff_rate > 50 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>
                    {step.dropoff_rate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {formatTime(step.avg_time_to_next)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
