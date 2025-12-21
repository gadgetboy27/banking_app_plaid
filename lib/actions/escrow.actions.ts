"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_STRIPE_ACCOUNTS_COLLECTION_ID: STRIPE_ACCOUNTS_COLLECTION_ID,
  APPWRITE_ESCROW_TRANSACTIONS_COLLECTION_ID: ESCROW_TRANSACTIONS_COLLECTION_ID,
  APPWRITE_ESCROW_EVENTS_COLLECTION_ID: ESCROW_EVENTS_COLLECTION_ID,
  APPWRITE_ESCROW_CONFIG_COLLECTION_ID: ESCROW_CONFIG_COLLECTION_ID,
} = process.env;

// ========================================
// STRIPE CONNECT ACCOUNT MANAGEMENT
// ========================================

/**
 * Create a Stripe Connect Custom account for a seller
 * Custom accounts hide Stripe dashboard access - seller only sees your UI
 */
export async function createSellerStripeAccount(
  userId: string,
  data: {
    country: string;
    email: string;
    businessProfile?: {
      name?: string;
      url?: string;
      mcc?: string; // Merchant category code
    };
  }
): Promise<StripeConnectedAccount | null> {
  try {
    const { database } = await createAdminClient();

    // Check if seller already has a Stripe account
    const existing = await database.listDocuments(
      DATABASE_ID!,
      STRIPE_ACCOUNTS_COLLECTION_ID!,
      [Query.equal("userId", [userId])]
    );

    if (existing.total > 0) {
      return parseStringify(existing.documents[0]);
    }

    // Create Stripe Custom Connect account
    // IMPORTANT: Using "custom" type means seller CANNOT access Stripe dashboard
    // All balance information is hidden from seller - only visible in YOUR app
    const account = await stripe.accounts.create({
      type: "custom", // 🔒 Seller cannot see Stripe balance or dashboard
      country: data.country,
      email: data.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: data.businessProfile,
      settings: {
        payouts: {
          schedule: {
            interval: "manual", // 🔒 MANUAL payouts - we control when seller gets paid
          },
        },
      },
    });

    // Save to database
    const stripeAccount = await database.createDocument(
      DATABASE_ID!,
      STRIPE_ACCOUNTS_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        stripeAccountId: account.id,
        accountType: "custom",
        country: data.country,
        currency: account.default_currency || "usd",
        isActive: true,
        isVerified: false,
        canReceivePayments: false,
        canMakePayouts: false,
        requirementsCurrentlyDueJSON: JSON.stringify(
          account.requirements?.currently_due || []
        ),
        requirementsPastDueJSON: JSON.stringify(
          account.requirements?.past_due || []
        ),
        requirementsEventuallyDueJSON: JSON.stringify(
          account.requirements?.eventually_due || []
        ),
        payoutsEnabled: account.payouts_enabled || false,
        chargesEnabled: account.charges_enabled || false,
        detailsSubmitted: account.details_submitted || false,
      }
    );

    return parseStringify(stripeAccount);
  } catch (error) {
    console.error("Error creating Stripe Connect account:", error);
    return null;
  }
}

/**
 * Generate Stripe Connect onboarding link
 * Seller completes identity verification through Stripe
 */
