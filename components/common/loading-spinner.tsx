    "use client";

import React from 'react';
import { IconLoader } from '@tabler/icons-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ 
  message = "Loading...", 
  size = 'md',
  className = ""
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-6', 
    lg: 'size-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-8 ${className}`}>
      <IconLoader className={`${sizeClasses[size]} animate-spin text-primary`} />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// Full page loading spinner
export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner message={message} size="lg" />
    </div>
  );
}

// Table loading spinner
export function TableLoader({ message = "Loading data..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner message={message} size="md" />
    </div>
  );
}

// Grid loading spinner
export function GridLoader({ message = "Loading rooms..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <LoadingSpinner message={message} size="lg" />
    </div>
  );
}

export default LoadingSpinner;
