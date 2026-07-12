import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';
import { ROUTES } from '../constants';

export default function NotFoundPage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 bg-surface-card border border-border rounded-full flex items-center justify-center mx-auto mb-5 shadow-card">
          <Compass size={24} className="text-text-secondary" />
        </div>
        <p className="text-5xl font-bold text-border mb-3">404</p>
        <h1 className="text-xl font-semibold text-text-primary mb-2">
          Page Not Found
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          The page you are looking for does not exist or has been moved.
          Check the URL or return to the dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft size={14} />}
          >
            Go Back
          </Button>
          <Button variant="primary" onClick={() => navigate(ROUTES.DASHBOARD)}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
