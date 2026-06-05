import React from "react";
import { calcSubtotal, calcTax, fmt, type ProposalData } from "./types";

/** Professional Proposal Template — renders as styled HTML for preview & PDF capture */
export default function ProposalTemplate({ data }: { data: ProposalData }) {
  const subtotal = calcSubtotal(data.pricing);
  const tax = calcTax(subtotal, data.taxRate);
  const total = subtotal + tax;
  const brand = data.brandColor || "#1e3a5f";
  const headingStyle: React.CSSProperties = {
    fontSize: 16, fontWeight: 700, color: brand,
    marginBottom: 12, paddingBottom: 6, borderBottom: `2px solid ${brand}`,
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: "#1a1a1a", lineHeight: 1.6, fontSize: 13,
      }}
    >
      {/* ── Cover / Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 100%)`, color: "#ffffff", padding: "48px 40px", marginBottom: 0 }}>
        {/* Logo */}
        {data.logoUrl && (
          <div style={{ marginBottom: 20 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.logoUrl} alt="Logo" style={{ maxHeight: 60, maxWidth: 200, objectFit: "contain" }} />
          </div>
        )}
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.8, marginBottom: 8 }}>Project Proposal</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 6px", lineHeight: 1.2 }}>{data.projectName}</h1>
        <p style={{ fontSize: 14, margin: "0 0 24px", opacity: 0.85 }}>Prepared for {data.clientName}</p>
        <div style={{ display: "flex", gap: 32, fontSize: 12, opacity: 0.9 }}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{data.companyName}</div>
            <div>{data.freelancerName}</div>
            <div>{data.freelancerEmail}</div>
            {data.freelancerPhone && <div>{data.freelancerPhone}</div>}
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Date Issued</div>
            <div>{new Date(data.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
            <div style={{ fontWeight: 600, marginTop: 8, marginBottom: 2 }}>Valid Until</div>
            <div>{new Date(data.validUntil).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "40px 40px" }}>
        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>Introduction</h2>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{data.introduction}</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>Project Understanding</h2>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{data.projectUnderstanding}</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>Scope of Work</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {data.scopeItems.map((item, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{item}</li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>Project Timeline</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: "30%" }}>Phase</th>
                <th style={{ ...thStyle, width: "20%" }}>Duration</th>
                <th style={{ ...thStyle, width: "50%" }}>Key Deliverables</th>
              </tr>
            </thead>
            <tbody>
              {data.timeline.map((row) => (
                <tr key={row.id}>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{row.phase}</td>
                  <td style={tdStyle}>{row.duration}</td>
                  <td style={tdStyle}>{row.deliverables}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>Investment</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: "50%", textAlign: "left" }}>Description</th>
                <th style={{ ...thStyle, width: "15%", textAlign: "center" }}>Qty</th>
                <th style={{ ...thStyle, width: "18%", textAlign: "right" }}>Rate</th>
                <th style={{ ...thStyle, width: "17%", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.pricing.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.description}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(item.rate)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 500 }}>{fmt(item.quantity * item.rate)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 500 }}>Subtotal</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 500 }}>{fmt(subtotal)}</td>
              </tr>
              {data.taxRate > 0 && (
                <tr>
                  <td colSpan={3} style={{ ...tdStyle, textAlign: "right" }}>Tax ({data.taxRate}%)</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(tax)}</td>
                </tr>
              )}
              <tr>
                <td colSpan={3} style={{ ...tdStyle, textAlign: "right", fontWeight: 700, fontSize: 14 }}>Total</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, fontSize: 14 }}>{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={headingStyle}>Terms &amp; Conditions</h2>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{data.terms}</p>
        </section>

        {data.notes && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={headingStyle}>Additional Notes</h2>
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{data.notes}</p>
          </section>
        )}

        <section style={{ marginBottom: 0, borderTop: "1px solid #e5e7eb", paddingTop: 32 }}>
          <h2 style={headingStyle}>Acceptance</h2>
          <p style={{ marginBottom: 24 }}>By signing below, both parties agree to the terms outlined in this proposal.</p>
          <div style={{ display: "flex", gap: 48 }}>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: "1px solid #9ca3af", marginBottom: 6, height: 32 }}></div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{data.freelancerName} — Service Provider</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Date: _______________</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ borderBottom: "1px solid #9ca3af", marginBottom: 6, height: 32 }}></div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{data.clientName} — Client</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Date: _______________</div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "16px 40px", fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
        {data.companyName} · {data.freelancerEmail}
        {data.freelancerWebsite ? ` · ${data.freelancerWebsite}` : ""}
      </div>
    </div>
  );
}

// ── Shared style constants ──
const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 12,
};

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "#f8f9fa",
  borderBottom: "2px solid #dee2e6",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "#495057",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #e9ecef",
};
