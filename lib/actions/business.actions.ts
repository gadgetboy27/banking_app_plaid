"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";
import { checkFeatureAccess } from "./subscription.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_BUSINESS_ENTITIES_COLLECTION_ID: BUSINESS_ENTITIES_COLLECTION_ID,
  APPWRITE_VAT_CONFIGURATIONS_COLLECTION_ID: VAT_CONFIGURATIONS_COLLECTION_ID,
  APPWRITE_CLIENTS_COLLECTION_ID: CLIENTS_COLLECTION_ID,
  APPWRITE_PROJECTS_COLLECTION_ID: PROJECTS_COLLECTION_ID,
  APPWRITE_INVOICES_COLLECTION_ID: INVOICES_COLLECTION_ID,
  APPWRITE_RECEIPTS_COLLECTION_ID: RECEIPTS_COLLECTION_ID,
} = process.env;

// ========================================
// BUSINESS ENTITY MANAGEMENT
// ========================================

export async function createBusinessEntity(
  userId: string,
  data: Omit<BusinessEntity, "$id" | "userId" | "$createdAt" | "$updatedAt">
): Promise<BusinessEntity | null> {
  try {
    // Check if user has business mode access
    const access = await checkFeatureAccess(userId, "businessMode");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to access business mode`);
    }

    const { database } = await createAdminClient();

    const businessEntity = await database.createDocument(
      DATABASE_ID!,
      BUSINESS_ENTITIES_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        businessName: data.businessName,
        businessType: data.businessType,
        registrationNumber: data.registrationNumber || null,
        taxId: data.taxId,
        vatNumber: data.vatNumber || null,
        addressStreet: data.address.street,
        addressCity: data.address.city,
        addressState: data.address.state,
        addressPostalCode: data.address.postalCode,
        addressCountry: data.address.country,
        industry: data.industry,
        currency: data.currency,
        fiscalYearStart: data.fiscalYearStart,
        logo: data.logo || null,
        isActive: true,
      }
    );

    return parseStringify(businessEntity);
  } catch (error) {
    console.error("Error creating business entity:", error);
    return null;
  }
}

export async function getUserBusinessEntities(userId: string): Promise<BusinessEntity[]> {
  try {
    const { database } = await createAdminClient();

    const entities = await database.listDocuments(
      DATABASE_ID!,
      BUSINESS_ENTITIES_COLLECTION_ID!,
      [Query.equal("userId", [userId]), Query.equal("isActive", [true])]
    );

    return parseStringify(entities.documents);
  } catch (error) {
    console.error("Error fetching business entities:", error);
    return [];
  }
}

export async function getBusinessEntity(entityId: string): Promise<BusinessEntity | null> {
  try {
    const { database } = await createAdminClient();

    const entity = await database.getDocument(
      DATABASE_ID!,
      BUSINESS_ENTITIES_COLLECTION_ID!,
      entityId
    );

    return parseStringify(entity);
  } catch (error) {
    console.error("Error fetching business entity:", error);
    return null;
  }
}

export async function updateBusinessEntity(
  entityId: string,
  data: Partial<BusinessEntity>
): Promise<BusinessEntity | null> {
  try {
    const { database } = await createAdminClient();

    const updated = await database.updateDocument(
      DATABASE_ID!,
      BUSINESS_ENTITIES_COLLECTION_ID!,
      entityId,
      data
    );

    return parseStringify(updated);
  } catch (error) {
    console.error("Error updating business entity:", error);
    return null;
  }
}

// ========================================
// VAT CONFIGURATION
// ========================================

export async function createVATConfiguration(
  userId: string,
  businessEntityId: string,
  data: Omit<VATConfiguration, "$id" | "userId" | "businessEntityId" | "$createdAt" | "$updatedAt">
): Promise<VATConfiguration | null> {
  try {
    // Check if user has VAT access
    const access = await checkFeatureAccess(userId, "vatCalculation");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to access VAT calculation`);
    }

    const { database } = await createAdminClient();

    const vatConfig = await database.createDocument(
      DATABASE_ID!,
      VAT_CONFIGURATIONS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        businessEntityId,
        defaultVATRate: data.defaultVATRate,
        vatRatesJSON: JSON.stringify(data.vatRates),
        vatScheme: data.vatScheme,
        registrationDate: data.registrationDate,
        reportingPeriod: data.reportingPeriod,
        nextFilingDate: data.nextFilingDate,
      }
    );

    return parseStringify(vatConfig);
  } catch (error) {
    console.error("Error creating VAT configuration:", error);
    return null;
  }
}

