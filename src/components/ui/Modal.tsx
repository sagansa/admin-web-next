'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
}: ModalProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen || !mounted) return null;

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'max-w-sm';
            case 'md':
                return 'max-w-md';
            case 'lg':
                return 'max-w-lg';
            case 'xl':
                return 'max-w-xl';
            case 'full':
                return 'max-w-full mx-4';
            default:
                return 'max-w-md';
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />

            <div
                className={`relative bg-white rounded-lg shadow-xl w-full ${getSizeClasses()} transform transition-all flex flex-col max-h-[90vh]`}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={handleKeyDown}
                tabIndex={-1}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    <button
                        type="button"
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={onClose}
                    >
                        <span className="sr-only">Close</span>
                        <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>

                <div className="px-6 py-4 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
