import { NextRequest } from 'next/server';
import { getVisitorsWithStats } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Server-Sent Events endpoint for realtime updates
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data
      const sendUpdate = () => {
        try {
          const visitors = getVisitorsWithStats({ hideBotsAndISPs: true });
          const data = `data: ${JSON.stringify(visitors)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('SSE update error:', error);
        }
      };

      // Send immediately
      sendUpdate();

      // Then every 2 seconds
      const interval = setInterval(sendUpdate, 2000);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
