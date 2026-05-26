import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Toaster } from 'react-hot-toast';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('BizOS App Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0D0D0F',
          color: '#FAFAFA',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          padding: '2rem',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #6C63FF, #7C74FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, fontSize: 24, fontWeight: 700, color: '#fff'
          }}>B</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#71717A', fontSize: 14, marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#6C63FF', color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 14
            }}
          >
            Reload app
          </button>
          <details style={{ marginTop: 16, color: '#52525B', fontSize: 12 }}>
            <summary style={{ cursor: 'pointer' }}>Stack trace</summary>
            <pre style={{ marginTop: 8, maxWidth: 600, overflow: 'auto', fontSize: 11 }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A1A1F',
            color: '#FAFAFA',
            border: '1px solid #1E1E24',
            borderRadius: '10px',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#1A1A1F' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#1A1A1F' } },
        }}
      />
    </ErrorBoundary>
  </React.StrictMode>
);
