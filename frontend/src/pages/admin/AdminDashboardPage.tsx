import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatCents, getApiErrorMessage } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  Search,
  DollarSign,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

interface AdminStats {
  totalReturns: number;
  byStatus: {
    SUBMITTED: number;
    UNDER_REVIEW: number;
    APPROVED: number;
    REJECTED: number;
    REFUNDED: number;
    CANCELLED: number;
    REFUND_FAILED: number;
  };
  totalRefundedCents: number;
  topReasons: { reason: string; count: number }[];
}

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data.stats);
      } catch (err: any) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div data-testid="admin-dashboard-loading" className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 dark:border-night-700 border-t-indigo-600"></div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading admin statistics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div
          data-testid="admin-stats-error"
          className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200"
        >
          <div className="font-semibold text-sm">Failed to load statistics</div>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 dark:border-night-700 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <span>🛡️ Operations Management</span>
          </div>
          <h1
            data-testid="admin-dashboard-title"
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Returns & Refund Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time returns queue tracking, review workflows, and financial metrics
          </p>
        </div>

        <Link
          to="/admin/returns"
          data-testid="go-to-queue-btn"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          Open Returns Queue
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Returns */}
        <div
          data-testid="kpi-total-returns"
          className="bg-white dark:bg-night-800 p-5 rounded-xl border border-slate-200 dark:border-night-700 shadow-sm flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Total Returns
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {stats.totalReturns}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all orders</div>
          </div>
          <div className="w-12 h-12 bg-slate-100 dark:bg-night-750 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

        {/* Needs Action (Submitted) */}
        <Link
          to="/admin/returns?status=SUBMITTED"
          data-testid="kpi-submitted-returns"
          className="bg-white dark:bg-night-800 p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-sm flex items-center justify-between hover:border-amber-400 dark:hover:border-amber-700 transition-colors group"
        >
          <div>
            <div className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase">
              Pending Review
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {stats.byStatus.SUBMITTED}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 group-hover:underline mt-0.5">
              Review queue &rarr;
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </Link>

        {/* Under Review */}
        <Link
          to="/admin/returns?status=UNDER_REVIEW"
          data-testid="kpi-under-review"
          className="bg-white dark:bg-night-800 p-5 rounded-xl border border-blue-200 dark:border-blue-900/60 shadow-sm flex items-center justify-between hover:border-blue-400 dark:hover:border-blue-700 transition-colors group"
        >
          <div>
            <div className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase">
              Under Review
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {stats.byStatus.UNDER_REVIEW}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 group-hover:underline mt-0.5">
              View active &rarr;
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Search className="w-6 h-6" />
          </div>
        </Link>

        {/* Total Refunded Cash */}
        <div
          data-testid="kpi-total-refunded"
          className="bg-white dark:bg-night-800 p-5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-sm flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase">
              Total Refunded
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCents(stats.totalRefundedCents)}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.byStatus.REFUNDED} orders settled
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Status Breakdown Grid */}
      <div className="bg-white dark:bg-night-800 rounded-xl border border-slate-200 dark:border-night-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">
          Status Pipeline Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(stats.byStatus).map(([statusKey, count]) => (
            <Link
              key={statusKey}
              to={`/admin/returns?status=${statusKey}`}
              className="p-3 rounded-lg border border-slate-100 dark:border-night-700 hover:border-indigo-200 dark:hover:border-indigo-900/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors text-center"
            >
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{count}</div>
              <div className="mt-1">
                <StatusBadge status={statusKey} size="sm" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Reasons & Quick Action Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Reasons Card */}
        <div className="bg-white dark:bg-night-800 rounded-xl border border-slate-200 dark:border-night-700 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Top Return Reasons
          </h3>
          <div className="space-y-3">
            {stats.topReasons.map((item) => {
              const pct = stats.totalReturns > 0 ? (item.count / stats.totalReturns) * 100 : 0;
              return (
                <div key={item.reason} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.reason}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">
                      {item.count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-night-750 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* QA Testing Oracle & Controls Info */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 p-6 space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            QA Evaluation & State Machine Controls
          </div>
          <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
            As an Administrator, you have full authority to execute the returns lifecycle state machine:
          </p>
          <ul className="text-xs text-indigo-700 dark:text-indigo-300 space-y-1.5 list-disc pl-4">
            <li><strong>Review:</strong> Move incoming returns from <code className="bg-white dark:bg-night-800 px-1 py-0.5 rounded">SUBMITTED</code> to <code className="bg-white dark:bg-night-800 px-1 py-0.5 rounded">UNDER_REVIEW</code>.</li>
            <li><strong>Approve:</strong> Confirms inspection and approves item refund.</li>
            <li><strong>Reject:</strong> Requires a mandatory documented rejection reason (validated via server-side Zod schema).</li>
            <li><strong>Simulated Payment Gateway:</strong> Test refund settlements and failure rollbacks directly via the interactive failure toggle.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

