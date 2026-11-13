import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, formatCents, formatDate, getApiErrorMessage } from '../../api/client';
import { ReturnRequest } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Timeline } from '../../components/Timeline';
import { Modal } from '../../components/Modal';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Search,
  DollarSign,
  Package,
  AlertCircle,
  Shield,
  CreditCard,
  User,
  ImageIcon,
} from 'lucide-react';

export const AdminDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [returnReq, setReturnReq] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Workflow actions state
  const [processingAction, setProcessingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Refund testing simulation toggle
  const [simulateGatewayFail, setSimulateGatewayFail] = useState(false);

  const fetchReturn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/returns/${id}`);
      setReturnReq(res.data.returnRequest);
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturn();
  }, [id]);

  // Action: Mark Under Review
  const handleMarkReview = async () => {
    if (!returnReq) return;
    setProcessingAction(true);
    setActionSuccessMessage(null);
    try {
      await api.patch(`/admin/returns/${returnReq.id}/review`);
      setActionSuccessMessage('Return status updated to UNDER_REVIEW.');
      fetchReturn();
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingAction(false);
    }
  };

  // Action: Approve Return
  const handleApprove = async () => {
    if (!returnReq) return;
    setProcessingAction(true);
    setActionSuccessMessage(null);
    try {
      await api.post(`/admin/returns/${returnReq.id}/approve`);
      setActionSuccessMessage('Return approved successfully. Ready for refund issuance.');
      fetchReturn();
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingAction(false);
    }
  };

  // Action: Reject Return
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReq) return;
    if (!rejectionReason.trim()) {
      setRejectError('Please specify a valid rejection reason.');
      return;
    }

    setProcessingAction(true);
    setRejectError(null);
    try {
      await api.post(`/admin/returns/${returnReq.id}/reject`, {
        reason: rejectionReason,
      });
      setRejectModalOpen(false);
      setActionSuccessMessage('Return marked as REJECTED.');
      fetchReturn();
    } catch (err: any) {
      setRejectError(getApiErrorMessage(err));
    } finally {
      setProcessingAction(false);
    }
  };

  // Action: Process Refund
  const handleProcessRefund = async () => {
    if (!returnReq) return;
    setProcessingAction(true);
    setActionSuccessMessage(null);
    try {
      const res = await api.post(
        `/admin/returns/${returnReq.id}/refund`,
        { forceFail: simulateGatewayFail },
        { validateStatus: (status) => status < 500 }
      );

      if (res.data.success) {
        setActionSuccessMessage(
          `Refund settled successfully! Gateway reference: ${res.data.gatewayRef}`
        );
      } else {
        setActionSuccessMessage(
          `Payment Gateway simulated failure triggered: ${res.data.failureReason}`
        );
      }
      fetchReturn();
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div data-testid="admin-detail-loading" className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-indigo-600"></div>
        <p className="mt-3 text-sm text-slate-500">Loading return for review...</p>
      </div>
    );
  }

  if (error || !returnReq) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div
          data-testid="admin-detail-error"
          className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800"
        >
          <div className="flex items-center gap-3 font-semibold text-base">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            Error Accessing Return
          </div>
          <p className="mt-2 text-sm">{error || 'Return request not found'}</p>
          <div className="mt-4">
            <Link
              to="/admin/returns"
              className="text-xs font-semibold text-rose-700 hover:text-rose-900"
            >
              &larr; Back to Returns Queue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalRefund = returnReq.returnItems.reduce(
    (sum, item) => sum + item.totalRefundCents,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/returns"
            data-testid="admin-back-btn"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1
                data-testid="admin-return-title"
                className="text-2xl font-bold tracking-tight text-slate-900"
              >
                Review Return #{returnReq.id}
              </h1>
              <StatusBadge status={returnReq.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer: <strong>{returnReq.customer?.name}</strong> (
              {returnReq.customer?.email}) • Order #{returnReq.orderId}
            </p>
          </div>
        </div>

        {/* Dynamic Action Buttons based on State Machine */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Transition: SUBMITTED -> UNDER_REVIEW */}
          {returnReq.status === 'SUBMITTED' && (
            <button
              data-testid="admin-review-btn"
              disabled={processingAction}
              onClick={handleMarkReview}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              <Search className="w-4 h-4" />
              Mark Under Review
            </button>
          )}

          {/* Transition: UNDER_REVIEW -> APPROVED */}
          {returnReq.status === 'UNDER_REVIEW' && (
            <>
              <button
                data-testid="admin-approve-btn"
                disabled={processingAction}
                onClick={handleApprove}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Return
              </button>

              <button
                data-testid="admin-reject-btn"
                disabled={processingAction}
                onClick={() => setRejectModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Reject Return
              </button>
            </>
          )}

          {/* Transition: APPROVED / REFUND_FAILED -> Process Refund */}
          {(returnReq.status === 'APPROVED' || returnReq.status === 'REFUND_FAILED') && (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer bg-slate-100 px-2 py-1.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  data-testid="simulate-gateway-fail-toggle"
                  checked={simulateGatewayFail}
                  onChange={(e) => setSimulateGatewayFail(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-[11px] font-semibold text-rose-700">
                  Simulate Gateway Fail (QA)
                </span>
              </label>

              <button
                data-testid="admin-refund-btn"
                disabled={processingAction}
                onClick={handleProcessRefund}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                {returnReq.status === 'REFUND_FAILED' ? 'Retry Refund' : 'Issue Refund'}
              </button>
            </div>
          )}
        </div>
      </div>

      {actionSuccessMessage && (
        <div
          data-testid="admin-action-success"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items & Math Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Claimed Return Items ({returnReq.returnItems.length})
              </h2>
              <span className="text-xs font-semibold text-slate-700">
                Reason: {returnReq.reason}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {returnReq.returnItems.map((item) => (
                <div key={item.id} className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {item.orderItem?.product.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Qty: {item.quantityReturned} • SKU: {item.orderItem?.product.sku}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm font-bold text-slate-900">
                      {formatCents(item.totalRefundCents)}
                    </div>
                  </div>

                  {/* Math Breakdown Box */}
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Net Item Refund</span>
                      <span className="font-semibold text-slate-900">
                        {formatCents(item.itemRefundCents)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tax Proportional</span>
                      <span className="font-semibold text-slate-900">
                        +{formatCents(item.taxRefundCents)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Restocking Fee</span>
                      <span className="font-semibold text-rose-600">
                        {item.restockingFeeCents > 0
                          ? `-${formatCents(item.restockingFeeCents)}`
                          : '$0.00'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Shipping Pro-rata</span>
                      <span className="font-semibold text-slate-900">
                        {item.shippingRefundCents > 0
                          ? `+${formatCents(item.shippingRefundCents)}`
                          : '$0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proof Evidence Photos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-400" />
              Attached Proof Evidence ({returnReq.images?.length || 0})
            </h3>

            {returnReq.images && returnReq.images.length > 0 ? (
              <div
                data-testid="admin-proof-images"
                className="grid grid-cols-2 sm:grid-cols-4 gap-4"
              >
                {returnReq.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100"
                  >
                    <img
                      src={`/${img.filePath}`}
                      alt={img.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 p-1 text-[10px] text-white truncate text-center">
                      {img.fileName}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-6">
                No proof images uploaded with this request.
              </div>
            )}
          </div>

          {/* Customer Comment */}
          {returnReq.comment && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Customer Explanation
              </div>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {returnReq.comment}
              </p>
            </div>
          )}
        </div>

        {/* Right Col */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Refund Settlement Total
            </div>
            <div className="pt-4 flex items-baseline justify-between">
              <span className="text-xs text-slate-500">Gross Refund Amount:</span>
              <span
                data-testid="admin-total-refund-val"
                className="text-2xl font-bold text-emerald-600"
              >
                {formatCents(totalRefund)}
              </span>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Audit History Trail
            </h3>
            <Timeline history={returnReq.statusHistory || []} />
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Return Request"
        description="A documented rejection reason is strictly required by the QA oracle."
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="rejectionReason"
              className="block text-xs font-semibold text-slate-700 uppercase"
            >
              Rejection Reason *
            </label>
            <textarea
              id="rejectionReason"
              data-testid="rejection-reason-textarea"
              required
              minLength={3}
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Serial number does not match item ordered; item shows signs of intentional damage..."
              className="mt-1.5 block w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {rejectError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {rejectError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="confirm-rejection-btn"
              disabled={processingAction}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {processingAction ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

