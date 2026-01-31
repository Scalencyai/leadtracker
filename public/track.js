// LeadTracker - Cookie-Based Tracking with Server Storage
// Version 3.0.0
// Usage: <script src="https://leadtracker-ivory.vercel.app/track.js" async></script>

(function() {
  'use strict';

  // Respect Do Not Track
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
    return;
  }

  // API endpoint
  var API_ENDPOINT = 'https://leadtracker-ivory.vercel.app/api/track';
  
  // Cookie helpers
  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/; SameSite=Lax';
  }
  
  function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Get or create visitor ID
  function getVisitorId() {
    var visitorId = getCookie('leadtracker_visitor_id');
    if (visitorId) return visitorId;
    
    // Generate fingerprint
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
      hash = hash & hash;
    }
    
    // Create readable ID
    var hashStr = Math.abs(hash).toString(36).toUpperCase();
    var visitorNum = Math.abs(hash) % 9999 + 1;
    visitorId = 'Visitor-' + visitorNum + '-' + hashStr.substr(0, 4);
    
    // Store in cookie (30 days)
    setCookie('leadtracker_visitor_id', visitorId, 30);
    return visitorId;
  }

  // Send tracking data
  function track() {
    var visitorId = getVisitorId();
    var data = {
      visitor_id: visitorId,
      url: window.location.href,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    };

    // Use fetch
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      mode: 'cors'
    }).then(function(response) {
      if (response.ok) {
        console.log('✓ LeadTracker: Page view tracked (cookie + server storage)');
      }
    }).catch(function(err) {
      console.error('LeadTracker: Failed to send data', err);
    });
  }

  // Track initial page view
  if (document.readyState === 'complete') {
    track();
  } else {
    window.addEventListener('load', track);
  }

  // Track page visibility changes
  var lastVisibilityChange = Date.now();
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      var timeSinceLastChange = Date.now() - lastVisibilityChange;
      if (timeSinceLastChange > 30000) {
        track();
      }
    }
    lastVisibilityChange = Date.now();
  });
})();
