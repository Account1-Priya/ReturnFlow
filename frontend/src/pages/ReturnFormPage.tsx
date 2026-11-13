import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api, formatCents, getApiErrorMessage } from '../api/client';
import { Order, OrderItem, ReturnReason, RefundPreview } from '../types';
import {
  ArrowLeft,
  RotateCcw,
  Upload,
  X,
  AlertCircle,
  HelpCircle,
  Info,
  DollarSign,
  PackageCheck,
} from 'lucide-react';

interface SelectedItemState {
  orderItemId: number;
  quantity: number;
}

export const ReturnFormPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderIdParam = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [selectedItems, setSelectedItems] = useState<SelectedItemState[]>([]);
  const [reason, setReason] = useState<ReturnReason>('CHANGED_MIND');
  const [comment, setComment] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Preview state
  const [refundPreview, setRefundPreview] = useState<RefundPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch Order
  useEffect(() => {
    if (!orderIdParam) {
      setLoadingOrder(false);
      return;
    }

    const fetchOrder = async () => {
      setLoadingOrder(true);
      try {
        const res = await api.get(`/orders/${orderIdParam}`);
        const ord: Order = res.data.order;
        setOrder(ord);

        // Pre-select first eligible item
        const eligible = ord.items.find((i) => i.isReturnEligible);
        if (eligible) {
          setSelectedItems([{ orderItemId: eligible.id, quantity: 1 }]);
        }
      } catch (err: any) {
        setSubmitError(getApiErrorMessage(err));
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [orderIdParam]);

  // Handle Item Checkbox Toggle
  const handleItemToggle = (item: OrderItem) => {
    const exists = selectedItems.find((si) => si.orderItemId === item.id);
    if (exists) {
      setSelectedItems(selectedItems.filter((si) => si.orderItemId !== item.id));
    } else {
      setSelectedItems([...selectedItems, { orderItemId: item.id, quantity: 1 }]);
    }
  };

  // Handle Quantity Change
  const handleQuantityChange = (orderItemId: number, qty: number) => {
    setSelectedItems(
      selectedItems.map((si) =>
        si.orderItemId === orderItemId ? { ...si, quantity: qty } : si
      )
    );
  };

  // Live Refund Preview Fetcher
  const updateRefundPreview = useCallback(async () => {
    if (!order || selectedItems.length === 0) {
      setRefundPreview(null);
      setPreviewError(null);
      return;
    }

    setLoadingPreview(true);
    setPreviewError(null);

    try {
      const res = await api.post('/returns/preview', {
        orderId: order.id,
        items: selectedItems,
        reason,
        comment: comment || undefined,
      });
      setRefundPreview(res.data.refundPreview);
    } catch (err: any) {
      setPreviewError(getApiErrorMessage(err));
      setRefundPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }, [order, selectedItems, reason, comment]);

  useEffect(() => {
    updateRefundPreview();
  }, [updateRefundPreview]);

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const newFiles = Array.from(e.target.files);
    if (files.length + newFiles.length > 5) {
      setSubmitError('Maximum 5 proof images allowed.');
      return;
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);

    // Create thumbnail previews
    const previews = updatedFiles.map((file) => URL.createObjectURL(file));
    setFilePreviews(previews);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, idx) => idx !== index);
    setFiles(updated);
    setFilePreviews(updated.map((f) => URL.createObjectURL(f)));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    if (selectedItems.length === 0) {
      setSubmitError('Please select at least one item to return.');
      return;
    }

    const isProofRequired = ['DEFECTIVE', 'DAMAGED_IN_TRANSIT', 'WRONG_ITEM'].includes(
      reason
    );
    if (isProofRequired && files.length === 0) {
      setSubmitError(
        `At least one proof photo is required for returns due to "${reason.replace(/_/g, ' ')}".`
      );
      return;
    }

    if (reason === 'OTHER' && comment.trim().length < 10) {
      setSubmitError(
        'Reason "OTHER" requires an explanatory comment of at least 10 characters.'
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append('orderId', order.id.toString());
      formData.append('reason', reason);
      if (comment) formData.append('comment', comment);
      formData.append('items', JSON.stringify(selectedItems));

      files.forEach((file) => {
        formData.append('images', file);
      });

      const res = await api.post('/returns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/returns/${res.data.returnRequest.id}?created=true`);
    } catch (err: any) {
      setSubmitError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isProofRequired = ['DEFECTIVE', 'DAMAGED_IN_TRANSIT', 'WRONG_ITEM'].includes(
    reason
  );

  if (loadingOrder) {
    return (
      <div data-testid="return-form-loading" className="py-24 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-brand-600"></div>
        <p className="mt-3 text-sm text-slate-500">Loading order items for return...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          No Order Selected
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Please select an order from your order list to initiate a return.
        </p>
        <Link
          to="/orders"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700"
        >
          <ArrowLeft className="w-4 h-4" /> Go to My Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="flex items-center gap-3 pb-6 border-b border-slate-200">
        <Link
          to={`/orders/${order.id}`}
          data-testid="back-to-order-btn"
          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1
            data-testid="return-form-title"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            Submit Return Request
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Order #{order.id} • Select items, reason, and preview your calculated refund
          </p>
        </div>
      </div>

      {submitError && (
        <div
          data-testid="return-form-error"
          className="my-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-sm text-rose-700"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Unable to submit return request</div>
            <div className="mt-0.5">{submitError}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Select Items */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                1. Select Items to Return
              </h2>
              <span className="text-xs text-slate-500">
                {selectedItems.length} of {order.items.length} selected
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {order.items.map((item) => {
                const selected = selectedItems.find(
                  (si) => si.orderItemId === item.id
                );
                const isEligible = item.isReturnEligible;
                const maxQty = item.availableReturnQuantity || 1;

                return (
                  <div
                    key={item.id}
                    data-testid={`return-item-select-row-${item.id}`}
                    className={`py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                      !isEligible ? 'opacity-50 bg-slate-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`item-${item.id}`}
                        data-testid={`item-checkbox-${item.id}`}
                        disabled={!isEligible}
                        checked={!!selected}
                        onChange={() => handleItemToggle(item)}
                        className="mt-1 h-4 w-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500 disabled:cursor-not-allowed"
                      />
                      <div>
                        <label
                          htmlFor={`item-${item.id}`}
                          className={`text-sm font-semibold ${
                            isEligible ? 'text-slate-900 cursor-pointer' : 'text-slate-500'
                          }`}
                        >
                          {item.product.name}
                        </label>
                        <p className="text-xs text-slate-500">
                          {formatCents(item.unitPriceCents)} each • {item.product.category}
                        </p>
                        {!isEligible && (
                          <p className="text-[11px] text-rose-600 mt-1 font-medium">
                            {item.ineligibilityReason || 'Ineligible for return'}
                          </p>
                        )}
                      </div>
                    </div>

                    {selected && (
                      <div className="flex items-center gap-3 pl-7 sm:pl-0">
                        <label
                          htmlFor={`qty-${item.id}`}
                          className="text-xs text-slate-600"
                        >
                          Quantity:
                        </label>
                        <select
                          id={`qty-${item.id}`}
                          data-testid={`item-quantity-select-${item.id}`}
                          value={selected.quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              item.id,
                              parseInt(e.target.value, 10)
                            )
                          }
                          className="border border-slate-300 rounded-lg text-xs py-1 px-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          {Array.from({ length: maxQty }, (_, i) => i + 1).map(
                            (num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Reason & Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                2. Return Reason & Comments
              </h2>
            </div>

            <div>
              <label
                htmlFor="reason"
                className="block text-xs font-semibold text-slate-700 uppercase"
              >
                Reason for Return *
              </label>
              <select
                id="reason"
                data-testid="return-reason-select"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReturnReason)}
                className="mt-1.5 block w-full border border-slate-300 rounded-lg py-2 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="DEFECTIVE">Defective / Not Functioning (Seller Fault)</option>
                <option value="DAMAGED_IN_TRANSIT">Damaged In Transit (Seller Fault)</option>
                <option value="WRONG_ITEM">Wrong Item Received (Seller Fault)</option>
                <option value="NOT_AS_DESCRIBED">Item Not As Described (15% Restocking Fee)</option>
                <option value="CHANGED_MIND">Changed Mind (15% Restocking Fee)</option>
                <option value="OTHER">Other (Requires ≥10 character comment)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label
                  htmlFor="comment"
                  className="block text-xs font-semibold text-slate-700 uppercase"
                >
                  Comment / Explanation {reason === 'OTHER' && <span className="text-rose-500">*</span>}
                </label>
                <span
                  data-testid="comment-char-count"
                  className={`text-xs ${
                    reason === 'OTHER' && comment.trim().length < 10
                      ? 'text-rose-600 font-semibold'
                      : 'text-slate-400'
                  }`}
                >
                  {comment.length} / 10 min chars
                </span>
              </div>
              <textarea
                id="comment"
                data-testid="return-comment-input"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  reason === 'OTHER'
                    ? 'Please provide a detailed explanation of at least 10 characters...'
                    : 'Add any optional details or observations...'
                }
                className="mt-1.5 block w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Step 3: Proof Images Upload */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                3. Photo Evidence & Proof{' '}
                {isProofRequired ? (
                  <span className="text-rose-500 font-bold">* Required</span>
                ) : (
                  <span className="text-slate-400 font-normal">(Optional)</span>
                )}
              </h2>
              <span className="text-xs text-slate-500">{files.length} / 5 max</span>
            </div>

            {isProofRequired && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>
                  Returns for {reason.replace(/_/g, ' ')} require at least one clear photo showing the issue.
                </span>
              </div>
            )}

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-6 text-center cursor-pointer bg-slate-50/50 transition-colors relative">
              <input
                type="file"
                data-testid="file-upload-input"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-900">
                Click to upload proof images
              </div>
              <p className="text-xs text-slate-500 mt-1">
                JPG, PNG, or WEBP up to 5 MB each (max 5 photos)
              </p>
            </div>

            {/* Thumbnail Previews */}
            {filePreviews.length > 0 && (
              <div
                data-testid="file-previews-container"
                className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2"
              >
                {filePreviews.map((previewUrl, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-slate-100"
                  >
                    <img
                      src={previewUrl}
                      alt={`Proof thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      data-testid={`remove-file-btn-${idx}`}
                      onClick={() => removeFile(idx)}
                      className="absolute top-1 right-1 p-1 bg-slate-900/70 text-white rounded-full hover:bg-rose-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 p-1 text-[10px] text-white truncate text-center">
                      {files[idx]?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Live Refund Preview Calculator */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-24">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Live Refund Preview
              </h3>
              {loadingPreview && (
                <span className="text-[11px] text-brand-600 animate-pulse font-medium">
                  Calculating...
                </span>
              )}
            </div>

            {previewError ? (
              <div
                data-testid="preview-error-box"
                className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700"
              >
                {previewError}
              </div>
            ) : refundPreview ? (
              <div data-testid="refund-preview-card" className="mt-4 space-y-3">
                <dl className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <dt>Items Subtotal</dt>
                    <dd className="font-medium text-slate-900">
                      {formatCents(refundPreview.subtotalItemRefundCents)}
                    </dd>
                  </div>

                  <div className="flex justify-between">
                    <dt>Tax Refund</dt>
                    <dd className="font-medium text-slate-900">
                      +{formatCents(refundPreview.totalTaxRefundCents)}
                    </dd>
                  </div>

                  {refundPreview.totalRestockingFeeCents > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <dt>Restocking Fee (15%)</dt>
                      <dd className="font-medium">
                        -{formatCents(refundPreview.totalRestockingFeeCents)}
                      </dd>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <dt>Shipping Refund</dt>
                    <dd className="font-medium text-slate-900">
                      {refundPreview.shippingRefundCents > 0
                        ? `+${formatCents(refundPreview.shippingRefundCents)}`
                        : '$0.00'}
                    </dd>
                  </div>

                  {refundPreview.shippingRefundCents > 0 && (
                    <div className="p-2 bg-emerald-50 rounded text-[11px] text-emerald-700">
                      Full original shipping refunded (entire order return due to seller fault).
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                    <dt className="text-sm font-bold text-slate-900">Total Refund</dt>
                    <dd
                      data-testid="preview-total-refund"
                      className="text-lg font-bold text-emerald-600"
                    >
                      {formatCents(refundPreview.totalRefundCents)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Select items above to see calculated refund amount.
              </div>
            )}

            {/* Submission Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="submit"
                data-testid="submit-return-btn"
                disabled={submitting || selectedItems.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                <PackageCheck className="w-4 h-4" />
                {submitting ? 'Submitting Request...' : 'Confirm & Submit Return'}
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                You can cancel this request at any time before review begins.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

