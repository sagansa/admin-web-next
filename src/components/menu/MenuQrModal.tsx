'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, ExternalLink, QrCode } from 'lucide-react';
import { buildMenuOrderUrl, buildQrCodeImageUrl, DEFAULT_MENU_BASE_URL } from '@/app/lib/menuQr';
import { Button, Modal } from '@/components/ui';

type MenuQrModalProps = {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  storeId: string;
  storeName: string;
  tableCode?: string;
  title?: string;
};

export default function MenuQrModal({
  isOpen,
  onClose,
  tenantId,
  storeId,
  storeName,
  tableCode,
  title,
}: MenuQrModalProps) {
  const [copied, setCopied] = useState(false);

  const menuUrl = useMemo(() => buildMenuOrderUrl({
    baseUrl: DEFAULT_MENU_BASE_URL,
    tenantId,
    storeId,
    tableCode,
  }), [tenantId, storeId, tableCode]);

  const qrImageUrl = useMemo(() => buildQrCodeImageUrl(menuUrl), [menuUrl]);
  const qrTitle = title || (tableCode ? `QR Meja ${tableCode}` : 'QR Store');
  const isStoreQr = !tableCode || tableCode === 'STORE';
  const qrFileName = `${storeName}-${tableCode || 'store'}-menu-qr.svg`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={qrTitle} size="lg">
      <div className="space-y-5">
        <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">{storeName}</div>
            <div className="mt-1 text-sm text-gray-600">
              {isStoreQr ? 'Store order' : `Meja ${tableCode}`}
            </div>
          </div>
          <QrCode className="h-8 w-8 shrink-0 text-indigo-600" />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,240px)_1fr]">
          <div className="mx-auto flex aspect-square w-full max-w-[240px] items-center justify-center rounded-lg border border-gray-200 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt={qrTitle}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="grid gap-2">
              <Button type="button" variant="secondary" onClick={copyUrl}>
                <Copy className="h-4 w-4" />
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button type="button" variant="secondary" asChild>
                <a href={menuUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open
                </a>
              </Button>
              <Button type="button" asChild>
                <a href={qrImageUrl} download={qrFileName} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
