import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VehicleManagement } from '@/components/VehicleManagement';
import { InspectorManagement } from '@/components/InspectorManagement';
import { InspectionManagement } from '@/components/InspectionManagement';
import { ReportsOverview } from '@/components/ReportsOverview';
import { Car, Users, ClipboardCheck, BarChart3 } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('vehicles');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-xl">
              🚗
            </div>
            Vehicle Inspection System
          </h1>
          <p className="text-lg text-gray-600">
            Manage vehicles, inspectors, and conduct comprehensive vehicle inspections
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow-sm">
            <TabsTrigger 
              value="vehicles" 
              className="flex items-center gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
            >
              <Car className="w-4 h-4" />
              Vehicles
            </TabsTrigger>
            <TabsTrigger 
              value="inspectors"
              className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
            >
              <Users className="w-4 h-4" />
              Inspectors
            </TabsTrigger>
            <TabsTrigger 
              value="inspections"
              className="flex items-center gap-2 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              <ClipboardCheck className="w-4 h-4" />
              Inspections
            </TabsTrigger>
            <TabsTrigger 
              value="reports"
              className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles" className="space-y-6">
            <VehicleManagement />
          </TabsContent>

          <TabsContent value="inspectors" className="space-y-6">
            <InspectorManagement />
          </TabsContent>

          <TabsContent value="inspections" className="space-y-6">
            <InspectionManagement />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;