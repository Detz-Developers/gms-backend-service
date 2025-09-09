
import * as admin from "firebase-admin";

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

export const seedServices = async () => {
  const db = admin.database();
  
  const services: Service[] = [
    {
      id: "SRV001",
      name: "Annual Generator Maintenance",
      type: "maintenance",
      provider: "PowerTech Services",
      cost: 2500,
      status: "scheduled",
      scheduledDate: "2024-03-01",
      generatorId: "GEN001",
      description: "Complete annual maintenance including oil change, filter replacement, and system diagnostics",
      createdAt: "2024-02-01T10:00:00.000Z",
      updatedAt: "2024-02-01T10:00:00.000Z"
    },
    {
      id: "SRV002",
      name: "Emergency Repair Service",
      type: "repair",
      provider: "QuickFix Solutions",
      cost: 1200,
      status: "in-progress",
      scheduledDate: "2024-02-18",
      generatorId: "GEN002",
      description: "Repair cooling system malfunction and replace damaged components",
      createdAt: "2024-02-10T14:30:00.000Z",
      updatedAt: "2024-02-18T09:15:00.000Z"
    },
    {
      id: "SRV003",
      name: "Battery Bank Installation",
      type: "installation",
      provider: "Energy Systems Inc",
      cost: 15000,
      status: "completed",
      scheduledDate: "2024-01-15",
      description: "Installation of new lithium-ion battery bank with monitoring system",
      createdAt: "2024-01-05T08:00:00.000Z",
      updatedAt: "2024-01-20T16:30:00.000Z"
    },
    {
      id: "SRV004",
      name: "Safety Inspection",
      type: "inspection",
      provider: "SafeGuard Inspections",
      cost: 800,
      status: "scheduled",
      scheduledDate: "2024-02-25",
      description: "Comprehensive safety inspection of all generator systems and compliance check",
      createdAt: "2024-02-15T11:45:00.000Z",
      updatedAt: "2024-02-15T11:45:00.000Z"
    },
    {
      id: "SRV005",
      name: "Fuel System Cleaning",
      type: "maintenance",
      provider: "PowerTech Services",
      cost: 950,
      status: "completed",
      scheduledDate: "2024-01-20",
      generatorId: "GEN003",
      description: "Deep cleaning of fuel system, filters, and injection components",
      createdAt: "2024-01-10T13:20:00.000Z",
      updatedAt: "2024-01-22T15:00:00.000Z"
    },
    {
      id: "SRV006",
      name: "Control Panel Upgrade",
      type: "installation",
      provider: "TechUpgrade Solutions",
      cost: 3500,
      status: "scheduled",
      scheduledDate: "2024-03-10",
      generatorId: "GEN001",
      description: "Upgrade to digital control panel with remote monitoring capabilities",
      createdAt: "2024-02-20T09:30:00.000Z",
      updatedAt: "2024-02-20T09:30:00.000Z"
    }
  ];

  try {

    await db.ref("services").remove();
    
   
    const updates: {[key: string]: Service} = {};
    services.forEach(service => {
      updates[`services/${service.id}`] = service;
    });
    
    await db.ref().update(updates);
    console.log("Services seed data added successfully!");
    
    return {
      success: true,
      message: "Services seed data added successfully",
      count: services.length
    };
  } catch (error) {
    console.error("Error adding seed data:", error);
    throw error;
  }
};
