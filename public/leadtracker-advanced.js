/**
 * LeadTracker Advanced Analytics
 * Session Recording + Heatmaps + Funnel Tracking
 */

(function() {
  'use strict';

  // Configuration
  const API_BASE = window.LEADTRACKER_API || 'https://leadtracker-ivory.vercel.app';
  
  // Generate or retrieve visitor/session IDs
  function getOrCreateId(key) {
    let id = localStorage.getItem(key);
    if (!id) {
      id = 'lt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(key, id);
    }
    return id;
  }

  const VISITOR_ID = getOrCreateId('leadtracker_visitor_id');
  const SESSION_ID = getOrCreateId('leadtracker_session_id');

  // ============================================
  // FEATURE 1: Session Recording (rrweb)
  // ============================================
  
  let sessionEvents = [];
  let sessionStartTime = Date.now();
  let recordingInterval = null;

  function initSessionRecording() {
    // Wait for rrweb to load (check every 100ms, max 5 seconds)
    let attempts = 0;
    const maxAttempts = 50;
    
    const checkRRWeb = setInterval(() => {
      attempts++;
      
      if (typeof rrweb !== 'undefined' && rrweb.record) {
        clearInterval(checkRRWeb);
        startRecording();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkRRWeb);
        console.warn('[LeadTracker] rrweb not loaded after 5s. Session recording disabled.');
        console.warn('[LeadTracker] Make sure rrweb script loads before leadtracker-advanced.js');
      }
    }, 100);
  }

  function startRecording() {
    try {
      rrweb.record({
        emit(event) {
          sessionEvents.push(event);
        },
        sampling: {
          scroll: 150,
          input: 'last'
        },
        recordCanvas: false,
        collectFonts: false
      });

      // Send events every 10 seconds
      recordingInterval = setInterval(() => {
        if (sessionEvents.length > 0) {
          sendSessionData();
        }
      }, 10000);

      // Send on page unload
      window.addEventListener('beforeunload', () => {
        sendSessionData(true);
      });

      console.log('[LeadTracker] ✓ Session recording started');
    } catch (error) {
      console.error('[LeadTracker] Failed to start recording:', error);
    }
  }

  function sendSessionData(completed = false) {
    const duration = Date.now() - sessionStartTime;
    
    fetch(`${API_BASE}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: SESSION_ID,
        visitor_id: VISITOR_ID,
        page_url: window.location.href,
        events: sessionEvents,
        duration,
        page_count: 1,
        completed
      }),
      keepalive: true
    }).catch(err => console.error('Session recording error:', err));

    // Clear sent events
    sessionEvents = [];
  }

  // ============================================
  // FEATURE 2: Funnel Event Tracking
  // ============================================

  function trackFunnelEvent(eventType, eventName, metadata = {}) {
    fetch(`${API_BASE}/api/funnel-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_id: VISITOR_ID,
        session_id: SESSION_ID,
        event_type: eventType,
        event_name: eventName,
        page_url: window.location.href,
        metadata
      })
    }).catch(err => console.error('Funnel event error:', err));
  }

  // Auto-track pageviews
  trackFunnelEvent('pageview', window.location.pathname);

  // Auto-track form submissions
  document.addEventListener('submit', (e) => {
    const form = e.target;
    const formId = form.id || form.name || 'unnamed_form';
    trackFunnelEvent('form_submit', formId, {
      action: form.action,
      method: form.method
    });
  });

  // Expose global function for custom events
  window.leadTrackerEvent = trackFunnelEvent;

  // ============================================
  // FEATURE 3: Click & Scroll Heatmaps
  // ============================================

  // Click tracking
  document.addEventListener('click', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const target = e.target;
    
    let selector = '';
    try {
      selector = target.tagName.toLowerCase();
      if (target.id) selector += `#${target.id}`;
      if (target.className) selector += `.${target.className.split(' ').join('.')}`;
    } catch (err) {
      selector = 'unknown';
    }

    const elementText = target.innerText?.substring(0, 100) || '';

    fetch(`${API_BASE}/api/heatmap/clicks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_id: VISITOR_ID,
        session_id: SESSION_ID,
        page_url: window.location.href,
        x,
        y,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        element_selector: selector,
        element_text: elementText
      })
    }).catch(err => console.error('Click tracking error:', err));

    // Track as funnel event too
    trackFunnelEvent('click', selector, { text: elementText });
  });

  // Scroll tracking
  let maxScrollDepth = 0;
  let scrollTimeout = null;

  function trackScroll() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    const scrollDepth = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
    maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      fetch(`${API_BASE}/api/heatmap/scroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_id: VISITOR_ID,
          session_id: SESSION_ID,
          page_url: window.location.href,
          scroll_depth: scrollDepth,
          max_scroll_depth: maxScrollDepth,
          viewport_height: windowHeight,
          page_height: documentHeight
        })
      }).catch(err => console.error('Scroll tracking error:', err));
    }, 1000);
  }

  window.addEventListener('scroll', trackScroll, { passive: true });

  // ============================================
  // Initialize
  // ============================================

  // Wait for rrweb to load, then start recording
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSessionRecording);
  } else {
    initSessionRecording();
  }

  console.log('[LeadTracker] Advanced analytics initialized');
})();
