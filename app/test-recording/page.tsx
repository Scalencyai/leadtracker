'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function TestRecordingPage() {
  const [status, setStatus] = useState('⏳ Loading recording library...');
  const [recordingInfo, setRecordingInfo] = useState('Checking...');

  useEffect(() => {
    // Check status after 2 seconds
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).rrweb) {
        setStatus('✅ rrweb loaded successfully!');
        setRecordingInfo(`
          rrweb loaded: Yes
          Session ID: ${localStorage.getItem('leadtracker_session_id') || 'Not set'}
          Visitor ID: ${localStorage.getItem('leadtracker_visitor_id') || 'Not set'}
        `);
      } else {
        setStatus('❌ rrweb failed to load!');
        setRecordingInfo('Recording: Disabled (rrweb not found)');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Load rrweb - try unpkg as alternative CDN */}
      <Script 
        src="https://unpkg.com/rrweb@latest/dist/rrweb.min.js"
        strategy="beforeInteractive"
      />
      <Script 
        src="/leadtracker-advanced.js"
        strategy="afterInteractive"
      />

      <div style={{ 
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '50px auto',
        padding: '20px',
        lineHeight: '1.6'
      }}>
        <h1>🎬 LeadTracker Session Recording Test</h1>
        
        <div style={{
          background: status.includes('✅') ? '#d4edda' : '#fff3cd',
          border: `1px solid ${status.includes('✅') ? '#c3e6cb' : '#ffeeba'}`,
          color: status.includes('✅') ? '#155724' : '#856404',
          padding: '15px',
          borderRadius: '4px',
          margin: '20px 0'
        }}>
          {status}
        </div>

        <div style={{
          background: '#f4f4f4',
          padding: '20px',
          margin: '20px 0',
          borderRadius: '8px'
        }}>
          <h2>Test Interactions</h2>
          <p>This page tests session recording. Try these interactions:</p>
          
          <input 
            type="text" 
            placeholder="Type something here..."
            style={{
              width: '100%',
              padding: '10px',
              margin: '10px 0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          
          <textarea 
            placeholder="Write a longer message..." 
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              margin: '10px 0',
              border: '1px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box'
            }}
          />
          
          <button 
            onClick={() => alert('Button clicked!')}
            style={{
              background: '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              margin: '5px'
            }}
          >
            Click Me!
          </button>
          
          <button 
            onClick={() => document.body.style.background = '#f0f0f0'}
            style={{
              background: '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              margin: '5px'
            }}
          >
            Change Background
          </button>
          
          <button 
            onClick={() => window.scrollTo(0, document.body.scrollHeight)}
            style={{
              background: '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              margin: '5px'
            }}
          >
            Scroll to Bottom
          </button>
        </div>

        <div style={{
          background: '#f4f4f4',
          padding: '20px',
          margin: '20px 0',
          borderRadius: '8px'
        }}>
          <h2>Recording Status</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{recordingInfo}</pre>
        </div>

        <div style={{
          background: '#f4f4f4',
          padding: '20px',
          margin: '20px 0',
          borderRadius: '8px'
        }}>
          <h2>Console Instructions</h2>
          <p>Open your browser console (F12) to see:</p>
          <ul>
            <li>✓ [LeadTracker] Advanced analytics initialized</li>
            <li>✓ [LeadTracker] Session recording started</li>
            <li>Or ⚠️ warnings if rrweb failed to load</li>
          </ul>
        </div>

        <div style={{ 
          height: '1000px', 
          background: 'linear-gradient(180deg, white, lightblue)' 
        }}>
          <p style={{ paddingTop: '500px', textAlign: 'center' }}>
            Scroll down to test scroll tracking!
          </p>
        </div>
      </div>
    </>
  );
}
