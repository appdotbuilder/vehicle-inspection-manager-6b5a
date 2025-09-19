import { z } from 'zod';

// Vehicle schema
export const vehicleSchema = z.object({
  id: z.number(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  vin: z.string(),
  license_plate: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Vehicle = z.infer<typeof vehicleSchema>;

// Input schema for creating vehicles
export const createVehicleInputSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  vin: z.string().min(17).max(17, "VIN must be exactly 17 characters"),
  license_plate: z.string().min(1, "License plate is required")
});

export type CreateVehicleInput = z.infer<typeof createVehicleInputSchema>;

// Input schema for updating vehicles
export const updateVehicleInputSchema = z.object({
  id: z.number(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  vin: z.string().min(17).max(17).optional(),
  license_plate: z.string().min(1).optional()
});

export type UpdateVehicleInput = z.infer<typeof updateVehicleInputSchema>;

// Inspector schema
export const inspectorSchema = z.object({
  id: z.number(),
  name: z.string(),
  employee_id: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Inspector = z.infer<typeof inspectorSchema>;

// Input schema for creating inspectors
export const createInspectorInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  employee_id: z.string().min(1, "Employee ID is required")
});

export type CreateInspectorInput = z.infer<typeof createInspectorInputSchema>;

// Input schema for updating inspectors
export const updateInspectorInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  employee_id: z.string().min(1).optional()
});

export type UpdateInspectorInput = z.infer<typeof updateInspectorInputSchema>;

// Inspection status enum
export const inspectionItemStatusSchema = z.enum(['pass', 'fail', 'not_applicable']);

export type InspectionItemStatus = z.infer<typeof inspectionItemStatusSchema>;

// Inspection schema
export const inspectionSchema = z.object({
  id: z.number(),
  vehicle_id: z.number(),
  inspector_id: z.number(),
  inspection_date: z.coerce.date(),
  completed: z.boolean(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Inspection = z.infer<typeof inspectionSchema>;

// Input schema for creating inspections
export const createInspectionInputSchema = z.object({
  vehicle_id: z.number(),
  inspector_id: z.number(),
  inspection_date: z.coerce.date(),
  notes: z.string().nullable().optional()
});

export type CreateInspectionInput = z.infer<typeof createInspectionInputSchema>;

// Input schema for updating inspections
export const updateInspectionInputSchema = z.object({
  id: z.number(),
  completed: z.boolean().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateInspectionInput = z.infer<typeof updateInspectionInputSchema>;

// Inspection item schema
export const inspectionItemSchema = z.object({
  id: z.number(),
  inspection_id: z.number(),
  item_name: z.string(),
  status: inspectionItemStatusSchema,
  comments: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type InspectionItem = z.infer<typeof inspectionItemSchema>;

// Input schema for creating inspection items
export const createInspectionItemInputSchema = z.object({
  inspection_id: z.number(),
  item_name: z.string().min(1, "Item name is required"),
  status: inspectionItemStatusSchema,
  comments: z.string().nullable().optional()
});

export type CreateInspectionItemInput = z.infer<typeof createInspectionItemInputSchema>;

// Input schema for updating inspection items
export const updateInspectionItemInputSchema = z.object({
  id: z.number(),
  status: inspectionItemStatusSchema.optional(),
  comments: z.string().nullable().optional()
});

export type UpdateInspectionItemInput = z.infer<typeof updateInspectionItemInputSchema>;

// Bulk input schema for creating multiple inspection items
export const createInspectionItemsInputSchema = z.object({
  inspection_id: z.number(),
  items: z.array(z.object({
    item_name: z.string().min(1, "Item name is required"),
    status: inspectionItemStatusSchema,
    comments: z.string().nullable().optional()
  }))
});

export type CreateInspectionItemsInput = z.infer<typeof createInspectionItemsInputSchema>;

// Query schema for getting vehicle inspections
export const getVehicleInspectionsInputSchema = z.object({
  vehicle_id: z.number()
});

export type GetVehicleInspectionsInput = z.infer<typeof getVehicleInspectionsInputSchema>;

// Query schema for getting inspection details
export const getInspectionDetailsInputSchema = z.object({
  inspection_id: z.number()
});

export type GetInspectionDetailsInput = z.infer<typeof getInspectionDetailsInputSchema>;

// Schema for inspection with related data
export const inspectionWithDetailsSchema = z.object({
  id: z.number(),
  vehicle_id: z.number(),
  inspector_id: z.number(),
  inspection_date: z.coerce.date(),
  completed: z.boolean(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  vehicle: vehicleSchema,
  inspector: inspectorSchema,
  items: z.array(inspectionItemSchema)
});

export type InspectionWithDetails = z.infer<typeof inspectionWithDetailsSchema>;

// Schema for reporting
export const inspectionReportSchema = z.object({
  total_inspections: z.number(),
  completed_inspections: z.number(),
  pending_inspections: z.number(),
  recent_inspections: z.array(inspectionWithDetailsSchema)
});

export type InspectionReport = z.infer<typeof inspectionReportSchema>;