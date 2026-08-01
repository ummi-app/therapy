export type SessionStatus =
  | "Scheduled"
  | "Attended"
  | "Child cancelled"
  | "Provider cancelled";
export type ClaimStatus = "Not submitted" | "Pending" | "Processed" | "Denied";
export type DocumentKind =
  | "Authorization"
  | "EOB"
  | "Provider statement"
  | "Other";
export type Severity = "critical" | "warning" | "info";

export type AuthorizationLine = {
  id: string;
  code: string;
  label: string;
  unitLabel: string;
  approvedUnits: number;
  providerReportedUsedUnits: number;
};

export type Authorization = {
  id: string;
  child: string;
  service: string;
  provider: string;
  number: string;
  starts: string;
  ends: string;
  lines: AuthorizationLine[];
};

export type TherapySession = {
  id: string;
  authorizationId: string;
  lineId: string;
  date: string;
  status: SessionStatus;
  scheduledUnits: number;
  attendedUnits: number;
  providerBilledUnits: number;
  note: string;
};

export type Claim = {
  id: string;
  claimNumber: string;
  authorizationId: string;
  sessionId: string;
  submittedAt: string;
  processedAt: string;
  status: ClaimStatus;
  billedUnits: number;
  processedUnits: number;
  providerBilled: number;
  insurerAllowed: number;
  insurerPaid: number;
  parentResponsibility: number;
  parentPaid: number;
  denialReason: string;
};

export type ImportedDocument = {
  id: string;
  name: string;
  kind: DocumentKind;
  importedAt: string;
  text: string;
  extracted: Record<string, string>;
};

export type Reminder = {
  id: string;
  title: string;
  due: string;
  done: boolean;
};
export type IssueResolution = {
  issueId: string;
  title: string;
  resolvedAt: string;
  fingerprint: string;
  note: string;
};
export type Ledger = {
  authorizations: Authorization[];
  sessions: TherapySession[];
  claims: Claim[];
  documents: ImportedDocument[];
  reminders: Reminder[];
  plan: string;
  sampleWorkspace?: boolean;
  resolvedIssueIds?: string[];
  resolutions?: IssueResolution[];
};

export type ReconciliationRow = {
  session: TherapySession;
  authorization?: Authorization;
  line?: AuthorizationLine;
  claim?: Claim;
  scheduled: number;
  attended: number;
  providerBilled: number;
  insurerProcessed: number;
  parentPaid: number;
  mismatch: boolean;
};

export type Issue = {
  id: string;
  severity: Severity;
  category: "Units" | "Claim" | "Renewal" | "Cost";
  title: string;
  detail: string;
  amount?: number;
  authorizationId?: string;
  claimId?: string;
  sessionId?: string;
  action: string;
};

export type Forecast = {
  authorizationId: string;
  lineId: string;
  approved: number;
  attended: number;
  providerReported: number;
  insurerProcessed: number;
  remaining: number;
  weeklyRate: number;
  projectedRunout: string | null;
  daysToExpiry: number;
};

export type ExtractedDocument = {
  kind: DocumentKind;
  fields: Record<string, string>;
  confidence: number;
};

export function hasClaimLine(
  ledger: Ledger,
  claimNumber: string,
  sessionId?: string,
) {
  if (!claimNumber.trim() || !sessionId) return false;
  const normalizedClaimNumber = claimNumber.trim().toLowerCase();
  return ledger.claims.some(
    (claim) =>
      claim.claimNumber.trim().toLowerCase() === normalizedClaimNumber &&
      claim.sessionId === sessionId,
  );
}

export type DocumentMatch = {
  authorizationId?: string;
  lineId?: string;
  sessionId?: string;
};

const NOW = "2026-07-31";
const DAY = 86_400_000;

