import React from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto">
        <RotateCcw className="w-8 h-8" />
      </div>
      <h1 className="mt-4 text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="mt-2 text-base font-semibold text-slate-700">Page Not Found</h2>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    </div>
  );
};

