export type Role = 'CUSTOMER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type ReturnReason =
  | 'DEFECTIVE'
  | 'DAMAGED_IN_TRANSIT'
  | 'WRONG_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'CHANGED_MIND'
  | 'OTHER';

export type ReturnStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REFUND_INITIATED'
  | 'REFUND_FAILED'
  | 'REFUNDED';

export type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  isFinalSale: boolean;
  unitPriceCents: number;
  stock: number;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  taxCents: number;
  lineTotalCents: number;
  product: Product;
  availableReturnQuantity?: number;
  isReturnEligible?: boolean;
  ineligibilityReason?: string;
}

export interface Order {
  id: number;
  customerId: number;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  customer?: { id: number; name: string; email: string };
  returnRequests?: ReturnRequest[];
}

export interface ReturnItem {
  id: number;
  returnRequestId: number;
  orderItemId: number;
  quantityReturned: number;
  itemRefundCents: number;
  taxRefundCents: number;
  restockingFeeCents: number;
  shippingRefundCents: number;
  totalRefundCents: number;
  orderItem?: OrderItem;
}

export interface ReturnImage {
  id: number;
  returnRequestId: number;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface Refund {
  id: number;
  returnRequestId: number;
  totalRefundCents: number;
  status: RefundStatus;
  gatewayRef?: string | null;
  failureReason?: string | null;
  initiatedAt: string;
  completedAt?: string | null;
}

export interface StatusHistory {
  id: number;
  returnRequestId: number;
  changedById: number;
  fromStatus: ReturnStatus | null;
  toStatus: ReturnStatus;
  note?: string | null;
  changedAt: string;
  changedBy?: {
    id: number;
    name: string;
    email: string;
    role: Role;
  };
}

export interface ReturnRequest {
  id: number;
  orderId: number;
  customerId: number;
  reason: ReturnReason;
  comment?: string | null;
  status: ReturnStatus;
  reviewedById?: number | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  order?: Order;
  customer?: { id: number; name: string; email: string };
  reviewedBy?: { id: number; name: string; email: string } | null;
  returnItems: ReturnItem[];
  images?: ReturnImage[];
  refund?: Refund | null;
  statusHistory?: StatusHistory[];
}

export interface RefundPreview {
  subtotalItemRefundCents: number;
  totalTaxRefundCents: number;
  totalRestockingFeeCents: number;
  shippingRefundCents: number;
  totalRefundCents: number;
  isEntireOrderReturned: boolean;
  items: {
    orderItemId: number;
    quantityReturned: number;
    itemRefundCents: number;
    taxRefundCents: number;
    restockingFeeCents: number;
    shippingRefundCents: number;
    totalRefundCents: number;
  }[];
}

