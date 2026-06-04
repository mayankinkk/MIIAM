"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface PrintReceiptHandle {
  print: (kind?: "receipt" | "kot" | "label") => void;
}

export interface ReceiptOrder {
  id: string;
  placedAt?: string;
  totalAmount?: number;
  paymentMethod?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
  status?: string;
  vendor?: { shopName?: string; name?: string; address?: string; phone?: string } | null;
  rider?: { name?: string; phone?: string } | null;
  items?: Array<{
    name: string;
    quantity: number | string;
    unitPrice?: number | string;
    price?: number | string;
    specialNotes?: string | null;
  }>;
}

interface Props {
  order: ReceiptOrder;
  customerName?: string;
  customerPhone?: string;
  showKot?: boolean;
  showLabel?: boolean;
}

const fmtMoney = (n: number | string | undefined) => {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return `Rs. ${Number.isFinite(v) ? v.toFixed(2) : "0.00"}`;
};

const fmtDate = (iso?: string) => {
  if (!iso) return new Date().toLocaleString();
  return new Date(iso).toLocaleString();
};

const PrintReceipt = forwardRef<PrintReceiptHandle, Props>(function PrintReceipt(
  { order, customerName, customerPhone, showKot = true, showLabel = true },
  ref
) {
  const receiptRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    print: (kind = "receipt") => {
      const node = receiptRef.current;
      if (!node) return;
      const target = node.querySelector<HTMLElement>(
        kind === "kot" ? "[data-print='kot']" :
        kind === "label" ? "[data-print='label']" :
        "[data-print='receipt']"
      );
      if (!target) return;

      const w = window.open("", "_blank", "width=420,height=720");
      if (!w) {
        window.print();
        return;
      }

      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((el) => el.outerHTML)
        .join("\n");

      w.document.open();
      w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${kind === "kot" ? "KOT" : kind === "label" ? "Address Label" : "Receipt"} - ${order.id.slice(0, 8).toUpperCase()}</title>
  ${styles}
  <style>
    @page { size: ${kind === "label" ? "100mm 150mm" : kind === "kot" ? "80mm auto" : "80mm auto"}; margin: 4mm; }
    body { background: white !important; margin: 0; padding: 0; }
    [data-print] { display: none; }
    [data-print-target] { display: block !important; }
  </style>
</head>
<body>
  ${target.outerHTML}
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); window.close(); }, 200);
    });
  </script>
