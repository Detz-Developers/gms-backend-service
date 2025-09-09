
import {onRequest} from "firebase-functions/v2/https";
import {onValueCreated, onValueUpdated} from "firebase-functions/v2/database";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";
import {Request, Response} from "express";
import {seedServices} from "./seedData";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.database();

// Service interface
interface Service {
  id: string;
  name: string;
  type: "maintenance" | "repair" | "inspection" | "installation";
  provider: string;
  cost: number;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  scheduledDate: string;
  generatorId?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// CORS middleware
const setCORSHeaders = (res: Response) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

// Helper function to generate service ID
const generateServiceId = (): string => {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `SRV${timestamp.slice(-6)}${randomNum}`;
};

// GET /services - Get all services
export const getServices = onRequest(async (req: Request, res: Response) => {
  setCORSHeaders(res);
  
  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  try {
    const snapshot = await db.ref("services").once("value");
    const services = snapshot.val() || {};
    
    // Convert to array and sort by created date
    const servicesArray = Object.values(services).sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.status(200).json({
      success: true,
      data: servicesArray,
      count: servicesArray.length
    });
  } catch (error) {
    logger.error("Error fetching services:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch services"
    });
  }
});

// POST /services - Create a new service
export const createService = onRequest(async (req: Request, res: Response) => {
  setCORSHeaders(res);
  
  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({success: false, error: "Method not allowed"});
    return;
  }

  try {
    const serviceData = req.body;
    
    // Validate required fields
    const requiredFields = ["name", "type", "provider", "cost", "scheduledDate", "description"];
    for (const field of requiredFields) {
      if (!serviceData[field]) {
        res.status(400).json({
          success: false,
          error: `Missing required field: ${field}`
        });
        return;
      }
    }

    const serviceId = generateServiceId();
    const now = new Date().toISOString();

    const newService: Service = {
      id: serviceId,
      name: serviceData.name,
      type: serviceData.type,
      provider: serviceData.provider,
      cost: parseFloat(serviceData.cost),
      status: serviceData.status || "scheduled",
      scheduledDate: serviceData.scheduledDate,
      generatorId: serviceData.generatorId || null,
      description: serviceData.description,
      createdAt: now,
      updatedAt: now
    };

    await db.ref(`services/${serviceId}`).set(newService);

    res.status(201).json({
      success: true,
      data: newService
    });
  } catch (error) {
    logger.error("Error creating service:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create service"
    });
  }
});

// PUT /services/:id - Update a service
export const updateService = onRequest(async (req: Request, res: Response) => {
  setCORSHeaders(res);
  
  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  if (req.method !== "PUT") {
    res.status(405).json({success: false, error: "Method not allowed"});
    return;
  }

  try {
    const serviceId = req.path.split("/").pop();
    if (!serviceId) {
      res.status(400).json({success: false, error: "Service ID is required"});
      return;
    }

    const updateData = req.body;
    const serviceRef = db.ref(`services/${serviceId}`);
    
    // Check if service exists
    const snapshot = await serviceRef.once("value");
    if (!snapshot.exists()) {
      res.status(404).json({success: false, error: "Service not found"});
      return;
    }

    const existingService = snapshot.val();
    const updatedService = {
      ...existingService,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await serviceRef.set(updatedService);

    res.status(200).json({
      success: true,
      data: updatedService
    });
  } catch (error) {
    logger.error("Error updating service:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update service"
    });
  }
});

// DELETE /services/:id - Delete a service
export const deleteService = onRequest(async (req: Request, res: Response) => {
  setCORSHeaders(res);
  
  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  if (req.method !== "DELETE") {
    res.status(405).json({success: false, error: "Method not allowed"});
    return;
  }

  try {
    const serviceId = req.path.split("/").pop();
    if (!serviceId) {
      res.status(400).json({success: false, error: "Service ID is required"});
      return;
    }

    const serviceRef = db.ref(`services/${serviceId}`);
    
    // Check if service exists
    const snapshot = await serviceRef.once("value");
    if (!snapshot.exists()) {
      res.status(404).json({success: false, error: "Service not found"});
      return;
    }

    await serviceRef.remove();

    res.status(200).json({
      success: true,
      message: "Service deleted successfully"
    });
  } catch (error) {
    logger.error("Error deleting service:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete service"
    });
  }
});

// GET /services/stats - Get service statistics
export const getServiceStats = onRequest(async (req: Request, res: Response) => {
  setCORSHeaders(res);
  
  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  try {
    const snapshot = await db.ref("services").once("value");
    const services = snapshot.val() || {};
    const servicesArray = Object.values(services) as Service[];

    const stats = {
      totalServices: servicesArray.length,
      completedServices: servicesArray.filter(s => s.status === "completed").length,
      inProgressServices: servicesArray.filter(s => s.status === "in-progress").length,
      scheduledServices: servicesArray.filter(s => s.status === "scheduled").length,
      cancelledServices: servicesArray.filter(s => s.status === "cancelled").length,
      totalCost: servicesArray.reduce((sum, service) => sum + service.cost, 0),
      averageCost: servicesArray.length > 0 ? 
        servicesArray.reduce((sum, service) => sum + service.cost, 0) / servicesArray.length : 0,
      servicesByType: {
        maintenance: servicesArray.filter(s => s.type === "maintenance").length,
        repair: servicesArray.filter(s => s.type === "repair").length,
        inspection: servicesArray.filter(s => s.type === "inspection").length,
        installation: servicesArray.filter(s => s.type === "installation").length
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error("Error fetching service stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch service statistics"
    });
  }
});

// Database trigger for service creation
export const onServiceCreated = onValueCreated("/services/{serviceId}", (event) => {
  const snapshot = event.data;
  const service = snapshot?.val?.();
  
  logger.info("New service created:", {
    serviceId: event.params.serviceId,
    serviceName: service?.name,
    serviceType: service?.type,
    provider: service?.provider
  });
});

// Database trigger for service updates
export const onServiceUpdated = onValueUpdated("/services/{serviceId}", (event) => {
  const beforeSnapshot = event.data.before;
  const afterSnapshot = event.data.after;
  const beforeData = beforeSnapshot?.val?.();
  const afterData = afterSnapshot?.val?.();
  
  logger.info("Service updated:", {
    serviceId: event.params.serviceId,
    beforeStatus: beforeData?.status,
    afterStatus: afterData?.status,
    serviceName: afterData?.name
  });
});

// POST /services/seed - Initialize with seed data
export const seedServiceData = onRequest(async (req: Request, res: Response) => {
  setCORSHeaders(res);
  
  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({success: false, error: "Method not allowed"});
    return;
  }

  try {
    const result = await seedServices();
    res.status(200).json(result);
  } catch (error) {
    logger.error("Error seeding service data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to seed service data"
    });
  }
});
