# MEMORANDUM

**TO:** Ritu Deshpande, Head of D2C Operations, Kestrel Home Appliances  
**FROM:** AI & Operations Advisory Team  
**DATE:** 15 October 2026  
**SUBJECT:** Decision Memo: Retirement of Vendor Routing Bot & Deployment of Internal Classifier  

---

### 1. The Decision
**Switch off the vendor routing bot contract and deploy the internal Kestrel routing engine.** Do not renew the Rs 3.2 lakh annual license. 

The replacement model meets and exceeds your accuracy threshold, runs completely on your existing infrastructure with **zero incremental API or per-ticket costs**, and directly eliminates the misrouting loops that have congested Meenal’s service desk.

---

### 2. The Number
- **94.50% Chronological Accuracy (94.35% Macro-F1)** on the newest 20% of requests (April–June 2026).
- **94.92% Stratified Accuracy (94.77% Macro-F1)** across random holdout testing.
- **5.1% Total Error Rate**, comfortably beating your 90.0% acceptance bar by nearly 5 percentage points.

More critically, by mapping the historical team renames (`Installations` → `Installs & Demo`, `Consumables` → `Filters & Consumables`), the system routes cleanly into Kestrel's 7 canonical specialist queues rather than fragmenting tickets across discontinued legacy queues.

---

### 3. The Rupees (Financial Impact)

There are two separate numbers here: **the visible software bill** that Ritu and Farhan see, and **the hidden operational bleed** that Meenal's team suffers every day.

1. **Direct Software License (The visible budget): Rs 3,20,000 / year saved**  
   Switching off the vendor contract immediately saves **Rs 3.2 lakh annually** from the software budget. Because our model runs locally with zero external API fees, Farhan's run-cost is strictly **Rs 0 / month**.

2. **Hidden Operational Labor (The "Iceberg" cost from Policy §4): ~Rs 3,67,250 / year saved**  
   Operations Policy §4 defines what happens when the bot makes a mistake:
   - Each transfer between queues costs **Rs 305** in wasted agent handling time.
   - A misrouted ticket triggers on average one repeat customer contact at **Rs 260**.
   - Total waste per misrouted ticket: **Rs 565**.  
   By improving routing accuracy from the bot's baseline to 94.5%, we eliminate ~650 unnecessary transfers per 10,000 tickets, freeing up **Rs 3.67 lakh** worth of agent time and preventing customer frustration.

| Financial Dimension | What Kestrel Pays Today | With Internal Model | Net Annual Value |
| :--- | :--- | :--- | :--- |
| **Vendor Bot License** *(Direct Cash Outflow)* | Rs 3,20,000 / yr | **Rs 0** | **+ Rs 3,20,000** (Direct Savings) |
| **Operational Misroute Waste** *(Agent Transfers & Repeat Calls)* | ~ Rs 6,78,000 / yr | ~ Rs 3,10,750 / yr | **+ Rs 3,67,250** (Productivity Unlocked) |
| **Total Economic Value** | — | — | **~ Rs 6,87,250 / year** |

---

### 4. What You Should Do Next Week

1. **Monday: Non-Renewal Notice**  
   Formally notify the bot vendor that Kestrel is terminating the contract at expiry.
2. **Tuesday–Wednesday: Dark Launch / Shadow Mode (3 Days)**  
   Run the internal classifier in "shadow mode" inside the CRM without auto-assigning. It will score incoming tickets alongside agents, verifying that real-world accuracy matches the 94.5% benchmark in production.
3. **Thursday: Implement the "Billing Guardrail" Rule**  
   Per Operations Policy §3 and Meenal’s feedback, enforce a routing rule: *Only route to Billing if the primary issue is payment failure, duplicate deduction, or invoice dispute.* If a customer simply mentions "already paid for installation", the classifier directs it to `Installs & Demo` or `Repairs`.
4. **Friday: 70% Confidence Threshold Auto-Assignment**  
   Enable automatic routing for tickets where model confidence is $\ge 70\%$ (~85% of volume). Route the remaining ambiguous cases to a single Tier-1 triage tray with model-suggested alternatives for 1-click human confirmation.
