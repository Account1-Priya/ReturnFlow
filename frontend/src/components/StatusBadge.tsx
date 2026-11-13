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
          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
          icon: Clock,
          label: status,
        };
      case 'UNDER_REVIEW':
      case 'PROCESSING':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60',
          icon: Search,
          label: status.replace('_', ' '),
        };
      case 'APPROVED':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60',
          icon: CheckCircle2,
          label: 'APPROVED',
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60',
          icon: XCircle,
          label: 'REJECTED',
        };
      case 'CANCELLED':
        return {
          bg: 'bg-slate-100 dark:bg-night-750 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-night-700',
          icon: Ban,
          label: 'CANCELLED',
        };
      case 'REFUND_INITIATED':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60',
          icon: ArrowRightLeft,
          label: 'REFUND INITIATED',
        };
      case 'REFUND_FAILED':
      case 'FAILED':
        return {
          bg: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60',
          icon: AlertCircle,
          label: 'REFUND FAILED',
        };
      case 'REFUNDED':
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
          icon: Check,
          label: status,
        };
      case 'SHIPPED':
        return {
          bg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/60',
          icon: Truck,
          label: 'SHIPPED',
        };
      case 'DELIVERED':
        return {
          bg: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-900/60',
          icon: Package,
          label: 'DELIVERED',
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-night-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-night-700',
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

