import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { BarChart3, TrendingUp, Clock, CheckCircle, Calendar, User, FileText } from 'lucide-react';
import type { InspectionReport } from '../../../server/src/schema';

export function ReportsOverview() {
  const [report, setReport] = useState<InspectionReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getInspectionReport.query();
      setReport(result);
    } catch (error) {
      console.error('Failed to load inspection report:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Data</h3>
          <p className="text-gray-600">Unable to load inspection reports at this time.</p>
          <Button onClick={loadReport} variant="outline" className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const completionRate = report.total_inspections > 0 
    ? Math.round((report.completed_inspections / report.total_inspections) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-orange-600" />
          Reports & Analytics
        </h2>
        <p className="text-gray-600 mt-1">Overview of inspection performance and statistics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Total Inspections
            </CardDescription>
            <CardTitle className="text-2xl text-blue-700">
              {report.total_inspections}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Completed
            </CardDescription>
            <CardTitle className="text-2xl text-green-700">
              {report.completed_inspections}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              Pending
            </CardDescription>
            <CardTitle className="text-2xl text-orange-700">
              {report.pending_inspections}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Completion Rate
            </CardDescription>
            <CardTitle className="text-2xl text-purple-700">
              {completionRate}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Inspection Progress</CardTitle>
          <CardDescription>Visual overview of inspection completion status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{completionRate}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">{report.completed_inspections}</div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-700">{report.pending_inspections}</div>
                <div className="text-sm text-orange-600">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Inspections */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inspections</CardTitle>
          <CardDescription>Latest inspection activities</CardDescription>
        </CardHeader>
        <CardContent>
          {report.recent_inspections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p>No recent inspections to display</p>
            </div>
          ) : (
            <div className="space-y-4">
              {report.recent_inspections.slice(0, 5).map((inspection) => (
                <div key={inspection.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        #{inspection.id}
                      </Badge>
                      <span className="font-medium">
                        {inspection.vehicle.make} {inspection.vehicle.model}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {inspection.vehicle.license_plate}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
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
                  <Badge 
                    className={inspection.completed 
                      ? "bg-green-100 text-green-800 hover:bg-green-100" 
                      : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                    }
                  >
                    {inspection.completed ? 'Completed' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 text-left"
              onClick={loadReport}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium">Refresh Reports</div>
                  <div className="text-sm text-gray-500">Update all statistics</div>
                </div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4 text-left"
              onClick={() => window.print()}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Print Report</div>
                  <div className="text-sm text-gray-500">Generate printable version</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}