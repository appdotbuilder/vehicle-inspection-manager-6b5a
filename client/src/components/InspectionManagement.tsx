import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { Plus, ClipboardCheck, Calendar, User, Car, CheckCircle, XCircle } from 'lucide-react';
import { NewInspectionForm } from '@/components/NewInspectionForm';
import { InspectionDetails } from '@/components/InspectionDetails';
import type { Inspection, Vehicle, Inspector } from '../../../server/src/schema';

export function InspectionManagement() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadInspections = useCallback(async () => {
    try {
      const result = await trpc.getInspections.query();
      setInspections(result);
    } catch (error) {
      console.error('Failed to load inspections:', error);
    }
  }, []);

  const loadVehicles = useCallback(async () => {
    try {
      const result = await trpc.getVehicles.query();
      setVehicles(result);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  }, []);

  const loadInspectors = useCallback(async () => {
    try {
      const result = await trpc.getInspectors.query();
      setInspectors(result);
    } catch (error) {
      console.error('Failed to load inspectors:', error);
    }
  }, []);

  useEffect(() => {
    loadInspections();
    loadVehicles();
    loadInspectors();
  }, [loadInspections, loadVehicles, loadInspectors]);

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find((v: Vehicle) => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})` : 'Unknown Vehicle';
  };

  const getInspectorInfo = (inspectorId: number) => {
    const inspector = inspectors.find((i: Inspector) => i.id === inspectorId);
    return inspector ? inspector.name : 'Unknown Inspector';
  };

  const filteredInspections = inspections.filter((inspection: Inspection) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'completed') return inspection.completed;
    if (filterStatus === 'pending') return !inspection.completed;
    return true;
  });

  const handleInspectionCreated = (newInspection: Inspection) => {
    setInspections((prev: Inspection[]) => [newInspection, ...prev]);
    setIsNewInspectionOpen(false);
  };

  const getStatusIcon = (completed: boolean) => {
    if (completed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    return <XCircle className="w-4 h-4 text-orange-500" />;
  };

  const getStatusBadge = (completed: boolean) => {
    if (completed) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
    }
    return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-purple-600" />
            Inspection Management
          </h2>
          <p className="text-gray-600 mt-1">Conduct and manage vehicle inspections</p>
        </div>
        
        <Dialog open={isNewInspectionOpen} onOpenChange={setIsNewInspectionOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={vehicles.length === 0 || inspectors.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Inspection
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Inspection</DialogTitle>
              <DialogDescription>
                Start a new vehicle inspection by selecting a vehicle and inspector.
              </DialogDescription>
            </DialogHeader>
            <NewInspectionForm
              vehicles={vehicles}
              inspectors={inspectors}
              onInspectionCreated={handleInspectionCreated}
              onCancel={() => setIsNewInspectionOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {vehicles.length === 0 || inspectors.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Setup Required</h3>
            <p className="text-gray-600 mb-4">
              You need at least one vehicle and one inspector before creating inspections.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              {vehicles.length === 0 && <p>• Add vehicles in the Vehicles tab</p>}
              {inspectors.length === 0 && <p>• Add inspectors in the Inspectors tab</p>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list">All Inspections</TabsTrigger>
            {selectedInspectionId && <TabsTrigger value="details">Inspection Details</TabsTrigger>}
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex gap-4 items-center">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Inspections</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredInspections.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {filterStatus === 'all' ? 'No inspections yet' : `No ${filterStatus} inspections`}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {filterStatus === 'all' 
                      ? 'Start your first vehicle inspection to ensure safety and compliance.'
                      : `Try changing the filter or create a new inspection.`
                    }
                  </p>
                  {filterStatus === 'all' && (
                    <Button onClick={() => setIsNewInspectionOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Start First Inspection
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredInspections.map((inspection: Inspection) => (
                  <Card 
                    key={inspection.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedInspectionId(inspection.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {getStatusIcon(inspection.completed)}
                            Inspection #{inspection.id}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              {getVehicleInfo(inspection.vehicle_id)}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {getInspectorInfo(inspection.inspector_id)}
                            </span>
                          </CardDescription>
                        </div>
                        {getStatusBadge(inspection.completed)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {inspection.inspection_date.toLocaleDateString()}
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                      {inspection.notes && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          📝 {inspection.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {selectedInspectionId && (
            <TabsContent value="details">
              <InspectionDetails 
                inspectionId={selectedInspectionId}
                onClose={() => setSelectedInspectionId(null)}
              />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}