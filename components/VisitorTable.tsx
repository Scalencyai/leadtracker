import type { VisitorWithStats } from '@/lib/types';

interface VisitorTableProps {
  visitors: VisitorWithStats[];
  onSelectVisitor: (id: string | number) => void;
}

export default function VisitorTable({ visitors, onSelectVisitor }: VisitorTableProps) {
  if (visitors.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <div className="text-6xl mb-4">👋</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No visitors yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Install the tracking script on your website to start identifying visitors
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 font-mono">
          Click "Get Tracking Script" above to get started
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Company
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
                onClick={() => onSelectVisitor(visitor.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VisitorRow({ visitor, onClick }: { visitor: VisitorWithStats; onClick: () => void }) {
  const isActive = Date.now() - visitor.last_seen < 5 * 60 * 1000;
  const companyName = visitor.company_name || 'Unknown Company';
  const location = [visitor.city, visitor.country].filter(Boolean).join(', ') || 'Unknown';

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
            {visitor.company_name && (
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                {visitor.ip_address}
              </div>
            )}
            {!visitor.company_name && (
              <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                IP: {visitor.ip_address}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        {location}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        {formatTime(visitor.last_seen)}
        {isActive && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
            Now
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
        {visitor.total_visits}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
        {visitor.pages_viewed.length} pages
      </td>
    </tr>
  );
}
