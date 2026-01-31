// LeadTracker - Website Visitor Tracking Script
// Version 1.0.0
// Usage: <script src="https://your-domain.com/track.js" data-api="https://your-domain.com/api/track" async></script>

(function() {
  'use strict';

  // Respect Do Not Track
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
    return;
  }

  // Get API endpoint from script tag
  var script = document.currentScript || document.querySelector('script[data-api]');
  var apiEndpoint = script ? script.getAttribute('data-api') : null;

  if (!apiEndpoint) {
    console.error('LeadTracker: data-api attribute is required');
    return;
  }

  // Collect page view data
  function getPageData() {
    return {
      url: window.location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };
  }

  // Send tracking data
  function track() {
    var data = getPageData();

    // Use sendBeacon for reliability (works even on page unload)
    if (navigator.sendBeacon) {
      var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(apiEndpoint, blob);
    } else {
      // Fallback to fetch
      fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch(function(err) {
        console.error('LeadTracker: Failed to send data', err);
      });
    }
  }

  // Track initial page view
  if (document.readyState === 'complete') {
    track();
  } else {
    window.addEventListener('load', track);
  }

  // Track page visibility changes (user returns to tab)
  var lastVisibilityChange = Date.now();
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      var timeSinceLastChange = Date.now() - lastVisibilityChange;
      // Only track if user was away for more than 30 seconds
      if (timeSinceLastChange > 30000) {
        track();
      }
    }
    lastVisibilityChange = Date.now();
  });
})();
