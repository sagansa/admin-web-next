'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';

interface VariantGroupModalProps {
    isOpen: boolean;
    group: { name: string; variants: string[] } | null;
    onSave: (name: string, variants: string[]) => void;
    onClose: () => void;
}

export function VariantGroupModal({ isOpen, group, onSave, onClose }: VariantGroupModalProps) {
    const [groupName, setGroupName] = useState('');
    const [variantTags, setVariantTags] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen && group) {
            setGroupName(group.name);
            setVariantTags(group.variants);
        } else if (isOpen && !group) {
            setGroupName('');
            setVariantTags([]);
        }
    }, [isOpen, group]);

    const handleSave = () => {
        const trimmedName = groupName.trim();
        if (!trimmedName || variantTags.length === 0) {
            return;
        }
        onSave(trimmedName, variantTags);
        handleClose();
    };

    const handleClose = () => {
        setGroupName('');
        setVariantTags([]);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {group ? 'Edit Variant Group' : 'Add Variant Group'}
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Group Name
                        </label>
                        <Input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="e.g. Size, Color, Level"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Option Values
                        </label>
                        <TagInput
                            tags={variantTags}
                            onChange={setVariantTags}
                            placeholder="Type option name and press Enter (e.g. Small, Medium, Large)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Press Enter to add each option. Press Backspace to remove last.
                        </p>
                    </div>

                    {variantTags.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-700">
                                ✨ <strong>{variantTags.length} options</strong> will create combinations with other groups
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button
                        type="button"
                        onClick={handleClose}
                        className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={!groupName.trim() || variantTags.length === 0}
                        className="bg-amber-600 text-white hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {group ? 'Update' : 'Add'} Group
                    </Button>
                </div>
            </div>
        </div>
    );
}
