import React from 'react';
import { ReturnStatus, OrderStatus, RefundStatus } from '../types';
import {
  Clock,
  Search,
  CheckCircle2,
  XCircle,
  Ban,
  ArrowRightLeft,
  AlertCircle,
  Check,
  Truck,
  Package,
} from 'lucide-react';

interface StatusBadgeProps {
  status: ReturnStatus | OrderStatus | RefundStatus | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'SUBMITTED':
      case 'PENDING':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          label: status,
        };
      case 'UNDER_REVIEW':
      case 'PROCESSING':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Search,
          label: status.replace('_', ' '),
        };
      case 'APPROVED':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: CheckCircle2,
          label: 'APPROVED',
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
          label: 'REJECTED',
        };
      case 'CANCELLED':
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: Ban,
          label: 'CANCELLED',
        };
      case 'REFUND_INITIATED':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: ArrowRightLeft,
          label: 'REFUND INITIATED',
        };
      case 'REFUND_FAILED':
      case 'FAILED':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: AlertCircle,
          label: 'REFUND FAILED',
        };
      case 'REFUNDED':
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: Check,
          label: status,
        };
      case 'SHIPPED':
        return {
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          icon: Truck,
          label: 'SHIPPED',
        };
      case 'DELIVERED':
        return {
          bg: 'bg-green-50 text-green-700 border-green-200',
          icon: Package,
          label: 'DELIVERED',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: Clock,
          label: status,
        };
    }
  };

  const { bg, icon: Icon, label } = getBadgeConfig();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      data-testid="status-badge"
      data-status={status}
      className={`inline-flex items-center rounded-full border ${bg} ${sizeClasses} ${className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
};

