import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, Users, IdCard, Calendar } from 'lucide-react';
import type { Inspector, CreateInspectorInput } from '../../../server/src/schema';

export function InspectorManagement() {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInspector, setEditingInspector] = useState<Inspector | null>(null);
  const [formData, setFormData] = useState<CreateInspectorInput>({
    name: '',
    employee_id: ''
  });

  const loadInspectors = useCallback(async () => {
    try {
      const result = await trpc.getInspectors.query();
      setInspectors(result);
    } catch (error) {
      console.error('Failed to load inspectors:', error);
    }
  }, []);

  useEffect(() => {
    loadInspectors();
  }, [loadInspectors]);

  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      employee_id: ''
    });
    setEditingInspector(null);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingInspector) {
        const response = await trpc.updateInspector.mutate({
          id: editingInspector.id,
          ...formData
        });
        setInspectors((prev: Inspector[]) => 
          prev.map((i: Inspector) => i.id === editingInspector.id ? response : i)
        );
      } else {
        const response = await trpc.createInspector.mutate(formData);
        setInspectors((prev: Inspector[]) => [...prev, response]);
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save inspector:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (inspector: Inspector) => {
    setEditingInspector(inspector);
    setFormData({
      name: inspector.name,
      employee_id: inspector.employee_id
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (inspectorId: number) => {
    try {
      await trpc.deleteInspector.mutate({ id: inspectorId });
      setInspectors((prev: Inspector[]) => prev.filter((i: Inspector) => i.id !== inspectorId));
    } catch (error) {
      console.error('Failed to delete inspector:', error);
    }
  };

  const openNewInspectorDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-600" />
            Inspector Management
          </h2>
          <p className="text-gray-600 mt-1">Manage certified vehicle inspectors</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewInspectorDialog} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Inspector
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {editingInspector ? 'Edit Inspector' : 'Add New Inspector'}
              </DialogTitle>
              <DialogDescription>
                {editingInspector ? 'Update the inspector information below.' : 'Enter the details for the new inspector.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInspectorInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    value={formData.employee_id}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInspectorInput) => ({ ...prev, employee_id: e.target.value.toUpperCase() }))
                    }
                    placeholder="EMP001"
                    required
                    className="font-mono"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                  {isLoading ? 'Saving...' : (editingInspector ? 'Update Inspector' : 'Add Inspector')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {inspectors.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No inspectors yet</h3>
            <p className="text-gray-600 mb-4">Add certified inspectors to perform vehicle inspections.</p>
            <Button onClick={openNewInspectorDialog} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Inspector
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inspectors.map((inspector: Inspector) => (
            <Card key={inspector.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      👤 {inspector.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <IdCard className="w-3 h-3" />
                      {inspector.employee_id}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                  <Calendar className="w-3 h-3" />
                  Added {inspector.created_at.toLocaleDateString()}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(inspector)}
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
                        <AlertDialogTitle>Delete Inspector</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {inspector.name} ({inspector.employee_id})? 
                          This action cannot be undone. Existing inspections will remain but won't be editable.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDelete(inspector.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Inspector
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