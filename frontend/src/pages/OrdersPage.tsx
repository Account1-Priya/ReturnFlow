import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatCents, formatDate, getApiErrorMessage } from '../api/client';
import { Order } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ShoppingBag, ArrowRight, Package, AlertCircle } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/orders?page=${pageNum}&limit=8`);
      setOrders(res.data.orders);
      setTotalPages(res.data.pagination.totalPages || 1);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1
            data-testid="orders-page-title"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            My Orders
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View order history, track deliveries, and request returns
          </p>
        </div>
        <Link
          to="/returns"
          data-testid="view-returns-link"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-auto"
        >
          Track Returns
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div
          data-testid="orders-error"
          className="my-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3 text-sm text-rose-700"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div data-testid="orders-loading" className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-brand-600"></div>
          <p className="mt-3 text-sm text-slate-500">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        /* Empty state */
        <div
          data-testid="orders-empty-state"
          className="py-16 text-center bg-white rounded-xl border border-slate-200 my-6"
        >
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            No orders found
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            You have not placed any orders yet. Check other test accounts or seed baseline data.
          </p>
        </div>
      ) : (
        /* Orders list */
        <div data-testid="orders-list" className="mt-6 space-y-4">
          {orders.map((order) => {
            const hasEligibleItems = order.items.some(
              (i) => i.isReturnEligible
            );
            const isDelivered = order.status === 'DELIVERED';

            return (
              <div
                key={order.id}
                data-testid={`order-card-${order.id}`}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-colors"
              >
                {/* Order card header */}
                <div className="p-5 sm:px-6 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs block">Order ID</span>
                      <span className="font-semibold text-slate-900">#{order.id}</span>
                    </div>
                    <div className="h-7 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <span className="text-slate-500 text-xs block">Placed on</span>
                      <span className="text-slate-700">{formatDate(order.createdAt)}</span>
                    </div>
                    {order.deliveredAt && (
                      <>
                        <div className="h-7 w-px bg-slate-200 hidden sm:block" />
                        <div>
                          <span className="text-slate-500 text-xs block">Delivered on</span>
                          <span className="text-slate-700">{formatDate(order.deliveredAt)}</span>
                        </div>
                      </>
                    )}
                    <div className="h-7 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <span className="text-slate-500 text-xs block">Total Amount</span>
                      <span className="font-semibold text-slate-900">
                        {formatCents(order.totalCents)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                </div>

                {/* Items preview */}
                <div className="p-5 sm:px-6">
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm py-1.5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-medium text-slate-900">
                              {item.product.name}
                            </span>
                            <span className="text-slate-400 text-xs ml-2">
                              Qty: {item.quantity} × {formatCents(item.unitPriceCents)}
                            </span>
                            {item.product.isFinalSale && (
                              <span className="ml-2 text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                Final Sale
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-medium text-slate-900">
                            {formatCents(item.lineTotalCents)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-slate-500">
                      {isDelivered ? (
                        hasEligibleItems ? (
                          <span className="text-emerald-700 font-medium">
                            ✓ Items eligible for return
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Items in this order are no longer eligible for return
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400">
                          Order must be delivered before requesting a return
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/orders/${order.id}`}
                        data-testid={`view-order-btn-${order.id}`}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        View Order Details
                      </Link>

                      {isDelivered && hasEligibleItems && (
                        <Link
                          to={`/returns/new?orderId=${order.id}`}
                          data-testid={`start-return-btn-${order.id}`}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
                        >
                          Return Items
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                data-testid="prev-page-btn"
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
                data-testid="next-page-btn"
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

