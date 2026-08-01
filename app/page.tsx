"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type ClaimStatus = "Paid" | "Pending" | "Needs review" | "Denied";

type Claim = {
  id: number;
  provider: string;
  service: string;
  date: string;
  amount: number;
  status: ClaimStatus;
  note: string;
};

type Authorization = {
  id: number;
  child: string;
  service: string;
  provider: string;
  used: number;
  approved: number;
  expires: string;
  color: "violet" | "orange" | "mint";
};

type Task = {
  id: number;
  title: string;
  detail: string;
  due: string;
  tone: "urgent" | "warm" | "neutral";
  done: boolean;
};

const seedAuthorizations: Authorization[] = [
  { id: 1, child: "Maya", service: "Occupational therapy", provider: "Bright Path OT", used: 31, approved: 40, expires: "Aug 18", color: "violet" },
  { id: 2, child: "Maya", service: "Speech therapy", provider: "Clear Voice Clinic", used: 18, approved: 24, expires: "Sep 2", color: "mint" },
  { id: 3, child: "Eli", service: "Behavior therapy", provider: "Northstar ABA", used: 14, approved: 30, expires: "Aug 9", color: "orange" },
];

const seedClaims: Claim[] = [
  { id: 1, provider: "Bright Path OT", service: "OT · 60 min", date: "Jul 28", amount: 168, status: "Pending", note: "Submitted Jul 29" },
  { id: 2, provider: "Northstar ABA", service: "ABA · 120 min", date: "Jul 25", amount: 312, status: "Needs review", note: "Hours cap cited" },
  { id: 3, provider: "Clear Voice Clinic", service: "Speech · 45 min", date: "Jul 24", amount: 142, status: "Paid", note: "Paid Jul 27" },
  { id: 4, provider: "Bright Path OT", service: "OT · 60 min", date: "Jul 21", amount: 168, status: "Denied", note: "Authorization mismatch" },
];

const seedTasks: Task[] = [
  { id: 1, title: "Confirm Northstar’s remaining ABA hours", detail: "The insurer’s 200-hour figure does not match the 14 sessions you have recorded.", due: "Due today", tone: "urgent", done: false },
  { id: 2, title: "Request corrected claim from Bright Path OT", detail: "Claim #7219 was denied because the authorization number was missing.", due: "Due Aug 2", tone: "warm", done: false },
  { id: 3, title: "Renew Maya’s OT authorization", detail: "Start now so coverage does not lapse after Aug 18.", due: "In 17 days", tone: "neutral", done: false },
];

