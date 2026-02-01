'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Visitor, PageView } from '@/lib/types';

export default function VisitorDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const visitorId = parseInt(params.id);
  
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [pageViews, setPageViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingIP, setRefreshingIP] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [visitorId]);

  async function fetchDetails() {
    try {
      const res = await fetch(`/api/visitors/${visitorId}`);
      const data = await res.json();
      
      // Parse timestamps as numbers
      if (data.visitor) {
        data.visitor.first_seen = parseInt(data.visitor.first_seen);
        data.visitor.last_seen = parseInt(data.visitor.last_seen);
        if (data.visitor.lookup_cached_at) {
          data.visitor.lookup_cached_at = parseInt(data.visitor.lookup_cached_at);
        }
      }
      
      if (data.pageViews) {
        data.pageViews = data.pageViews.map((pv: any) => ({
          ...pv,
          viewed_at: parseInt(pv.viewed_at)
        }));
      }
      
      setVisitor(data.visitor);
      setPageViews(data.pageViews);
    } catch (error) {
      console.error('Failed to fetch visitor details:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshIPLookup() {
    if (!visitor) return;
    
    setRefreshingIP(true);
    try {
      const res = await fetch(`/api/visitors/${visitorId}/refresh-ip`, {
        method: 'POST'
      });
      
      if (res.ok) {
        await fetchDetails();
      } else {
        const data = await res.json();
        alert(`IP Lookup failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to refresh IP lookup:', error);
      alert('Failed to refresh IP lookup');
    } finally {
      setRefreshingIP(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!visitor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Visitor not found</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const companyName = visitor.company_name || 'Unknown Company';
  const location = [visitor.city, visitor.country].filter(Boolean).join(', ') || 'Unknown';
  const sessionDuration = visitor.last_seen - visitor.first_seen;
  const isActive = Date.now() - visitor.last_seen < 5 * 60 * 1000;
  
  const uniquePages = new Set(pageViews.map(pv => pv.page_url)).size;
  const avgTimePerPage = pageViews.length > 1 ? sessionDuration / pageViews.length : 0;
  const entryPage = pageViews[pageViews.length - 1]?.page_url || 'N/A';
  const exitPage = pageViews[0]?.page_url || 'N/A';
  const bounceRate = pageViews.length === 1 ? 100 : 0;
  
  const userAgent = pageViews[0]?.user_agent || '';
  const deviceInfo = parseUserAgent(userAgent);

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

  function parseUserAgent(ua: string) {
    if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    
    let browser = 'Unknown';
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

    let os = 'Unknown';
    if (ua.includes('Windows NT 10')) os = 'Windows 10';
    else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (ua.includes('Windows NT 6.2')) os = 'Windows 8';
    else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (ua.includes('Mac OS X')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    let device = 'Desktop';
    if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device = 'Mobile';
    else if (ua.includes('iPad') || ua.includes('Tablet')) device = 'Tablet';

    return { browser, os, device };
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header with Back Button */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {companyName}
                </h1>
                {isActive && (
                  <span className="flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                {location}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Reuse all the DetailPanel content here */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Page Views" value={pageViews.length.toString()} />
          <StatCard label="Unique Pages" value={uniquePages.toString()} />
          <StatCard label="Session Time" value={formatDuration(sessionDuration)} />
          <StatCard label="Avg Time/Page" value={formatDuration(avgTimePerPage)} />
        </div>

        {/* Engagement Score */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              📊 Engagement Score
            </h3>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.min(100, Math.round((pageViews.length * 10) + (sessionDuration / 60000)))}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Bounce Rate:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{bounceRate}%</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Pages/Visit:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {(pageViews.length / 1).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Technology */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            💻 Technology
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <TechCard icon="🌐" label="Browser" value={deviceInfo.browser} />
            <TechCard icon="💾" label="OS" value={deviceInfo.os} />
            <TechCard icon="📱" label="Device" value={deviceInfo.device} />
          </div>
        </div>

        {/* Visit Details */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              📍 Visit Details
            </h3>
            {location === 'Unknown' && (
              <button
                onClick={refreshIPLookup}
                disabled={refreshingIP}
                className="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 font-medium"
              >
                {refreshingIP ? '🔄 Loading...' : '🔍 Lookup Location'}
              </button>
            )}
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            <DetailRow label="IP Address" value={visitor.ip_address} mono />
            <DetailRow label="Location" value={location} />
            <DetailRow label="ISP" value={visitor.isp || 'Unknown'} />
            <DetailRow label="Entry Page" value={getReadableUrl(entryPage)} />
            <DetailRow label="Exit Page" value={getReadableUrl(exitPage)} />
            <DetailRow label="First Seen" value={formatDateTime(visitor.first_seen)} />
            <DetailRow label="Last Seen" value={formatDateTime(visitor.last_seen)} />
            {visitor.is_bot === 1 && (
              <DetailRow label="Type" value="🤖 Bot Detected" badge="red" />
            )}
            {visitor.is_isp === 1 && (
              <DetailRow label="Type" value="🏢 ISP Detected" badge="yellow" />
            )}
          </div>
        </div>

        {/* Traffic Source */}
        {pageViews.length > 0 && pageViews[0].referrer && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Traffic Source
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {getReferrerSource(pageViews[0].referrer)}
              </div>
              {pageViews[0].referrer && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono break-all">
                  {pageViews[0].referrer}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session Timeline */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            🕐 Session Timeline ({pageViews.length} pages)
          </h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
            
            <div className="space-y-4">
              {pageViews.slice().reverse().map((pv, index) => {
                const nextPv = pageViews[pageViews.length - index - 2];
                const timeOnPage = nextPv ? nextPv.viewed_at - pv.viewed_at : 0;
                
                return (
                  <div key={pv.id} className="relative pl-10">
                    <div className={`absolute left-2.5 w-3 h-3 rounded-full ${
                      index === 0 
                        ? 'bg-green-500 ring-4 ring-green-100 dark:ring-green-900' 
                        : 'bg-blue-500'
                    }`} />
                    
                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white break-words">
                            {getReadableUrl(pv.page_url)}
                          </div>
                        </div>
                        {index === 0 && (
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded flex-shrink-0">
                            Entry
                          </span>
                        )}
                        {index === pageViews.length - 1 && (
                          <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded flex-shrink-0">
                            Exit
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>🕐 {new Date(pv.viewed_at).toLocaleTimeString()}</span>
                        {timeOnPage > 0 && (
                          <span>⏱️ {formatDuration(timeOnPage)}</span>
                        )}
                      </div>
                      
                      {pv.referrer && index === 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-medium">From:</span> {getReferrerSource(pv.referrer)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
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
    <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      {badge ? (
        <span className={`text-xs font-medium px-2 py-1 rounded self-start ${badgeClasses[badge]}`}>
          {value}
        </span>
      ) : (
        <div className={`text-sm text-gray-900 dark:text-white ${mono ? 'font-mono text-xs' : ''} break-all`}>
          {value}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

function TechCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-sm font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}
