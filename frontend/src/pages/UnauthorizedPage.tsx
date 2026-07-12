import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui';
import { ROUTES } from '../constants';

export default function UnauthorizedPage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 bg-status-danger-bg rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={24} className="text-status-danger" />
        </div>
        <h1 className="text-xl font-semibold text-text-primary mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          You do not have the required permissions to access this page.
          Contact your system administrator if you believe this is an error.
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
        <p className="text-xs text-text-muted mt-6">Error Code: 403 Forbidden</p>
      </div>
    </div>
  );
}
