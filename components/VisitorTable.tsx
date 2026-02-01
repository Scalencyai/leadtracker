'use client';

import { useRouter } from 'next/navigation';
import type { VisitorWithStats } from '@/lib/types';

interface VisitorTableProps {
  visitors: VisitorWithStats[];
  onSelectVisitor?: (id: string | number) => void;
}

export default function VisitorTable({ visitors, onSelectVisitor }: VisitorTableProps) {
  const router = useRouter();
  if (visitors.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 sm:p-12 text-center">
        <div className="text-5xl sm:text-6xl mb-4">👋</div>
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No visitors yet
        </h3>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
          Install the tracking script on your website to start identifying visitors
        </p>
        <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-mono">
          Click "Get Tracking Script" above to get started
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Company / Visitor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Last Seen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Visits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pages
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {visitors.map((visitor) => (
                <VisitorRow
                  key={visitor.id}
                  visitor={visitor}
                  onClick={() => router.push(`/dashboard/visitors/${visitor.id}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-3">
        {visitors.map((visitor) => (
          <VisitorCard
            key={visitor.id}
            visitor={visitor}
            onClick={() => router.push(`/dashboard/visitors/${visitor.id}`)}
          />
        ))}
      </div>
    </>
  );
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function VisitorRow({ visitor, onClick }: { visitor: VisitorWithStats; onClick: () => void }) {
  const isActive = Date.now() - visitor.last_seen < 5 * 60 * 1000;
  const companyName = visitor.company_name || 'Unknown Company';
  const location = [visitor.city, visitor.country].filter(Boolean).join(', ') || 'Unknown';

  return (
    <tr
      onClick={onClick}
      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
    >
      <td className="px-6 py-4">
        <div className="flex items-center">
          {isActive && (
            <span className="flex h-2 w-2 mr-3">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
          )}
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {companyName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {visitor.ip_address}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        {location}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        {formatTime(visitor.last_seen)}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-blue-900 dark:text-blue-200">
          {visitor.total_visits}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
          {visitor.pages_viewed.slice(0, 3).join(', ')}
          {visitor.pages_viewed.length > 3 && ` +${visitor.pages_viewed.length - 3} more`}
        </div>
      </td>
    </tr>
  );
}

function VisitorCard({ visitor, onClick }: { visitor: VisitorWithStats; onClick: () => void }) {
  const isActive = Date.now() - visitor.last_seen < 5 * 60 * 1000;
  const companyName = visitor.company_name || 'Unknown Company';
  const location = [visitor.city, visitor.country].filter(Boolean).join(', ') || 'Unknown';

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isActive && (
            <span className="flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {companyName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
              {visitor.ip_address}
            </div>
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 ml-2 flex-shrink-0">
          {visitor.total_visits}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">📍 Location</div>
          <div className="text-sm text-gray-900 dark:text-white truncate">{location}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">🕐 Last Seen</div>
          <div className="text-sm text-gray-900 dark:text-white">{formatTime(visitor.last_seen)}</div>
        </div>
      </div>

      {/* Pages */}
      {visitor.pages_viewed.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">📄 Pages</div>
          <div className="text-xs text-gray-700 dark:text-gray-300 truncate">
            {visitor.pages_viewed.slice(0, 2).join(', ')}
            {visitor.pages_viewed.length > 2 && ` +${visitor.pages_viewed.length - 2}`}
          </div>
        </div>
      )}
    </div>
  );
}
