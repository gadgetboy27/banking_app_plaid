# Escrow Settlement Condition Examples

## Overview

This document provides real-world examples of how settlement conditions work to protect both buyers and sellers in various transaction scenarios.

## Key Principle: Seller Never Sees Stripe Balance

**CRITICAL:** Using Stripe Connect **Custom** accounts means:
- ✅ Seller has NO access to Stripe dashboard
- ✅ Seller CANNOT see funds in Stripe balance
- ✅ Seller CANNOT manually withdraw funds
- ✅ Platform controls 100% of payout timing
- ✅ Funds go DIRECTLY from Stripe to seller's bank account when released
- ✅ Seller only sees balance and transactions in YOUR app

---

## Scenario 1: Physical Goods (Standard E-commerce)

### Product: Vintage Camera - $450 NZD

**Settlement Conditions:**
1. **Tracking Confirmation** (Priority 1)
   - Seller must provide courier tracking number
   - Item must show "delivered" status from courier API

2. **Buyer Confirmation** (Priority 2)
   - Buyer has option to confirm receipt early
   - OR wait for automatic conditions

3. **Time-Based Auto-Release** (Priority 3)
   - Auto-release after 14 days if no dispute
   - Starts counting from payment capture

### Transaction Flow:

```
Day 0: Buyer pays $450
├─ Payment captured
├─ Stripe holds funds
└─ Status: PAYMENT_RECEIVED

Day 1: Seller ships camera
├─ Enters tracking: NZP123456789
├─ Tracking URL generated
└─ Status: SHIPPED

Day 3: Courier updates
├─ Webhook from courier: "In transit"
└─ Status: IN_TRANSIT

Day 5: Package delivered
├─ Courier webhook: "Delivered"
├─ Tracking condition MET ✅
├─ Start 7-day dispute period
└─ Status: DELIVERED

Day 6: Buyer confirms receipt
├─ Buyer clicks "Confirm Receipt" in app
├─ Buyer confirmation condition MET ✅
├─ All conditions satisfied
├─ System triggers release
├─ Transfer $437 to seller's Connect account
├─ Immediately trigger payout
└─ Status: RELEASED

Day 8-10: Funds arrive in seller's bank
├─ Seller receives notification
└─ Seller sees transaction in YOUR app, not Stripe

Platform fee: $13 (2.9% + $0.30)
Seller receives: $437
Buyer protection: 7-day dispute window after delivery
```

---

## Scenario 2: Digital Goods (Software License)

### Product: Premium Plugin License - $99 USD

**Settlement Conditions:**
1. **Buyer Confirmation** (Priority 1)
   - Buyer must confirm download/activation

2. **Time-Based Auto-Release** (Priority 2)
   - Auto-release after 48 hours (digital goods are faster)

### Transaction Flow:

```
Hour 0: Buyer purchases
├─ Payment captured
└─ Status: PAYMENT_RECEIVED

Hour 0.5: Seller delivers
├─ License key generated automatically
├─ Email sent to buyer with download link
└─ Status: CONFIRMED (instant for digital)

Hour 2: Buyer confirms
├─ Buyer activates license key
├─ Confirmation condition MET ✅
├─ 48-hour timer condition NOT YET MET
└─ Status: Still CONFIRMED (waiting for timer)

Hour 48: Auto-release timer expires
├─ Time-based condition MET ✅
├─ All conditions satisfied
├─ System triggers release
└─ Status: RELEASED

Seller receives: $95.18
Platform fee: $3.82
Release time: 48 hours maximum
```

**Why 48 hours for digital goods?**
- Buyer has time to test the product
- Prevents instant chargebacks
- Gives platform time to detect fraud
- Shorter than physical goods (no shipping involved)

---

## Scenario 3: Freelance Service (Web Design Project)

### Project: Website Redesign - $3,500 USD

**Settlement Conditions:**
1. **Milestone-Based** (Priority 1)
   - 3 milestones must be completed
   - Each milestone approved by buyer

2. **Buyer Confirmation** (Priority 2)
   - Final deliverable must be approved

### Milestones:

