import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatCents, formatDate, getApiErrorMessage } from '../api/client';
import { ReturnRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RotateCcw, ArrowRight, Package, AlertCircle } from 'lucide-react';

export const MyReturnsPage: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReturns = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/returns?page=${pageNum}&limit=8`);
      setReturns(res.data.returnRequests);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns(page);
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1
            data-testid="my-returns-title"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            My Return Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track status, review approvals, and monitor refund settlements
          </p>
        </div>
        <Link
          to="/orders"
          data-testid="start-new-return-link"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" />
          Start New Return
        </Link>
      </div>

      {error && (
        <div
          data-testid="returns-error"
          className="my-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-700"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div data-testid="returns-loading" className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-brand-600"></div>
          <p className="mt-3 text-sm text-slate-500">Loading your return requests...</p>
        </div>
      ) : returns.length === 0 ? (
        <div
          data-testid="returns-empty-state"
          className="py-16 text-center bg-white rounded-xl border border-slate-200 my-6"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            No return requests yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            You haven't requested any returns. You can initiate returns on delivered orders within 30 days.
          </p>
          <Link
            to="/orders"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Go to My Orders &rarr;
          </Link>
        </div>
      ) : (
        <div data-testid="returns-list" className="mt-6 space-y-4">
          {returns.map((ret) => {
            const totalRefund = ret.returnItems.reduce(
              (sum, item) => sum + item.totalRefundCents,
              0
            );

            return (
              <div
                key={ret.id}
                data-testid={`return-card-${ret.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-colors"
              >
                <div className="p-5 sm:px-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs block">Return Request</span>
                      <span className="font-semibold text-slate-900">#{ret.id}</span>
                    </div>
                    <div className="h-7 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <span className="text-slate-500 text-xs block">Order ID</span>
                      <Link
                        to={`/orders/${ret.orderId}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        #{ret.orderId}
                      </Link>
                    </div>
                    <div className="h-7 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <span className="text-slate-500 text-xs block">Submitted On</span>
                      <span className="text-slate-700">{formatDate(ret.createdAt)}</span>
                    </div>
                    <div className="h-7 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <span className="text-slate-500 text-xs block">Reason</span>
                      <span className="font-medium text-slate-800">{ret.reason}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={ret.status} />
                  </div>
                </div>

                <div className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Items summary */}
                  <div className="space-y-1.5">
                    {ret.returnItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 text-xs text-slate-700"
                      >
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">
                          {item.orderItem?.product.name || `Item #${item.orderItemId}`}
                        </span>
                        <span className="text-slate-400">
                          (Qty returned: {item.quantityReturned})
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Right: Refund amount and View Details action */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="sm:text-right">
                      <span className="text-xs text-slate-500 block">Total Refund</span>
                      <span
                        data-testid={`return-refund-amount-${ret.id}`}
                        className="text-base font-bold text-slate-900"
                      >
                        {formatCents(totalRefund)}
                      </span>
                    </div>

                    <Link
                      to={`/returns/${ret.id}`}
                      data-testid={`view-return-btn-${ret.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
                    >
                      View Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