export async function getVATConfiguration(businessEntityId: string): Promise<VATConfiguration | null> {
  try {
    const { database } = await createAdminClient();

    const configs = await database.listDocuments(
      DATABASE_ID!,
      VAT_CONFIGURATIONS_COLLECTION_ID!,
      [Query.equal("businessEntityId", [businessEntityId])]
    );

    if (configs.total === 0) return null;

    const config = configs.documents[0];
    config.vatRates = JSON.parse(config.vatRatesJSON);

    return parseStringify(config);
  } catch (error) {
    console.error("Error fetching VAT configuration:", error);
    return null;
  }
}

export async function updateVATConfiguration(
  configId: string,
  data: Partial<VATConfiguration>
): Promise<VATConfiguration | null> {
  try {
    const { database } = await createAdminClient();

    const updateData: any = { ...data };
    if (data.vatRates) {
      updateData.vatRatesJSON = JSON.stringify(data.vatRates);
      delete updateData.vatRates;
    }

    const updated = await database.updateDocument(
      DATABASE_ID!,
      VAT_CONFIGURATIONS_COLLECTION_ID!,
      configId,
      updateData
    );

    return parseStringify(updated);
  } catch (error) {
    console.error("Error updating VAT configuration:", error);
    return null;
  }
}

// ========================================
// VAT CALCULATION
// ========================================

export function calculateVAT(
  amount: number,
  vatRate: number,
  isInclusive: boolean = false
): {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
} {
  if (isInclusive) {
    // VAT is included in the amount
    const vatAmount = amount - (amount / (1 + vatRate / 100));
    const netAmount = amount - vatAmount;
    return {
      netAmount,
      vatAmount,
      grossAmount: amount,
    };
  } else {
    // VAT is added to the amount
    const vatAmount = amount * (vatRate / 100);
    const grossAmount = amount + vatAmount;
    return {
      netAmount: amount,
      vatAmount,
      grossAmount,
    };
  }
}

export async function calculateVATReturn(
  userId: string,
  businessEntityId: string,
  startDate: string,
  endDate: string
): Promise<VATReturnData | null> {
  try {
    const { database } = await createAdminClient();

    // Get all VAT-eligible transactions in period
    const enhancedTransactions = await database.listDocuments(
      DATABASE_ID!,
      process.env.APPWRITE_ENHANCED_TRANSACTIONS_COLLECTION_ID!,
      [
        Query.equal("userId", [userId]),
        Query.equal("businessEntityId", [businessEntityId]),
        Query.equal("isVatEligible", [true]),
      ]
    );

    let vatDue = 0; // VAT on sales
    let vatReclaimed = 0; // VAT on purchases
    let totalSales = 0;
    let totalPurchases = 0;
    const transactionIds: string[] = [];

    for (const transaction of enhancedTransactions.documents) {
      const vatAmount = transaction.vatAmount || 0;
      transactionIds.push(transaction.transactionId);

      if (transaction.enhancedCategory === "income" || transaction.enhancedCategory === "salary") {
        vatDue += vatAmount;
        totalSales += vatAmount / (transaction.vatRate / 100);
      } else {
        vatReclaimed += vatAmount;
        totalPurchases += vatAmount / (transaction.vatRate / 100);
      }
    }

    const netVat = vatDue - vatReclaimed;

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      vatDue,
      vatReclaimed,
      netVat,
      totalSales,
      totalPurchases,
      transactions: transactionIds,
    };
  } catch (error) {
    console.error("Error calculating VAT return:", error);
    return null;
  }
}

// ========================================
// CLIENT MANAGEMENT
// ========================================

export async function createClient(
  userId: string,
  businessEntityId: string,
  data: Omit<Client, "$id" | "userId" | "businessEntityId" | "$createdAt" | "$updatedAt" | "totalInvoiced" | "totalPaid">
): Promise<Client | null> {
  try {
    const { database } = await createAdminClient();

    const client = await database.createDocument(
      DATABASE_ID!,
      CLIENTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        businessEntityId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        address: data.address || null,
        taxId: data.taxId || null,
        vatNumber: data.vatNumber || null,
        paymentTerms: data.paymentTerms,
        notes: data.notes || null,
        isActive: true,
        totalInvoiced: 0,
        totalPaid: 0,
      }
    );

    return parseStringify(client);
  } catch (error) {
    console.error("Error creating client:", error);
    return null;
  }
}

