import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatCents, formatDate, getApiErrorMessage } from '../api/client';
import { Order } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Receipt,
} from 'lucide-react';
import { ProductImage } from '../components/ProductImage';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.order);
      } catch (err: any) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div data-testid="order-detail-loading" className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 dark:border-night-700 border-t-brand-600"></div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div
          data-testid="order-detail-error"
          className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <h3 className="text-base font-semibold">Error Loading Order</h3>
          </div>
          <p className="mt-2 text-sm">{error || 'Order not found'}</p>
          <div className="mt-4">
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-100"
            >
              <ArrowLeft className="w-4 h-4" /> Back to My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasEligibleItems = order.items.some((i) => i.isReturnEligible);
  const isDelivered = order.status === 'DELIVERED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 dark:border-night-700 gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            data-testid="back-to-orders-btn"
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-night-750 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1
                data-testid="order-detail-title"
                className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100"
              >
                Order #{order.id}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Placed on {formatDate(order.createdAt)}
              {order.deliveredAt && ` • Delivered on ${formatDate(order.deliveredAt)}`}
            </p>
          </div>
        </div>

        {isDelivered && hasEligibleItems && (
          <Link
            to={`/returns/new?orderId=${order.id}`}
            data-testid="request-return-btn"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Request Return / Refund
          </Link>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-night-800 rounded-xl border border-slate-200 dark:border-night-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-night-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Purchased Items ({order.items.length})
              </h2>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-night-700">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  data-testid={`order-item-row-${item.id}`}
                  className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <ProductImage product={item.product} size="md" className="mt-0.5" interactive />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        SKU: {item.product.sku} • Category: {item.product.category}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span>Qty: {item.quantity}</span>
                        <span>•</span>
                        <span>{formatCents(item.unitPriceCents)} each</span>
                        {item.discountCents > 0 && (
                          <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                            (Discount: -{formatCents(item.discountCents)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-0 pt-3 sm:pt-0 border-slate-100 dark:border-night-700">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatCents(item.lineTotalCents)}
                    </div>

                    {/* Eligibility Badge */}
                    <div
                      data-testid={`item-eligibility-badge-${item.id}`}
                      className="inline-flex items-center gap-1.5"
                    >
                      {item.isReturnEligible ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60">
                          <CheckCircle2 className="w-3 h-3" />
                          {item.availableReturnQuantity} Available to Return
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-night-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-night-700"
                          title={item.ineligibilityReason}
                        >
                          <XCircle className="w-3 h-3 text-slate-400" />
                          {item.ineligibilityReason || 'Ineligible'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pre-existing Returns on this order */}
          {order.returnRequests && order.returnRequests.length > 0 && (
            <div className="bg-white dark:bg-night-800 rounded-xl border border-slate-200 dark:border-night-700 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                Returns Associated with this Order
              </h3>
              <div className="space-y-2.5">
                {order.returnRequests.map((ret) => (
                  <div
                    key={ret.id}
                    data-testid={`associated-return-${ret.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-night-700 bg-slate-50/50 dark:bg-night-900/50 hover:bg-slate-50 dark:hover:bg-night-900 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <RotateCcw className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Return #{ret.id}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-2">
                          Reason: {ret.reason}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={ret.status} size="sm" />
                      <Link
                        to={`/returns/${ret.id}`}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
                      >
                        View &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Financial Order Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-night-800 rounded-xl border border-slate-200 dark:border-night-700 shadow-sm p-5">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-night-700">
              <Receipt className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Order Summary</h3>
            </div>

            <dl className="mt-4 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">
                  {formatCents(order.subtotalCents)}
                </dd>
              </div>

              {order.discountCents > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-300">
                  <dt>Order Discount</dt>
                  <dd className="font-medium">-{formatCents(order.discountCents)}</dd>
                </div>
              )}

              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">
                  {order.shippingCents === 0 ? 'FREE' : formatCents(order.shippingCents)}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt>Estimated Tax</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">
                  {formatCents(order.taxCents)}
                </dd>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-night-700 flex justify-between text-sm font-semibold text-slate-900 dark:text-slate-100">
                <dt>Total Paid</dt>
                <dd data-testid="order-total-amount">
                  {formatCents(order.totalCents)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Delivery & Policy Info Box */}
          <div className="bg-slate-50 dark:bg-night-900 rounded-xl border border-slate-200 dark:border-night-700 p-4 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div className="font-semibold text-slate-900 dark:text-slate-100">Return Policy Reminder:</div>
            <ul className="list-disc pl-4 space-y-1">
              <li>30-day window from delivery date.</li>
              <li>Proof images required for damaged or defective items.</li>
              <li>15% restocking fee on change of mind returns.</li>
              <li>Final sale, gift cards, and perishables cannot be returned.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

