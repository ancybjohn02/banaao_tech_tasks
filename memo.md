# Decision Memo: Retirement of Vendor Routing Bot & Deployment of Internal Classifier

**To:** Ritu Deshpande, Head of D2C Operations, Kestrel Home Appliances  
**From:** AI & Operations Advisory Team  
**Date:** 15 October 2026  
**Subject:** Retirement of Vendor Routing Bot & Deployment of Internal Classifier

---

## 1. The Decision

**Switch off the vendor routing bot contract and deploy the internal Kestrel routing engine.** Do not renew the ₹3.2 lakh annual license.

The replacement model meets and exceeds the required accuracy threshold, runs on existing infrastructure with **zero incremental API or per-ticket costs**, and aims to eliminate the misrouting loops that have congested Meenal's service desk.

---

## 2. The Numbers

| Evaluation Metric | Chronological Holdout (April–June 2026) | Stratified Holdout |
|:---|---:|---:|
| Accuracy | **94.50%** | **94.92%** |
| Macro-F1 Score | **94.35%** | **94.77%** |
| Total Error Rate | **5.50%** | **5.08%** |

The chronological holdout evaluates the model on the newest 20% of requests (April–June 2026), while stratified holdout testing evaluates performance across a random split.

The chronological accuracy of **94.50%** exceeds the required **90.0% acceptance threshold** by 4.5 percentage points.

More critically, historical team renames have been mapped to Kestrel's **seven canonical specialist queues**, avoiding fragmentation across discontinued legacy queues.

| Legacy Queue | Canonical Queue |
|:---|:---|
| `Installations` | `Installs & Demo` |
| `Consumables` | `Filters & Consumables` |

---

## 3. Financial Impact

### Cost Comparison

| Cost Driver | Current Vendor Bot | Internal Kestrel Model | Estimated Savings |
|:---|---:|---:|---:|
| Annual software license | ₹3,20,000 | ₹0 | **₹3,20,000** |
| Misrouting cost per error | ₹565 | ₹565 | — |
| Estimated errors per 10,000 tickets | ~1,200 (88% accuracy) | ~550 (94.5% accuracy) | ~650 fewer errors |
| Misrouting cost per 10,000 tickets | ₹6,78,000 | ₹3,10,750 | **₹3,67,250** |

### Estimated Annual Savings

| Component | Estimated Savings |
|:---|---:|
| Annual license savings | ₹3,20,000 |
| Misrouting cost reduction | ₹3,67,250 |
| **Total Estimated Annual Savings** | **₹6,87,250** |

By running a lightweight scikit-learn model locally on the existing CRM server, the solution avoids external AI API charges and additional per-ticket inference fees.

This directly addresses Finance Controller Farhan Sheikh's concern about recurring cloud AI costs.

> **Financial assumption:** The estimated annual savings assume 10,000 tickets per month, or 120,000 tickets per year. Actual savings should be validated against production ticket volumes and measured misrouting rates.

---

## 4. Implementation Plan: Next Week

### Monday — Non-Renewal Notice

- Formally notify the vendor that Kestrel will not renew the routing bot contract at expiry.
- Confirm the termination notice period and any contractual obligations.

### Tuesday–Wednesday — Dark Launch / Shadow Mode

Run the internal classifier alongside the existing workflow without automatically assigning or transferring tickets.

- Generate predictions for incoming requests.
- Compare predictions against agent-confirmed routing decisions.
- Track accuracy, macro-F1, confidence calibration, and queue-level performance.
- Investigate misroutes and verify whether production performance aligns with the 94.50% chronological benchmark.

### Thursday — Implement the Billing Guardrail

In accordance with Operations Policy §3 and Meenal's feedback, enforce the following rule:

> **Route to Billing only when the primary issue concerns payment failure, duplicate deduction, or invoice dispute.**

If a customer merely mentions having already paid for installation, route the request to `Installs & Demo` or `Repairs`, depending on the primary issue.

Test the rule against representative historical tickets before enabling it in production.

### Friday — Confidence-Based Routing

Enable automatic routing for requests where model confidence is **≥ 70%**, targeting approximately **85% of ticket volume**, subject to successful shadow-mode validation.

For requests below the confidence threshold:

- Route them to a centralized Tier-1 triage queue.
- Display the model's suggested destination and alternative queues.
- Require human confirmation before final assignment.

Monitor routing accuracy, override rates, and queue-level error patterns after rollout. Retain a rollback path to the existing workflow until the internal model demonstrates stable production performance.

---

## 5. Success Criteria

The deployment will be considered successful when it demonstrates:

- [ ] Chronological holdout accuracy of at least **90.0%**.
- [ ] Stable routing performance across all seven canonical queues.
- [ ] Correct application of the Billing Guardrail.
- [ ] Production validation of the targeted **85% auto-routing coverage**.
- [ ] Human review for low-confidence cases.
- [ ] No unexpected external AI API or per-ticket inference charges.
- [ ] Measurable reduction in misrouting incidents and repeat customer calls.

---

## Recommendation

Proceed with the internal classifier through a controlled shadow-mode rollout, validate its performance against real incoming tickets, and enable confidence-based automation only after the acceptance criteria are met.

**Decision requested:** Approve vendor non-renewal planning and the controlled deployment of the internal Kestrel routing engine.
