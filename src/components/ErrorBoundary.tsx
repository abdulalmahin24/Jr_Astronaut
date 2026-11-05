import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Eye } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onFallback2D?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '24px',
            backgroundColor: 'var(--color-paper-2)',
            border: 'var(--rule-hair) solid var(--color-error)',
            color: 'var(--color-ink)',
            textAlign: 'center',
            margin: '12px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'var(--color-paper-3)',
              border: 'var(--rule-hair) solid var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={20} color="var(--color-error)" />
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--color-error)', fontFamily: 'var(--font-display)' }}>
            {this.props.fallbackTitle || 'Subsystem Sensor Offline'}
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--color-muted)', maxWidth: '420px', margin: 0, lineHeight: 1.45 }}>
            {this.state.error?.message?.includes('WebGL')
              ? 'Hardware 3D WebGL acceleration is currently unavailable on this device or display driver. The tactical bridge is operating in 2D sensor mode.'
              : 'A telemetry subsystem encountered an unexpected state. Mission state and telemetry data remain fully intact.'}
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            {this.props.onFallback2D && (
              <button
                onClick={this.props.onFallback2D}
                className="hm-btn-primary hm-nowrap"
                style={{ padding: '6px 14px', fontSize: '11px', fontFamily: 'var(--font-outlier)' }}
              >
                <Eye size={14} />
                <span>2D Tactical View</span>
              </button>
            )}
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="hm-btn-secondary hm-nowrap"
              style={{ padding: '6px 14px', fontSize: '11px', fontFamily: 'var(--font-outlier)' }}
            >
              <RefreshCw size={14} />
              <span>Retry Telemetry</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
