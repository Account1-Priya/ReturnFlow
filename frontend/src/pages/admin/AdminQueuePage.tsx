import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, formatCents, formatDate, getApiErrorMessage } from '../../api/client';
import { ReturnRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Search,
  Filter,
  ArrowRight,
  ListOrdered,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const AdminQueuePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await api.get(`/admin/returns?${params.toString()}`);
      setReturns(res.data.returnRequests);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [status, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQueue();
  };

  const handleStatusTab = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
    setSearchParams(newStatus ? { status: newStatus } : {});
  };

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'Pending Review', value: 'SUBMITTED' },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Refunded', value: 'REFUNDED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Failed Refund', value: 'REFUND_FAILED' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 dark:border-night-700 gap-4">
        <div>
          <h1
            data-testid="admin-queue-title"
            className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Returns Review Queue
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Filter, inspect evidence, approve or reject return submissions
          </p>
        </div>

        <button
          onClick={fetchQueue}
          data-testid="refresh-queue-btn"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-night-800 border border-slate-300 dark:border-night-600 rounded-lg hover:bg-slate-50 dark:hover:bg-night-900 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Queue
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto pb-2 border-b border-slate-200 dark:border-night-700 gap-2 scrollbar-none">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            data-testid={`filter-tab-${tab.value || 'all'}`}
            onClick={() => handleStatusTab(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              status === tab.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-night-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-night-750 border border-slate-200 dark:border-night-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            data-testid="admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, email, or comments..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-night-600 rounded-lg text-sm dark:text-slate-100 bg-white dark:bg-night-750 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          data-testid="search-submit-btn"
          className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 dark:bg-night-700 rounded-lg hover:bg-slate-800 dark:hover:bg-night-600 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div
          data-testid="queue-error"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 flex items-center gap-3 text-sm"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div data-testid="queue-loading" className="py-24 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 dark:border-night-700 border-t-indigo-600"></div>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading queue items...</p>
        </div>
      ) : returns.length === 0 ? (
        <div
          data-testid="queue-empty-state"
          className="py-16 text-center bg-white dark:bg-night-800 rounded-xl border border-slate-200 dark:border-night-700"
        >
          <ListOrdered className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            No returns found in this queue view
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Try switching filter tabs or clearing your search query.
          </p>
        </div>
      ) : (
        <div
          data-testid="queue-table-container"
          className="bg-white dark:bg-night-800 rounded-xl border border-slate-200 dark:border-night-700 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-night-700 text-left text-sm">
              <thead className="bg-slate-50/75 dark:bg-night-900/75 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Return ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Order</th>
                  <th className="px-6 py-3.5">Reason</th>
                  <th className="px-6 py-3.5">Total Refund</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-night-700 bg-white dark:bg-night-800">
                {returns.map((ret) => {
                  const totalRefund = ret.returnItems.reduce(
                    (sum, i) => sum + i.totalRefundCents,
                    0
                  );

                  return (
                    <tr
                      key={ret.id}
                      data-testid={`queue-row-${ret.id}`}
                      className="hover:bg-slate-50/50 dark:hover:bg-night-900/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">
                        #{ret.id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {ret.customer?.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {ret.customer?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                          #{ret.orderId}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {ret.reason}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        {formatCents(totalRefund)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(ret.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={ret.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/returns/${ret.id}`}
                          data-testid={`inspect-return-btn-${ret.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-colors"
                        >
                          Review &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-night-700 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 text-xs border border-slate-300 dark:border-night-600 rounded-lg bg-white dark:bg-night-800 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1 text-xs border border-slate-300 dark:border-night-600 rounded-lg bg-white dark:bg-night-800 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

