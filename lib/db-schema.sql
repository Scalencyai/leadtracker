-- LeadTracker Database Schema Extensions
-- Session Recording, Funnel Tracking, Heatmap Data

-- ============================================
-- FEATURE 1: Session Recording
-- ============================================

-- Session recordings storage
CREATE TABLE IF NOT EXISTS session_recordings (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  visitor_id TEXT,
  page_url TEXT NOT NULL,
  events JSONB NOT NULL DEFAULT '[]',
  duration INTEGER DEFAULT 0, -- in milliseconds
  page_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_session_recordings_session_id ON session_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_visitor_id ON session_recordings(visitor_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_created_at ON session_recordings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_recordings_duration ON session_recordings(duration DESC);

-- ============================================
-- FEATURE 2: Conversion Funnels
-- ============================================

-- Funnel definitions
CREATE TABLE IF NOT EXISTS funnels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL, -- Array of {name, event_type, event_name, match_rule}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Funnel events for tracking
CREATE TABLE IF NOT EXISTS funnel_events (
  id SERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  event_type TEXT NOT NULL, -- 'pageview', 'click', 'form_submit', etc.
  event_name TEXT NOT NULL,
  page_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funnel_events_visitor_id ON funnel_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_session_id ON funnel_events(session_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_event_type ON funnel_events(event_type);
CREATE INDEX IF NOT EXISTS idx_funnel_events_created_at ON funnel_events(created_at DESC);

-- Funnel conversions (calculated results)
CREATE TABLE IF NOT EXISTS funnel_conversions (
  id SERIAL PRIMARY KEY,
  funnel_id INTEGER REFERENCES funnels(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  step_reached INTEGER NOT NULL, -- 0-indexed
  completed BOOLEAN DEFAULT FALSE,
  time_to_convert INTEGER, -- in milliseconds
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_funnel_conversions_funnel_id ON funnel_conversions(funnel_id);
CREATE INDEX IF NOT EXISTS idx_funnel_conversions_visitor_id ON funnel_conversions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_funnel_conversions_created_at ON funnel_conversions(created_at DESC);

-- ============================================
-- FEATURE 3: Heatmaps (Clicks & Scroll)
-- ============================================

-- Click tracking
CREATE TABLE IF NOT EXISTS click_events (
  id SERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  page_url TEXT NOT NULL,
  x INTEGER NOT NULL,
  y INTEGER NOT NULL,
  viewport_width INTEGER,
  viewport_height INTEGER,
  element_selector TEXT,
  element_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_click_events_page_url ON click_events(page_url);
CREATE INDEX IF NOT EXISTS idx_click_events_visitor_id ON click_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_click_events_created_at ON click_events(created_at DESC);

-- Scroll tracking
CREATE TABLE IF NOT EXISTS scroll_events (
  id SERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  page_url TEXT NOT NULL,
  scroll_depth INTEGER NOT NULL, -- 0-100 percentage
  max_scroll_depth INTEGER NOT NULL,
  viewport_height INTEGER,
  page_height INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scroll_events_page_url ON scroll_events(page_url);
CREATE INDEX IF NOT EXISTS idx_scroll_events_visitor_id ON scroll_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_scroll_events_created_at ON scroll_events(created_at DESC);

-- Page screenshots for heatmap overlay
CREATE TABLE IF NOT EXISTS page_screenshots (
  id SERIAL PRIMARY KEY,
  page_url TEXT NOT NULL UNIQUE,
  screenshot_data TEXT, -- Base64 encoded image
  viewport_width INTEGER,
  viewport_height INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_screenshots_page_url ON page_screenshots(page_url);
