// Shared types for both database and localStorage implementations

export interface Visitor {
  id: string | number;
  ip_address: string;
  company_name: string | null;
  country: string | null;
  city: string | null;
  isp: string | null;
  is_bot: boolean | number;
  is_isp: boolean | number;
  first_seen: number;
  last_seen: number;
  lookup_cached_at: number | null;
}

export interface PageView {
  id: string | number;
  visitor_id: string | number;
  page_url: string;
  referrer: string | null;
  user_agent: string | null;
  viewed_at: number;
  duration: number;
}

export interface VisitorWithStats extends Visitor {
  total_visits: number;
  pages_viewed: string[];
}

// ============================================
// SESSION RECORDING TYPES
// ============================================

export interface SessionRecording {
  id: number;
  session_id: string;
  visitor_id: string | null;
  page_url: string;
  events: any[]; // rrweb events
  duration: number; // milliseconds
  page_count: number;
  created_at: string;
  updated_at: string;
  completed: boolean;
}

// ============================================
// FUNNEL TYPES
// ============================================

export interface FunnelStep {
  name: string;
  event_type: 'pageview' | 'click' | 'form_submit' | 'custom';
  event_name: string;
  match_rule?: 'exact' | 'contains' | 'regex';
}

export interface Funnel {
  id: number;
  name: string;
  description: string | null;
  steps: FunnelStep[];
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface FunnelEvent {
  id: number;
  visitor_id: string;
  session_id: string | null;
  event_type: string;
  event_name: string;
  page_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface FunnelConversion {
  id: number;
  funnel_id: number;
  visitor_id: string;
  session_id: string | null;
  step_reached: number;
  completed: boolean;
  time_to_convert: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface FunnelAnalytics {
  funnel: Funnel;
  steps: {
    name: string;
    count: number;
    dropoff_rate: number;
    avg_time_to_next: number | null;
  }[];
  total_entries: number;
  total_completions: number;
  conversion_rate: number;
  avg_time_to_convert: number | null;
}

// ============================================
// HEATMAP TYPES
// ============================================

export interface ClickEvent {
  id: number;
  visitor_id: string;
  session_id: string | null;
  page_url: string;
  x: number;
  y: number;
  viewport_width: number | null;
  viewport_height: number | null;
  element_selector: string | null;
  element_text: string | null;
  created_at: string;
}

export interface ScrollEvent {
  id: number;
  visitor_id: string;
  session_id: string | null;
  page_url: string;
  scroll_depth: number; // 0-100
  max_scroll_depth: number;
  viewport_height: number | null;
  page_height: number | null;
  created_at: string;
}

export interface PageScreenshot {
  id: number;
  page_url: string;
  screenshot_data: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  created_at: string;
  updated_at: string;
}

export interface HeatmapData {
  page_url: string;
  clicks: ClickEvent[];
  scrolls: ScrollEvent[];
  screenshot: PageScreenshot | null;
}
