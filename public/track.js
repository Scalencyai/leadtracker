// LeadTracker - LocalStorage Tracking Script
// Version 2.0.0 - No Server Needed!
// Usage: <script src="https://your-domain.com/track.js" async></script>

(function() {
  'use strict';

  // Respect Do Not Track
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
    return;
  }

  // Storage keys
  var STORAGE_KEY_VISITORS = 'leadtracker_visitors';
  var STORAGE_KEY_PAGE_VIEWS = 'leadtracker_page_views';

  // Get client "IP" (fingerprint-based since we're client-side)
  function getClientId() {
    var stored = localStorage.getItem('leadtracker_client_id');
    if (stored) return stored;
    
    // Generate fingerprint from user agent + screen + language
    var fingerprint = [
      navigator.userAgent,
      screen.width + 'x' + screen.height,
      navigator.language,
      new Date().getTimezoneOffset()
    ].join('|');
    
    // Simple hash
    var hash = 0;
    for (var i = 0; i < fingerprint.length; i++) {
      var char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    var clientId = 'client_' + Math.abs(hash).toString(36);
    localStorage.setItem('leadtracker_client_id', clientId);
    return clientId;
  }

  // Get or create visitor
  function getOrCreateVisitor(clientId, timestamp) {
    var visitors = JSON.parse(localStorage.getItem(STORAGE_KEY_VISITORS) || '[]');
    var visitor = visitors.find(function(v) { return v.ip_address === clientId; });

    if (visitor) {
      visitor.last_seen = timestamp;
      localStorage.setItem(STORAGE_KEY_VISITORS, JSON.stringify(visitors));
      return visitor;
    }

    visitor = {
      id: 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      ip_address: clientId,
      company_name: null,
      country: null,
      city: null,
      isp: null,
      is_bot: false,
      is_isp: false,
      first_seen: timestamp,
      last_seen: timestamp,
      lookup_cached_at: null
    };

    visitors.push(visitor);
    localStorage.setItem(STORAGE_KEY_VISITORS, JSON.stringify(visitors));
    return visitor;
  }

  // Add page view
  function addPageView(visitorId, pageUrl, referrer, userAgent, timestamp) {
    var pageViews = JSON.parse(localStorage.getItem(STORAGE_KEY_PAGE_VIEWS) || '[]');
    
    var pageView = {
      id: 'pv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      visitor_id: visitorId,
      page_url: pageUrl,
      referrer: referrer,
      user_agent: userAgent,
      viewed_at: timestamp,
      duration: 0
    };

    pageViews.push(pageView);
    localStorage.setItem(STORAGE_KEY_PAGE_VIEWS, JSON.stringify(pageViews));
    return pageView;
  }

  // Track page view
  function track() {
    var timestamp = Date.now();
    var clientId = getClientId();
    var visitor = getOrCreateVisitor(clientId, timestamp);
    
    addPageView(
      visitor.id,
      window.location.href,
      document.referrer || null,
      navigator.userAgent,
      timestamp
    );

    console.log('✓ LeadTracker: Page view tracked (localStorage)');
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
