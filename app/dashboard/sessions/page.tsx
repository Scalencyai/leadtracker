'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import DashboardNav from '@/components/DashboardNav';

interface Session {
  id: number;
  session_id: string;
  visitor_id: number;
  page_url: string;
  duration: number;
  page_count: number;
  created_at: string;
  completed: boolean;
  events?: any[];
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rrwebPlayer, setRrwebPlayer] = useState<any>(null);

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSessions() {
    try {
      const res = await fetch('/api/sessions?limit=50');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadSessionDetails(session: Session) {
    try {
      const res = await fetch(`/api/sessions/${session.id}`);
      const data = await res.json();
      setSelectedSession(data);
      
      // Wait a bit for rrweb-player to load
      setTimeout(() => playSession(data), 500);
    } catch (error) {
      console.error('Failed to load session details:', error);
    }
  }

  function playSession(session: Session) {
    try {
      if (!session.events || session.events.length === 0) {
        console.warn('No events recorded for this session');
        const container = document.getElementById('player-container');
        if (container) {
          container.innerHTML = '<div class="p-8 text-center text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded">⚠️ No events recorded for this session. Make sure rrweb is loading on your website.</div>';
        }
        return;
      }

      // Clear previous player
      const container = document.getElementById('player-container');
      if (!container) {
        console.error('Player container not found');
        return;
      }
      
      container.innerHTML = '<div class="p-8 text-center text-gray-500">Loading player...</div>';

      // Wait for rrweb-player to be available
      const initPlayer = () => {
        if ((window as any).rrwebPlayer) {
          try {
            container.innerHTML = ''; // Clear loading message
            new (window as any).rrwebPlayer({
              target: container,
              props: {
                events: session.events,
                width: 1024,
                height: 576,
                autoPlay: true,
                speed: 2,
                showController: true
              }
            });
            console.log('✅ Session player initialized');
          } catch (error) {
            console.error('Failed to initialize player:', error);
            container.innerHTML = '<div class="p-8 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">❌ Failed to initialize player. Error: ' + (error as Error).message + '</div>';
          }
        } else {
          console.log('Waiting for rrweb-player...');
          setTimeout(initPlayer, 500);
        }
      };

      initPlayer();
    } catch (error) {
      console.error('Failed to play session:', error);
      const container = document.getElementById('player-container');
      if (container) {
        container.innerHTML = '<div class="p-8 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded">❌ Error: ' + (error as Error).message + '</div>';
      }
    }
  }

  function formatDuration(ms: number) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  return (
    <>
      <Script 
        src="/rrweb.min.js"
        strategy="beforeInteractive"
        onLoad={() => console.log('✅ rrweb core loaded')}
        onError={(e) => console.error('❌ rrweb core failed to load:', e)}
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/rrweb-player@latest/dist/index.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('✅ rrweb-player loaded');
          setRrwebPlayer((window as any).rrwebPlayer);
        }}
        onError={(e) => {
          console.error('❌ rrweb-player failed to load:', e);
        }}
      />
      <link 
        rel="stylesheet" 
        href="https://cdn.jsdelivr.net/npm/rrweb-player@latest/dist/style.css"
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DashboardNav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              🎬 Session Recordings
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Watch visitor sessions replay
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions List */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Recent Sessions ({sessions.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-[600px] overflow-y-auto">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      Loading sessions...
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No sessions recorded yet
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => loadSessionDetails(session)}
                        className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          selectedSession?.id === session.id 
                            ? 'bg-blue-50 dark:bg-blue-950' 
                            : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {session.page_url}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDate(session.created_at)}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                {formatDuration(session.duration)}
                              </span>
                              {session.completed && (
                                <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                                  ✓ Complete
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Session Player */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6">
                {selectedSession ? (
                  <>
                    <div className="mb-4">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Session Replay
                      </h2>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Duration: {formatDuration(selectedSession.duration)}</span>
                        <span>Pages: {selectedSession.page_count}</span>
                        <span>Events: {selectedSession.events?.length || 0}</span>
                      </div>
                    </div>
                    
                    {selectedSession.events && selectedSession.events.length > 0 ? (
                      <div 
                        id="player-container" 
                        className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
                      />
                    ) : (
                      <div className="p-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        No events recorded for this session
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    Select a session to watch replay
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