```
Milestone 1: Design Mockups (30% - $1,050)
Milestone 2: Development (60% - $2,100)
Milestone 3: Final Delivery (10% - $350)
```

### Transaction Flow:

```
Week 0: Buyer pays full $3,500
├─ Full amount captured upfront
├─ Funds held in escrow
└─ Status: PAYMENT_RECEIVED

Week 2: Milestone 1 complete
├─ Seller marks Milestone 1 as done
├─ Uploads mockup files
├─ Buyer reviews and approves
├─ Milestone 1 condition MET ✅
├─ Conditions: 33% complete
└─ Status: Still PAYMENT_RECEIVED

Week 4: Milestone 2 complete
├─ Development finished
├─ Buyer tests staging site
├─ Buyer approves
├─ Milestone 2 condition MET ✅
├─ Conditions: 66% complete
└─ Status: Still PAYMENT_RECEIVED

Week 5: Milestone 3 complete
├─ Seller delivers final files + handoff
├─ Buyer confirms final delivery
├─ Milestone 3 condition MET ✅
├─ Buyer confirmation condition MET ✅
├─ ALL conditions satisfied ✅
├─ System triggers release
└─ Status: RELEASED

Seller receives: $3,394.50
Platform fee: $105.50
Total project time: 5 weeks
Buyer protection: Milestone-based approval
Seller protection: Full payment upfront
```

**Alternative: Milestone-Based Partial Releases**

For longer projects, you could release funds per milestone:

```typescript
// Custom implementation (not in base system)
Milestone 1 approved → Release 30% ($1,050)
Milestone 2 approved → Release 60% ($2,100)
Milestone 3 approved → Release 10% ($350)
```

---

## Scenario 4: High-Value Item with Inspection Period

### Product: Used MacBook Pro - $2,800 NZD

**Settlement Conditions:**
1. **Delivery Confirmation** (Priority 1)
   - Must be signature-required delivery

2. **Inspection Period** (Priority 2)
   - 3-day inspection period after delivery
   - Buyer can test the item

3. **Buyer Confirmation OR Timer** (Priority 3)
   - Buyer confirms item is as described
   - OR 3 days pass without dispute

### Transaction Flow:

```
Day 0: Buyer pays $2,800
└─ Status: PAYMENT_RECEIVED

Day 2: Seller ships with signature delivery
├─ Tracking: ARAMEX-SIGNATURE-REQ
└─ Status: SHIPPED

Day 5: Package delivered
├─ Signature: "J. Smith"
├─ Delivery confirmation uploaded
├─ Delivery condition MET ✅
├─ START 3-day inspection period
└─ Status: DELIVERED

Days 5-8: Inspection period
├─ Buyer tests laptop
├─ Checks specs, condition, functionality
├─ Inspection timer running...
└─ Status: DELIVERED (inspection active)

Day 6: Buyer confirms
├─ Buyer satisfied with condition
├─ Clicks "Accept Item"
├─ Inspection condition MET ✅
├─ Buyer confirmation condition MET ✅
├─ All conditions satisfied
└─ Status: RELEASED

Seller receives: $2,717
Platform fee: $83
Buyer protection: 3-day inspection + 7-day dispute after
Seller protection: Immediate payout after inspection approval
```

**What if buyer finds an issue?**

```
Day 6: Buyer discovers problem
├─ Opens dispute: "Screen has crack not shown in photos"
├─ Uploads evidence photos
├─ Status: DISPUTED

Platform Review:
├─ Reviews seller's listing photos
├─ Reviews buyer's evidence photos
├─ Contacts both parties
└─ Resolution options:
    1. Full refund → $2,800 back to buyer
    2. Partial refund → $2,500 to seller, $300 to buyer
    3. Release to seller → Buyer claim denied
```

---

## Scenario 5: Subscription/Recurring Service

### Service: Monthly Social Media Management - $500/month

**Settlement Conditions:**
1. **Time-Based** (Priority 1)
   - Auto-release after 30 days of service

2. **Buyer Confirmation** (Priority 2)
   - Buyer can confirm early if satisfied

