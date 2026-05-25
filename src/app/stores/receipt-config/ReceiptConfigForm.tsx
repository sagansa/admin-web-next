'use client';

import { Store } from '@/app/services/api';
import { Button } from '@/components/ui';
import { useState, useEffect } from 'react';

interface ReceiptConfigFormProps {
    selectedStores: Store[];
    isBulkMode: boolean;
    onSave: (data: ReceiptConfigData) => Promise<void>;
    loading: boolean;
}

export interface ReceiptConfigData {
    receipt_header?: string | null;
    receipt_footer?: string | null;
    email_receipt_logo?: File | null;
    print_receipt_logo?: File | null;
    address?: string | null;
    phone?: string | null;
}

export default function ReceiptConfigForm({
    selectedStores,
    isBulkMode,
    onSave,
    loading,
}: ReceiptConfigFormProps) {
    const [receiptHeader, setReceiptHeader] = useState('');
    const [receiptFooter, setReceiptFooter] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [emailLogo, setEmailLogo] = useState<File | null>(null);
    const [printLogo, setPrintLogo] = useState<File | null>(null);
    const [emailLogoPreview, setEmailLogoPreview] = useState<string | null>(null);
    const [printLogoPreview, setPrintLogoPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load data when single store is selected
    useEffect(() => {
        if (!isBulkMode && selectedStores.length === 1) {
            const store = selectedStores[0];
            setReceiptHeader(store.receipt_header || '');
            setReceiptFooter(store.receipt_footer || '');
            setAddress(store.address || '');
            setPhone(store.phone || '');
            setEmailLogo(null);
            setPrintLogo(null);
            setEmailLogoPreview(store.email_receipt_logo || null);
            setPrintLogoPreview(store.print_receipt_logo || null);
        } else if (isBulkMode) {
            // Clear form for bulk mode
            setReceiptHeader('');
            setReceiptFooter('');
            setAddress('');
            setPhone('');
            setEmailLogo(null);
            setPrintLogo(null);
            setEmailLogoPreview(null);
            setPrintLogoPreview(null);
        } else {
            // Clear form if no store or multiple stores selected without bulk mode
            setReceiptHeader('');
            setReceiptFooter('');
            setAddress('');
            setPhone('');
            setEmailLogo(null);
            setPrintLogo(null);
            setEmailLogoPreview(null);
            setPrintLogoPreview(null);
        }
    }, [selectedStores, isBulkMode]);

    const handleEmailLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setEmailLogo(file);
        if (file) {
            setEmailLogoPreview(URL.createObjectURL(file));
        } else {
            setEmailLogoPreview(null);
        }
    };

    const handlePrintLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setPrintLogo(file);
        if (file) {
            setPrintLogoPreview(URL.createObjectURL(file));
        } else {
            setPrintLogoPreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const data: ReceiptConfigData = {
            receipt_header: receiptHeader.trim() || null,
            receipt_footer: receiptFooter.trim() || null,
            address: address.trim() || null,
            phone: phone.trim() || null,
            email_receipt_logo: emailLogo,
            print_receipt_logo: printLogo,
        };

        try {
            await onSave(data);
            // Reset file previews after save
            setEmailLogoPreview(null);
            setPrintLogoPreview(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        }
    };

    if (selectedStores.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-gray-500">
                <div className="text-center">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No store selected</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Select a store from the list to edit its receipt configuration
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col">
            <div className="border-b bg-white px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Receipt Configuration</h2>
                <div className="mt-3">
                    {isBulkMode ? (
                        <div className="rounded-md bg-amber-50 px-3 py-2">
                            <p className="text-sm text-amber-800">
                                <span className="font-medium">Multi-Update Mode:</span> Editing {selectedStores.length} stores
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">
                            Editing: <span className="font-medium">{selectedStores[0].name}</span>
                        </p>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="receipt-header" className="block text-sm font-medium text-gray-700">
                                Receipt Header {isBulkMode && <span className="text-gray-500">(optional)</span>}
                            </label>
                            <textarea
                                id="receipt-header"
                                value={receiptHeader}
                                onChange={(e) => setReceiptHeader(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                                placeholder="Header text for receipts..."
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                This text will appear at the top of receipts
                            </p>
                        </div>

                        <div>
                            <label htmlFor="receipt-footer" className="block text-sm font-medium text-gray-700">
                                Receipt Footer {isBulkMode && <span className="text-gray-500">(optional)</span>}
                            </label>
                            <textarea
                                id="receipt-footer"
                                value={receiptFooter}
                                onChange={(e) => setReceiptFooter(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                                placeholder="Footer text for receipts..."
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                This text will appear at the bottom of receipts
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Store Address {isBulkMode && <span className="text-gray-500">(optional)</span>}
                            </label>
                            <textarea
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                                placeholder="Full store address..."
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone Number {isBulkMode && <span className="text-gray-500">(optional)</span>}
                            </label>
                            <input
                                id="phone"
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                                placeholder="Phone number..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Receipt Logo {isBulkMode && <span className="text-gray-500">(optional)</span>}
                            </label>
                            <label className="relative cursor-pointer block">
                                <div
                                    className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-indigo-500 transition-colors overflow-hidden bg-gray-50"
                                >
                                    {emailLogoPreview ? (
                                        <img
                                            src={emailLogoPreview}
                                            alt="Email logo preview"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <>
                                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            <p className="mt-2 text-sm text-gray-500">Click to upload</p>
                                            <p className="text-xs text-gray-400 mt-1">Square image, max 2MB</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleEmailLogoChange}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Print Receipt Logo {isBulkMode && <span className="text-gray-500">(optional)</span>}
                            </label>
                            <label className="relative cursor-pointer block">
                                <div
                                    className="w-28 h-28 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-indigo-500 transition-colors overflow-hidden bg-gray-50"
                                >
                                    {printLogoPreview ? (
                                        <img
                                            src={printLogoPreview}
                                            alt="Print logo preview"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <>
                                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                            </svg>
                                            <p className="mt-2 text-sm text-gray-500">Click to upload</p>
                                            <p className="text-xs text-gray-400 mt-1">Square image, max 2MB</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePrintLogoChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 border-t bg-gray-50 px-6 py-4">
                    <Button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : isBulkMode ? `Update ${selectedStores.length} Stores` : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
