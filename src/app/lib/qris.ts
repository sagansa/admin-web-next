export interface QrisTag {
  id: string;
  length: number;
  value: string;
  children?: QrisTag[];
}

export interface QrisParsedData {
  pointOfInitiationMethod?: string;
  pointOfInitiationLabel: string;
  merchantName?: string;
  merchantCity?: string;
  postalCode?: string;
  countryCode?: string;
  currency?: string;
  amount?: string;
  merchantCategoryCode?: string;
  crc?: string;
  merchantAccountInfo: Array<{
    id: string;
    gui?: string;
    merchantPan?: string;
    merchantId?: string;
    criteria?: string;
    raw: string;
  }>;
  additionalData?: {
    billNumber?: string;
    mobileNumber?: string;
    storeLabel?: string;
    loyaltyNumber?: string;
    referenceLabel?: string;
    customerLabel?: string;
    terminalLabel?: string;
    purpose?: string;
  };
  tags: QrisTag[];
  rawPayload: string;
}

const CURRENCY_LABELS: Record<string, string> = {
  '360': 'IDR',
};

const POINT_OF_INITIATION_LABELS: Record<string, string> = {
  '11': 'Statis',
  '12': 'Dinamis',
};

const ADDITIONAL_DATA_LABELS: Record<string, keyof NonNullable<QrisParsedData['additionalData']>> = {
  '01': 'billNumber',
  '02': 'mobileNumber',
  '03': 'storeLabel',
  '04': 'loyaltyNumber',
  '05': 'referenceLabel',
  '06': 'customerLabel',
  '07': 'terminalLabel',
  '08': 'purpose',
};

export const QRIS_ADDITIONAL_DATA_DISPLAY_LABELS: Record<keyof NonNullable<QrisParsedData['additionalData']>, string> = {
  billNumber: 'Nomor Tagihan',
  mobileNumber: 'Nomor HP',
  storeLabel: 'Label Toko',
  loyaltyNumber: 'Nomor Loyalty',
  referenceLabel: 'Referensi',
  customerLabel: 'Pelanggan',
  terminalLabel: 'Terminal',
  purpose: 'Tujuan',
};

function parseTags(payload: string): QrisTag[] {
  const tags: QrisTag[] = [];
  let offset = 0;

  while (offset < payload.length) {
    const id = payload.slice(offset, offset + 2);
    const lengthText = payload.slice(offset + 2, offset + 4);
    const length = Number(lengthText);
    const valueStart = offset + 4;
    const valueEnd = valueStart + length;

    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(lengthText) || valueEnd > payload.length) {
      break;
    }

    tags.push({
      id,
      length,
      value: payload.slice(valueStart, valueEnd),
    });

    offset = valueEnd;
  }

  return tags;
}

function tagValue(tags: QrisTag[], id: string) {
  return tags.find((tag) => tag.id === id)?.value;
}

function parseNestedTag(tag: QrisTag): QrisTag {
  const children = parseTags(tag.value);

  if (children.length === 0) {
    return tag;
  }

  const parsedLength = children.reduce((total, child) => total + 4 + child.length, 0);

  return parsedLength === tag.value.length ? { ...tag, children } : tag;
}

export function parseQrisPayload(payload?: string | null): QrisParsedData | null {
  const rawPayload = payload?.trim();

  if (!rawPayload) {
    return null;
  }

  const tags = parseTags(rawPayload).map((tag) => {
    if ((tag.id >= '26' && tag.id <= '51') || tag.id === '62') {
      return parseNestedTag(tag);
    }

    return tag;
  });

  if (tags.length === 0) {
    return null;
  }

  const merchantAccountInfo = tags
    .filter((tag) => tag.id >= '26' && tag.id <= '51')
    .map((tag) => ({
      id: tag.id,
      gui: tagValue(tag.children || [], '00'),
      merchantPan: tagValue(tag.children || [], '01'),
      merchantId: tagValue(tag.children || [], '02') || tagValue(tag.children || [], '03'),
      criteria: tagValue(tag.children || [], '03'),
      raw: tag.value,
    }));

  const additionalTag = tags.find((tag) => tag.id === '62');
  const additionalData = additionalTag?.children?.reduce<QrisParsedData['additionalData']>((result, child) => {
    const key = ADDITIONAL_DATA_LABELS[child.id];

    if (key) {
      return {
        ...result,
        [key]: child.value,
      };
    }

    return result;
  }, {});

  const pointOfInitiationMethod = tagValue(tags, '01');
  const currency = tagValue(tags, '53');

  return {
    pointOfInitiationMethod,
    pointOfInitiationLabel: POINT_OF_INITIATION_LABELS[pointOfInitiationMethod || ''] || 'Tidak diketahui',
    merchantName: tagValue(tags, '59'),
    merchantCity: tagValue(tags, '60'),
    postalCode: tagValue(tags, '61'),
    countryCode: tagValue(tags, '58'),
    currency: currency ? CURRENCY_LABELS[currency] || currency : undefined,
    amount: tagValue(tags, '54'),
    merchantCategoryCode: tagValue(tags, '52'),
    crc: tagValue(tags, '63'),
    merchantAccountInfo,
    additionalData,
    tags,
    rawPayload,
  };
}

export function getQrisSummaryItems(payload?: string | null) {
  const data = parseQrisPayload(payload);

  if (!data) {
    return [];
  }

  const primaryAccount = data.merchantAccountInfo[0];

  return [
    { label: 'Merchant', value: data.merchantName },
    { label: 'Kota', value: data.merchantCity },
    { label: 'Tipe QR', value: data.pointOfInitiationLabel },
    { label: 'Mata Uang', value: data.currency },
    { label: 'NMID/MPAN', value: primaryAccount?.merchantPan || primaryAccount?.merchantId },
    { label: 'Acquirer', value: primaryAccount?.gui },
    { label: 'MCC', value: data.merchantCategoryCode },
    { label: 'CRC', value: data.crc },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));
}