### Month 1 Flow:

```
Day 1: First month payment captured
└─ Status: PAYMENT_RECEIVED

Days 1-30: Service delivered
├─ Seller posts content throughout month
├─ Provides analytics reports
└─ Status: PAYMENT_RECEIVED

Day 30: Timer expires
├─ 30-day service period complete
├─ Time-based condition MET ✅
├─ All conditions satisfied
└─ Status: RELEASED

Day 32: Seller receives funds
```

### Month 2 Flow:

```
Day 31: New month, new escrow
└─ New escrow transaction created for $500

Day 45: Buyer confirms early
├─ Buyer very satisfied with performance
├─ Confirms receipt early
├─ Funds released after 15 days instead of 30
└─ Status: RELEASED
```

---

## Scenario 6: Dual Signature (Business Contract)

### Contract: Enterprise Software Development - $50,000 USD

**Settlement Conditions:**
1. **Dual Signature** (Priority 1)
   - BOTH buyer AND seller must sign off
   - Used for large contracts with acceptance criteria

2. **Milestone-Based** (Priority 2)
   - Multiple development phases

### Transaction Flow:

```
Day 0: Contract signed, payment captured
└─ $50,000 held in escrow

Week 12: Development complete
├─ Seller marks project complete
├─ Submits for approval
├─ Seller signs: "Work complete" ✅
└─ Awaiting buyer signature

Week 13: Buyer review
├─ Buyer tests deliverables
├─ Runs acceptance tests
├─ Everything passes
├─ Buyer signs: "Accepted" ✅
├─ Dual signature condition MET ✅
└─ Status: RELEASED

Seller receives: $48,550
Platform fee: $1,450
Protection: Both parties must agree before release
```

---

## Scenario 7: What if Seller Never Ships?

### Product: Designer Handbag - $1,200 USD

```
Day 0: Buyer pays
└─ Status: PAYMENT_RECEIVED

Days 1-3: Waiting for shipping
└─ System sends reminder to seller

Day 3: Seller hasn't shipped
└─ System sends FINAL NOTICE

Day 5: Still no shipment
├─ Buyer can request cancellation
├─ Platform reviews
├─ No tracking provided = seller fault
└─ REFUND to buyer

Result: Full refund to buyer
Seller rating: Decreased
Seller status: May be suspended
```

---

## Scenario 8: What if Tracking Shows Delivered but Buyer Disputes?

### Product: Sneakers - $350 USD

```
Day 5: Tracking shows "Delivered"
└─ Status: DELIVERED

Day 6: Buyer claims "Never received"
├─ Opens dispute
├─ Uploads evidence: "I was home all day, no package"
└─ Status: DISPUTED

Platform Investigation:
├─ Checks tracking: Delivered to mailbox
├─ Checks delivery photo (if available)
├─ Asks seller for proof
├─ Contacts courier

Possible Resolutions:
1. Courier confirms misdelivery → REFUND buyer
2. Delivery photo shows package at door → RELEASE to seller
3. Neighbor signed for package → RELEASE to seller (buyer error)
4. Insufficient evidence → SPLIT 50/50 (rare)
```

---

## Scenario 9: Automatic Release Examples

### Example A: Silent Buyer (Happy but Doesn't Confirm)

```
Day 5: Package delivered
Day 6-12: Buyer doesn't confirm (but happy)
Day 12: 7-day dispute period ends with no dispute
Day 14: Auto-release timer (14 days from payment)
├─ Time-based condition MET ✅
├─ No disputes filed
├─ Tracking shows delivered
└─ AUTOMATIC RELEASE

Seller gets paid even though buyer never clicked "confirm"
```

### Example B: Buyer on Vacation

```
Day 5: Package delivered
Day 5-15: Buyer on vacation, doesn't check deliveries
Day 15: Returns from vacation, sees package
Day 16: "Oh I got it!" - tries to confirm
Day 16: Already auto-released on day 14
└─ Funds already sent to seller
```

---

## Settlement Condition Evaluation Logic

### Condition Priority System

Conditions are evaluated in priority order:

