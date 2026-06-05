import React from "react";
import { fmt, type ContractData } from "./types";

/** Professional Contract Template — renders as styled HTML for preview & PDF capture */
export default function ContractTemplate({ data }: { data: ContractData }) {
  const brand = data.brandColor || "#1a3d2b";
  const clauseStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, marginBottom: 8, color: brand };

  return (
    <div
      style={{
        fontFamily: "'Georgia', 'Times New Roman', serif",
        color: "#1a1a1a",
        lineHeight: 1.7,
        fontSize: 13,
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "48px 48px 32px",
          textAlign: "center",
          borderBottom: `3px double ${brand}`,
        }}
      >
        {/* Logo */}
        {data.logoUrl && (
          <div style={{ marginBottom: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.logoUrl} alt="Logo" style={{ maxHeight: 50, maxWidth: 180, objectFit: "contain" }} />
          </div>
        )}
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 4px", color: brand, letterSpacing: 2, textTransform: "uppercase" }}>
          Service Agreement
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          Effective Date: {new Date(data.effectiveDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div style={{ padding: "32px 48px" }}>
        {/* ── Parties ── */}
        <section style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 8px" }}>
            This Service Agreement (&quot;Agreement&quot;) is entered into between:
          </p>
          <div style={{ display: "flex", gap: 32, margin: "16px 0" }}>
            <div style={{ flex: 1, background: "#f9fafb", padding: "16px 20px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6b7280", marginBottom: 6 }}>
                Service Provider
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{data.freelancerName}</div>
              <div style={{ fontSize: 12, color: "#4b5563", whiteSpace: "pre-wrap" }}>
                {data.freelancerAddress}{"\n"}{data.freelancerEmail}
              </div>
            </div>
            <div style={{ flex: 1, background: "#f9fafb", padding: "16px 20px", borderRadius: 6, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#6b7280", marginBottom: 6 }}>
                Client
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{data.clientName}</div>
              <div style={{ fontSize: 12, color: "#4b5563", whiteSpace: "pre-wrap" }}>
                {data.clientAddress}{"\n"}{data.clientEmail}
              </div>
            </div>
          </div>
        </section>

        {/* ── 1. Project Scope ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={clauseStyle}>1. Project Scope</h2>
          <p style={{ margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{data.projectScope}</p>
          {data.deliverables.length > 0 && (
            <>
              <p style={{ margin: "0 0 8px", fontWeight: 500 }}>Deliverables:</p>
              <ol style={{ margin: 0, paddingLeft: 24 }}>
                {data.deliverables.map((d, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{d}</li>
                ))}
              </ol>
            </>
          )}
        </section>

        {/* ── 2. Timeline ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={clauseStyle}>2. Timeline</h2>
          <p style={{ margin: 0 }}>
            The project shall commence on{" "}
            <strong>{new Date(data.effectiveDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>{" "}
            and is expected to be completed by{" "}
            <strong>{new Date(data.completionDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</strong>.
            Any changes to the timeline must be agreed upon in writing by both parties.
          </p>
        </section>

        {/* ── 3. Compensation ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={clauseStyle}>3. Compensation</h2>
          <p style={{ margin: "0 0 12px" }}>
            The Client agrees to pay the Service Provider a total of{" "}
            <strong>{fmt(data.totalAmount)}</strong> for the services described above.
            Payment shall be made according to the following schedule:
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ ...cellStyle, textAlign: "left", width: "40%" }}>Milestone</th>
                <th style={{ ...cellStyle, textAlign: "right", width: "30%" }}>Amount</th>
                <th style={{ ...cellStyle, textAlign: "right", width: "30%" }}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {data.paymentSchedule.map((m) => (
                <tr key={m.id}>
                  <td style={{ ...cellStyle, fontWeight: 500 }}>{m.milestone}</td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>{fmt(m.amount)}</td>
                  <td style={{ ...cellStyle, textAlign: "right" }}>
                    {m.dueDate ? new Date(m.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Upon milestone approval"}
                  </td>
                </tr>
              ))}
              <tr style={{ background: "#f9fafb" }}>
                <td style={{ ...cellStyle, fontWeight: 700 }}>Total</td>
                <td style={{ ...cellStyle, textAlign: "right", fontWeight: 700 }}>{fmt(data.totalAmount)}</td>
                <td style={cellStyle}></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ── 4. Revisions ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={clauseStyle}>4. Revisions</h2>
          <p style={{ margin: 0 }}>
            The Client is entitled to <strong>{data.revisionLimit} round{data.revisionLimit !== 1 ? "s" : ""}</strong> of revisions
            per deliverable at no additional cost. Additional revisions will be billed at the Service Provider&apos;s
            standard hourly rate. Revisions must be requested in writing within 5 business days of delivery.
          </p>
        </section>

        {/* ── 5. Confidentiality ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={clauseStyle}>5. Confidentiality</h2>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.confidentialityClause}</p>
        </section>

        {/* ── 6. Termination ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={clauseStyle}>6. Termination</h2>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.terminationClause}</p>
        </section>

        {/* ── 7. Limitation of Liability ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={clauseStyle}>7. Limitation of Liability</h2>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.liabilityClause}</p>
        </section>

        {/* ── 8. Governing Law ── */}
        <section style={{ marginBottom: 28 }}>
          <h2 style={clauseStyle}>8. Governing Law</h2>
          <p style={{ margin: 0 }}>
            This Agreement shall be governed by and construed in accordance with the laws of{" "}
            <strong>{data.governingLaw}</strong>.
          </p>
        </section>

        {/* ── 9. Additional Terms ── */}
        {data.additionalTerms && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={clauseStyle}>9. Additional Terms</h2>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{data.additionalTerms}</p>
          </section>
        )}

        {/* ── Signatures ── */}
        <section style={{ borderTop: "1px solid #e5e7eb", paddingTop: 32, marginTop: 8 }}>
          <p style={{ margin: "0 0 24px", fontSize: 13 }}>
            By signing below, both parties acknowledge that they have read, understood, and agree to be bound by the terms of this Agreement.
          </p>
          <div style={{ display: "flex", gap: 48 }}>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: "1px solid #374151", marginBottom: 8, height: 40 }}></div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{data.freelancerName}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Service Provider</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Date: _______________</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: "1px solid #374151", marginBottom: 8, height: 40 }}></div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{data.clientName}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Client</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Date: _______________</div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "12px 48px",
          fontSize: 10,
          color: "#9ca3af",
          textAlign: "center",
          fontFamily: "'Segoe UI', Arial, sans-serif",
        }}
      >
        Page 1 of 1 · Generated by ClientFlow
      </div>
    </div>
  );
}

// ── Style constants ──
const cellStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #e5e7eb",
};
