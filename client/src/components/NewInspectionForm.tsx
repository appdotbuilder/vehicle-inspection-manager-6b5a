import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { Vehicle, Inspector, Inspection, CreateInspectionInput } from '../../../server/src/schema';

interface NewInspectionFormProps {
  vehicles: Vehicle[];
  inspectors: Inspector[];
  onInspectionCreated: (inspection: Inspection) => void;
  onCancel: () => void;
}

export function NewInspectionForm({ vehicles, inspectors, onInspectionCreated, onCancel }: NewInspectionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateInspectionInput>({
    vehicle_id: 0,
    inspector_id: 0,
    inspection_date: new Date(),
    notes: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.vehicle_id === 0 || formData.inspector_id === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await trpc.createInspection.mutate({
        ...formData,
        notes: formData.notes || null
      });
      onInspectionCreated(response);
    } catch (error) {
      console.error('Failed to create inspection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const parseInputDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="vehicle">Vehicle</Label>
          <Select
            value={formData.vehicle_id.toString()}
            onValueChange={(value) => 
              setFormData((prev: CreateInspectionInput) => ({ ...prev, vehicle_id: parseInt(value) }))
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle: Vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                  {vehicle.make} {vehicle.model} ({vehicle.license_plate}) - {vehicle.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspector">Inspector</Label>
          <Select
            value={formData.inspector_id.toString()}
            onValueChange={(value) => 
              setFormData((prev: CreateInspectionInput) => ({ ...prev, inspector_id: parseInt(value) }))
            }
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an inspector" />
            </SelectTrigger>
            <SelectContent>
              {inspectors.map((inspector: Inspector) => (
                <SelectItem key={inspector.id} value={inspector.id.toString()}>
                  {inspector.name} ({inspector.employee_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inspection_date">Inspection Date</Label>
          <Input
            id="inspection_date"
            type="date"
            value={formatDateForInput(formData.inspection_date)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateInspectionInput) => ({ 
                ...prev, 
                inspection_date: parseInputDate(e.target.value) 
              }))
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateInspectionInput) => ({ 
                ...prev, 
                notes: e.target.value || null 
              }))
            }
            placeholder="Any additional notes or special instructions..."
            rows={3}
          />
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || formData.vehicle_id === 0 || formData.inspector_id === 0}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isLoading ? 'Creating...' : 'Create Inspection'}
        </Button>
      </DialogFooter>
    </form>
  );
}