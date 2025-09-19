import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import { 
  createVehicleInputSchema,
  updateVehicleInputSchema,
  createInspectorInputSchema,
  updateInspectorInputSchema,
  createInspectionInputSchema,
  updateInspectionInputSchema,
  createInspectionItemsInputSchema,
  updateInspectionItemInputSchema,
  getVehicleInspectionsInputSchema,
  getInspectionDetailsInputSchema
} from './schema';

// Handler imports
import { createVehicle } from './handlers/create_vehicle';
import { getVehicles } from './handlers/get_vehicles';
import { getVehicleById } from './handlers/get_vehicle_by_id';
import { updateVehicle } from './handlers/update_vehicle';
import { deleteVehicle } from './handlers/delete_vehicle';
import { createInspector } from './handlers/create_inspector';
import { getInspectors } from './handlers/get_inspectors';
import { getInspectorById } from './handlers/get_inspector_by_id';
import { updateInspector } from './handlers/update_inspector';
import { deleteInspector } from './handlers/delete_inspector';
import { createInspection } from './handlers/create_inspection';
import { getInspections } from './handlers/get_inspections';
import { getVehicleInspections } from './handlers/get_vehicle_inspections';
import { getInspectionDetails } from './handlers/get_inspection_details';
import { updateInspection } from './handlers/update_inspection';
import { createInspectionItems } from './handlers/create_inspection_items';
import { updateInspectionItem } from './handlers/update_inspection_item';
import { getInspectionReport } from './handlers/get_inspection_report';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Vehicle management routes
  createVehicle: publicProcedure
    .input(createVehicleInputSchema)
    .mutation(({ input }) => createVehicle(input)),
  
  getVehicles: publicProcedure
    .query(() => getVehicles()),
  
  getVehicleById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getVehicleById(input.id)),
  
  updateVehicle: publicProcedure
    .input(updateVehicleInputSchema)
    .mutation(({ input }) => updateVehicle(input)),
  
  deleteVehicle: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteVehicle(input.id)),

  // Inspector management routes
  createInspector: publicProcedure
    .input(createInspectorInputSchema)
    .mutation(({ input }) => createInspector(input)),
  
  getInspectors: publicProcedure
    .query(() => getInspectors()),
  
  getInspectorById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getInspectorById(input.id)),
  
  updateInspector: publicProcedure
    .input(updateInspectorInputSchema)
    .mutation(({ input }) => updateInspector(input)),
  
  deleteInspector: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteInspector(input.id)),

  // Inspection management routes
  createInspection: publicProcedure
    .input(createInspectionInputSchema)
    .mutation(({ input }) => createInspection(input)),
  
  getInspections: publicProcedure
    .query(() => getInspections()),
  
  getVehicleInspections: publicProcedure
    .input(getVehicleInspectionsInputSchema)
    .query(({ input }) => getVehicleInspections(input)),
  
  getInspectionDetails: publicProcedure
    .input(getInspectionDetailsInputSchema)
    .query(({ input }) => getInspectionDetails(input)),
  
  updateInspection: publicProcedure
    .input(updateInspectionInputSchema)
    .mutation(({ input }) => updateInspection(input)),

  // Inspection items management routes
  createInspectionItems: publicProcedure
    .input(createInspectionItemsInputSchema)
    .mutation(({ input }) => createInspectionItems(input)),
  
  updateInspectionItem: publicProcedure
    .input(updateInspectionItemInputSchema)
    .mutation(({ input }) => updateInspectionItem(input)),

  // Reporting routes
  getInspectionReport: publicProcedure
    .query(() => getInspectionReport()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();