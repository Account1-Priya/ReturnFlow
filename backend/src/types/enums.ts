export type Role = 'CUSTOMER' | 'ADMIN';
export const Role = {
  CUSTOMER: 'CUSTOMER' as const,
  ADMIN: 'ADMIN' as const,
};

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';
export const OrderStatus = {
  PENDING: 'PENDING' as const,
  PROCESSING: 'PROCESSING' as const,
  SHIPPED: 'SHIPPED' as const,
  DELIVERED: 'DELIVERED' as const,
  CANCELLED: 'CANCELLED' as const,
};

export type ProductCategory =
  | 'ELECTRONICS'
  | 'CLOTHING'
  | 'BOOKS'
  | 'GIFT_CARD'
  | 'PERISHABLE'
  | 'PERSONALIZED'
  | 'HOME'
  | 'SPORTS'
  | 'OTHER';
export const ProductCategory = {
  ELECTRONICS: 'ELECTRONICS' as const,
  CLOTHING: 'CLOTHING' as const,
  BOOKS: 'BOOKS' as const,
  GIFT_CARD: 'GIFT_CARD' as const,
  PERISHABLE: 'PERISHABLE' as const,
  PERSONALIZED: 'PERSONALIZED' as const,
  HOME: 'HOME' as const,
  SPORTS: 'SPORTS' as const,
  OTHER: 'OTHER' as const,
};

export type ReturnReason =
  | 'DEFECTIVE'
  | 'DAMAGED_IN_TRANSIT'
  | 'WRONG_ITEM'
  | 'NOT_AS_DESCRIBED'
  | 'CHANGED_MIND'
  | 'OTHER';
export const ReturnReason = {
  DEFECTIVE: 'DEFECTIVE' as const,
  DAMAGED_IN_TRANSIT: 'DAMAGED_IN_TRANSIT' as const,
  WRONG_ITEM: 'WRONG_ITEM' as const,
  NOT_AS_DESCRIBED: 'NOT_AS_DESCRIBED' as const,
  CHANGED_MIND: 'CHANGED_MIND' as const,
  OTHER: 'OTHER' as const,
};

export type ReturnStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REFUND_INITIATED'
  | 'REFUND_FAILED'
  | 'REFUNDED';
export const ReturnStatus = {
  SUBMITTED: 'SUBMITTED' as const,
  UNDER_REVIEW: 'UNDER_REVIEW' as const,
  APPROVED: 'APPROVED' as const,
  REJECTED: 'REJECTED' as const,
  CANCELLED: 'CANCELLED' as const,
  REFUND_INITIATED: 'REFUND_INITIATED' as const,
  REFUND_FAILED: 'REFUND_FAILED' as const,
  REFUNDED: 'REFUNDED' as const,
};

export type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export const RefundStatus = {
  PENDING: 'PENDING' as const,
  PROCESSING: 'PROCESSING' as const,
  COMPLETED: 'COMPLETED' as const,
  FAILED: 'FAILED' as const,
};