export const seedLedger: Ledger = {
  authorizations: [
    {
      id: "auth-aba",
      child: "Eli Rivera",
      service: "Behavior therapy",
      provider: "Northstar ABA",
      number: "ABA-2049",
      starts: "2026-01-01",
      ends: "2026-08-31",
      lines: [
        {
          id: "line-97153",
          code: "97153",
          label: "Technician direct treatment",
          unitLabel: "15-minute unit",
          approvedUnits: 240,
          providerReportedUsedUnits: 200,
        },
        {
          id: "line-97155",
          code: "97155",
          label: "BCBA supervision",
          unitLabel: "15-minute unit",
          approvedUnits: 48,
          providerReportedUsedUnits: 20,
        },
      ],
    },
    {
      id: "auth-ot",
      child: "Maya Rivera",
      service: "Occupational therapy",
      provider: "Bright Path OT",
      number: "OT-4471",
      starts: "2026-05-19",
      ends: "2026-08-18",
      lines: [
        {
          id: "line-97530",
          code: "97530",
          label: "Therapeutic activities",
          unitLabel: "15-minute unit",
          approvedUnits: 160,
          providerReportedUsedUnits: 124,
        },
      ],
    },
  ],
  sessions: [
    {
      id: "session-1",
      authorizationId: "auth-aba",
      lineId: "line-97153",
      date: "2026-07-07",
      status: "Attended",
      scheduledUnits: 8,
      attendedUnits: 8,
      providerBilledUnits: 8,
      note: "In-home session",
    },
    {
      id: "session-2",
      authorizationId: "auth-aba",
      lineId: "line-97153",
      date: "2026-07-11",
      status: "Attended",
      scheduledUnits: 8,
      attendedUnits: 8,
      providerBilledUnits: 16,
      note: "Parent log shows two hours",
    },
    {
      id: "session-3",
      authorizationId: "auth-aba",
      lineId: "line-97153",
      date: "2026-07-18",
      status: "Provider cancelled",
      scheduledUnits: 8,
      attendedUnits: 0,
      providerBilledUnits: 8,
      note: "BCBA cancelled by text",
    },
    {
      id: "session-4",
      authorizationId: "auth-aba",
      lineId: "line-97153",
      date: "2026-07-25",
      status: "Attended",
      scheduledUnits: 8,
      attendedUnits: 8,
      providerBilledUnits: 8,
      note: "In-home session",
    },
    {
      id: "session-5",
      authorizationId: "auth-ot",
      lineId: "line-97530",
      date: "2026-07-09",
      status: "Attended",
      scheduledUnits: 4,
      attendedUnits: 4,
      providerBilledUnits: 4,
      note: "Clinic visit",
    },
    {
      id: "session-6",
      authorizationId: "auth-ot",
      lineId: "line-97530",
      date: "2026-07-16",
      status: "Attended",
      scheduledUnits: 4,
      attendedUnits: 4,
      providerBilledUnits: 4,
      note: "Clinic visit",
    },
    {
      id: "session-7",
      authorizationId: "auth-ot",
      lineId: "line-97530",
      date: "2026-07-23",
      status: "Attended",
      scheduledUnits: 4,
      attendedUnits: 4,
      providerBilledUnits: 4,
      note: "Clinic visit",
    },
    {
      id: "session-8",
      authorizationId: "auth-ot",
      lineId: "line-97530",
      date: "2026-07-30",
      status: "Attended",
      scheduledUnits: 4,
      attendedUnits: 4,
      providerBilledUnits: 4,
      note: "Clinic visit",
    },
  ],
  claims: [
    {
      id: "claim-1",
      claimNumber: "CLM-88291",
      authorizationId: "auth-aba",
      sessionId: "session-2",
      submittedAt: "2026-07-13",
      processedAt: "2026-07-20",
      status: "Processed",
      billedUnits: 16,
      processedUnits: 16,
      providerBilled: 1200,
      insurerAllowed: 720,
      insurerPaid: 540,
      parentResponsibility: 180,
      parentPaid: 0,
      denialReason: "",
    },
    {
      id: "claim-2",
      claimNumber: "CLM-88402",
      authorizationId: "auth-aba",
      sessionId: "session-3",
      submittedAt: "2026-07-20",
      processedAt: "2026-07-27",
      status: "Denied",
      billedUnits: 8,
      processedUnits: 0,
      providerBilled: 600,
      insurerAllowed: 0,
      insurerPaid: 0,
      parentResponsibility: 600,
      parentPaid: 0,
      denialReason: "Authorization limit reached",
    },
    {
      id: "claim-3",
      claimNumber: "CLM-7219",
      authorizationId: "auth-ot",
      sessionId: "session-5",
      submittedAt: "2026-07-10",
      processedAt: "",
      status: "Pending",
      billedUnits: 4,
      processedUnits: 0,
      providerBilled: 168,
      insurerAllowed: 0,
      insurerPaid: 0,
      parentResponsibility: 0,
      parentPaid: 0,
      denialReason: "",
    },
  ],
  documents: [],
  reminders: [
    {
      id: "reminder-1",
      title: "Ask Northstar for a corrected unit ledger",
      due: "2026-08-01",
      done: false,
    },
  ],
  plan: "Free",
  sampleWorkspace: true,
  resolvedIssueIds: [],
  resolutions: [],
};

