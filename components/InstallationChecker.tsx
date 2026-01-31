'use client';

import { useState } from 'react';

interface CheckResult {
  installed: boolean;
  url: string;
  checks: {
    scriptFound: boolean;
    endpointConfigured: boolean;
    asyncLoading: boolean;
    scriptUrl: string | null;
  };
  issues: string[];
  recommendations: string[];
}

export default function InstallationChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkInstallation = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/check-installation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to check installation');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Network error - please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        🔍 Check Script Installation
      </h2>
      
      <div className="space-y-4">
        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Website URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && checkInstallation()}
            />
            <button
              onClick={checkInstallation}
              disabled={loading || !url}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Checking...' : 'Check'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                        rounded-md p-4">
            <div className="flex items-center gap-2">
              <span className="text-red-600 dark:text-red-400 text-xl">❌</span>
              <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className={`rounded-md p-4 ${
              result.installed 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {result.installed ? '✅' : '⚠️'}
                </span>
                <div>
                  <h3 className={`font-semibold ${
                    result.installed 
                      ? 'text-green-800 dark:text-green-300'
                      : 'text-yellow-800 dark:text-yellow-300'
                  }`}>
                    {result.installed 
                      ? 'Script Correctly Installed!' 
                      : 'Installation Issues Found'}
                  </h3>
                  <p className={`text-sm ${
                    result.installed 
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-yellow-700 dark:text-yellow-400'
                  }`}>
                    Checked: {result.url}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Checks */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Installation Checks
                </h4>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <CheckItem 
                  label="Tracking Script Found"
                  status={result.checks.scriptFound}
                />
                <CheckItem 
                  label="API Endpoint Configured"
                  status={result.checks.endpointConfigured}
                />
                <CheckItem 
                  label="Async Loading"
                  status={result.checks.asyncLoading}
                  optional
                />
                {result.checks.scriptUrl && (
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Script URL:
                    </p>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded 
                                   text-gray-800 dark:text-gray-200">
                      {result.checks.scriptUrl}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* Issues */}
            {result.issues.length > 0 && (
              <div className="border border-orange-200 dark:border-orange-800 rounded-md overflow-hidden">
                <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-2 border-b 
                              border-orange-200 dark:border-orange-800">
                  <h4 className="font-medium text-orange-900 dark:text-orange-300">
                    ⚠️ Issues Found
                  </h4>
                </div>
                <ul className="divide-y divide-orange-100 dark:divide-orange-900">
                  {result.issues.map((issue, i) => (
                    <li key={i} className="px-4 py-2 text-sm text-orange-800 dark:text-orange-300">
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="border border-blue-200 dark:border-blue-800 rounded-md overflow-hidden">
                <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 border-b 
                              border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-300">
                    💡 Recommendations
                  </h4>
                </div>
                <ul className="divide-y divide-blue-100 dark:divide-blue-900">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="px-4 py-2 text-sm text-blue-800 dark:text-blue-300">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CheckItem({ 
  label, 
  status, 
  optional = false 
}: { 
  label: string; 
  status: boolean; 
  optional?: boolean;
}) {
  return (
    <div className="px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {label}
        {optional && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            (optional)
          </span>
        )}
      </span>
      <span className={`text-lg ${
        status 
          ? 'text-green-600 dark:text-green-400' 
          : optional
            ? 'text-gray-400 dark:text-gray-500'
            : 'text-red-600 dark:text-red-400'
      }`}>
        {status ? '✓' : optional ? '○' : '✗'}
      </span>
    </div>
  );
}