export async function generateOnboardingLink(
  userId: string
): Promise<{ url: string; expiresAt: string } | null> {
  try {
    const { database } = await createAdminClient();

    // Get seller's Stripe account
    const accounts = await database.listDocuments(
      DATABASE_ID!,
      STRIPE_ACCOUNTS_COLLECTION_ID!,
      [Query.equal("userId", [userId])]
    );

    if (accounts.total === 0) {
      throw new Error("No Stripe account found for user");
    }

    const account = accounts.documents[0];

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_SITE_URL}/seller/onboarding/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/seller/onboarding/complete`,
      type: "account_onboarding",
    });

    // Update database with onboarding link
    await database.updateDocument(
      DATABASE_ID!,
      STRIPE_ACCOUNTS_COLLECTION_ID!,
      account.$id,
      {
        onboardingLink: accountLink.url,
        onboardingExpiresAt: new Date(
          accountLink.expires_at * 1000
        ).toISOString(),
      }
    );

    return {
      url: accountLink.url,
      expiresAt: new Date(accountLink.expires_at * 1000).toISOString(),
    };
  } catch (error) {
    console.error("Error generating onboarding link:", error);
    return null;
  }
}

/**
 * Refresh Stripe account status from Stripe API
 * Call this after onboarding or periodically
 */
export async function refreshStripeAccountStatus(
  userId: string
): Promise<StripeConnectedAccount | null> {
  try {
    const { database } = await createAdminClient();

    const accounts = await database.listDocuments(
      DATABASE_ID!,
      STRIPE_ACCOUNTS_COLLECTION_ID!,
      [Query.equal("userId", [userId])]
    );

    if (accounts.total === 0) return null;

    const dbAccount = accounts.documents[0];

    // Fetch latest from Stripe
    const stripeAccount = await stripe.accounts.retrieve(
      dbAccount.stripeAccountId
    );

    // Update database
    const updated = await database.updateDocument(
      DATABASE_ID!,
      STRIPE_ACCOUNTS_COLLECTION_ID!,
      dbAccount.$id,
      {
        isVerified: stripeAccount.details_submitted,
        canReceivePayments: stripeAccount.charges_enabled,
        canMakePayouts: stripeAccount.payouts_enabled,
        requirementsCurrentlyDueJSON: JSON.stringify(
          stripeAccount.requirements?.currently_due || []
        ),
        requirementsPastDueJSON: JSON.stringify(
          stripeAccount.requirements?.past_due || []
        ),
        requirementsEventuallyDueJSON: JSON.stringify(
          stripeAccount.requirements?.eventually_due || []
        ),
        payoutsEnabled: stripeAccount.payouts_enabled,
        chargesEnabled: stripeAccount.charges_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
      }
    );

    return parseStringify(updated);
  } catch (error) {
    console.error("Error refreshing Stripe account:", error);
    return null;
  }
}

// ========================================
// ESCROW TRANSACTION CREATION
// ========================================

/**
 * Create an escrow transaction
 * This captures payment from buyer but HOLDS funds until conditions are met
 */
export async function createEscrowTransaction(
  buyerId: string,
  data: {
    sellerId: string;
    itemDescription: string;
    itemType: "physical_goods" | "digital_goods" | "service" | "subscription";
    amount: number; // in cents
    currency: string;
    settlementRuleTemplateId?: string; // Use predefined rules
    customConditions?: Omit<SettlementCondition, "isMet" | "metAt">[];
    metadata?: Record<string, any>;
  }
): Promise<EscrowTransaction | null> {
  try {
    const { database } = await createAdminClient();

    // Get seller's Stripe account
    const sellerAccounts = await database.listDocuments(
      DATABASE_ID!,
      STRIPE_ACCOUNTS_COLLECTION_ID!,
      [Query.equal("userId", [data.sellerId])]
    );

    if (sellerAccounts.total === 0) {
      throw new Error("Seller has not set up payment account");
    }

    const sellerAccount = sellerAccounts.documents[0];

    if (!sellerAccount.chargesEnabled) {
      throw new Error("Seller account not verified yet");
    }

    // Get platform config
    const config = await getPlatformConfig();

    // Calculate fees
    const platformFee = Math.round(
      data.amount * (config.platformFeePercentage / 100) +
        config.platformFeeFixed
    );
    const stripeFee = Math.round(
      data.amount * (config.stripeFeePercentage / 100) + config.stripeFeeFixed
    );
    const sellerAmount = data.amount - platformFee - stripeFee;

    // Determine settlement conditions
    let conditions: SettlementCondition[];

    if (data.customConditions) {
      // Use custom conditions
      conditions = data.customConditions.map((c, index) => ({
        ...c,
        isMet: false,
        priority: c.priority || index + 1,
      }));
    } else {
      // Use template or defaults based on item type
      conditions = await getDefaultConditionsForItemType(data.itemType, config);
    }

    // Create Payment Intent (but don't capture yet - will capture after buyer confirms)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency,
      payment_method_types: ["card"],
      capture_method: "manual", // Will capture after buyer confirms payment
      metadata: {
        buyerId,
        sellerId: data.sellerId,
        itemType: data.itemType,
        platformType: "escrow",
      },
    });

    // Create escrow transaction in database
    const escrow = await database.createDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      ID.unique(),
      {
        buyerId,
        sellerId: data.sellerId,
        sellerStripeAccountId: sellerAccount.stripeAccountId,
        itemDescription: data.itemDescription,
        itemType: data.itemType,
        amount: data.amount,
        platformFee,
        sellerAmount,
        currency: data.currency,
        stripePaymentIntentId: paymentIntent.id,
        status: "pending_payment",
        statusHistoryJSON: JSON.stringify([
          {
            status: "pending_payment",
            timestamp: new Date().toISOString(),
            triggeredBy: "buyer",
            note: "Escrow transaction created",
          },
        ]),
        settlementConditionsJSON: JSON.stringify(conditions),
        allConditionsMet: false,
        disputePeriodDays: config.defaultDisputePeriodDays,
        metadataJSON: JSON.stringify(data.metadata || {}),
      }
    );

    // Log event
    await logEscrowEvent(escrow.$id, {
      eventType: "payment_received",
      description: "Escrow transaction created, awaiting payment",
      triggeredBy: "buyer",
    });

    return parseStringify(escrow);
  } catch (error) {
    console.error("Error creating escrow transaction:", error);
    return null;
  }
}

/**
 * Capture payment from buyer
 * Called after buyer confirms payment in UI
 */
export async function captureEscrowPayment(
  escrowId: string,
  paymentMethodId: string
): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
  try {
    const { database } = await createAdminClient();

    const escrow = await database.getDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId
    );

    if (escrow.status !== "pending_payment") {
      return { success: false, error: "Invalid escrow status" };
    }

    // Attach payment method and confirm
    const paymentIntent = await stripe.paymentIntents.confirm(
      escrow.stripePaymentIntentId,
      {
        payment_method: paymentMethodId,
      }
    );

    // Capture the payment
    const captured = await stripe.paymentIntents.capture(paymentIntent.id);

    // Update escrow status
    const statusHistory = JSON.parse(escrow.statusHistoryJSON);
    statusHistory.push({
      status: "payment_received",
      timestamp: new Date().toISOString(),
      triggeredBy: "buyer",
      note: "Payment captured successfully",
    });

    await database.updateDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId,
      {
        status: "payment_received",
        statusHistoryJSON: JSON.stringify(statusHistory),
        stripeChargeId: captured.latest_charge as string,
      }
    );

    // Log event
    await logEscrowEvent(escrowId, {
      eventType: "payment_received",
      description: `Payment of ${escrow.amount / 100} ${escrow.currency} captured`,
      triggeredBy: "system",
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error capturing payment:", error);
    return { success: false, error: error.message };
  }
}

// ========================================
// SELLER ACTIONS
// ========================================

/**
 * Seller marks item as shipped and provides tracking
 */
export async function markAsShipped(
  escrowId: string,
  sellerId: string,
  trackingData: {
    carrier: string;
    trackingNumber: string;
    trackingUrl?: string;
    estimatedDelivery?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { database } = await createAdminClient();

    const escrow = await database.getDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId
    );

    // Verify seller owns this transaction
    if (escrow.sellerId !== sellerId) {
      return { success: false, error: "Unauthorized" };
    }

    if (escrow.status !== "payment_received") {
      return { success: false, error: "Invalid status for shipping" };
    }

    // Update status
    const statusHistory = JSON.parse(escrow.statusHistoryJSON);
    statusHistory.push({
      status: "shipped",
      timestamp: new Date().toISOString(),
      triggeredBy: "seller",
      note: `Shipped via ${trackingData.carrier}`,
    });

    await database.updateDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId,
      {
        status: "shipped",
        statusHistoryJSON: JSON.stringify(statusHistory),
        shippingDetailsJSON: JSON.stringify({
          ...trackingData,
          shippedAt: new Date().toISOString(),
        }),
      }
    );

    // Update tracking condition if exists
    await updateCondition(escrowId, "tracking_confirmation", {
      trackingNumber: trackingData.trackingNumber,
      carrierName: trackingData.carrier,
    });

    // Log event
    await logEscrowEvent(escrowId, {
      eventType: "shipped",
      description: `Item shipped via ${trackingData.carrier}: ${trackingData.trackingNumber}`,
      triggeredBy: "seller",
      data: trackingData,
    });

    // Check if all conditions are met
    await evaluateSettlementConditions(escrowId);

    return { success: true };
  } catch (error: any) {
    console.error("Error marking as shipped:", error);
    return { success: false, error: error.message };
  }
}

// ========================================
// BUYER ACTIONS
// ========================================

/**
 * Buyer confirms receipt of item
 * This is one of the settlement conditions
 */
export async function confirmReceipt(
  escrowId: string,
  buyerId: string,
  rating?: number,
  feedback?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { database } = await createAdminClient();

    const escrow = await database.getDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId
    );

    // Verify buyer owns this transaction
    if (escrow.buyerId !== buyerId) {
      return { success: false, error: "Unauthorized" };
    }

    if (!["shipped", "in_transit", "delivered"].includes(escrow.status)) {
      return {
        success: false,
        error: "Item must be delivered before confirming",
      };
    }

    // Update status
    const statusHistory = JSON.parse(escrow.statusHistoryJSON);
    statusHistory.push({
      status: "confirmed",
      timestamp: new Date().toISOString(),
      triggeredBy: "buyer",
      note: "Buyer confirmed receipt",
    });

    await database.updateDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId,
      {
        status: "confirmed",
        statusHistoryJSON: JSON.stringify(statusHistory),
      }
    );

    // Update buyer confirmation condition
    await updateCondition(escrowId, "buyer_confirmation", {
      confirmationRequired: true,
    });

    // Log event
    await logEscrowEvent(escrowId, {
      eventType: "confirmed",
      description: "Buyer confirmed receipt of item",
      triggeredBy: "buyer",
      data: { rating, feedback },
    });

    // Evaluate settlement conditions
    await evaluateSettlementConditions(escrowId);

    return { success: true };
  } catch (error: any) {
    console.error("Error confirming receipt:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Buyer opens a dispute
 */
export async function openDispute(
  escrowId: string,
  buyerId: string,
  reason: string,
  evidence?: {
    description: string;
    photos?: string[];
    documents?: string[];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { database } = await createAdminClient();

    const escrow = await database.getDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId
    );

    if (escrow.buyerId !== buyerId) {
      return { success: false, error: "Unauthorized" };
    }

    // Can only dispute certain statuses
    if (!["shipped", "in_transit", "delivered", "confirmed"].includes(escrow.status)) {
      return { success: false, error: "Cannot dispute at this stage" };
    }

    // Check if dispute period has expired
    if (escrow.disputePeriodEndsAt) {
      const now = new Date();
      const deadline = new Date(escrow.disputePeriodEndsAt);
      if (now > deadline) {
        return { success: false, error: "Dispute period has expired" };
      }
    }

    const statusHistory = JSON.parse(escrow.statusHistoryJSON);
    statusHistory.push({
      status: "disputed",
      timestamp: new Date().toISOString(),
      triggeredBy: "buyer",
      note: reason,
    });

    await database.updateDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId,
      {
        status: "disputed",
        statusHistoryJSON: JSON.stringify(statusHistory),
        disputeReason: reason,
        disputedAt: new Date().toISOString(),
      }
    );

    // Log event
    await logEscrowEvent(escrowId, {
      eventType: "disputed",
      description: `Buyer opened dispute: ${reason}`,
      triggeredBy: "buyer",
      data: evidence,
    });

    // TODO: Notify seller and platform admin
    // TODO: Pause any auto-release timers

    return { success: true };
  } catch (error: any) {
    console.error("Error opening dispute:", error);
    return { success: false, error: error.message };
  }
}

// ========================================
// SETTLEMENT CONDITION ENGINE
// ========================================

/**
 * Update a specific settlement condition
 */
async function updateCondition(
  escrowId: string,
  conditionType: SettlementConditionType,
  updates: Record<string, any>
): Promise<void> {
  try {
    const { database } = await createAdminClient();

    const escrow = await database.getDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId
    );

    const conditions: SettlementCondition[] = JSON.parse(
      escrow.settlementConditionsJSON
    );

    // Find and update the condition
    const conditionIndex = conditions.findIndex((c) => c.type === conditionType);

    if (conditionIndex >= 0) {
      conditions[conditionIndex].config = {
        ...conditions[conditionIndex].config,
        ...updates,
      };

      await database.updateDocument(
        DATABASE_ID!,
        ESCROW_TRANSACTIONS_COLLECTION_ID!,
        escrowId,
        {
          settlementConditionsJSON: JSON.stringify(conditions),
        }
      );
    }
  } catch (error) {
    console.error("Error updating condition:", error);
  }
}

/**
 * Evaluate all settlement conditions and trigger payout if all met
 */
export async function evaluateSettlementConditions(
  escrowId: string
): Promise<{
  allConditionsMet: boolean;
  unmetConditions: string[];
  released?: boolean;
}> {
  try {
    const { database } = await createAdminClient();

    const escrow = await database.getDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId
    );

    const conditions: SettlementCondition[] = JSON.parse(
      escrow.settlementConditionsJSON
    );

    // Evaluate each condition
    const evaluatedConditions = conditions.map((condition) =>
      evaluateCondition(condition, escrow)
    );

    // Check if all conditions are met
    const allMet = evaluatedConditions.every((c) => c.isMet);
    const unmet = evaluatedConditions
      .filter((c) => !c.isMet)
      .map((c) => c.description);

    // Update database with evaluation results
    await database.updateDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId,
      {
        settlementConditionsJSON: JSON.stringify(evaluatedConditions),
        allConditionsMet: allMet,
      }
    );

    // If all conditions met and not already released, trigger payout
    let released = false;
    if (allMet && !["released", "refunded", "disputed"].includes(escrow.status)) {
      const result = await releaseFundsToSeller(escrowId);
      released = result.success;
    }

    return {
      allConditionsMet: allMet,
      unmetConditions: unmet,
      released,
    };
  } catch (error) {
    console.error("Error evaluating settlement conditions:", error);
    return { allConditionsMet: false, unmetConditions: [] };
  }
}

/**
 * Evaluate a single settlement condition
 */
function evaluateCondition(
  condition: SettlementCondition,
  escrow: any
): SettlementCondition {
  const now = new Date();

  switch (condition.type) {
    case "tracking_confirmation":
      // Check if tracking number exists and item is delivered
      const hasTracking = !!condition.config.trackingNumber;
      const isDelivered = condition.config.deliveryConfirmed === true;
      condition.isMet = hasTracking && isDelivered;
      break;

    case "time_based":
      // Check if auto-release time has passed
      if (condition.config.autoReleaseAt) {
        const releaseDate = new Date(condition.config.autoReleaseAt);
        condition.isMet = now >= releaseDate;
      }
      break;

    case "buyer_confirmation":
      // Check if buyer confirmed
      condition.isMet = escrow.status === "confirmed";
      break;

    case "delivery_confirmation":
      // Check shipping details for delivery
      if (escrow.shippingDetailsJSON) {
        const shipping = JSON.parse(escrow.shippingDetailsJSON);
        condition.isMet = !!shipping.actualDelivery;
      }
      break;

    case "milestone_based":
      // Check if all milestones are complete
      if (condition.config.milestones) {
        condition.isMet = condition.config.milestones.every((m) => m.completed);
      }
      break;

    case "inspection_period":
      // Check if inspection period has passed without dispute
      if (condition.config.inspectionDeadline) {
        const deadline = new Date(condition.config.inspectionDeadline);
        condition.isMet = now >= deadline && escrow.status !== "disputed";
      }
      break;

    case "dual_signature":
      // Check if both parties signed
      condition.isMet =
        condition.config.buyerSigned === true &&
        condition.config.sellerSigned === true;
      break;

    default:
      condition.isMet = false;
  }

  if (condition.isMet && !condition.metAt) {
    condition.metAt = now.toISOString();
  }

  return condition;
}

// ========================================
// FUND RELEASE & PAYOUT
// ========================================

/**
 * Release funds to seller
 * This is the CORE escrow functionality - triggered when all conditions are met
 */
export async function releaseFundsToSeller(
  escrowId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { database } = await createAdminClient();

    const escrow = await database.getDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId
    );

    // Verify all conditions are met
    if (!escrow.allConditionsMet) {
      return { success: false, error: "Not all conditions are met" };
    }

    if (["released", "refunded"].includes(escrow.status)) {
      return { success: false, error: "Funds already released or refunded" };
    }

    // Step 1: Transfer funds to seller's Stripe Connect account
    const transfer = await stripe.transfers.create({
      amount: escrow.sellerAmount,
      currency: escrow.currency,
      destination: escrow.sellerStripeAccountId,
      transfer_group: escrowId,
      metadata: {
        escrowId,
        buyerId: escrow.buyerId,
        sellerId: escrow.sellerId,
      },
    });

    // Step 2: Immediately trigger payout to seller's bank account
    // NOTE: This moves funds from Stripe balance to seller's bank
    // Seller never sees the Stripe balance - funds go directly to their bank
    const payout = await stripe.payouts.create(
      {
        amount: escrow.sellerAmount,
        currency: escrow.currency,
        metadata: {
          escrowId,
          transferId: transfer.id,
        },
      },
      {
        stripeAccount: escrow.sellerStripeAccountId,
      }
    );

    // Update escrow status
    const statusHistory = JSON.parse(escrow.statusHistoryJSON);
    statusHistory.push({
      status: "released",
      timestamp: new Date().toISOString(),
      triggeredBy: "system",
      note: "All conditions met - funds released to seller",
    });

    await database.updateDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId,
      {
        status: "released",
        statusHistoryJSON: JSON.stringify(statusHistory),
        stripeTransferId: transfer.id,
        stripePayoutId: payout.id,
      }
    );

    // Log event
    await logEscrowEvent(escrowId, {
      eventType: "released",
      description: `Funds released to seller: ${escrow.sellerAmount / 100} ${escrow.currency}`,
      triggeredBy: "system",
      data: { transferId: transfer.id, payoutId: payout.id },
    });

    // TODO: Notify seller that funds are on the way to their bank account

    return { success: true };
  } catch (error: any) {
    console.error("Error releasing funds:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Refund to buyer (admin action or dispute resolution)
 */
export async function refundToBuyer(
  escrowId: string,
  refundAmount?: number, // If partial refund
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { database } = await createAdminClient();

    const escrow = await database.getDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId
    );

    if (["refunded", "released"].includes(escrow.status)) {
      return { success: false, error: "Transaction already completed" };
    }

    const amountToRefund = refundAmount || escrow.amount;

    // Issue refund
    const refund = await stripe.refunds.create({
      payment_intent: escrow.stripePaymentIntentId,
      amount: amountToRefund,
      reason: "requested_by_customer",
      metadata: {
        escrowId,
        refundReason: reason || "Dispute resolved in buyer's favor",
      },
    });

    // Update status
    const statusHistory = JSON.parse(escrow.statusHistoryJSON);
    statusHistory.push({
      status: "refunded",
      timestamp: new Date().toISOString(),
      triggeredBy: "platform",
      note: reason || "Refund issued",
    });

    await database.updateDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId,
      {
        status: "refunded",
        statusHistoryJSON: JSON.stringify(statusHistory),
      }
    );

    // Log event
    await logEscrowEvent(escrowId, {
      eventType: "refunded",
      description: `Refund issued to buyer: ${amountToRefund / 100} ${escrow.currency}`,
      triggeredBy: "platform",
      data: { refundId: refund.id, amount: amountToRefund, reason },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error refunding to buyer:", error);
    return { success: false, error: error.message };
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Log an event in the escrow transaction history
 */
async function logEscrowEvent(
  escrowTransactionId: string,
  event: {
    eventType: EscrowEvent["eventType"];
    description: string;
    triggeredBy: "buyer" | "seller" | "platform" | "system" | "webhook";
    data?: Record<string, any>;
  }
): Promise<void> {
  try {
    const { database } = await createAdminClient();

    await database.createDocument(
      DATABASE_ID!,
      ESCROW_EVENTS_COLLECTION_ID!,
      ID.unique(),
      {
        escrowTransactionId,
        eventType: event.eventType,
        description: event.description,
        triggeredBy: event.triggeredBy,
        dataJSON: JSON.stringify(event.data || {}),
      }
    );
  } catch (error) {
    console.error("Error logging escrow event:", error);
  }
}

/**
 * Get platform configuration
 */
async function getPlatformConfig(): Promise<EscrowPlatformConfig> {
  try {
    const { database } = await createAdminClient();

    const configs = await database.listDocuments(
      DATABASE_ID!,
      ESCROW_CONFIG_COLLECTION_ID!,
      [Query.limit(1)]
    );

    if (configs.total > 0) {
      return parseStringify(configs.documents[0]);
    }

    // Return defaults if no config exists
    return {
      $id: "",
      platformFeePercentage: 2.5,
      platformFeeFixed: 30,
      stripeFeePercentage: 2.9,
      stripeFeeFixed: 30,
      defaultDisputePeriodDays: 7,
      defaultAutoReleaseDays: 14,
      defaultInspectionDays: 3,
      minTransactionAmount: 100, // $1.00
      maxTransactionAmount: 1000000, // $10,000
      requiresTrackingAbove: 5000, // $50
      supportEmail: "support@yourapp.com",
      termsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/terms`,
      privacyUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/privacy`,
      $createdAt: "",
      $updatedAt: "",
    };
  } catch (error) {
    console.error("Error getting platform config:", error);
    throw error;
  }
}

/**
 * Get default settlement conditions based on item type
 */
async function getDefaultConditionsForItemType(
  itemType: "physical_goods" | "digital_goods" | "service" | "subscription",
  config: EscrowPlatformConfig
): Promise<SettlementCondition[]> {
  const now = new Date();

  switch (itemType) {
    case "physical_goods":
      return [
        {
          type: "tracking_confirmation",
          description: "Seller must provide tracking and item must be delivered",
          isMet: false,
          config: {
            requireTracking: true,
          },
          priority: 1,
        },
        {
          type: "buyer_confirmation",
          description: "Buyer must confirm receipt OR",
          isMet: false,
          config: {
            confirmationRequired: true,
          },
          priority: 2,
        },
        {
          type: "time_based",
          description: `Auto-release after ${config.defaultAutoReleaseDays} days if no dispute`,
          isMet: false,
          config: {
            autoReleaseDays: config.defaultAutoReleaseDays,
            autoReleaseAt: new Date(
              now.getTime() + config.defaultAutoReleaseDays * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          priority: 3,
        },
      ];

    case "digital_goods":
      return [
        {
          type: "buyer_confirmation",
          description: "Buyer must confirm receipt OR",
          isMet: false,
          config: {
            confirmationRequired: true,
          },
          priority: 1,
        },
        {
          type: "time_based",
          description: "Auto-release after 48 hours if no dispute",
          isMet: false,
          config: {
            autoReleaseDays: 2,
            autoReleaseAt: new Date(
              now.getTime() + 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          priority: 2,
        },
      ];

    case "service":
      return [
        {
          type: "milestone_based",
          description: "All service milestones must be completed",
          isMet: false,
          config: {
            milestones: [
              {
                id: "1",
                description: "Service completed",
                percentage: 100,
                completed: false,
              },
            ],
          },
          priority: 1,
        },
        {
          type: "buyer_confirmation",
          description: "Buyer must confirm completion",
          isMet: false,
          config: {
            confirmationRequired: true,
          },
          priority: 2,
        },
      ];

    default:
      return [
        {
          type: "time_based",
          description: `Auto-release after ${config.defaultAutoReleaseDays} days`,
          isMet: false,
          config: {
            autoReleaseDays: config.defaultAutoReleaseDays,
            autoReleaseAt: new Date(
              now.getTime() + config.defaultAutoReleaseDays * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          priority: 1,
        },
      ];
  }
}

/**
 * Get escrow transaction by ID
 */
export async function getEscrowTransaction(
  escrowId: string
): Promise<EscrowTransaction | null> {
  try {
    const { database } = await createAdminClient();

    const escrow = await database.getDocument(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      escrowId
    );

    return parseStringify(escrow);
  } catch (error) {
    console.error("Error getting escrow transaction:", error);
    return null;
  }
}

/**
 * Get user's escrow transactions (buyer or seller)
 */
export async function getUserEscrowTransactions(
  userId: string,
  role: "buyer" | "seller"
): Promise<EscrowTransaction[]> {
  try {
    const { database } = await createAdminClient();

    const field = role === "buyer" ? "buyerId" : "sellerId";

    const escrows = await database.listDocuments(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      [Query.equal(field, [userId]), Query.orderDesc("$createdAt")]
    );

    return parseStringify(escrows.documents);
  } catch (error) {
    console.error("Error getting user escrow transactions:", error);
    return [];
  }
}
