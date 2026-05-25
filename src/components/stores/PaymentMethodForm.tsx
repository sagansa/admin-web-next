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

interface PaymentMethodFormProps {
    initialData?: PaymentMethod;
    storeId: string;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
}

export default function PaymentMethodForm({
    initialData,
    storeId,
    onSubmit,
    onCancel,
}: PaymentMethodFormProps) {
    const [type, setType] = useState<'cash' | 'qris' | 'transfer' | 'debit' | 'credit' | 'online'>(
        initialData?.type || 'cash'
    );
    const [name, setName] = useState(initialData?.name || '');
    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
    const [requireProof, setRequireProof] = useState(initialData?.require_proof ?? false);
    const [details, setDetails] = useState<any>(initialData?.details || {});
    const [loading, setLoading] = useState(false);
    const [qrisFiles, setQrisFiles] = useState<any[]>([]);
    const [paymentImageFiles, setPaymentImageFiles] = useState<any[]>([]);

    // Reset details when type changes, unless it's initial load
    useEffect(() => {
        if (!initialData || initialData.type !== type) {
            if (type === 'cash') {
                setName('Tunai');
                setDetails({});
                setQrisFiles([]);
            } else if (type === 'qris') {
                setName('QRIS');
                setDetails({ qr_image: '' });
                setQrisFiles([]);
            } else if (type === 'transfer') {
                setName('Transfer Bank');
                setDetails({ bank_name: '', account_number: '', account_holder: '' });
                setQrisFiles([]);
            } else if (type === 'debit') {
                setName('Debit Card');
                setDetails({});
                setDetails({});
                setQrisFiles([]);
            } else if (type === 'online') {
                setName('Online Delivery');
                setDetails({});
                setQrisFiles([]);
            }
        }
    }, [type, initialData]);

    // Load existing QRIS image if editing
    useEffect(() => {
        if (initialData?.details?.qr_image && type === 'qris') {
            const imageUrl = initialData.details.qr_image;
            if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
                fetch(imageUrl)
                    .then(res => res.blob())
                    .then(blob => {
                        const file = new File([blob], 'qris.jpg', { type: blob.type });
                        setQrisFiles([file]);
                    })
                    .catch(() => {
                        setDetails({ ...details, qr_image: imageUrl });
                    });
            }
        }
    }, [initialData, type]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData: any = {
                store_id: storeId,
                type,
                name,
                is_active: isActive,
                require_proof: requireProof,
                details,
            };

            // Add QRIS file if present
            if (type === 'qris' && qrisFiles.length > 0) {
                submitData.details = {
                    ...details,
                    qr_image_file: qrisFiles[0],
                };
            }

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
                            onValueChange={(value) => setType(value as any)}
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
                            <Label>Upload Gambar QRIS</Label>
                            <FilePondUploader
                                files={qrisFiles}
                                onUpdateFiles={(fileItems) => {
                                    setQrisFiles(fileItems.map((fileItem) => fileItem.file));
                                }}
                                allowMultiple={false}
                                maxFiles={1}
                                acceptedFileTypes={['image/*']}
                                labelIdle='Drag & Drop gambar QRIS atau <span class="filepond--label-action">Browse</span>'
                            />
                            <p className="text-xs text-muted-foreground">
                                Upload gambar QRIS Anda (JPG, PNG, atau format gambar lainnya).
                            </p>
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
