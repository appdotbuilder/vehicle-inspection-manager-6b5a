import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, Car, Calendar, Hash, FileText } from 'lucide-react';
import type { Vehicle, CreateVehicleInput } from '../../../server/src/schema';

export function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<CreateVehicleInput>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    license_plate: ''
  });

  const loadVehicles = useCallback(async () => {
    try {
      const result = await trpc.getVehicles.query();
      setVehicles(result);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const resetForm = useCallback(() => {
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      vin: '',
      license_plate: ''
    });
    setEditingVehicle(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingVehicle) {
        const response = await trpc.updateVehicle.mutate({
          id: editingVehicle.id,
          ...formData
        });
        setVehicles((prev: Vehicle[]) => 
          prev.map((v: Vehicle) => v.id === editingVehicle.id ? response : v)
        );
      } else {
        const response = await trpc.createVehicle.mutate(formData);
        setVehicles((prev: Vehicle[]) => [...prev, response]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save vehicle:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
      license_plate: vehicle.license_plate
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (vehicleId: number) => {
    try {
      await trpc.deleteVehicle.mutate({ id: vehicleId });
      setVehicles((prev: Vehicle[]) => prev.filter((v: Vehicle) => v.id !== vehicleId));
    } catch (error) {
      console.error('Failed to delete vehicle:', error);
    }
  };

  const openNewVehicleDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Car className="w-6 h-6 text-blue-600" />
            Vehicle Management
          </h2>
          <p className="text-gray-600 mt-1">Add, edit, and manage your vehicle fleet</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewVehicleDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </DialogTitle>
              <DialogDescription>
                {editingVehicle ? 'Update the vehicle information below.' : 'Enter the details for the new vehicle.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="make">Make</Label>
                    <Input
                      id="make"
                      value={formData.make}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateVehicleInput) => ({ ...prev, make: e.target.value }))
                      }
                      placeholder="Toyota, Ford, BMW..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateVehicleInput) => ({ ...prev, model: e.target.value }))
                      }
                      placeholder="Camry, F-150, X3..."
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateVehicleInput) => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))
                    }
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vin">VIN</Label>
                  <Input
                    id="vin"
                    value={formData.vin}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateVehicleInput) => ({ ...prev, vin: e.target.value.toUpperCase() }))
                    }
                    placeholder="17-character VIN"
                    maxLength={17}
                    minLength={17}
                    required
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_plate">License Plate</Label>
                  <Input
                    id="license_plate"
                    value={formData.license_plate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateVehicleInput) => ({ ...prev, license_plate: e.target.value.toUpperCase() }))
                    }
                    placeholder="ABC-1234"
                    required
                    className="font-mono"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? 'Saving...' : (editingVehicle ? 'Update Vehicle' : 'Add Vehicle')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {vehicles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vehicles yet</h3>
            <p className="text-gray-600 mb-4">Add your first vehicle to get started with inspections.</p>
            <Button onClick={openNewVehicleDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle: Vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="w-5 h-5 text-blue-600" />
                      {vehicle.make} {vehicle.model}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" />
                      {vehicle.year}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {vehicle.license_plate}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Hash className="w-3 h-3" />
                    <span className="font-mono text-xs">{vehicle.vin}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <FileText className="w-3 h-3" />
                    Added {vehicle.created_at.toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(vehicle)}
                    className="flex-1"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {vehicle.make} {vehicle.model} ({vehicle.license_plate})? 
                          This action cannot be undone and will also delete all associated inspections.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(vehicle.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Vehicle
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}