import React from 'react';
import { useAuthStore } from '../../stores/useAuthStore';

interface PermissionGateProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGate: React.FC<PermissionGateProps> = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useAuthStore();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGate;