function currency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export default function Home() {
  const [authorizations, setAuthorizations] = useState<Authorization[]>(seedAuthorizations);
  const [claims, setClaims] = useState<Claim[]>(seedClaims);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Free");
  const [toast, setToast] = useState("");
  const [activeView, setActiveView] = useState("Overview");

  useEffect(() => {
    const saved = window.localStorage.getItem("careledger-demo");
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      queueMicrotask(() => {
        if (data.authorizations) setAuthorizations(data.authorizations);
        if (data.claims) setClaims(data.claims);
        if (data.tasks) setTasks(data.tasks);
        if (data.plan) setSelectedPlan(data.plan);
      });
    } catch {
      window.localStorage.removeItem("careledger-demo");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("careledger-demo", JSON.stringify({ authorizations, claims, tasks, plan: selectedPlan }));
  }, [authorizations, claims, tasks, selectedPlan]);

  const totalAtRisk = useMemo(() => claims.filter((claim) => claim.status === "Denied" || claim.status === "Needs review").reduce((sum, claim) => sum + claim.amount, 0), [claims]);
  const urgentCount = tasks.filter((task) => !task.done).length;
  const usedHours = authorizations.reduce((sum, item) => sum + item.used, 0);
  const approvedHours = authorizations.reduce((sum, item) => sum + item.approved, 0);

  function toggleTask(id: number) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  }

  function createCase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const child = String(form.get("child") || "Child");
    const service = String(form.get("service") || "Therapy");
    const provider = String(form.get("provider") || "Provider");
    const approved = Math.max(1, Number(form.get("approved") || 24));
    const expires = String(form.get("expires") || "Sep 30");
    const newAuthorization: Authorization = { id: Date.now(), child, service, provider, used: 0, approved, expires, color: "violet" };
    setAuthorizations((current) => [...current, newAuthorization]);
    setTasks((current) => [{ id: Date.now() + 1, title: `Add ${service.toLowerCase()} authorization letter`, detail: `Capture the approval reference and service details for ${provider}.`, due: "Set a due date", tone: "neutral", done: false }, ...current]);
    setShowCaseForm(false);
    setToast(`${service} coverage added for ${child}`);
  }

  function startMockCheckout(plan: string) {
    setSelectedPlan(plan);
    setShowPricing(false);
    setToast(`${plan} is active — this was a successful mock checkout.`);
  }

  function addDemoClaim() {
    setClaims((current) => [{ id: Date.now(), provider: "New provider", service: "Therapy · 60 min", date: "Today", amount: 175, status: "Pending", note: "Added locally" }, ...current]);
    setToast("A new claim was added to your tracker.");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">C</span><span>careledger</span></div>
        <div className="family-switcher"><span className="avatar-group"><span className="mini-avatar lavender">M</span><span className="mini-avatar peach">E</span></span><span><strong>Rivera family</strong><small>2 children · 3 providers</small></span><span className="chevron">⌄</span></div>
        <nav aria-label="Primary navigation">
          {["Overview", "Coverage", "Claims", "Documents", "Timeline"].map((item) => <button key={item} className={activeView === item ? "nav-item active" : "nav-item"} onClick={() => setActiveView(item)}><span>{item === "Overview" ? "◌" : item === "Coverage" ? "◒" : item === "Claims" ? "▤" : item === "Documents" ? "▱" : "◷"}</span>{item}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <button className="mini-upgrade" onClick={() => setShowPricing(true)}><span className="sparkle">✦</span><span><strong>{selectedPlan === "Free" ? "Upgrade your plan" : `${selectedPlan} plan`}</strong><small>{selectedPlan === "Free" ? "See all therapy coverage" : "Mock subscription active"}</small></span></button>
          <button className="profile"><span className="profile-avatar">AR</span><span>Alex Rivera</span><span className="dots">•••</span></button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><p className="eyebrow">Tuesday, July 31</p><h1>Good morning, Alex.</h1></div>
          <div className="header-actions"><button className="icon-button" aria-label="Notifications">⌁<span className="notification-dot" /></button><button className="add-button" onClick={() => setShowCaseForm(true)}><span>+</span> Add coverage</button></div>
        </header>

        <section className="hero-card">
          <div className="hero-copy"><span className="pill"><span className="pulse" /> {urgentCount} actions need attention</span><h2>Keep care moving.<br /><em>Without chasing paperwork.</em></h2><p>CareLedger turns therapy authorizations, claims, and follow-ups into one calm, clear plan for your family.</p><button className="outline-button" onClick={() => setActiveView("Timeline")}>View your care timeline <span>→</span></button></div>
          <div className="hero-visual" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="hero-card-stack card-back" /><div className="hero-card-stack card-front"><span className="stack-icon">▣</span><span>Coverage</span><strong>3 active plans</strong><div className="stack-meter"><span /></div></div><span className="tiny-star star-a">✦</span><span className="tiny-star star-b">✦</span></div>
        </section>

        <section className="stats-grid">
          <article className="stat-card"><div className="stat-label"><span className="metric-icon purple">⌇</span> Therapy hours</div><strong>{usedHours} <span>/ {approvedHours}</span></strong><div className="meter"><span style={{ width: `${Math.round((usedHours / approvedHours) * 100)}%` }} /></div><small>Across all active authorizations</small></article>
          <article className="stat-card"><div className="stat-label"><span className="metric-icon orange">!</span> Needs review</div><strong>{currency(totalAtRisk)}</strong><p className="stat-detail"><span className="trend-dot" /> 2 claims need a follow-up</p><button className="text-button" onClick={() => setActiveView("Claims")}>Review claims <span>→</span></button></article>
          <article className="stat-card"><div className="stat-label"><span className="metric-icon mint">✓</span> Care docs</div><strong>12 <span>/ 14</span></strong><p className="stat-detail">Two documents still needed</p><button className="text-button" onClick={() => setToast("Document checklist opened in a full version.")}>Finish checklist <span>→</span></button></article>
        </section>

        <section className="two-column">
          <article className="panel coverage-panel"><div className="panel-heading"><div><p className="eyebrow">ACTIVE COVERAGE</p><h2>Authorization runway</h2></div><button className="subtle-button" onClick={() => setShowCaseForm(true)}>+ Add</button></div><div className="coverage-list">
            {authorizations.map((authorization) => {
              const remaining = authorization.approved - authorization.used;
              const percent = Math.round((authorization.used / authorization.approved) * 100);
              return <div className="coverage-row" key={authorization.id}><span className={`service-avatar ${authorization.color}`}>{initials(authorization.service)}</span><div className="coverage-main"><div><strong>{authorization.service}</strong><span>{authorization.child} · {authorization.provider}</span></div><div className="coverage-bar"><span className={authorization.color} style={{ width: `${percent}%` }} /></div></div><div className="coverage-remaining"><strong>{remaining}</strong><span>of {authorization.approved} left</span></div><span className="expiry">Ends {authorization.expires}</span></div>;
            })}
          </div><button className="footer-link" onClick={() => setActiveView("Coverage")}>See coverage details <span>→</span></button></article>

          <article className="panel actions-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR NEXT STEPS</p><h2>Keep momentum</h2></div><button className="subtle-button" onClick={() => setToast("Your action list is already up to date.")}>View all</button></div><div className="task-list">
            {tasks.map((task) => <label className={task.done ? "task done" : "task"} key={task.id}><input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} /><span className={`custom-check ${task.tone}`}>✓</span><span className="task-copy"><strong>{task.title}</strong><small>{task.detail}</small></span><span className={`task-due ${task.tone}`}>{task.due}</span></label>)}
          </div><button className="footer-link" onClick={() => setToast("Great work — your task list is saved on this device.")}>Mark today complete <span>→</span></button></article>
        </section>

        <section className="panel claim-panel"><div className="panel-heading"><div><p className="eyebrow">RECENT ACTIVITY</p><h2>Claims at a glance</h2></div><button className="subtle-button" onClick={addDemoClaim}>+ Add claim</button></div><div className="claims-table"><div className="claim-head"><span>Provider</span><span>Service date</span><span>Amount</span><span>Status</span><span /></div>{claims.map((claim) => <div className="claim-row" key={claim.id}><span className="provider-cell"><span className="provider-logo">{initials(claim.provider)}</span><span><strong>{claim.provider}</strong><small>{claim.service} · {claim.note}</small></span></span><span>{claim.date}</span><strong>{currency(claim.amount)}</strong><span className={`status ${claim.status.toLowerCase().replace(" ", "-")}`}>{claim.status}</span><button className="row-menu" aria-label={`More actions for ${claim.provider}`}>•••</button></div>)}</div><button className="footer-link" onClick={() => setActiveView("Claims")}>Open claim tracker <span>→</span></button></section>
      </section>

      {showCaseForm && <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="coverage-title"><button className="close" onClick={() => setShowCaseForm(false)} aria-label="Close">×</button><p className="eyebrow">NEW COVERAGE</p><h2 id="coverage-title">Add an authorization</h2><p>Start with the details from the approval letter. You can add documents and claims afterward.</p><form onSubmit={createCase}><label>Child<input name="child" placeholder="e.g. Maya" required /></label><label>Service<select name="service" defaultValue="Occupational therapy"><option>Occupational therapy</option><option>Speech therapy</option><option>Behavior therapy</option><option>Physical therapy</option><option>Feeding therapy</option></select></label><label>Provider<input name="provider" placeholder="e.g. Bright Path OT" required /></label><div className="form-split"><label>Approved hours<input name="approved" type="number" min="1" defaultValue="24" required /></label><label>Ends<input name="expires" placeholder="e.g. Sep 30" required /></label></div><button className="primary-full" type="submit">Add coverage plan <span>→</span></button></form></section></div>}

      {showPricing && <div className="modal-backdrop" role="presentation"><section className="modal pricing-modal" role="dialog" aria-modal="true" aria-labelledby="pricing-title"><button className="close" onClick={() => setShowPricing(false)} aria-label="Close">×</button><p className="eyebrow">SIMPLE, FAMILY-FIRST PRICING</p><h2 id="pricing-title">Choose your support level</h2><p>Try a realistic checkout without entering a card. Your choice stays saved locally.</p><div className="pricing-grid"><article><span className="plan-name">Starter</span><strong>$9 <small>/ month</small></strong><p>For one child and one active coverage plan.</p><ul><li>Authorization runway</li><li>Claims & task tracking</li><li>Local-only storage</li></ul><button onClick={() => startMockCheckout("Starter")}>Mock checkout</button></article><article className="featured-plan"><span className="most-loved">MOST LOVED</span><span className="plan-name">Family</span><strong>$15 <small>/ month</small></strong><p>For multiple children, providers, and ongoing care.</p><ul><li>Everything in Starter</li><li>Unlimited active plans</li><li>Case-ready export pack</li></ul><button onClick={() => startMockCheckout("Family")}>Start mock checkout</button></article></div><small className="privacy-note">No payment is collected in this MVP. A real version should use a trusted payment processor and privacy-safe storage.</small></section></div>}

      {toast && <div className="toast" role="status"><span>✓</span>{toast}<button onClick={() => setToast("")}>×</button></div>}
    </main>
  );
}
