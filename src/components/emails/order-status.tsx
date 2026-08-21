import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

interface OrderStatusEmailProps {
  orderNumber?: string;
  customerName?: string;
  status?: string;
  note?: string;
}

export const OrderStatusEmail = ({
  orderNumber = "ORD-0000-0000",
  customerName = "Customer",
  status = "SHIPPED",
  note = "",
}: OrderStatusEmailProps) => {
  const isShipped = status === "SHIPPED";
  const isCancelled = status === "CANCELLED";
  
  const title = isShipped 
    ? "Your order is on the way!" 
    : isCancelled 
      ? "Your order has been cancelled" 
      : `Your order status is now ${status}`;

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{title}</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            There is an update on your order <strong>{orderNumber}</strong>.
          </Text>
          
          <Text style={statusText}>
            Status: <strong>{status}</strong>
          </Text>

          {note && (
            <Text style={noteText}>
              Note from store: "{note}"
            </Text>
          )}

          {isShipped && (
            <Text style={text}>
              Your package has been handed over to our delivery partner. They will contact you soon.
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  marginBottom: "64px",
  borderRadius: "8px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0 0 20px",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
};

const statusText = {
  backgroundColor: "#f3f4f6",
  padding: "12px",
  borderRadius: "6px",
  color: "#111827",
  fontSize: "16px",
  marginTop: "16px",
  marginBottom: "16px",
};

const noteText = {
  color: "#4b5563",
  fontSize: "14px",
  fontStyle: "italic",
  borderLeft: "3px solid #6366f1",
  paddingLeft: "12px",
  marginTop: "16px",
  marginBottom: "16px",
};

export default OrderStatusEmail;