</body>
</html>`);
      w.document.close();
    },
  }), [order]);

  const items = order.items || [];
  const subtotal = items.reduce((acc, it) => {
    const q = typeof it.quantity === "string" ? parseFloat(it.quantity) : it.quantity ?? 1;
    const p = parseFloat(String(it.unitPrice ?? it.price ?? 0));
    return acc + (Number.isFinite(q) ? q : 1) * (Number.isFinite(p) ? p : 0);
  }, 0);

  return (
    <div ref={receiptRef} aria-hidden="true">
      {/* CUSTOMER RECEIPT */}
      <div
        data-print="receipt"
        data-print-target
        className="print-receipt"
        style={{
          fontFamily: "'Plus Jakarta Sans', monospace, sans-serif",
          width: "72mm",
          padding: "4mm",
          color: "#000",
          background: "#fff",
          fontSize: "11px",
          lineHeight: 1.4,
        }}
      >
        <div style={{ textAlign: "center", borderBottom: "1px dashed #000", paddingBottom: 6, marginBottom: 6 }}>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 1 }}>MIIAM</div>
          <div style={{ fontSize: 10, marginTop: 2 }}>Tax Invoice / Receipt</div>
          <div style={{ fontSize: 9, marginTop: 2 }}>{order.vendor?.shopName || order.vendor?.name || "MIIAM Store"}</div>
          {order.vendor?.address && <div style={{ fontSize: 9 }}>{order.vendor.address}</div>}
          {order.vendor?.phone && <div style={{ fontSize: 9 }}>Ph: {order.vendor.phone}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
          <span>Order #</span>
          <strong>{order.id.slice(0, 8).toUpperCase()}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
          <span>Date</span>
          <span>{fmtDate(order.placedAt)}</span>
        </div>
        {customerName && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
            <span>Customer</span>
            <span>{customerName}</span>
          </div>
        )}
        {customerPhone && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 2 }}>
            <span>Phone</span>
            <span>{customerPhone}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
          <span>Payment</span>
          <span>{(order.paymentMethod || "COD").toUpperCase()}</span>
        </div>

        <div style={{ borderTop: "1px dashed #000", borderBottom: "1px dashed #000", padding: "4px 0", margin: "4px 0" }}>
          {items.length === 0 ? (
            <div style={{ fontSize: 10, fontStyle: "italic", textAlign: "center" }}>No items</div>
          ) : (
            items.map((it, i) => {
              const q = typeof it.quantity === "string" ? parseFloat(it.quantity) : it.quantity ?? 1;
              const p = parseFloat(String(it.unitPrice ?? it.price ?? 0));
              const line = (Number.isFinite(q) ? q : 1) * (Number.isFinite(p) ? p : 0);
              return (
                <div key={i} style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>{it.name}</span>
                    <span>{fmtMoney(line)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#444" }}>
                    <span>{q} x {fmtMoney(p)}</span>
                    {it.specialNotes && <span style={{ fontStyle: "italic" }}>{it.specialNotes}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ fontSize: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>{fmtMoney(subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 12, marginTop: 4 }}>
            <span>TOTAL</span>
            <span>{fmtMoney(order.totalAmount ?? subtotal)}</span>
          </div>
        </div>

        {order.deliveryAddress && (
          <div style={{ borderTop: "1px dashed #000", marginTop: 6, paddingTop: 6, fontSize: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>DELIVER TO</div>
            <div>{order.deliveryAddress}</div>
            {order.deliveryInstructions && (
              <div style={{ fontStyle: "italic", marginTop: 2 }}>Note: {order.deliveryInstructions}</div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 8, fontSize: 9, borderTop: "1px dashed #000", paddingTop: 6 }}>
          Thank you for ordering with MIIAM!<br />
          www.miiam.app
        </div>
      </div>

      {/* KITCHEN ORDER TICKET (KOT) */}
      {showKot && (
        <div
          data-print="kot"
          style={{
            fontFamily: "'Plus Jakarta Sans', monospace, sans-serif",
            width: "72mm",
            padding: "4mm",
            color: "#000",
            background: "#fff",
            fontSize: "12px",
            lineHeight: 1.3,
          }}
        >
          <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 6, marginBottom: 6 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>KOT</div>
            <div style={{ fontSize: 10 }}>Kitchen Order Ticket</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13 }}>
            <span>#{order.id.slice(0, 8).toUpperCase()}</span>
            <span>{fmtDate(order.placedAt)}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 11 }}>
            Type: {order.status === "ready_for_pickup" ? "PICKUP" : "DINE-IN-DELIVERY"}
          </div>
          {order.deliveryAddress && (
            <div style={{ fontSize: 11, marginTop: 2 }}>Addr: {order.deliveryAddress}</div>
          )}
          {customerName && <div style={{ fontSize: 11 }}>Cust: {customerName}{customerPhone ? ` (${customerPhone})` : ""}</div>}
          {order.deliveryInstructions && (
            <div style={{ fontSize: 11, marginTop: 2, fontStyle: "italic" }}>Note: {order.deliveryInstructions}</div>
          )}
          <div style={{ borderTop: "2px solid #000", margin: "6px 0" }} />
          <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 4 }}>ITEMS</div>
          <ol style={{ paddingLeft: 18, margin: 0 }}>
            {items.map((it, i) => {
              const q = typeof it.quantity === "string" ? parseFloat(it.quantity) : it.quantity ?? 1;
              return (
                <li key={i} style={{ marginBottom: 4, fontWeight: 700 }}>
                  {q} x {it.name}
                  {it.specialNotes && <div style={{ fontSize: 10, fontWeight: 400, fontStyle: "italic" }}>— {it.specialNotes}</div>}
                </li>
              );
            })}
          </ol>
          <div style={{ borderTop: "2px solid #000", marginTop: 6, paddingTop: 4, textAlign: "center", fontSize: 9 }}>
            -- END OF TICKET --
          </div>
        </div>
      )}

      {/* ADDRESS LABEL */}
      {showLabel && (
        <div
          data-print="label"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            width: "92mm",
            padding: "6mm",
            color: "#000",
            background: "#fff",
            border: "2px solid #000",
            fontSize: "12px",
            lineHeight: 1.3,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>MIIAM DELIVERY</div>
          <div style={{ borderTop: "1px solid #000", paddingTop: 6 }}>
            <div style={{ fontSize: 10 }}>TO:</div>
            <div style={{ fontWeight: 900, fontSize: 16, marginTop: 2 }}>{customerName || "Customer"}</div>
            {customerPhone && <div style={{ fontSize: 11 }}>Ph: {customerPhone}</div>}
            <div style={{ fontSize: 12, marginTop: 4, fontWeight: 600 }}>{order.deliveryAddress || "—"}</div>
            {order.deliveryInstructions && (
              <div style={{ fontSize: 10, fontStyle: "italic", marginTop: 4, borderTop: "1px dashed #000", paddingTop: 4 }}>
                Note: {order.deliveryInstructions}
              </div>
            )}
          </div>
          <div style={{ borderTop: "1px solid #000", marginTop: 6, paddingTop: 4, display: "flex", justifyContent: "space-between", fontSize: 9 }}>
            <span>Order #{order.id.slice(0, 8).toUpperCase()}</span>
            <span>{(order.paymentMethod || "COD").toUpperCase()}</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default PrintReceipt;
