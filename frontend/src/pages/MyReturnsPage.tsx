import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatCents, formatDate, getApiErrorMessage } from '../api/client';
import { ReturnRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { RotateCcw, ArrowRight, AlertCircle } from 'lucide-react';
import { ProductImage } from '../components/ProductImage';

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 dark:border-night-700 gap-4">
        <div>
          <h1
            data-testid="my-returns-title"
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          >
            My Return Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
          className="my-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-3 text-sm text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div data-testid="returns-loading" className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 dark:border-night-700 border-t-brand-600"></div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading your return requests...</p>
        </div>
      ) : returns.length === 0 ? (
        <div
          data-testid="returns-empty-state"
          className="py-16 text-center bg-white dark:bg-night-800 rounded-xl border border-slate-200 dark:border-night-700 my-6"
        >
          <div className="w-12 h-12 bg-slate-100 dark:bg-night-750 rounded-full flex items-center justify-center text-slate-400 mx-auto">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
            No return requests yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You haven't requested any returns. You can initiate returns on delivered orders within 30 days.
          </p>
          <Link
            to="/orders"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
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
                className="bg-white dark:bg-night-800 rounded-xl border border-slate-200 dark:border-night-700 shadow-sm overflow-hidden hover:border-slate-300 dark:hover:border-night-600 transition-colors"
              >
                <div className="p-5 sm:px-6 bg-slate-50/50 dark:bg-night-900/50 border-b border-slate-100 dark:border-night-700 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs block">Return Request</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">#{ret.id}</span>
                    </div>
                    <div className="h-7 w-px bg-slate-200 dark:bg-night-700 hidden sm:block" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs block">Order ID</span>
                      <Link
                        to={`/orders/${ret.orderId}`}
                        className="font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                      >
                        #{ret.orderId}
                      </Link>
                    </div>
                    <div className="h-7 w-px bg-slate-200 dark:bg-night-700 hidden sm:block" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs block">Submitted On</span>
                      <span className="text-slate-700 dark:text-slate-300">{formatDate(ret.createdAt)}</span>
                    </div>
                    <div className="h-7 w-px bg-slate-200 dark:bg-night-700 hidden sm:block" />
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 text-xs block">Reason</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">{ret.reason}</span>
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
                        className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <ProductImage
                          product={item.orderItem?.product}
                          fallbackLabel={`Item #${item.orderItemId}`}
                          size="xs"
                        />
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
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-0 pt-3 sm:pt-0 border-slate-100 dark:border-night-700">
                    <div className="sm:text-right">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Refund</span>
                      <span
                        data-testid={`return-refund-amount-${ret.id}`}
                        className="text-base font-bold text-slate-900 dark:text-slate-100"
                      >
                        {formatCents(totalRefund)}
                      </span>
                    </div>

                    <Link
                      to={`/returns/${ret.id}`}
                      data-testid={`view-return-btn-${ret.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-night-800 border border-slate-300 dark:border-night-600 rounded-lg hover:bg-slate-50 dark:hover:bg-night-900 shadow-sm transition-colors"
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
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-night-600 rounded-lg bg-white dark:bg-night-800 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 dark:border-night-600 rounded-lg bg-white dark:bg-night-800 disabled:opacity-40"
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

