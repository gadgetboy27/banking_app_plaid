import { NextRequest, NextResponse } from "next/server";
import { runAllEscrowCronJobs } from "@/lib/cron/escrow-auto-release";

/**
 * Escrow Auto-Release Cron Job API Route
 *
 * SETUP INSTRUCTIONS:
 *
 * ## Vercel Cron (Recommended):
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/escrow-auto-release",
 *     "schedule": "0 * * * *"  // Every hour
 *   }]
 * }
 *
 * ## Manual Trigger (for testing):
 * curl -X POST https://yourapp.com/api/cron/escrow-auto-release \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 *
 * ## Security:
 * Set CRON_SECRET in your environment variables
 */

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      // In development, allow without secret but log warning
      console.warn("[CRON] CRON_SECRET not set - anyone can trigger this endpoint!");
    }

    // Run the cron job
    const results = await runAllEscrowCronJobs();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error("[CRON API] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron (some services use GET instead of POST)
export async function GET(request: NextRequest) {
  return POST(request);
}
