import type { VisitorWithStats } from '@/lib/types';

interface StatsCardsProps {
  visitors: VisitorWithStats[];
}

export default function StatsCards({ visitors }: StatsCardsProps) {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  const visitorsToday = visitors.filter(v => v.last_seen >= oneDayAgo).length;
  const activeNow = visitors.filter(v => v.last_seen >= fiveMinutesAgo).length;
  const companiesThisWeek = new Set(
    visitors
      .filter(v => v.last_seen >= oneWeekAgo && v.company_name)
      .map(v => v.company_name)
  ).size;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      <StatCard
        title="Visitors Today"
        value={visitorsToday}
        icon="📊"
        color="blue"
      />
      <StatCard
        title="Active Now"
        value={activeNow}
        icon="🟢"
        color="green"
        pulsing={activeNow > 0}
      />
      <StatCard
        title="Companies This Week"
        value={companiesThisWeek}
        icon="🏢"
        color="purple"
      />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'purple';
  pulsing?: boolean;
}

function StatCard({ title, value, icon, color, pulsing }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
        </div>
        <div className={`text-4xl ${pulsing ? 'pulsing-dot' : ''}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
