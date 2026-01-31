'use client';

import { useState, useEffect } from 'react';
import VisitorTable from '@/components/VisitorTable';
import StatsCards from '@/components/StatsCards';
import Filters from '@/components/Filters';
import TrackingScriptModal from '@/components/TrackingScriptModal';
import VisitorDetailPanel from '@/components/VisitorDetailPanel';
import InstallationChecker from '@/components/InstallationChecker';
import type { VisitorWithStats } from '@/lib/db';

export default function Dashboard() {
  const [visitors, setVisitors] = useState<VisitorWithStats[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<VisitorWithStats[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<number | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const [hideBotsAndISPs, setHideBotsAndISPs] = useState(true);

  // Load initial data and setup SSE
  useEffect(() => {
    // Fetch initial data
    fetchVisitors();

    // Setup Server-Sent Events for realtime updates (only if no error)
    let eventSource: EventSource | null = null;
    
    if (!error) {
      try {
        eventSource = new EventSource('/api/visitors/stream');

        eventSource.onmessage = (event) => {
          try {
            const updatedVisitors = JSON.parse(event.data);
            setVisitors(updatedVisitors);
            setError(null);
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        };

        eventSource.onerror = (e) => {
          console.error('SSE connection error:', e);
          // Don't show error to user, just log it
        };
      } catch (e) {
        console.error('Failed to setup SSE:', e);
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [error]);

  // Apply filters
  useEffect(() => {
    let filtered = [...visitors];

    // Hide bots and ISPs
    if (hideBotsAndISPs) {
      filtered = filtered.filter(v => !v.is_bot && !v.is_isp);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        (v.company_name?.toLowerCase().includes(query)) ||
        v.ip_address.includes(query)
      );
    }

    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter(v => v.country === selectedCountry);
    }

    // Active only
    if (activeOnly) {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      filtered = filtered.filter(v => v.last_seen >= fiveMinutesAgo);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = Date.now();
      let cutoff = 0;

      switch (dateRange) {
        case 'today':
          cutoff = now - 24 * 60 * 60 * 1000;
          break;
        case '7days':
          cutoff = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case '30days':
          cutoff = now - 30 * 24 * 60 * 60 * 1000;
          break;
      }

      filtered = filtered.filter(v => v.last_seen >= cutoff);
    }

    setFilteredVisitors(filtered);
  }, [visitors, searchQuery, selectedCountry, dateRange, activeOnly, hideBotsAndISPs]);

  async function fetchVisitors() {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/visitors');
      
      if (!res.ok) {
        throw new Error(`API returned ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data.visitors && Array.isArray(data.visitors)) {
        setVisitors(data.visitors);
      } else {
        setVisitors([]);
      }
      
      if (data.countries && Array.isArray(data.countries)) {
        setCountries(data.countries);
      } else {
        setCountries([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch visitors:', error);
      setError(error.message || 'Failed to load data');
      setVisitors([]);
      setCountries([]);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    const params = new URLSearchParams();
    if (hideBotsAndISPs) params.set('hideBotsAndISPs', 'true');
    if (selectedCountry) params.set('country', selectedCountry);
    if (searchQuery) params.set('search', searchQuery);
    if (activeOnly) params.set('activeOnly', 'true');

    const url = `/api/export?${params.toString()}`;
    window.open(url, '_blank');
  }

  // Error UI
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Database Connection Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={fetchVisitors}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Retry Connection
            </button>
            <div className="mt-4 text-sm text-gray-500">
              <p>Debug endpoints:</p>
              <a href="/api/debug" target="_blank" className="text-blue-600 hover:underline">
                /api/debug
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading UI
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                LeadTracker
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Free B2B Website Visitor Identification
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => setShowScriptModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Tracking Script
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StatsCards visitors={filteredVisitors} />

        {/* Installation Checker */}
        <div className="mt-8">
          <InstallationChecker />
        </div>

        <div className="mt-8">
          <Filters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCountry={selectedCountry}
            setSelectedCountry={setSelectedCountry}
            countries={countries}
            dateRange={dateRange}
            setDateRange={setDateRange}
            activeOnly={activeOnly}
            setActiveOnly={setActiveOnly}
            hideBotsAndISPs={hideBotsAndISPs}
            setHideBotsAndISPs={setHideBotsAndISPs}
          />

          <VisitorTable
            visitors={filteredVisitors}
            onSelectVisitor={setSelectedVisitor}
          />
        </div>
      </main>

      {/* Modals */}
      {showScriptModal && (
        <TrackingScriptModal onClose={() => setShowScriptModal(false)} />
      )}

      {selectedVisitor && (
        <VisitorDetailPanel
          visitorId={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
        />
      )}
    </div>
  );
}
