'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShiftStore, ShiftStoreInput } from '@/app/services/api';
import { getErrorMessage } from '@/app/utils/error';
import { Button, Input, Label, Modal } from '@/components/ui';

interface ShiftStoreFormProps {
  tenantName?: string;
  shiftStore?: ShiftStore;
  isOpen: boolean;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: ShiftStoreInput) => Promise<void>;
}

const toTimeInputValue = (time: string | null | undefined) => {
  if (!time) {
    return '';
  }

  const [hours = '00', minutes = '00'] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

const computeDurationMinutes = (start: string, end: string): number | null => {
  if (!start || !end) {
    return null;
  }

  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);

  if ([startHours, startMinutes, endHours, endMinutes].some((value) => Number.isNaN(value))) {
    return null;
  }

  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;

  let diff = endTotal - startTotal;
  if (diff <= 0) {
    diff += 24 * 60;
  }

  return diff;
};

const formatDurationText = (durationMinutes: number | null) => {
  if (durationMinutes === null) {
    return '--';
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || hours === 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(' ');
};

export default function ShiftStoreForm({
  tenantName,
  shiftStore,
  isOpen,
  loading,
  error,
  onClose,
  onSubmit,
}: ShiftStoreFormProps) {
  const [name, setName] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (shiftStore) {
      setName(shiftStore.name ?? '');
      setShiftStartTime(toTimeInputValue(shiftStore.shift_start_time));
      setShiftEndTime(toTimeInputValue(shiftStore.shift_end_time));
    } else {
      setName('');
      setShiftStartTime('');
      setShiftEndTime('');
    }
    setLocalError(null);
  }, [shiftStore, isOpen]);

  const durationMinutes = useMemo(
    () => computeDurationMinutes(shiftStartTime, shiftEndTime),
    [shiftStartTime, shiftEndTime],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLocalError(null);

    if (!name.trim()) {
      setLocalError('Shift name is required.');
      return;
    }

    if (!shiftStartTime || !shiftEndTime) {
      setLocalError('Both start and end times are required.');
      return;
    }

    const payload: ShiftStoreInput = {
      name: name.trim(),
      shift_start_time: shiftStartTime,
      shift_end_time: shiftEndTime,
      duration: durationMinutes ?? undefined,
    };

    try {
      await onSubmit(payload);
    } catch (submitError) {
      setLocalError(getErrorMessage(submitError, 'Failed to save shift'));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={shiftStore ? 'Edit Shift' : 'Create Shift'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {tenantName && (
          <p className="-mt-1 text-xs text-gray-500">Tenant: {tenantName}</p>
        )}

        {(localError || error) && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {localError || error}
          </div>
        )}

        <div>
          <Label htmlFor="shift-name" className="mb-2">
            Shift Name
          </Label>
          <Input
            id="shift-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Morning Shift"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="shift-start-time" className="mb-2">
              Start Time
            </Label>
            <Input
              id="shift-start-time"
              type="time"
              value={shiftStartTime}
              onChange={(e) => setShiftStartTime(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="shift-end-time" className="mb-2">
              End Time
            </Label>
            <Input
              id="shift-end-time"
              type="time"
              value={shiftEndTime}
              onChange={(e) => setShiftEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-700">Duration</span>
          <p className="mt-1 text-sm text-gray-600">
            {durationMinutes !== null
              ? `${durationMinutes} minutes (${formatDurationText(durationMinutes)})`
              : 'Set start and end times to calculate duration.'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            If end time is earlier than start time, the shift is treated as crossing midnight.
          </p>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : shiftStore ? 'Update Shift' : 'Create Shift'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
