'use client';

import { useState } from 'react';
import { Store } from '@/app/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';

interface TaxSettingsFormProps {
    store: Store;
    onUpdate: (data: any) => Promise<void>;
}

export default function TaxSettingsForm({ store, onUpdate }: TaxSettingsFormProps) {
    const [taxRate, setTaxRate] = useState(store.tax_rate ?? 0);
    const [taxName, setTaxName] = useState(store.tax_name || 'Pajak');
    const [taxType, setTaxType] = useState<'exclusive' | 'inclusive'>(store.tax_type || 'exclusive');

    const [serviceChargeType, setServiceChargeType] = useState<'percentage' | 'fixed'>(store.service_charge_type || 'percentage');
    const [serviceChargeRate, setServiceChargeRate] = useState(store.service_charge_rate ?? 0);
    const [serviceChargeAmount, setServiceChargeAmount] = useState(store.service_charge_amount ?? 0);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        try {
            await onUpdate({
                tax_rate: taxRate,
                tax_name: taxName,
                tax_type: taxType,
                service_charge_type: serviceChargeType,
                service_charge_rate: serviceChargeRate,
                service_charge_amount: serviceChargeAmount
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Error updating settings:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Pengaturan Pajak</h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3 space-y-2">
                        <Label htmlFor="tax_name">Nama Pajak</Label>
                        <Input
                            type="text"
                            name="tax_name"
                            id="tax_name"
                            value={taxName}
                            onChange={(e) => setTaxName(e.target.value)}
                            placeholder="Contoh: PPN, PB1"
                        />
                    </div>

                    <div className="sm:col-span-3 space-y-2">
                        <div className="flex flex-col gap-3">
                            <Label>Tipe Pajak</Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="tax_type"
                                    checked={taxType === 'inclusive'}
                                    onCheckedChange={(checked) => setTaxType(checked ? 'inclusive' : 'exclusive')}
                                />
                                <Label htmlFor="tax_type" className="font-normal cursor-pointer">
                                    {taxType === 'inclusive' ? 'Inclusive (Termasuk di harga)' : 'Exclusive (Ditambah ke total)'}
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-3 space-y-2">
                        <Label htmlFor="tax_rate">Persentase Pajak (%)</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                name="tax_rate"
                                id="tax_rate"
                                min="0"
                                max="100"
                                step="0.01"
                                value={taxRate}
                                onChange={(e) => setTaxRate(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                className="pr-12"
                                placeholder="0.00"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Biaya Layanan (Service Charge)</h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3 space-y-2">
                        <div className="flex flex-col gap-3">
                            <Label>Tipe Biaya</Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="service_charge_type"
                                    checked={serviceChargeType === 'percentage'}
                                    onCheckedChange={(checked) => setServiceChargeType(checked ? 'percentage' : 'fixed')}
                                />
                                <Label htmlFor="service_charge_type" className="font-normal cursor-pointer">
                                    {serviceChargeType === 'percentage' ? 'Persentase (%)' : 'Nominal Tetap (Rp)'}
                                </Label>
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-3 space-y-2">
                        <Label htmlFor="service_charge_value">
                            {serviceChargeType === 'percentage' ? 'Persentase (%)' : 'Nominal (Rp)'}
                        </Label>
                        <div className="relative">
                            {serviceChargeType === 'percentage' ? (
                                <>
                                    <Input
                                        type="number"
                                        name="service_charge_rate"
                                        id="service_charge_rate"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={serviceChargeRate}
                                        onChange={(e) => setServiceChargeRate(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        className="pr-12"
                                        placeholder="0.00"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">%</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">Rp</span>
                                    </div>
                                    <Input
                                        type="number"
                                        name="service_charge_amount"
                                        id="service_charge_amount"
                                        min="0"
                                        step="100"
                                        value={serviceChargeAmount}
                                        onChange={(e) => setServiceChargeAmount(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                        className="pl-12"
                                        placeholder="0"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-center space-x-3 pt-4">
                {success && (
                    <span className="text-sm text-green-600 font-medium">Berhasil disimpan!</span>
                )}
                <Button
                    type="submit"
                    disabled={loading}
                >
                    {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </Button>
            </div>
        </form>
    );
}
