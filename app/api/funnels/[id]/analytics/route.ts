import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import type { Funnel, FunnelAnalytics, FunnelStep } from '@/lib/types';

// GET: Get funnel analytics (conversion rates, drop-off, etc.)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get funnel definition
    const funnelResult = await sql`
      SELECT * FROM funnels WHERE id = ${id}
    `;

    if (funnelResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funnel not found' },
        { status: 404 }
      );
    }

    const funnelRow = funnelResult.rows[0];
    const funnel: Funnel = {
      id: funnelRow.id,
      name: funnelRow.name,
      description: funnelRow.description,
      steps: funnelRow.steps,
      created_at: funnelRow.created_at,
      updated_at: funnelRow.updated_at,
      is_active: funnelRow.is_active
    };
    const steps: FunnelStep[] = funnel.steps;

    // Get conversions for this funnel in date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const conversionsResult = await sql`
      SELECT 
        step_reached,
        completed,
        time_to_convert,
        created_at,
        completed_at
      FROM funnel_conversions
      WHERE funnel_id = ${id}
      AND created_at >= ${cutoffDate.toISOString()}
      ORDER BY created_at DESC
    `;

    const conversions = conversionsResult.rows;

    // Calculate step statistics
    const stepStats = steps.map((step, index) => {
      const reachedStep = conversions.filter(c => c.step_reached >= index);
      const reachedNextStep = conversions.filter(c => c.step_reached >= index + 1);
      
      const count = reachedStep.length;
      const dropoffCount = reachedStep.length - reachedNextStep.length;
      const dropoffRate = count > 0 ? (dropoffCount / count) * 100 : 0;

      // Calculate average time to next step
      let avgTimeToNext: number | null = null;
      if (index < steps.length - 1 && reachedNextStep.length > 0) {
        const times = reachedNextStep
          .map(c => c.time_to_convert)
          .filter(t => t !== null && t > 0);
        
        if (times.length > 0) {
          avgTimeToNext = times.reduce((sum, t) => sum + t, 0) / times.length;
        }
      }

      return {
        name: step.name,
        count,
        dropoff_rate: dropoffRate,
        avg_time_to_next: avgTimeToNext
      };
    });

    // Overall stats
    const totalEntries = conversions.filter(c => c.step_reached >= 0).length;
    const totalCompletions = conversions.filter(c => c.completed).length;
    const conversionRate = totalEntries > 0 ? (totalCompletions / totalEntries) * 100 : 0;

    const completedTimes = conversions
      .filter(c => c.completed && c.time_to_convert)
      .map(c => c.time_to_convert);
    
    const avgTimeToConvert = completedTimes.length > 0
      ? completedTimes.reduce((sum, t) => sum + t, 0) / completedTimes.length
      : null;

    const analytics: FunnelAnalytics = {
      funnel,
      steps: stepStats,
      total_entries: totalEntries,
      total_completions: totalCompletions,
      conversion_rate: conversionRate,
      avg_time_to_convert: avgTimeToConvert
    };

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Funnel analytics error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
