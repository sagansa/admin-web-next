export const DEFAULT_MENU_BASE_URL =
  process.env.NEXT_PUBLIC_MENU_BASE_URL || 'http://localhost:3002';

type BuildMenuOrderUrlParams = {
  baseUrl: string;
  tenantId: string;
  storeId: string;
  tableCode?: string;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const normalizeBaseUrl = (value: string) => {
  const trimmed = trimTrailingSlash(value.trim() || DEFAULT_MENU_BASE_URL);
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const buildMenuOrderUrl = ({
  baseUrl,
  tenantId,
  storeId,
  tableCode,
}: BuildMenuOrderUrlParams) => {
  const url = new URL(normalizeBaseUrl(baseUrl));

  url.searchParams.set('tenantId', tenantId);
  url.searchParams.set('storeId', storeId);

  if (tableCode) {
    url.searchParams.set('tableCode', tableCode);
  }

  return url.toString();
};

export const buildQrCodeImageUrl = (data: string, size = 360) => {
  const encodedData = encodeURIComponent(data);

  return `https://api.qrserver.com/v1/create-qr-code/?format=svg&margin=14&size=${size}x${size}&data=${encodedData}`;
};
