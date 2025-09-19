import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for inspection item status
export const inspectionItemStatusEnum = pgEnum('inspection_item_status', ['pass', 'fail', 'not_applicable']);

// Vehicles table
export const vehiclesTable = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  vin: text('vin').notNull().unique(),
  license_plate: text('license_plate').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Inspectors table
export const inspectorsTable = pgTable('inspectors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  employee_id: text('employee_id').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Inspections table
export const inspectionsTable = pgTable('inspections', {
  id: serial('id').primaryKey(),
  vehicle_id: integer('vehicle_id').notNull().references(() => vehiclesTable.id, { onDelete: 'cascade' }),
  inspector_id: integer('inspector_id').notNull().references(() => inspectorsTable.id, { onDelete: 'restrict' }),
  inspection_date: timestamp('inspection_date').notNull(),
  completed: boolean('completed').default(false).notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Inspection items table (checklist items)
export const inspectionItemsTable = pgTable('inspection_items', {
  id: serial('id').primaryKey(),
  inspection_id: integer('inspection_id').notNull().references(() => inspectionsTable.id, { onDelete: 'cascade' }),
  item_name: text('item_name').notNull(),
  status: inspectionItemStatusEnum('status').notNull(),
  comments: text('comments'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const vehiclesRelations = relations(vehiclesTable, ({ many }) => ({
  inspections: many(inspectionsTable)
}));

export const inspectorsRelations = relations(inspectorsTable, ({ many }) => ({
  inspections: many(inspectionsTable)
}));

export const inspectionsRelations = relations(inspectionsTable, ({ one, many }) => ({
  vehicle: one(vehiclesTable, {
    fields: [inspectionsTable.vehicle_id],
    references: [vehiclesTable.id]
  }),
  inspector: one(inspectorsTable, {
    fields: [inspectionsTable.inspector_id],
    references: [inspectorsTable.id]
  }),
  items: many(inspectionItemsTable)
}));

export const inspectionItemsRelations = relations(inspectionItemsTable, ({ one }) => ({
  inspection: one(inspectionsTable, {
    fields: [inspectionItemsTable.inspection_id],
    references: [inspectionsTable.id]
  })
}));

// TypeScript types for the table schemas
export type Vehicle = typeof vehiclesTable.$inferSelect;
export type NewVehicle = typeof vehiclesTable.$inferInsert;

export type Inspector = typeof inspectorsTable.$inferSelect;
export type NewInspector = typeof inspectorsTable.$inferInsert;

export type Inspection = typeof inspectionsTable.$inferSelect;
export type NewInspection = typeof inspectionsTable.$inferInsert;

export type InspectionItem = typeof inspectionItemsTable.$inferSelect;
export type NewInspectionItem = typeof inspectionItemsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  vehicles: vehiclesTable,
  inspectors: inspectorsTable,
  inspections: inspectionsTable,
  inspectionItems: inspectionItemsTable
};