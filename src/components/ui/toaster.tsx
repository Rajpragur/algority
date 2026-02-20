'use client';

import React from 'react';
import {
    Toaster as SonnerToaster,
    toast as sonnerToast,
} from 'sonner';
import {
    CheckCircle,
    AlertCircle,
    Info,
    AlertTriangle,
    X,
} from 'lucide-react';

import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'error' | 'warning';
type Position =
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';

interface ActionButton {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost'; // Button variant keys
}

interface ToasterProps {
    id?: string | number;
    title?: string;
    message: string;
    variant?: Variant;
    duration?: number;
    position?: Position;
    actions?: ActionButton;
    onDismiss?: () => void;
    highlightTitle?: boolean;
}

const variantStyles: Record<Variant, string> = {
    default: 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white',
    success: 'bg-emerald-500 text-white border-emerald-600 dark:border-emerald-400',
    error: 'bg-rose-500 text-white border-rose-600 dark:border-rose-400',
    warning: 'bg-amber-500 text-neutral-950 border-amber-600 dark:border-amber-400',
};

const titleColor: Record<Variant, string> = {
    default: 'text-neutral-900 dark:text-white',
    success: 'text-white',
    error: 'text-white',
    warning: 'text-neutral-950',
};

const iconColor: Record<Variant, string> = {
    default: 'text-neutral-500 dark:text-neutral-400',
    success: 'text-white opacity-90',
    error: 'text-white opacity-90',
    warning: 'text-neutral-950 opacity-90',
};

const variantIcons: Record<Variant, React.ComponentType<{ className?: string }>> = {
    default: Info,
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
};

// Custom Toast Component for rendering
const ToastContent = ({
    title,
    message,
    variant = 'default',
    actions,
    onDismiss,
    toastId,
}: ToasterProps & { toastId: string | number }) => {
    const Icon = variantIcons[variant];

    return (
        <div
            className={cn(
                'flex items-start w-full max-w-sm p-4 rounded-xl border shadow-lg pointer-events-auto',
                // Using explicit colors to ensure opacity
                variantStyles[variant]
            )}
            role="alert"
        >
            <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconColor[variant])} />

            <div className="flex-1 ml-3 mr-2 space-y-1 min-w-0">
                {title && (
                    <h3 className={cn('text-sm font-semibold leading-none', titleColor[variant])}>
                        {title}
                    </h3>
                )}
                <p className="text-sm opacity-90 leading-snug break-words">
                    {message}
                </p>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    sonnerToast.dismiss(toastId);
                    if (onDismiss) onDismiss();
                }}
                className="flex-shrink-0 -mr-2 -mt-2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400"
                aria-label="Close"
            >
                <X className="h-4 w-4 opacity-60 hover:opacity-100" />
            </button>
        </div>
    );
};

// Global toaster component to be placed in layout
export function Toaster({ position = 'bottom-right' }: { position?: Position }) {
    return (
        <SonnerToaster
            position={position}
            toastOptions={{
                unstyled: true,
                classNames: {
                    toast: 'w-full flex justify-end',
                },
            }}
        />
    );
}

// Custom toast object to replace sonner.toast
export const toast = {
    success: (message: string, options?: Omit<ToasterProps, 'message' | 'variant'>) => {
        sonnerToast.custom((id) => (
            <ToastContent
                toastId={id}
                message={message}
                variant="success"
                title={options?.title || 'Success'}
                {...options}
            />
        ), { duration: options?.duration || 4000, id: options?.id });
    },
    error: (message: string, options?: Omit<ToasterProps, 'message' | 'variant'>) => {
        sonnerToast.custom((id) => (
            <ToastContent
                toastId={id}
                message={message}
                variant="error"
                title={options?.title || 'Error'}
                {...options}
            />
        ), { duration: options?.duration || 4000, id: options?.id });
    },
    warning: (message: string, options?: Omit<ToasterProps, 'message' | 'variant'>) => {
        sonnerToast.custom((id) => (
            <ToastContent
                toastId={id}
                message={message}
                variant="warning"
                title={options?.title || 'Warning'}
                {...options}
            />
        ), { duration: options?.duration || 4000, id: options?.id });
    },
    info: (message: string, options?: Omit<ToasterProps, 'message' | 'variant'>) => {
        sonnerToast.custom((id) => (
            <ToastContent
                toastId={id}
                message={message}
                variant="default"
                title={options?.title || 'Info'}
                {...options}
            />
        ), { duration: options?.duration || 4000, id: options?.id });
    },
    dismiss: sonnerToast.dismiss,
};
