import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch the page
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'LeadTracker-Checker/1.0'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch page: ${response.status} ${response.statusText}`,
        installed: false 
      }, { status: 400 });
    }

    const html = await response.text();

    // Check for tracking script (flexible pattern for any domain)
    const scriptPattern = /track\.js/i;
    const hasScript = scriptPattern.test(html);

    // Check for tracking endpoint
    const endpointPattern = /api\/track/;
    const hasEndpoint = endpointPattern.test(html);

    // Extract script URL if present
    const scriptUrlMatch = html.match(/<script[^>]*src=["']([^"']*track\.js[^"']*)["']/i);
    const scriptUrl = scriptUrlMatch ? scriptUrlMatch[1] : null;

    // Check if it's async
    const isAsync = scriptUrl ? html.includes('async') || html.includes('defer') : false;

    // Determine installation status
    const installed = hasScript && hasEndpoint;

    // Build result
    const result = {
      installed,
      url: targetUrl.toString(),
      checks: {
        scriptFound: hasScript,
        endpointConfigured: hasEndpoint,
        asyncLoading: isAsync,
        scriptUrl: scriptUrl || null
      },
      issues: [] as string[],
      recommendations: [] as string[]
    };

    // Add issues and recommendations
    if (!hasScript) {
      result.issues.push('Tracking script not found in HTML');
      result.recommendations.push('Make sure to add the <script> tag before </body>');
    }

    if (!hasEndpoint) {
      result.issues.push('API endpoint not configured in script');
      result.recommendations.push('Verify the tracking script has the correct API URL');
    }

    if (hasScript && !isAsync) {
      result.issues.push('Script is not loaded asynchronously');
      result.recommendations.push('Add "async" or "defer" attribute to the <script> tag for better performance');
    }

    if (scriptUrl && !scriptUrl.startsWith('http')) {
      result.issues.push('Script URL appears to be relative - might not work across domains');
      result.recommendations.push('Use absolute URL for the tracking script');
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Installation check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check installation',
      installed: false 
    }, { status: 500 });
  }
}
