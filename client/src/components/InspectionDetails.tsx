import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { ArrowLeft, CheckCircle, XCircle, Minus, Plus, Save, Calendar, User, Car } from 'lucide-react';
import type { InspectionWithDetails, InspectionItem, InspectionItemStatus } from '../../../server/src/schema';

interface InspectionDetailsProps {
  inspectionId: number;
  onClose: () => void;
}

const INSPECTION_ITEMS = [
  'Engine',
  'Brakes',
  'Headlights',
  'Taillights',
  'Turn Signals',
  'Tires - Front Left',
  'Tires - Front Right', 
  'Tires - Rear Left',
  'Tires - Rear Right',
  'Windshield',
  'Side Mirrors',
  'Seat Belts',
  'Horn',
  'Exhaust System',
  'Battery',
  'Wipers',
  'Interior Condition',
  'Body Condition',
  'Registration/Documentation'
];

export function InspectionDetails({ inspectionId, onClose }: InspectionDetailsProps) {
  const [inspection, setInspection] = useState<InspectionWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddItemsOpen, setIsAddItemsOpen] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [newItems, setNewItems] = useState<Array<{item_name: string, status: InspectionItemStatus, comments: string | null}>>([]);

  const loadInspectionDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getInspectionDetails.query({ inspection_id: inspectionId });
      if (result) {
        setInspection(result);
        setNotes(result.notes || '');
      }
    } catch (error) {
      console.error('Failed to load inspection details:', error);
    } finally {
      setIsLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    loadInspectionDetails();
  }, [loadInspectionDetails]);

  const handleUpdateInspectionItem = async (itemId: number, status: InspectionItemStatus, comments: string | null) => {
    try {
      await trpc.updateInspectionItem.mutate({
        id: itemId,
        status,
        comments: comments || null
      });
      
      // Update local state
      if (inspection) {
        const updatedItems = inspection.items.map((item: InspectionItem) =>
          item.id === itemId ? { ...item, status, comments: comments || null } : item
        );
        setInspection({ ...inspection, items: updatedItems });
      }
    } catch (error) {
      console.error('Failed to update inspection item:', error);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await trpc.updateInspection.mutate({
        id: inspectionId,
        notes: notes || null
      });
      
      if (inspection) {
        setInspection({ ...inspection, notes: notes || null });
      }
    } catch (error) {
      console.error('Failed to update notes:', error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddItems = () => {
    if (!inspection) return;
    
    const existingItemNames = new Set(inspection.items.map((item: InspectionItem) => item.item_name));
    const availableItems = INSPECTION_ITEMS.filter(item => !existingItemNames.has(item));
    
    if (availableItems.length > 0) {
      setNewItems([{
        item_name: availableItems[0],
        status: 'not_applicable' as InspectionItemStatus,
        comments: null
      }]);
      setIsAddItemsOpen(true);
    }
  };

  const handleSubmitNewItems = async () => {
    try {
      await trpc.createInspectionItems.mutate({
        inspection_id: inspectionId,
        items: newItems
      });
      
      // Reload inspection details to get the updated items
      await loadInspectionDetails();
      setIsAddItemsOpen(false);
      setNewItems([]);
    } catch (error) {
      console.error('Failed to add inspection items:', error);
    }
  };

  const addNewItemRow = () => {
    if (!inspection) return;
    
    const existingItemNames = new Set([
      ...inspection.items.map((item: InspectionItem) => item.item_name),
      ...newItems.map(item => item.item_name)
    ]);
    const availableItems = INSPECTION_ITEMS.filter(item => !existingItemNames.has(item));
    
    if (availableItems.length > 0) {
      setNewItems([...newItems, {
        item_name: availableItems[0],
        status: 'not_applicable' as InspectionItemStatus,
        comments: null
      }]);
    }
  };

  const removeNewItemRow = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const updateNewItem = (index: number, field: string, value: string | InspectionItemStatus) => {
    const updated = [...newItems];
    updated[index] = { ...updated[index], [field]: value };
    setNewItems(updated);
  };



  const isCompleted = inspection?.items.every((item: InspectionItem) => item.status !== 'not_applicable') || false;

  if (isLoading || !inspection) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inspection details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">Inspection #{inspection.id}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
            <span className="flex items-center gap-1">
              <Car className="w-3 h-3" />
              {inspection.vehicle.make} {inspection.vehicle.model} ({inspection.vehicle.license_plate})
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {inspection.inspector.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {inspection.inspection_date.toLocaleDateString()}
            </span>
          </div>
        </div>
        <Badge variant={isCompleted ? "default" : "secondary"} className={isCompleted ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
          {isCompleted ? 'Completed' : 'In Progress'}
        </Badge>
      </div>

      {/* Inspection Items */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Inspection Checklist</CardTitle>
              <CardDescription>Review and update the status of each inspection item</CardDescription>
            </div>
            <Dialog open={isAddItemsOpen} onOpenChange={setIsAddItemsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleAddItems}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Items
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Inspection Items</DialogTitle>
                  <DialogDescription>
                    Add new items to this inspection checklist.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {newItems.map((item, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label>Item</Label>
                        <Select
                          value={item.item_name || INSPECTION_ITEMS[0]}
                          onValueChange={(value) => updateNewItem(index, 'item_name', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INSPECTION_ITEMS.filter(availableItem => 
                              !inspection.items.some((existingItem: InspectionItem) => existingItem.item_name === availableItem) &&
                              !newItems.some((newItem, i) => i !== index && newItem.item_name === availableItem)
                            ).map((availableItem) => (
                              <SelectItem key={availableItem} value={availableItem}>
                                {availableItem}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Label>Status</Label>
                        <Select
                          value={item.status}
                          onValueChange={(value: InspectionItemStatus) => updateNewItem(index, 'status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="fail">Fail</SelectItem>
                            <SelectItem value="not_applicable">N/A</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeNewItemRow(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addNewItemRow}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Item
                  </Button>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddItemsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitNewItems} disabled={newItems.length === 0}>
                    Add Items
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {inspection.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No inspection items yet. Add some items to get started.</p>
            </div>
          ) : (
            inspection.items.map((item: InspectionItem) => (
              <InspectionItemRow
                key={item.id}
                item={item}
                onUpdate={handleUpdateInspectionItem}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Notes</CardTitle>
          <CardDescription>Additional observations and comments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Enter any additional notes, observations, or recommendations..."
            rows={4}
          />
          <Button 
            onClick={handleSaveNotes} 
            disabled={isSavingNotes}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSavingNotes ? 'Saving...' : 'Save Notes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface InspectionItemRowProps {
  item: InspectionItem;
  onUpdate: (itemId: number, status: InspectionItemStatus, comments: string | null) => void;
}

function InspectionItemRow({ item, onUpdate }: InspectionItemRowProps) {
  const [localComments, setLocalComments] = useState(item.comments || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (status: InspectionItemStatus) => {
    setIsUpdating(true);
    await onUpdate(item.id, status, localComments || null);
    setIsUpdating(false);
  };

  const handleCommentsBlur = async () => {
    if (localComments !== (item.comments || '')) {
      setIsUpdating(true);
      await onUpdate(item.id, item.status, localComments || null);
      setIsUpdating(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {getStatusIcon(item.status)}
          <h4 className="font-medium">{item.item_name}</h4>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={item.status}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pass">Pass</SelectItem>
              <SelectItem value="fail">Fail</SelectItem>
              <SelectItem value="not_applicable">N/A</SelectItem>
            </SelectContent>
          </Select>
          {getStatusBadge(item.status)}
        </div>
      </div>
      
      <Textarea
        value={localComments}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLocalComments(e.target.value)}
        onBlur={handleCommentsBlur}
        placeholder="Add comments or notes for this item..."
        rows={2}
        className="text-sm"
      />
    </div>
  );
}

function getStatusIcon(status: InspectionItemStatus) {
  switch (status) {
    case 'pass': return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'fail': return <XCircle className="w-4 h-4 text-red-600" />;
    case 'not_applicable': return <Minus className="w-4 h-4 text-gray-400" />;
    default: return <Minus className="w-4 h-4 text-gray-400" />;
  }
}

function getStatusBadge(status: InspectionItemStatus) {
  switch (status) {
    case 'pass': 
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pass</Badge>;
    case 'fail': 
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Fail</Badge>;
    case 'not_applicable': 
      return <Badge variant="secondary">N/A</Badge>;
    default: 
      return <Badge variant="secondary">N/A</Badge>;
  }
}