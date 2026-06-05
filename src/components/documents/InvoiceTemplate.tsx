import React from "react";
import { calcSubtotal, calcTax, fmt, type InvoiceData } from "./types";

/** Professional Invoice Template — renders as styled HTML for preview & PDF capture */
export default function InvoiceTemplate({ data }: { data: InvoiceData }) {
  const subtotal = calcSubtotal(data.items);
  const tax = calcTax(subtotal, data.taxRate);
  const total = subtotal + tax;
  const brand = data.brandColor || "#0f4c81";

  const overdue = new Date(data.dueDate) < new Date() && total > 0;

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        color: "#1a1a1a",
        lineHeight: 1.6,
        fontSize: 13,
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: "40px 40px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {/* Left — Company */}
        <div>
          {/* Logo */}
          {data.logoUrl && (
            <div style={{ marginBottom: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.logoUrl} alt="Logo" style={{ maxHeight: 60, maxWidth: 200, objectFit: "contain" }} />
            </div>
          )}
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: brand, letterSpacing: -0.5 }}>
            {data.companyName}
          </h1>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#6b7280", whiteSpace: "pre-wrap" }}>
            {data.freelancerName}{"\n"}
            {data.freelancerEmail}{"\n"}
            {data.freelancerPhone && `${data.freelancerPhone}\n`}
            {data.freelancerAddress}
          </p>
        </div>
        {/* Right — Invoice meta */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: brand, letterSpacing: -1, lineHeight: 1 }}>
            INVOICE
          </div>
          <div style={{ marginTop: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 600 }}>#{data.invoiceNumber}</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
            <div>Issued: {new Date(data.issueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</div>
            <div>Due: {new Date(data.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</div>
          </div>
          {overdue && (
            <div style={{ marginTop: 8, background: "#fee2e2", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4, display: "inline-block" }}>
              OVERDUE
            </div>
          )}
        </div>
      </div>

      {/* ── Bill To ── */}
      <div style={{ padding: "0 40px 24px", display: "flex", gap: 48 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#9ca3af", marginBottom: 4 }}>
            Bill To
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{data.clientName}</div>
          <div style={{ fontSize: 12, color: "#6b7280", whiteSpace: "pre-wrap" }}>
            {data.clientEmail}{"\n"}{data.clientAddress}
          </div>
        </div>
      </div>

      {/* ── Items Table ── */}
      <div style={{ padding: "0 40px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: brand, color: "#fff" }}>
              <th style={{ ...thStyle, borderRadius: "6px 0 0 0", textAlign: "left", width: "50%" }}>Description</th>
              <th style={{ ...thStyle, textAlign: "center", width: "12%" }}>Qty</th>
              <th style={{ ...thStyle, textAlign: "right", width: "18%" }}>Rate</th>
              <th style={{ ...thStyle, borderRadius: "0 6px 0 0", textAlign: "right", width: "20%" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={item.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                <td style={tdStyle}>{item.description}</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>{item.quantity}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(item.rate)}</td>
                <td style={{ ...tdStyle, textAlign: "right", fontWeight: 500 }}>{fmt(item.quantity * item.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Totals ── */}
      <div style={{ padding: "16px 40px 32px", display: "flex", justifyContent: "flex-end" }}>
        <div style={{ width: 260 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13 }}>
            <span style={{ color: "#6b7280" }}>Subtotal</span>
            <span style={{ fontWeight: 500 }}>{fmt(subtotal)}</span>
          </div>
          {data.taxRate > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13 }}>
              <span style={{ color: "#6b7280" }}>Tax ({data.taxRate}%)</span>
              <span>{fmt(tax)}</span>
            </div>
          )}
          <div style={{ borderTop: `2px solid ${brand}`, marginTop: 4, paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: brand }}>Total Due</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: brand }}>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* ── Payment Info ── */}
      {(data.bankName || data.paymentTerms) && (
        <div style={{ padding: "0 40px 32px" }}>
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: "20px 24px", border: "1px solid #e5e7eb" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: brand }}>Payment Information</h3>
            <div style={{ display: "flex", gap: 48, fontSize: 12 }}>
              <div>
                {data.paymentTerms && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: "#6b7280", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Payment Terms</span>
                    <div style={{ marginTop: 2 }}>{data.paymentTerms}</div>
                  </div>
                )}
              </div>
              <div>
                {data.bankName && (
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: "#6b7280", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Bank Details</span>
                    <div style={{ marginTop: 2 }}>
                      Bank: {data.bankName}
                      {data.accountNumber && <><br />Account: {data.accountNumber}</>}
                      {data.routingNumber && <><br />Routing: {data.routingNumber}</>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {data.notes && (
        <div style={{ padding: "0 40px 32px" }}>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: "#9ca3af", marginBottom: 4 }}>
            Notes
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "#6b7280", whiteSpace: "pre-wrap" }}>{data.notes}</p>
        </div>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "16px 40px",
          fontSize: 11,
          color: "#9ca3af",
          textAlign: "center",
        }}
      >
        {data.companyName} · {data.freelancerEmail}
      </div>
    </div>
  );
}

// ── Shared style constants ──
const thStyle: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  color: "#ffffff",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid #e5e7eb",
};
