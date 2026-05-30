'use client';

import { useState, useEffect } from 'react';
import { PaymentMethod } from '@/app/services/api';
import { FilePondUploader } from '@/components/ui/FilePondUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { QRIS_ADDITIONAL_DATA_DISPLAY_LABELS, getQrisSummaryItems, parseQrisPayload } from '@/app/lib/qris';

type BrowserWithBarcodeDetector = Window & {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
        detect: (image: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
    };
};

type PaymentMethodType = PaymentMethod['type'];

type PaymentMethodDetails = Record<string, unknown> & {
    image?: string;
    qr_image?: string;
    qris_payload?: string;
    bank_name?: string;
    account_number?: string;
    account_holder?: string;
    payment_image?: unknown;
};

interface PaymentMethodSubmitData {
    store_id: string;
    type: PaymentMethodType;
    name: string;
    is_active: boolean;
    require_proof: boolean;
    details: PaymentMethodDetails;
}

interface PaymentMethodFormProps {
    initialData?: PaymentMethod;
    storeId: string;
    onSubmit: (data: PaymentMethodSubmitData) => Promise<void>;
    onCancel: () => void;
}

export default function PaymentMethodForm({
    initialData,
    storeId,
    onSubmit,
    onCancel,
}: PaymentMethodFormProps) {
    const [type, setType] = useState<PaymentMethodType>(
        initialData?.type || 'cash'
    );
    const [name, setName] = useState(initialData?.name || '');
    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
    const [requireProof, setRequireProof] = useState(initialData?.require_proof ?? false);
    const [details, setDetails] = useState<PaymentMethodDetails>((initialData?.details || {}) as PaymentMethodDetails);
    const [loading, setLoading] = useState(false);
    const [paymentImageFiles, setPaymentImageFiles] = useState<unknown[]>([]);
    const [qrisReadStatus, setQrisReadStatus] = useState<string>('');
    const qrisData = parseQrisPayload(details?.qris_payload);
    const qrisSummaryItems = getQrisSummaryItems(details?.qris_payload);

    // Reset details when type changes, unless it's initial load
    useEffect(() => {
        if (!initialData || initialData.type !== type) {
            if (type === 'cash') {
                setName('Tunai');
                setDetails({});
            } else if (type === 'qris') {
                setName('QRIS');
                setDetails({});
                setQrisReadStatus('');
            } else if (type === 'transfer') {
                setName('Transfer Bank');
                setDetails({ bank_name: '', account_number: '', account_holder: '' });
            } else if (type === 'debit') {
                setName('Debit Card');
                setDetails({});
                setDetails({});
            } else if (type === 'online') {
                setName('Online Delivery');
                setDetails({});
            }
        }
    }, [type, initialData]);

    // Load existing Payment Image if editing
    useEffect(() => {
        if (initialData?.details?.image) {
            const imageUrl = initialData.details.image;
            if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
                fetch(imageUrl)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], 'payment_image.jpg', { type: blob.type });
                        setPaymentImageFiles([file]);
                    })
                    .catch(() => {
                        // If fetch fails (e.g. CORS), just keep the URL in details but don't populate filepond
                        // FilePond might need initialFiles prop if we want to show it, but here we just rely on state
                    });
            }
        }
    }, [initialData]);

    const readQrisPayload = async (file: File) => {
        const BarcodeDetector = (window as BrowserWithBarcodeDetector).BarcodeDetector;

        if (!BarcodeDetector) {
            setQrisReadStatus('Browser belum mendukung pembacaan QR otomatis. Gunakan browser yang mendukung BarcodeDetector untuk membaca data QRIS.');
            return;
        }

        try {
            setQrisReadStatus('Membaca data QRIS...');
            const detector = new BarcodeDetector({ formats: ['qr_code'] });
            const bitmap = await createImageBitmap(file);
            const codes = await detector.detect(bitmap);
            bitmap.close();

            const payload = codes[0]?.rawValue?.trim();

            if (!payload) {
                setQrisReadStatus('QR tidak terbaca. Coba upload gambar QRIS yang lebih jelas.');
                return;
            }

            setDetails((current) => {
                const next = { ...current };
                delete next.qr_image;

                return {
                    ...next,
                    qris_payload: payload,
                };
            });
            setQrisReadStatus('Data QRIS berhasil dibaca. POS akan menampilkan QR dinamis sesuai nominal.');
        } catch (error) {
            console.error('Failed to read QRIS image:', error);
            setQrisReadStatus('QR tidak terbaca. Coba upload ulang dengan gambar yang lebih jelas.');
        }
    };

    const handleQrisFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        const file = input.files?.[0];

        if (!file) {
            return;
        }

        await readQrisPayload(file);
        input.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData: PaymentMethodSubmitData = {
                store_id: storeId,
                type,
                name,
                is_active: isActive,
                require_proof: requireProof,
                details,
            };

            // Add Payment Image file if present
            if (paymentImageFiles.length > 0) {
                submitData.details = {
                    ...submitData.details,
                    payment_image: paymentImageFiles[0],
                };
            }

            await onSubmit(submitData);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{initialData ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}</CardTitle>
                    <CardDescription>
                        Kelola metode pembayaran yang tersedia untuk toko ini
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipe Pembayaran</Label>
                        <Select
                            value={type}
                            onValueChange={(value) => setType(value as PaymentMethodType)}
                            disabled={!!initialData}
                        >
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Pilih tipe pembayaran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Tunai (Cash)</SelectItem>
                                <SelectItem value="qris">QRIS</SelectItem>
                                <SelectItem value="transfer">Transfer Bank</SelectItem>
                                <SelectItem value="debit">Debit Card</SelectItem>
                                <SelectItem value="credit">Credit Card</SelectItem>
                                <SelectItem value="online">Online Delivery</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Tampilan</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Contoh: Tunai, QRIS BCA, Transfer BCA"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Logo Metode Pembayaran (Opsional)</Label>
                        <FilePondUploader
                            files={paymentImageFiles}
                            onUpdateFiles={(fileItems) => {
                                setPaymentImageFiles(fileItems.map((fileItem) => fileItem.file));
                            }}
                            allowMultiple={false}
                            maxFiles={1}
                            acceptedFileTypes={['image/*']}
                            labelIdle='Drag & Drop logo atau <span class="filepond--label-action">Browse</span>'
                        />
                        <p className="text-xs text-muted-foreground">
                            Upload logo metode pembayaran (JPG, PNG). Akan ditampilkan di POS.
                        </p>
                    </div>

                    {type === 'qris' && (
                        <div className="space-y-2">
                            <Label htmlFor="qris_reader">Baca Data QRIS</Label>
                            <Input
                                id="qris_reader"
                                type="file"
                                accept="image/*"
                                onChange={handleQrisFileChange}
                            />
                            <p className="text-xs text-muted-foreground">
                                Gambar hanya dipakai sementara untuk membaca payload QRIS. Setelah terbaca, file langsung dikosongkan dan tidak ikut disimpan.
                            </p>
                            {qrisReadStatus && (
                                <p className="text-xs text-muted-foreground">
                                    {qrisReadStatus}
                                </p>
                            )}
                            {qrisData && (
                                <div className="rounded-md border bg-muted/20 p-4">
                                    <div className="mb-3">
                                        <p className="text-sm font-medium">Detail Data QRIS</p>
                                        <p className="text-xs text-muted-foreground">
                                            Data berikut dibaca otomatis dari payload QRIS.
                                        </p>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {qrisSummaryItems.map((item) => (
                                            <div key={item.label} className="space-y-1">
                                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                                <p className="break-words text-sm font-medium">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {qrisData.additionalData && Object.keys(qrisData.additionalData).length > 0 && (
                                        <div className="mt-4 border-t pt-3">
                                            <p className="mb-2 text-xs font-medium text-muted-foreground">Data Tambahan</p>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                {Object.entries(qrisData.additionalData).map(([key, value]) => (
                                                    value ? (
                                                        <div key={key} className="text-sm">
                                                            <span className="text-muted-foreground">
                                                                {QRIS_ADDITIONAL_DATA_DISPLAY_LABELS[key as keyof typeof QRIS_ADDITIONAL_DATA_DISPLAY_LABELS] || key}: </span>
                                                            <span className="break-words font-medium">{value}</span>
                                                        </div>
                                                    ) : null
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="mt-4 border-t pt-3">
                                        <p className="mb-1 text-xs font-medium text-muted-foreground">Payload QRIS</p>
                                        <p className="max-h-24 overflow-auto break-all rounded bg-background p-2 text-xs">
                                            {qrisData.rawPayload}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {type === 'transfer' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bank_name">Nama Bank</Label>
                                <Input
                                    id="bank_name"
                                    type="text"
                                    value={details.bank_name || ''}
                                    onChange={(e) => setDetails({ ...details, bank_name: e.target.value })}
                                    placeholder="BCA, Mandiri, BNI, dll"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account_number">Nomor Rekening</Label>
                                <Input
                                    id="account_number"
                                    type="text"
                                    value={details.account_number || ''}
                                    onChange={(e) => setDetails({ ...details, account_number: e.target.value })}
                                    placeholder="1234567890"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account_holder">Atas Nama</Label>
                                <Input
                                    id="account_holder"
                                    type="text"
                                    value={details.account_holder || ''}
                                    onChange={(e) => setDetails({ ...details, account_holder: e.target.value })}
                                    placeholder="Nama pemilik rekening"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="is_active">Status Aktif</Label>
                                <p className="text-sm text-muted-foreground">
                                    Metode pembayaran ini akan tersedia untuk digunakan
                                </p>
                            </div>
                            <Switch
                                id="is_active"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="require_proof">Wajib Bukti Bayar</Label>
                                <p className="text-sm text-muted-foreground">
                                    Kasir harus upload bukti pembayaran
                                </p>
                            </div>
                            <Switch
                                id="require_proof"
                                checked={requireProof}
                                onCheckedChange={setRequireProof}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={onCancel}
                            variant="outline"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
