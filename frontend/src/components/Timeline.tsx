import React from 'react';
import { StatusHistory } from '../types';
import { formatDate } from '../api/client';
import { StatusBadge } from './StatusBadge';
import { User, Shield } from 'lucide-react';

interface TimelineProps {
  history: StatusHistory[];
}

export const Timeline: React.FC<TimelineProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-night-900 rounded-lg">
        No status history recorded yet.
      </div>
    );
  }

  return (
    <div data-testid="status-timeline" className="flow-root">
      <ul className="-mb-8">
        {history.map((item, idx) => {
          const isLast = idx === history.length - 1;
          const isStaff = item.changedBy?.role === 'ADMIN';

          return (
            <li key={item.id}>
              <div className="relative pb-8">
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-night-700"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3 items-start">
                  <div>
                    <span
                      className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-night-800 ${
                        isStaff
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-700 dark:bg-slate-600 text-white'
                      }`}
                    >
                      {isStaff ? (
                        <Shield className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.toStatus} size="sm" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          by {item.changedBy?.name || 'System'}{' '}
                          {isStaff && (
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">(Admin)</span>
                          )}
                        </span>
                      </div>
                      <time className="text-xs text-slate-400">
                        {formatDate(item.changedAt)}
                      </time>
                    </div>
                    {item.note && (
                      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-night-900 p-3 rounded-md border border-slate-100 dark:border-night-700">
                        {item.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