```typescript
Priority 1: tracking_confirmation
├─ IF tracking shows delivered
└─ THEN condition MET

Priority 2: buyer_confirmation
├─ IF buyer clicks "Confirm Receipt"
└─ OR (skip if Priority 1 met)

Priority 3: time_based
├─ IF current_date >= auto_release_date
└─ AND no_active_disputes
└─ THEN condition MET

ALL conditions with isMet=true → TRIGGER RELEASE
```

### OR Logic vs AND Logic

**OR Logic (Most Common):**
```
Condition 1 OR Condition 2 OR Condition 3

Example: Physical Goods
- Tracking delivered ✅ → Release
- OR buyer confirms ✅ → Release
- OR 14 days pass ✅ → Release

Only ONE needs to be met
```

**AND Logic (High-Risk Items):**
```
Condition 1 AND Condition 2 AND Condition 3

Example: Expensive Electronics
- Tracking delivered ✅
- AND 3-day inspection passed ✅
- AND buyer confirms ✅ → Release

ALL must be met
```

Configure in settlement conditions:
```typescript
{
  type: "delivery_confirmation",
  required: true, // AND logic
  priority: 1
}

vs

{
  type: "buyer_confirmation",
  required: false, // OR logic
  priority: 2
}
```

---

## Platform Fees & Economics

### Fee Structure

```
Base Rate: 2.9% + $0.30 (Stripe)
Platform Fee: 2.5% (your revenue)

Example: $100 transaction
- Stripe fee: $3.20
- Platform fee: $2.50
- Seller receives: $94.30
- Your revenue: $2.50 per transaction
```

### Volume Projections

```
100 transactions/month × $150 avg = $15,000 volume
Platform revenue: $375/month

1,000 transactions/month × $150 avg = $150,000 volume
Platform revenue: $3,750/month

10,000 transactions/month × $150 avg = $1.5M volume
Platform revenue: $37,500/month
```

---

## Dispute Resolution Framework

### Level 1: Automated (70% of cases)
```
Clear evidence → Auto-resolve
- Tracking shows delivered + photo
- Digital delivery confirmed
- Both parties agree
```

### Level 2: Platform Review (25% of cases)
```
Evidence review by platform team
- Compare seller description vs buyer claim
- Review photos/documentation
- Contact courier if needed
- Decision within 48 hours
```

### Level 3: Mediation (5% of cases)
```
Complex disputes
- High value ($1,000+)
- Conflicting evidence
- Both parties have valid claims
- May involve third-party arbitration
```

---

## Security & Fraud Prevention

### Red Flags That Prevent Auto-Release

1. **New seller account** (<30 days) → Manual review
2. **High-value transaction** (>$1,000) → Extended hold
3. **Different shipping address** than billing → Verification required
4. **Buyer dispute history** → Investigate before release
5. **Seller shipping delays** → Require proof before release

### Fraud Detection

```typescript
// Check before releasing funds
if (sellerAccountAge < 30 days && transactionAmount > $500) {
  // Hold for 7 additional days
  // Verify tracking authenticity
  // Check for stolen credit cards
}

if (buyerDisputeRate > 20%) {
  // Flag as potentially fraudulent buyer
  // Require signature delivery
  // Video unboxing proof
}
```

---

## Summary: Why This Protects Both Parties

### Buyer Protection:
✅ Money held until delivery confirmed
✅ Inspection period for expensive items
✅ Dispute window after delivery
✅ Platform mediates disputes
✅ Can't be scammed by fake sellers

### Seller Protection:
✅ Payment guaranteed once item delivered
✅ Can't access funds prevents impulsive withdrawal
✅ Automatic release after timer (no buyer ghosting)
✅ Tracking proves delivery
✅ Platform mediates disputes (not just buyer's word)

### Platform Control:
✅ Custom Stripe accounts = no seller dashboard access
✅ Manual payouts = full control
✅ Immediate transfer to bank = no Stripe balance visibility
✅ Programmable conditions = flexible rules
✅ Audit trail = compliance ready

**This is truly escrow done right.** 🎯
