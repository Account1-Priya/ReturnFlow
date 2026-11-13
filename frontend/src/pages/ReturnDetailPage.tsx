import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api, formatCents, formatDate, getApiErrorMessage } from '../api/client';
import { ReturnRequest } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { Modal } from '../components/Modal';
import {
  ArrowLeft,
  RotateCcw,
  Package,
  AlertCircle,
  XCircle,
  CheckCircle2,
  DollarSign,
  Upload,
  Ban,
  ImageIcon,
} from 'lucide-react';

export const ReturnDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const justCreated = searchParams.get('created');

  const [returnReq, setReturnReq] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Additional image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const fetchReturnDetail = async () => {
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
    fetchReturnDetail();
  }, [id]);

  const handleCancelReturn = async () => {
    if (!returnReq) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await api.post(`/returns/${returnReq.id}/cancel`);
      setCancelModalOpen(false);
      fetchReturnDetail();
    } catch (err: any) {
      setCancelError(getApiErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const handleUploadAdditionalImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !returnReq) return;
    setUploadingImage(true);
    setUploadSuccess(null);
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach((f) => formData.append('images', f));

      await api.post(`/returns/${returnReq.id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadSuccess('Additional photos uploaded successfully.');
      fetchReturnDetail();
    } catch (err: any) {
      setError(getApiErrorMessage(err));
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div data-testid="return-detail-loading" className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-brand-600"></div>
        <p className="mt-3 text-sm text-slate-500">Loading return details...</p>
      </div>
    );
  }

  if (error || !returnReq) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div
          data-testid="return-detail-error"
          className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <h3 className="text-base font-semibold">Error Loading Return</h3>
          </div>
          <p className="mt-2 text-sm">{error || 'Return request not found'}</p>
          <div className="mt-4">
            <Link
              to="/returns"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900"
            >
              <ArrowLeft className="w-4 h-4" /> Back to My Returns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCancellable = returnReq.status === 'SUBMITTED';
  const totalRefund = returnReq.returnItems.reduce(
    (sum, item) => sum + item.totalRefundCents,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/returns"
            data-testid="back-to-returns-btn"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1
                data-testid="return-detail-id"
                className="text-2xl font-bold tracking-tight text-slate-900"
              >
                Return #{returnReq.id}
              </h1>
              <StatusBadge status={returnReq.status} />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Submitted on {formatDate(returnReq.createdAt)} • For Order{' '}
              <Link
                to={`/orders/${returnReq.orderId}`}
                className="font-medium text-brand-600 hover:text-brand-700"
              >
                #{returnReq.orderId}
              </Link>
            </p>
          </div>
        </div>

        {/* Cancel button (allowed only in SUBMITTED state before review) */}
        {isCancellable && (
          <button
            data-testid="open-cancel-modal-btn"
            onClick={() => setCancelModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors self-start sm:self-auto"
          >
            <Ban className="w-4 h-4" />
            Cancel Return Request
          </button>
        )}
      </div>

      {justCreated && (
        <div
          data-testid="return-created-banner"
          className="my-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-sm text-emerald-800"
        >
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>
            Your return request has been submitted successfully! Our support team will review it shortly.
          </span>
        </div>
      )}

      {/* Rejection Alert */}
      {returnReq.status === 'REJECTED' && returnReq.rejectionReason && (
        <div
          data-testid="rejection-reason-box"
          className="my-6 p-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900"
        >
          <div className="flex items-center gap-2 font-semibold text-sm">
            <XCircle className="w-5 h-5 text-rose-600" />
            Return Request Rejected
          </div>
          <p className="mt-2 text-xs text-rose-800 bg-white/70 p-3 rounded-lg border border-rose-100">
            <strong>Rejection Reason:</strong> {returnReq.rejectionReason}
          </p>
        </div>
      )}

      {/* Refund Success Alert */}
      {returnReq.status === 'REFUNDED' && (
        <div
          data-testid="refund-settled-box"
          className="my-6 p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Refund Processed & Settled
            </div>
            <span className="text-sm font-bold text-emerald-700">
              {formatCents(totalRefund)}
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-800">
            Payment Gateway Reference:{' '}
            <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-emerald-900">
              {returnReq.refund?.gatewayRef || 'GW-REF-SETTLED'}
            </code>
          </p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Items & Images */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items returned breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Returned Items & Refund Breakdown
              </h2>
              <span className="text-xs text-slate-500">
                Reason: <strong>{returnReq.reason}</strong>
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
                          {item.orderItem?.product.name || `Item #${item.orderItemId}`}
                        </div>
                        <div className="text-xs text-slate-500">
                          Quantity Returned: {item.quantityReturned}
                        </div>
                      </div>
                    </div>

                    <div className="text-sm font-bold text-slate-900">
                      {formatCents(item.totalRefundCents)}
                    </div>
                  </div>

                  {/* Itemized math breakdown */}
                  <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2 border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Net Item Refund</span>
                      <span className="font-medium text-slate-900">
                        {formatCents(item.itemRefundCents)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Tax Refund</span>
                      <span className="font-medium text-slate-900">
                        +{formatCents(item.taxRefundCents)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Restocking Fee</span>
                      <span className="font-medium text-rose-600">
                        {item.restockingFeeCents > 0
                          ? `-${formatCents(item.restockingFeeCents)}`
                          : '$0.00'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Shipping Refund</span>
                      <span className="font-medium text-slate-900">
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

          {/* Customer Comment */}
          {returnReq.comment && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Customer Comment
              </h3>
              <p
                data-testid="return-customer-comment"
                className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100"
              >
                {returnReq.comment}
              </p>
            </div>
          )}

          {/* Proof Images Gallery */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                Proof Images ({returnReq.images?.length || 0})
              </h3>

              {isCancellable && (
                <label className="cursor-pointer text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingImage ? 'Uploading...' : 'Add More Photos'}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadAdditionalImages}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>

            {uploadSuccess && (
              <div className="mt-3 p-2 bg-emerald-50 text-emerald-700 text-xs rounded border border-emerald-200">
                {uploadSuccess}
              </div>
            )}

            {returnReq.images && returnReq.images.length > 0 ? (
              <div
                data-testid="proof-images-grid"
                className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4"
              >
                {returnReq.images.map((img) => (
                  <div
                    key={img.id}
                    className="group relative rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100"
                  >
                    <img
                      src={`/${img.filePath}`}
                      alt={img.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 p-1.5 text-[10px] text-white truncate text-center">
                      {img.fileName}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-4 text-center py-4">
                No proof photos were attached to this request.
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Timeline & Summary */}
        <div className="space-y-6">
          {/* Refund Grand Total Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 text-slate-700 font-semibold text-xs uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Total Refund Summary
            </div>
            <div className="pt-3 flex items-baseline justify-between">
              <span className="text-xs text-slate-500">Calculated Refund:</span>
              <span
                data-testid="return-detail-total-refund"
                className="text-2xl font-bold text-emerald-600"
              >
                {formatCents(totalRefund)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Status:{' '}
              <strong className="text-slate-700">{returnReq.status}</strong>
            </div>
          </div>

          {/* Audit History Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              Return Status Timeline
            </h3>
            <Timeline history={returnReq.statusHistory || []} />
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Return Request"
        description="Are you sure you want to cancel this return request?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will mark return #{returnReq.id} as CANCELLED and free the items so they can be re-returned if needed. This action cannot be undone.
          </p>

          {cancelError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {cancelError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              data-testid="cancel-modal-dismiss-btn"
              onClick={() => setCancelModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Keep Request
            </button>
            <button
              type="button"
              data-testid="confirm-cancel-return-btn"
              disabled={cancelling}
              onClick={handleCancelReturn}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Return'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