export async function getBusinessClients(businessEntityId: string): Promise<Client[]> {
  try {
    const { database } = await createAdminClient();

    const clients = await database.listDocuments(
      DATABASE_ID!,
      CLIENTS_COLLECTION_ID!,
      [Query.equal("businessEntityId", [businessEntityId]), Query.equal("isActive", [true])]
    );

    return parseStringify(clients.documents);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export async function updateClient(
  clientId: string,
  data: Partial<Client>
): Promise<Client | null> {
  try {
    const { database } = await createAdminClient();

    const updated = await database.updateDocument(
      DATABASE_ID!,
      CLIENTS_COLLECTION_ID!,
      clientId,
      data
    );

    return parseStringify(updated);
  } catch (error) {
    console.error("Error updating client:", error);
    return null;
  }
}

// ========================================
// PROJECT MANAGEMENT
// ========================================

export async function createProject(
  userId: string,
  businessEntityId: string,
  data: Omit<Project, "$id" | "userId" | "businessEntityId" | "$createdAt" | "$updatedAt" | "spent">
): Promise<Project | null> {
  try {
    const { database } = await createAdminClient();

    const project = await database.createDocument(
      DATABASE_ID!,
      PROJECTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        businessEntityId,
        name: data.name,
        clientId: data.clientId || null,
        status: data.status,
        budget: data.budget || null,
        spent: 0,
        startDate: data.startDate,
        endDate: data.endDate || null,
        description: data.description || null,
        color: data.color || null,
      }
    );

    return parseStringify(project);
  } catch (error) {
    console.error("Error creating project:", error);
    return null;
  }
}

export async function getBusinessProjects(
  businessEntityId: string,
  filters?: { status?: Project["status"]; clientId?: string }
): Promise<Project[]> {
  try {
    const { database } = await createAdminClient();

    const queries = [Query.equal("businessEntityId", [businessEntityId])];

    if (filters?.status) {
      queries.push(Query.equal("status", [filters.status]));
    }

    if (filters?.clientId) {
      queries.push(Query.equal("clientId", [filters.clientId]));
    }

    const projects = await database.listDocuments(
      DATABASE_ID!,
      PROJECTS_COLLECTION_ID!,
      queries
    );

    return parseStringify(projects.documents);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return [];
  }
}

export async function updateProject(
  projectId: string,
  data: Partial<Project>
): Promise<Project | null> {
  try {
    const { database } = await createAdminClient();

    const updated = await database.updateDocument(
      DATABASE_ID!,
      PROJECTS_COLLECTION_ID!,
      projectId,
      data
    );

    return parseStringify(updated);
  } catch (error) {
    console.error("Error updating project:", error);
    return null;
  }
}

// ========================================
// INVOICE MANAGEMENT
// ========================================

export async function createInvoice(data: CreateInvoiceProps): Promise<Invoice | null> {
  try {
    // Check if user has invoice access
    const access = await checkFeatureAccess(data.userId, "invoiceManagement");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to access invoicing`);
    }

    const { database } = await createAdminClient();

    // Get client details
    const client = await database.getDocument(
      DATABASE_ID!,
      CLIENTS_COLLECTION_ID!,
      data.clientId
    );

    // Calculate totals
    let subtotal = 0;
    let vatAmount = 0;

    const processedItems = data.items.map(item => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemVAT = itemTotal * (item.vatRate / 100);

      subtotal += itemTotal;
      vatAmount += itemVAT;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        total: itemTotal + itemVAT,
      };
    });

    const totalAmount = subtotal + vatAmount;

    // Generate invoice number
    const existingInvoices = await database.listDocuments(
      DATABASE_ID!,
      INVOICES_COLLECTION_ID!,
      [Query.equal("businessEntityId", [data.businessEntityId])]
    );

    const invoiceNumber = `INV-${String(existingInvoices.total + 1).padStart(5, "0")}`;

    const invoice = await database.createDocument(
      DATABASE_ID!,
      INVOICES_COLLECTION_ID!,
      ID.unique(),
      {
        userId: data.userId,
        businessEntityId: data.businessEntityId,
        invoiceNumber,
        status: "draft",
        clientId: data.clientId,
        clientName: client.name,
        clientEmail: client.email,
        clientAddress: client.address || null,
        itemsJSON: JSON.stringify(processedItems),
        subtotal,
        vatAmount,
        totalAmount,
        currency: "USD", // From business entity
        issueDate: new Date().toISOString(),
        dueDate: data.dueDate,
        notes: data.notes || null,
        terms: null,
      }
    );

    return parseStringify(invoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    return null;
  }
}

export async function getBusinessInvoices(
  businessEntityId: string,
  filters?: { status?: Invoice["status"]; clientId?: string }
): Promise<Invoice[]> {
  try {
    const { database } = await createAdminClient();

    const queries = [Query.equal("businessEntityId", [businessEntityId])];

    if (filters?.status) {
      queries.push(Query.equal("status", [filters.status]));
    }

    if (filters?.clientId) {
      queries.push(Query.equal("clientId", [filters.clientId]));
    }

    const invoices = await database.listDocuments(
      DATABASE_ID!,
      INVOICES_COLLECTION_ID!,
      queries
    );

    // Parse items JSON
    const parsedInvoices = invoices.documents.map(invoice => ({
      ...invoice,
      items: JSON.parse(invoice.itemsJSON),
    }));

    return parseStringify(parsedInvoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: Invoice["status"],
  paidDate?: string
): Promise<Invoice | null> {
  try {
    const { database } = await createAdminClient();

    const updateData: any = { status };
    if (status === "paid" && paidDate) {
      updateData.paidDate = paidDate;
    }

    const updated = await database.updateDocument(
      DATABASE_ID!,
      INVOICES_COLLECTION_ID!,
      invoiceId,
      updateData
    );

    // Update client totals if paid
    if (status === "paid") {
      const client = await database.getDocument(
        DATABASE_ID!,
        CLIENTS_COLLECTION_ID!,
        updated.clientId
      );

      await database.updateDocument(
        DATABASE_ID!,
        CLIENTS_COLLECTION_ID!,
        updated.clientId,
        {
          totalPaid: client.totalPaid + updated.totalAmount,
        }
      );
    }

    return parseStringify(updated);
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return null;
  }
}

// ========================================
// RECEIPT MANAGEMENT
// ========================================

export async function uploadReceipt(
  userId: string,
  transactionId: string | undefined,
  fileData: {
    fileName: string;
    fileUrl: string;
    fileType: string;
  }
): Promise<Receipt | null> {
  try {
    // Check if user has OCR access
    const access = await checkFeatureAccess(userId, "receiptOCR");
    if (!access.allowed) {
      throw new Error(`Upgrade to ${access.upgrade} to scan receipts`);
    }

    const { database } = await createAdminClient();

    const receipt = await database.createDocument(
      DATABASE_ID!,
      RECEIPTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        transactionId: transactionId || null,
        fileName: fileData.fileName,
        fileUrl: fileData.fileUrl,
        fileType: fileData.fileType,
        uploadDate: new Date().toISOString(),
        verified: false,
      }
    );

    return parseStringify(receipt);
  } catch (error) {
    console.error("Error uploading receipt:", error);
    return null;
  }
}

export async function processReceiptOCR(
  receiptId: string,
  ocrData: Receipt["ocrData"]
): Promise<Receipt | null> {
  try {
    const { database } = await createAdminClient();

    const updated = await database.updateDocument(
      DATABASE_ID!,
      RECEIPTS_COLLECTION_ID!,
      receiptId,
      {
        ocrDataJSON: JSON.stringify(ocrData),
        verified: ocrData.confidence > 0.8,
      }
    );

    return parseStringify(updated);
  } catch (error) {
    console.error("Error processing receipt OCR:", error);
    return null;
  }
}

export async function getUserReceipts(
  userId: string,
  transactionId?: string
): Promise<Receipt[]> {
  try {
    const { database } = await createAdminClient();

    const queries = [Query.equal("userId", [userId])];

    if (transactionId) {
      queries.push(Query.equal("transactionId", [transactionId]));
    }

    const receipts = await database.listDocuments(
      DATABASE_ID!,
      RECEIPTS_COLLECTION_ID!,
      queries
    );

    return parseStringify(receipts.documents);
  } catch (error) {
    console.error("Error fetching receipts:", error);
    return [];
  }
}