export const emptyLedger: Ledger = {
  authorizations: [],
  sessions: [],
  claims: [],
  documents: [],
  reminders: [],
  plan: "Free",
  sampleWorkspace: false,
  resolvedIssueIds: [],
  resolutions: [],
};

function parseDate(value: string) {
  return new Date(`${value}T12:00:00`).getTime();
}
export function daysBetween(from: string, to: string) {
  return Math.round((parseDate(to) - parseDate(from)) / DAY);
}
export function addDays(date: string, days: number) {
  const next = new Date(parseDate(date) + days * DAY);
  return next.toISOString().slice(0, 10);
}

export function getReconciliationRows(ledger: Ledger): ReconciliationRow[] {
  return [...ledger.sessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((session) => {
      const authorization = ledger.authorizations.find(
        (item) => item.id === session.authorizationId,
      );
      const line = authorization?.lines.find(
        (item) => item.id === session.lineId,
      );
      const claim = ledger.claims.find((item) => item.sessionId === session.id);
      const providerBilled = claim?.billedUnits ?? session.providerBilledUnits;
      const insurerProcessed = claim?.processedUnits ?? 0;
      return {
        session,
        authorization,
        line,
        claim,
        scheduled: session.scheduledUnits,
        attended: session.status === "Attended" ? session.attendedUnits : 0,
        providerBilled,
        insurerProcessed,
        parentPaid: claim?.parentPaid ?? 0,
        mismatch:
          providerBilled !==
            (session.status === "Attended" ? session.attendedUnits : 0) ||
          insurerProcessed > providerBilled,
      };
    });
}

export function getForecasts(ledger: Ledger, now = NOW): Forecast[] {
  return ledger.authorizations.flatMap((authorization) =>
    authorization.lines.map((line) => {
      const matchingSessions = ledger.sessions.filter(
        (session) =>
          session.authorizationId === authorization.id &&
          session.lineId === line.id &&
          session.status === "Attended",
      );
      const attended = matchingSessions.reduce(
        (sum, session) => sum + session.attendedUnits,
        0,
      );
      const processed = ledger.claims
        .filter(
          (claim) =>
            claim.authorizationId === authorization.id &&
            matchingSessions.some((session) => session.id === claim.sessionId),
        )
        .reduce((sum, claim) => sum + claim.processedUnits, 0);
      const recentUnits = matchingSessions
        .filter(
          (session) =>
            daysBetween(session.date, now) >= 0 &&
            daysBetween(session.date, now) <= 28,
        )
        .reduce((sum, session) => sum + session.attendedUnits, 0);
      const weeklyRate = Math.round((recentUnits / 4) * 10) / 10;
      const remaining = Math.max(0, line.approvedUnits - attended);
      const projectedRunout =
        weeklyRate > 0
          ? addDays(now, Math.ceil((remaining / weeklyRate) * 7))
          : null;
      return {
        authorizationId: authorization.id,
        lineId: line.id,
        approved: line.approvedUnits,
        attended,
        providerReported: line.providerReportedUsedUnits,
        insurerProcessed: processed,
        remaining,
        weeklyRate,
        projectedRunout,
        daysToExpiry: daysBetween(now, authorization.ends),
      };
    }),
  );
}

export function detectIssues(ledger: Ledger, now = NOW): Issue[] {
  const issues: Issue[] = [];
  const rows = getReconciliationRows(ledger);
  for (const row of rows) {
    if (row.providerBilled > row.attended) {
      issues.push({
        id: `units-${row.session.id}`,
        severity: row.attended === 0 ? "critical" : "warning",
        category: "Units",
        title:
          row.attended === 0
            ? "Cancelled session appears billed"
            : "Provider billed more units than attended",
        detail: `${row.authorization?.provider ?? "Provider"} billed ${row.providerBilled} units for ${dateLabel(row.session.date)}; your session log supports ${row.attended}.`,
        authorizationId: row.session.authorizationId,
        claimId: row.claim?.id,
        sessionId: row.session.id,
        action: "Ask the provider for a corrected claim and unit ledger.",
      });
    }
  }
  for (const forecast of getForecasts(ledger, now)) {
    const authorization = ledger.authorizations.find(
      (item) => item.id === forecast.authorizationId,
    )!;
    const line = authorization.lines.find(
      (item) => item.id === forecast.lineId,
    )!;
    if (
      forecast.providerReported >
      forecast.attended + Math.max(4, forecast.weeklyRate)
    ) {
      issues.push({
        id: `reported-${line.id}`,
        severity: "critical",
        category: "Units",
        title: "Provider’s used-unit count does not match your sessions",
        detail: `${authorization.provider} reports ${forecast.providerReported} ${line.unitLabel}s used for ${line.code}; your attended-session ledger supports ${forecast.attended}. Difference: ${forecast.providerReported - forecast.attended} units.`,
        authorizationId: authorization.id,
        action:
          "Request the dated service ledger before accepting a self-pay switch.",
      });
    }
    if (forecast.daysToExpiry <= 30 && forecast.daysToExpiry >= 0) {
      issues.push({
        id: `renew-${line.id}`,
        severity: forecast.daysToExpiry <= 14 ? "warning" : "info",
        category: "Renewal",
        title: `${authorization.service} authorization ends in ${forecast.daysToExpiry} days`,
        detail: `${forecast.remaining} units remain for ${line.code}. At the recent pace, the projected runout is ${forecast.projectedRunout ? dateLabel(forecast.projectedRunout) : "not yet available"}.`,
        authorizationId: authorization.id,
        action:
          "Start the renewal request and confirm required clinical notes.",
      });
    }
    if (
      forecast.projectedRunout &&
      forecast.projectedRunout < authorization.ends
    ) {
      issues.push({
        id: `runout-${line.id}`,
        severity: "warning",
        category: "Renewal",
        title: `${line.code} units may run out before the authorization ends`,
        detail: `${forecast.remaining} units remain at about ${forecast.weeklyRate} units per week, projecting depletion on ${dateLabel(forecast.projectedRunout)}.`,
        authorizationId: authorization.id,
        action:
          "Compare the remaining plan with scheduled sessions and ask whether more units are needed.",
      });
    }
  }
  for (const claim of ledger.claims) {
    if (
      claim.status === "Pending" &&
      daysBetween(claim.submittedAt, now) >= 14
    ) {
      issues.push({
        id: `pending-${claim.id}`,
        severity: "warning",
        category: "Claim",
        title: `Claim ${claim.claimNumber} has been pending ${daysBetween(claim.submittedAt, now)} days`,
        detail: `${money(claim.providerBilled)} was submitted and has no processed date.`,
        claimId: claim.id,
        authorizationId: claim.authorizationId,
        action:
          "Check the insurer portal and ask the provider for the submission confirmation.",
      });
    }
    if (claim.status === "Denied") {
      issues.push({
        id: `denied-${claim.id}`,
        severity: "critical",
        category: "Claim",
        title: `Claim ${claim.claimNumber} was denied`,
        detail: `${money(claim.parentResponsibility)} is currently shown as family responsibility. Reason: ${claim.denialReason || "not recorded"}.`,
        amount: claim.parentResponsibility,
        claimId: claim.id,
        authorizationId: claim.authorizationId,
        action:
          "Verify the EOB reason before paying and request correction or appeal evidence.",
      });
    }
    if (claim.parentPaid > claim.parentResponsibility) {
      issues.push({
        id: `overpay-${claim.id}`,
        severity: "critical",
        category: "Cost",
        title: `Payment exceeds EOB responsibility by ${money(claim.parentPaid - claim.parentResponsibility)}`,
        detail: `The family recorded ${money(claim.parentPaid)} paid, while the EOB responsibility is ${money(claim.parentResponsibility)}.`,
        amount: claim.parentPaid - claim.parentResponsibility,
        claimId: claim.id,
        action: "Request a refund or account credit and attach the EOB.",
      });
    }
  }
  const rank = { critical: 0, warning: 1, info: 2 };
  return issues.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function getOpenIssues(ledger: Ledger, now = NOW): Issue[] {
  const legacyResolved = new Set(ledger.resolvedIssueIds ?? []);
  return detectIssues(ledger, now).filter(
    (issue) =>
      !legacyResolved.has(issue.id) &&
      !(ledger.resolutions ?? []).some(
        (resolution) =>
          resolution.issueId === issue.id &&
          resolution.fingerprint === issueFingerprint(issue),
      ),
  );
}

export function issueFingerprint(issue: Issue) {
  return JSON.stringify([
    issue.title,
    issue.detail,
    issue.action,
    issue.amount ?? null,
  ]);
}

export function matchDocumentToLedger(
  ledger: Ledger,
  document: ExtractedDocument,
): DocumentMatch {
  const { fields } = document;
  const authorization =
    ledger.authorizations.find(
      (item) =>
        Boolean(fields.authorizationNumber) &&
        item.number === fields.authorizationNumber,
    ) ||
    ledger.authorizations.find((item) =>
      item.lines.some((line) => line.code === fields.billingCode),
    );
  if (!authorization) return {};
  const line = authorization.lines.find(
    (item) => item.code === fields.billingCode,
  );
  const parsedServiceDate = fields.serviceDate
    ? new Date(fields.serviceDate)
    : null;
  const serviceDate =
    parsedServiceDate && !Number.isNaN(parsedServiceDate.getTime())
      ? parsedServiceDate.toISOString().slice(0, 10)
      : "";
  const session = ledger.sessions.find(
    (item) =>
      item.authorizationId === authorization.id && item.date === serviceDate,
  );
  return {
    authorizationId: authorization.id,
    lineId: line?.id,
    sessionId: session?.id,
  };
}

export function extractDocument(text: string): ExtractedDocument {
  const normalized = text.replace(/\r/g, "");
  const lower = normalized.toLowerCase();
  const kind: DocumentKind =
    lower.includes("explanation of benefits") ||
    lower.includes("patient responsibility")
      ? "EOB"
      : lower.includes("authorization") || lower.includes("approved units")
        ? "Authorization"
        : lower.includes("provider statement") || lower.includes("amount due")
          ? "Provider statement"
          : "Other";
  const patterns: Record<string, RegExp> = {
    authorizationNumber:
      /authorization\s*(?:number|#|no\.?)[\s:]*([A-Z0-9-]+)/i,
    claimNumber: /claim\s*(?:number|#|no\.?)[\s:]*([A-Z0-9-]+)/i,
    provider: /provider[\s:]+([^\n]+)/i,
    child: /(?:child|patient)[\s:]+([^\n]+)/i,
    serviceDate:
      /service\s*date[\s:]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2})/i,
    startDate:
      /start\s*date[\s:]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2})/i,
    endDate:
      /end\s*date[\s:]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{4}-\d{2}-\d{2})/i,
    billingCode: /(?:CPT|billing)\s*(?:code)?[\s:]+(\d{5})/i,
    approvedUnits: /approved\s*units?[\s:]+([\d.]+)/i,
    billedUnits: /(?:units?\s*billed|billed\s*units?)[\s:]+([\d.]+)/i,
    processedUnits: /(?:units?\s*processed|processed\s*units?)[\s:]+([\d.]+)/i,
    providerBilled: /(?:provider\s*billed|amount\s*billed)[\s:$]+([\d,.]+)/i,
    insurerAllowed: /(?:allowed\s*amount|insurer\s*allowed)[\s:$]+([\d,.]+)/i,
    insurerPaid: /(?:insurance|insurer)\s*paid[\s:$]+([\d,.]+)/i,
    parentResponsibility:
      /(?:patient|parent)\s*responsibility[\s:$]+([\d,.]+)/i,
    denialReason: /(?:denial\s*reason|reason)[\s:]+([^\n]+)/i,
  };
  const fields: Record<string, string> = {};
  for (const [name, pattern] of Object.entries(patterns)) {
    const match = normalized.match(pattern);
    if (match?.[1]) fields[name] = match[1].trim();
  }
  const expected = kind === "Authorization" ? 5 : kind === "EOB" ? 7 : 3;
  return {
    kind,
    fields,
    confidence: Math.min(
      0.98,
      Math.round((Object.keys(fields).length / expected) * 100) / 100,
    ),
  };
}

