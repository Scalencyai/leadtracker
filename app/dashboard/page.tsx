'use client';

import { useState, useEffect } from 'react';
import VisitorTable from '@/components/VisitorTable';
import StatsCards from '@/components/StatsCards';
import Filters from '@/components/Filters';
import TrackingScriptModal from '@/components/TrackingScriptModal';
import InstallationChecker from '@/components/InstallationChecker';
import DashboardNav from '@/components/DashboardNav';
import type { VisitorWithStats } from '@/lib/types';

export default function Dashboard() {
  const [visitors, setVisitors] = useState<VisitorWithStats[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<VisitorWithStats[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const [hideBotsAndISPs, setHideBotsAndISPs] = useState(false);

  // Load data from API
  useEffect(() => {
    fetchVisitors();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchVisitors, 5000);
    return () => clearInterval(interval);
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
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

  function applyFilters() {
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
  }

  function handleExport() {
    const jsonData = JSON.stringify({
      visitors,
      exportedAt: new Date().toISOString()
    }, null, 2);
    
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadtracker_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Loading UI
  if (loading && visitors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error UI
  if (error && visitors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Connection Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={fetchVisitors}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Navigation */}
      <DashboardNav />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                LeadTracker
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Free B2B Website Visitor Identification (Cookie-based)
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleExport}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                📥 Export
              </button>
              <button
                onClick={() => setShowScriptModal(true)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                🔧 Get Script
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
          />
        </div>
      </main>

      {/* Modals */}
      {showScriptModal && (
        <TrackingScriptModal onClose={() => setShowScriptModal(false)} />
      )}
    </div>
  );
}
