/**
 * ESCROW AUTO-RELEASE CRON JOB
 *
 * This job runs periodically (recommended: every hour) to:
 * 1. Check all active escrow transactions
 * 2. Evaluate settlement conditions
 * 3. Auto-release funds when time-based conditions are met
 * 4. Update tracking statuses from carrier APIs
 *
 * Deploy this as:
 * - Vercel Cron: /api/cron/escrow-auto-release (every hour)
 * - AWS Lambda: Scheduled EventBridge rule
 * - Railway: Cron plugin
 */

import { createAdminClient } from "../appwrite";
import { Query } from "node-appwrite";
import { evaluateSettlementConditions } from "../actions/escrow.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_ESCROW_TRANSACTIONS_COLLECTION_ID: ESCROW_TRANSACTIONS_COLLECTION_ID,
} = process.env;

export async function runEscrowAutoRelease(): Promise<{
  processed: number;
  released: number;
  errors: number;
  details: any[];
}> {
  console.log("[CRON] Starting escrow auto-release job...");

  const results = {
    processed: 0,
    released: 0,
    errors: 0,
    details: [] as any[],
  };

  try {
    const { database } = await createAdminClient();

    // Get all active escrow transactions that haven't been released/refunded
    const activeStatuses = [
      "payment_received",
      "shipped",
      "in_transit",
      "delivered",
      "confirmed",
    ];

    for (const status of activeStatuses) {
      const escrows = await database.listDocuments(
        DATABASE_ID!,
        ESCROW_TRANSACTIONS_COLLECTION_ID!,
        [Query.equal("status", [status]), Query.limit(100)]
      );

      console.log(`[CRON] Found ${escrows.total} transactions with status: ${status}`);

      for (const escrow of escrows.documents) {
        results.processed++;

        try {
          // Evaluate settlement conditions
          const evaluation = await evaluateSettlementConditions(escrow.$id);

          if (evaluation.released) {
            results.released++;
            results.details.push({
              escrowId: escrow.$id,
              action: "released",
              amount: escrow.sellerAmount,
              reason: "All conditions met",
            });

            console.log(`[CRON] ✅ Released funds for escrow ${escrow.$id}`);
          } else if (evaluation.allConditionsMet) {
            results.details.push({
              escrowId: escrow.$id,
              action: "conditions_met",
              status: "awaiting_release",
            });

            console.log(
              `[CRON] ⏳ Conditions met for ${escrow.$id} but not yet released`
            );
          } else {
            // Log unmet conditions for monitoring
            results.details.push({
              escrowId: escrow.$id,
              action: "evaluated",
              unmetConditions: evaluation.unmetConditions,
            });
          }
        } catch (error: any) {
          results.errors++;
          results.details.push({
            escrowId: escrow.$id,
            action: "error",
            error: error.message,
          });

          console.error(`[CRON] ❌ Error processing escrow ${escrow.$id}:`, error);
        }
      }
    }

    console.log(`[CRON] Escrow auto-release job completed:
      - Processed: ${results.processed}
      - Released: ${results.released}
      - Errors: ${results.errors}
    `);

    return results;
  } catch (error) {
    console.error("[CRON] Fatal error in escrow auto-release job:", error);
    throw error;
  }
}

/**
 * Update tracking statuses from carrier APIs
 * This checks shipping carrier APIs to update delivery status
 */
export async function updateTrackingStatuses(): Promise<void> {
  try {
    const { database } = await createAdminClient();

    // Get all escrows with tracking numbers that aren't delivered yet
    const escrows = await database.listDocuments(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      [
        Query.equal("status", ["shipped", "in_transit"]),
        Query.isNotNull("shippingDetailsJSON"),
        Query.limit(100),
      ]
    );

    for (const escrow of escrows.documents) {
      try {
        const shippingDetails = JSON.parse(escrow.shippingDetailsJSON);

        if (!shippingDetails.trackingNumber) continue;

        // Check carrier API for delivery status
        // TODO: Integrate with carrier APIs (FedEx, UPS, USPS, etc.)
        // const trackingStatus = await checkCarrierTracking(
        //   shippingDetails.carrier,
        //   shippingDetails.trackingNumber
        // );

        // if (trackingStatus.delivered) {
        //   // Update escrow status to delivered
        //   // Update condition to mark delivery as confirmed
        // }

        console.log(
          `[CRON] TODO: Check tracking for ${shippingDetails.trackingNumber}`
        );
      } catch (error) {
        console.error(`Error updating tracking for escrow ${escrow.$id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in updateTrackingStatuses:", error);
  }
}

/**
 * Send reminder notifications for pending actions
 */
export async function sendEscrowReminders(): Promise<void> {
  try {
    const { database } = await createAdminClient();

    // Find escrows where seller hasn't shipped after 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const unshipped = await database.listDocuments(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      [
        Query.equal("status", ["payment_received"]),
        Query.lessThan("$createdAt", threeDaysAgo.toISOString()),
        Query.limit(50),
      ]
    );

    for (const escrow of unshipped.documents) {
      // TODO: Send notification to seller
      console.log(
        `[CRON] TODO: Remind seller ${escrow.sellerId} to ship escrow ${escrow.$id}`
      );
    }

    // Find escrows where buyer hasn't confirmed after delivery + 2 days
    const needsConfirmation = await database.listDocuments(
      DATABASE_ID!,
      ESCROW_TRANSACTIONS_COLLECTION_ID!,
      [Query.equal("status", ["delivered"]), Query.limit(50)]
    );

    for (const escrow of needsConfirmation.documents) {
      if (escrow.shippingDetailsJSON) {
        const shipping = JSON.parse(escrow.shippingDetailsJSON);
        if (shipping.actualDelivery) {
          const deliveryDate = new Date(shipping.actualDelivery);
          const twoDaysAfterDelivery = new Date(deliveryDate);
          twoDaysAfterDelivery.setDate(twoDaysAfterDelivery.getDate() + 2);

          if (new Date() > twoDaysAfterDelivery) {
            // TODO: Send reminder to buyer to confirm receipt
            console.log(
              `[CRON] TODO: Remind buyer ${escrow.buyerId} to confirm receipt for escrow ${escrow.$id}`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error sending escrow reminders:", error);
  }
}

// Export combined job runner
export async function runAllEscrowCronJobs(): Promise<any> {
  console.log("[CRON] Starting all escrow cron jobs...");

  const autoReleaseResults = await runEscrowAutoRelease();
  await updateTrackingStatuses();
  await sendEscrowReminders();

  console.log("[CRON] All escrow cron jobs completed");

  return autoReleaseResults;
}