function dateLabel(value: string) {
  if (!value) return "unknown date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}
function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function buildEvidencePacket(issue: Issue, ledger: Ledger) {
  const authorization = ledger.authorizations.find(
    (item) => item.id === issue.authorizationId,
  );
  const claim = ledger.claims.find((item) => item.id === issue.claimId);
  const rows = getReconciliationRows(ledger).filter(
    (row) => !authorization || row.session.authorizationId === authorization.id,
  );
  const evidence = rows
    .map(
      (row) =>
        `${row.session.date} | ${row.session.status} | scheduled ${row.scheduled} | attended ${row.attended} | provider billed ${row.providerBilled} | insurer processed ${row.insurerProcessed}`,
    )
    .join("\n");
  return `CARELEDGER EVIDENCE SUMMARY\nGenerated ${NOW}\n\nISSUE\n${issue.title}\n${issue.detail}\n\nAUTHORIZATION\n${authorization ? `${authorization.child} | ${authorization.service} | ${authorization.provider}\nAuthorization ${authorization.number} | ${authorization.starts} to ${authorization.ends}` : "Not linked"}\n\nCLAIM\n${claim ? `${claim.claimNumber} | ${claim.status} | billed ${money(claim.providerBilled)} | family responsibility ${money(claim.parentResponsibility)}\nDenial reason: ${claim.denialReason || "none recorded"}` : "Not linked"}\n\nSESSION RECONCILIATION\n${evidence || "No linked sessions"}\n\nCALL SCRIPT\nHello, I’m calling about ${authorization?.child ?? "my child"}’s ${authorization?.service ?? "therapy"} records. My records show: ${issue.detail} Please send me the dated service-unit ledger, the submitted claim details, and the authorization record used to calculate remaining coverage. Please do not move this balance to self-pay while the discrepancy is reviewed. What is the reference number for this request, and when should I follow up?\n\nREQUESTED RESOLUTION\n${issue.action}\n\nNOTES\nThis is a parent-maintained record, not legal or medical advice. Verify all figures against the insurer EOB and provider statement.`;
}
