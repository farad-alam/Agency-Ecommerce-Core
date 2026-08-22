import { Store, Truck, Wallet, RefreshCw, Heart } from "lucide-react";

const TRUST_ITEMS = [
  {
    Icon: Store,
    label: "Real Physical Store",
    sub: "New Market, Chapainawabganj",
  },
  {
    Icon: Truck,
    label: "Fast Delivery",
    sub: "Across All of Bangladesh",
  },
  {
    Icon: Wallet,
    label: "Cash on Delivery",
    sub: "Pay When You Receive",
  },
  {
    Icon: RefreshCw,
    label: "7-Day Exchange",
    sub: "Easy, No Questions Asked",
  },
  {
    Icon: Heart,
    label: "500+ Happy Customers",
    sub: "And Growing Every Day",
  },
];

export function TrustBar() {
  return (
    <div
      style={{
        background: "#141414",
        borderTop: "1px solid #2A2A2A",
        borderBottom: "1px solid #2A2A2A",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 lg:gap-0">
          {TRUST_ITEMS.map(({ Icon, label, sub }, i) => (
            <div
              key={label}
              className="flex flex-col items-center text-center gap-2"
              style={{
                borderRight: i < TRUST_ITEMS.length - 1 ? "1px solid #2A2A2A" : "none",
                padding: "0 16px",
              }}
            >
              <Icon
                className="h-6 w-6 mb-1"
                style={{ color: "#8B0D1A", strokeWidth: 1.5 }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontFamily: "'Montserrat', Arial, sans-serif",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  color: "#F5F2ED",
                  display: "block",
                }}
              >
                {label}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "11px",
                  color: "#9A9A8E",
                  display: "block",
                }}
              >
                {sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
