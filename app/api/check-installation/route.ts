import { NextRequest, NextResponse } from 'next/server';
import { corsResponse, handleOptions } from '@/lib/cors';

export async function POST(request: NextRequest) {
  try {
    const { url, apiUrl } = await request.json();
    
    if (!url) {
      return corsResponse({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return corsResponse({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Determine API endpoint to test
    const testApiUrl = apiUrl || `${request.headers.get('origin') || 'https://leadtracker-ivory.vercel.app'}/api/track`;

    // Fetch the page HTML (for basic checks)
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'LeadTracker-Checker/1.0'
      }
    });

    if (!response.ok) {
      return corsResponse({ 
        error: `Failed to fetch page: ${response.status} ${response.statusText}`,
        installed: false 
      }, { status: 400 });
    }

    const html = await response.text();

    // Check for tracking script in HTML (may not work for client-side rendered sites like Framer)
    const scriptPattern = /track\.js|leadtracker|visitor.*track/i;
    const hasScriptInHtml = scriptPattern.test(html);

    // Check for tracking endpoint in HTML
    const endpointPattern = /api\/track/;
    const hasEndpointInHtml = endpointPattern.test(html);

    // Extract script URL if present
    const scriptUrlMatch = html.match(/<script[^>]*src=["']([^"']*track[^"']*)["']/i);
    const scriptUrl = scriptUrlMatch ? scriptUrlMatch[1] : null;

    // Check if it's async
    const isAsync = scriptUrl ? html.includes('async') || html.includes('defer') : false;

    // **NEW: Test if API actually responds** (works for client-side rendered sites!)
    let apiWorks = false;
    let apiError = null;
    
    try {
      const testResponse = await fetch(testApiUrl, {
        method: 'OPTIONS',
        headers: {
          'Origin': targetUrl.origin
        }
      });
      
      // Check if API has CORS headers
      const corsHeader = testResponse.headers.get('access-control-allow-origin');
      apiWorks = testResponse.ok && (corsHeader === '*' || corsHeader === targetUrl.origin);
      
      if (!apiWorks) {
        apiError = `API responded with ${testResponse.status}, CORS: ${corsHeader || 'missing'}`;
      }
    } catch (error: any) {
      apiError = error.message;
    }

    // Determine installation status - API test is most reliable!
    const installed = apiWorks;

    // Build result
    const result = {
      installed,
      url: targetUrl.toString(),
      checks: {
        apiResponding: apiWorks,
        scriptFoundInHtml: hasScriptInHtml,
        endpointConfigured: hasEndpointInHtml,
        asyncLoading: isAsync,
        scriptUrl: scriptUrl || null,
        testedApiUrl: testApiUrl
      },
      issues: [] as string[],
      recommendations: [] as string[],
      warnings: [] as string[]
    };

    // Add issues and recommendations based on API test (most reliable!)
    if (!apiWorks) {
      result.issues.push(`API not responding or CORS not configured: ${apiError}`);
      result.recommendations.push('Verify the API endpoint is deployed and CORS headers are set');
    } else {
      // API works!
      if (!hasScriptInHtml) {
        result.warnings.push('Tracking script not visible in static HTML');
        result.recommendations.push('This is normal for client-side rendered sites (Framer, React, etc.). The script may be injected dynamically.');
      }
      
      if (!hasEndpointInHtml) {
        result.warnings.push('API endpoint not visible in static HTML');
        result.recommendations.push('The endpoint is configured in JavaScript - this is fine!');
      }
    }

    if (hasScriptInHtml && !isAsync) {
      result.warnings.push('Script is not loaded asynchronously');
      result.recommendations.push('Add "async" or "defer" attribute to the <script> tag for better performance');
    }

    if (scriptUrl && !scriptUrl.startsWith('http')) {
      result.warnings.push('Script URL appears to be relative');
      result.recommendations.push('Consider using absolute URL for better reliability');
    }

    return corsResponse(result);

  } catch (error: any) {
    console.error('Installation check error:', error);
    return corsResponse({ 
      error: 'Failed to check installation',
      details: error.message,
      installed: false 
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return handleOptions();
}
