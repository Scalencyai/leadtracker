'use client';

import { useEffect, useState, useRef } from 'react';
import type { HeatmapData, ClickEvent, ScrollEvent } from '@/lib/types';

interface HeatmapViewerProps {
  pageUrl: string;
  days?: number;
}

type ViewMode = 'click' | 'scroll';

export default function HeatmapViewer({ pageUrl, days = 7 }: HeatmapViewerProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('click');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHeatmapData();
  }, [pageUrl, days]);

  useEffect(() => {
    if (heatmapData) {
      renderHeatmap();
    }
  }, [heatmapData, viewMode]);

  async function loadHeatmapData() {
    try {
      setLoading(true);
      
      const [clicksRes, scrollsRes, screenshotRes] = await Promise.all([
        fetch(`/api/heatmap/clicks?page_url=${encodeURIComponent(pageUrl)}&days=${days}`),
        fetch(`/api/heatmap/scroll?page_url=${encodeURIComponent(pageUrl)}&days=${days}`),
        fetch(`/api/heatmap/screenshot?page_url=${encodeURIComponent(pageUrl)}`)
      ]);

      const clicksData = await clicksRes.json();
      const scrollsData = await scrollsRes.json();
      const screenshotData = await screenshotRes.json();

      setHeatmapData({
        page_url: pageUrl,
        clicks: clicksData.clicks || [],
        scrolls: scrollsData.scrolls || [],
        screenshot: screenshotData.screenshot || null
      });
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
    } finally {
      setLoading(false);
    }
  }

  function renderHeatmap() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !heatmapData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const width = container.clientWidth;
    const height = 800; // Default height
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (viewMode === 'click') {
      renderClickHeatmap(ctx, width, height);
    } else {
      renderScrollHeatmap(ctx, width, height);
    }
  }

  function renderClickHeatmap(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!heatmapData) return;

    // Find click frequency
    const clickMap = new Map<string, number>();
    heatmapData.clicks.forEach(click => {
      const key = `${click.x},${click.y}`;
      clickMap.set(key, (clickMap.get(key) || 0) + 1);
    });

    const maxFrequency = Math.max(...Array.from(clickMap.values()), 1);

    // Draw heatmap circles
    heatmapData.clicks.forEach(click => {
      const key = `${click.x},${click.y}`;
      const frequency = clickMap.get(key) || 1;
      const intensity = frequency / maxFrequency;

      // Scale coordinates to canvas size
      const scaledX = (click.x / (click.viewport_width || width)) * width;
      const scaledY = (click.y / (click.viewport_height || height)) * height;

      // Color based on intensity (blue to red)
      const hue = (1 - intensity) * 240; // 240 = blue, 0 = red
      const alpha = 0.3 + (intensity * 0.4);

      ctx.beginPath();
      const gradient = ctx.createRadialGradient(scaledX, scaledY, 0, scaledX, scaledY, 30);
      gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, ${alpha})`);
      gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.arc(scaledX, scaledY, 30, 0, Math.PI * 2);
      ctx.fill();
    });

    // Add markers for high-intensity clicks
    clickMap.forEach((frequency, key) => {
      if (frequency > maxFrequency * 0.5) {
        const [x, y] = key.split(',').map(Number);
        const scaledX = (x / (heatmapData.clicks[0]?.viewport_width || width)) * width;
        const scaledY = (y / (heatmapData.clicks[0]?.viewport_height || height)) * height;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${frequency}`, scaledX, scaledY + 4);
      }
    });
  }

  function renderScrollHeatmap(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!heatmapData || heatmapData.scrolls.length === 0) return;

    // Calculate scroll depth distribution
    const depthBuckets = Array(height).fill(0);
    
    heatmapData.scrolls.forEach(scroll => {
      const depth = scroll.max_scroll_depth / 100; // 0-1
      const pixelDepth = Math.floor(depth * height);
      
      for (let i = 0; i <= pixelDepth && i < height; i++) {
        depthBuckets[i]++;
      }
    });

    const maxViews = Math.max(...depthBuckets, 1);

    // Draw gradient based on scroll depth
    for (let y = 0; y < height; y++) {
      const views = depthBuckets[y];
      const intensity = views / maxViews;
      
      // Color from green (high views) to red (low views)
      const hue = intensity * 120; // 120 = green, 0 = red
      const alpha = 0.2 + (intensity * 0.6);
      
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha})`;
      ctx.fillRect(0, y, width, 1);
    }

    // Draw percentage markers
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    
    [25, 50, 75, 100].forEach(percent => {
      const y = (percent / 100) * height;
      ctx.fillText(`${percent}%`, width - 10, y - 5);
      
      // Dashed line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!heatmapData) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Failed to load heatmap data
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('click')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'click'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Click Heatmap ({heatmapData.clicks.length})
          </button>
          <button
            onClick={() => setViewMode('scroll')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'scroll'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Scroll Heatmap ({heatmapData.scrolls.length})
          </button>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Last {days} days • {pageUrl}
        </div>
      </div>

      {/* Heatmap Canvas */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden">
        <div ref={containerRef} className="relative">
          {/* Background screenshot if available */}
          {heatmapData.screenshot?.screenshot_data && (
            <img
              src={heatmapData.screenshot.screenshot_data}
              alt="Page screenshot"
              className="w-full opacity-30"
            />
          )}
          
          {/* Heatmap overlay */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full"
            style={{ mixBlendMode: 'multiply' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Clicks</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {heatmapData.clicks.length}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Scrolls</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {heatmapData.scrolls.length}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg Scroll Depth</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {heatmapData.scrolls.length > 0
              ? Math.round(
                  heatmapData.scrolls.reduce((sum, s) => sum + s.max_scroll_depth, 0) /
                    heatmapData.scrolls.length
                )
              : 0}%
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Screenshot</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {heatmapData.screenshot ? '✓' : '✗'}
          </div>
        </div>
      </div>
    </div>
  );
}
