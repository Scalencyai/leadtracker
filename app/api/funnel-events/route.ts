import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// POST: Track funnel event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      visitor_id, 
      session_id, 
      event_type, 
      event_name, 
      page_url, 
      metadata 
    } = body;

    if (!visitor_id || !event_type || !event_name) {
      return NextResponse.json(
        { error: 'visitor_id, event_type, and event_name are required' },
        { status: 400 }
      );
    }

    // Insert event
    await sql`
      INSERT INTO funnel_events (
        visitor_id, session_id, event_type, 
        event_name, page_url, metadata
      ) VALUES (
        ${visitor_id}, ${session_id || null}, ${event_type},
        ${event_name}, ${page_url || null}, ${JSON.stringify(metadata || {})}
      )
    `;

    // Check for matching funnels and update conversions
    const funnels = await sql`
      SELECT id, steps FROM funnels WHERE is_active = true
    `;

    for (const funnel of funnels.rows) {
      await updateFunnelConversion(
        funnel.id,
        funnel.steps,
        visitor_id,
        session_id,
        event_type,
        event_name
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Funnel event error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function updateFunnelConversion(
  funnelId: number,
  steps: any[],
  visitorId: string,
  sessionId: string | null,
  eventType: string,
  eventName: string
) {
  try {
    // Find matching step
    const matchingStepIndex = steps.findIndex(step => 
      step.event_type === eventType && matchEventName(step, eventName)
    );

    if (matchingStepIndex === -1) return;

    // Get or create conversion record
    const existingConversion = await sql`
      SELECT * FROM funnel_conversions
      WHERE funnel_id = ${funnelId}
      AND visitor_id = ${visitorId}
      AND (session_id = ${sessionId || null} OR ${sessionId} IS NULL)
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const now = new Date().toISOString();

    if (existingConversion.rows.length > 0) {
      const conv = existingConversion.rows[0];
      
      // Update if reached further step
      if (matchingStepIndex > conv.step_reached) {
        const isCompleted = matchingStepIndex === steps.length - 1;
        const timeToConvert = isCompleted 
          ? Date.now() - new Date(conv.created_at).getTime()
          : null;

        await sql`
          UPDATE funnel_conversions
          SET 
            step_reached = ${matchingStepIndex},
            completed = ${isCompleted},
            time_to_convert = ${timeToConvert},
            completed_at = ${isCompleted ? now : null}
          WHERE id = ${conv.id}
        `;
      }
    } else if (matchingStepIndex === 0) {
      // Create new conversion (only if first step)
      await sql`
        INSERT INTO funnel_conversions (
          funnel_id, visitor_id, session_id, step_reached, completed
        ) VALUES (
          ${funnelId}, ${visitorId}, ${sessionId || null}, 0, false
        )
      `;
    }
  } catch (error) {
    console.error('Funnel conversion update error:', error);
  }
}

function matchEventName(step: any, eventName: string): boolean {
  const rule = step.match_rule || 'exact';
  
  switch (rule) {
    case 'exact':
      return step.event_name === eventName;
    case 'contains':
      return eventName.includes(step.event_name);
    case 'regex':
      try {
        const regex = new RegExp(step.event_name);
        return regex.test(eventName);
      } catch {
        return false;
      }
    default:
      return step.event_name === eventName;
  }
}
