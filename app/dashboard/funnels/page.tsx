'use client';

import { useState, useEffect } from 'react';
import DashboardNav from '@/components/DashboardNav';
import FunnelBuilder from '@/components/FunnelBuilder';
import FunnelVisualization from '@/components/FunnelVisualization';
import type { Funnel, FunnelStep } from '@/lib/types';

export default function FunnelsPage() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFunnels();
  }, []);

  async function loadFunnels() {
    try {
      setLoading(true);
      const res = await fetch('/api/funnels');
      const data = await res.json();
      setFunnels(data.funnels || []);
    } catch (error) {
      console.error('Failed to load funnels:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFunnel(name: string, description: string, steps: FunnelStep[]) {
    try {
      const res = await fetch('/api/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, steps })
      });

      if (res.ok) {
        await loadFunnels();
        setShowBuilder(false);
      } else {
        alert('Failed to create funnel');
      }
    } catch (error) {
      console.error('Failed to create funnel:', error);
      alert('Failed to create funnel');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DashboardNav />
      
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                Conversion Funnels
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-2">
                Track user journeys and conversion rates
              </p>
            </div>
            <button
              onClick={() => setShowBuilder(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              + Create Funnel
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : funnels.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No funnels yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create your first funnel to track conversions
            </p>
            <button
              onClick={() => setShowBuilder(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Your First Funnel
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Funnel List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {funnels.map((funnel) => (
                <div
                  key={funnel.id}
                  onClick={() => setSelectedFunnel(funnel.id)}
                  className={`bg-white dark:bg-gray-900 rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedFunnel === funnel.id ? 'ring-2 ring-blue-600' : ''
                  }`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {funnel.name}
                  </h3>
                  {funnel.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {funnel.description}
                    </p>
                  )}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {funnel.steps.length} steps
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Funnel Visualization */}
            {selectedFunnel && (
              <div className="mt-8">
                <FunnelVisualization funnelId={selectedFunnel} days={30} />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Funnel Builder Modal */}
      {showBuilder && (
        <FunnelBuilder
          onSave={handleCreateFunnel}
          onCancel={() => setShowBuilder(false)}
        />
      )}
    </div>
  );
}
