'use client';

import { useEffect, useState } from 'react';
import type { Visitor, PageView } from '@/lib/db';

interface VisitorDetailPanelProps {
  visitorId: number;
  onClose: () => void;
}

export default function VisitorDetailPanel({ visitorId, onClose }: VisitorDetailPanelProps) {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [visitorId]);

  async function fetchDetails() {
    try {
      const res = await fetch(`/api/visitors/${visitorId}`);
      const data = await res.json();
      setVisitor(data.visitor);
      setPageViews(data.pageViews);
    } catch (error) {
      console.error('Failed to fetch visitor details:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 w-full md:w-1/2 lg:w-1/3 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl z-40">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!visitor) {
    return null;
  }

  const companyName = visitor.company_name || 'Unknown Company';
  const location = [visitor.city, visitor.country].filter(Boolean).join(', ') || 'Unknown';
  const sessionDuration = visitor.last_seen - visitor.first_seen;
  const isActive = Date.now() - visitor.last_seen < 5 * 60 * 1000;

  function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return '< 1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  function formatDateTime(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  function getReadableUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  }

  function getReferrerSource(referrer: string | null): string {
    if (!referrer) return 'Direct';
    try {
      const url = new URL(referrer);
      const hostname = url.hostname;
      if (hostname.includes('google')) return 'Google';
      if (hostname.includes('linkedin')) return 'LinkedIn';
      if (hostname.includes('facebook')) return 'Facebook';
      if (hostname.includes('twitter') || hostname.includes('t.co')) return 'Twitter';
      if (hostname.includes('bing')) return 'Bing';
      return hostname;
    } catch {
      return 'Direct';
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full md:w-1/2 lg:w-1/3 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl z-40 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {companyName}
                </h2>
                {isActive && (
                  <span className="flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {location}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Visits</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {pageViews.length}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">Session Duration</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatDuration(sessionDuration)}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <DetailRow label="IP Address" value={visitor.ip_address} mono />
            <DetailRow label="ISP" value={visitor.isp || 'Unknown'} />
            <DetailRow label="First Seen" value={formatDateTime(visitor.first_seen)} />
            <DetailRow label="Last Seen" value={formatDateTime(visitor.last_seen)} />
            {visitor.is_bot === 1 && (
              <DetailRow label="Type" value="Bot Detected" badge="red" />
            )}
            {visitor.is_isp === 1 && (
              <DetailRow label="Type" value="ISP Detected" badge="yellow" />
            )}
          </div>

          {/* Referrer Source */}
          {pageViews.length > 0 && pageViews[0].referrer && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Traffic Source
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {getReferrerSource(pageViews[0].referrer)}
                </div>
                {pageViews[0].referrer && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono truncate">
                    {pageViews[0].referrer}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Page Views */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Pages Viewed ({pageViews.length})
            </h3>
            <div className="space-y-2">
              {pageViews.map((pv) => (
                <div
                  key={pv.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {getReadableUrl(pv.page_url)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDateTime(pv.viewed_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
  badge?: 'red' | 'yellow' | 'green';
}

function DetailRow({ label, value, mono, badge }: DetailRowProps) {
  const badgeClasses = {
    red: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    green: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  };

  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      {badge ? (
        <span className={`text-xs font-medium px-2 py-1 rounded ${badgeClasses[badge]}`}>
          {value}
        </span>
      ) : (
        <div className={`text-sm text-gray-900 dark:text-white ${mono ? 'font-mono' : ''}`}>
          {value}
        </div>
      )}
    </div>
  );
}
