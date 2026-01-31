'use client';

import { useState, useEffect } from 'react';
import VisitorTable from '@/components/VisitorTable';
import StatsCards from '@/components/StatsCards';
import Filters from '@/components/Filters';
import TrackingScriptModal from '@/components/TrackingScriptModal';
import VisitorDetailPanel from '@/components/VisitorDetailPanel';
import type { VisitorWithStats } from '@/lib/db';

export default function Dashboard() {
  const [visitors, setVisitors] = useState<VisitorWithStats[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<VisitorWithStats[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<number | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  
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

    // Setup Server-Sent Events for realtime updates
    const eventSource = new EventSource('/api/visitors/stream');

    eventSource.onmessage = (event) => {
      const updatedVisitors = JSON.parse(event.data);
      setVisitors(updatedVisitors);
    };

    eventSource.onerror = () => {
      console.error('SSE connection error, will retry...');
    };

    return () => {
      eventSource.close();
    };
  }, []);

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
      const res = await fetch('/api/visitors');
      const data = await res.json();
      setVisitors(data.visitors);
      setCountries(data.countries);
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
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
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-600 transition-colors"
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
