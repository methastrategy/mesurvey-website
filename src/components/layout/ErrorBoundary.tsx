import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[MESURV ErrorBoundary caught]', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.removeItem('mesurv-survey-storage-v1');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-rose-900/50 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-950/60 border border-rose-800 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              เกิดข้อผิดพลาดในการประมวลผล
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              ระบบตรวจพบข้อผิดพลาดที่ไม่คาดคิด ข้อมูลฉบับร่างของท่านถูกจัดเก็บไว้ในเครื่องอย่างปลอดภัย
            </p>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left font-mono text-xs text-rose-400/90 mb-6 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-survey-600 hover:bg-survey-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                รีเฟรชหน้าต่างใหม่
              </button>
              <button
                onClick={this.handleResetStorage}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                title="ล้างแคชข้อมูลหากแอปติดลูป"
              >
                ล้างแคชฉบับร่าง
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
