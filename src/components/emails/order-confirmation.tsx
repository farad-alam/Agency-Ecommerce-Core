import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Hr,
} from "@react-email/components";

interface OrderConfirmationEmailProps {
  orderNumber?: string;
  customerName?: string;
  total?: string;
  items?: Array<{ title: string; quantity: number; price: string }>;
  shippingAddress?: string;
}

export const OrderConfirmationEmail = ({
  orderNumber = "ORD-0000-0000",
  customerName = "Customer",
  total = "150 BDT",
  items = [
    { title: "Sample Product", quantity: 1, price: "150 BDT" }
  ],
  shippingAddress = "Dhaka, Bangladesh",
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your order {orderNumber} is confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thank you for your order!</Heading>
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            We've received your order <strong>{orderNumber}</strong> and we're getting it ready to ship.
          </Text>

          <Section style={orderBox}>
            <Text style={sectionTitle}>Order Summary</Text>
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemColLeft}>
                  <Text style={itemText}>{item.quantity}x {item.title}</Text>
                </Column>
                <Column style={itemColRight}>
                  <Text style={itemText}>{item.price}</Text>
                </Column>
              </Row>
            ))}
            <Hr style={hr} />
            <Row>
              <Column style={itemColLeft}>
                <Text style={totalText}>Total</Text>
              </Column>
              <Column style={itemColRight}>
                <Text style={totalText}>{total}</Text>
              </Column>
            </Row>
          </Section>

          <Section style={shippingBox}>
            <Text style={sectionTitle}>Shipping To</Text>
            <Text style={shippingText}>{shippingAddress}</Text>
          </Section>

          <Text style={text}>
            We'll send you another email when your order ships.
          </Text>
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

const orderBox = {
  backgroundColor: "#f9fafb",
  padding: "20px",
  borderRadius: "8px",
  marginBottom: "20px",
};

const sectionTitle = {
  color: "#333",
  fontSize: "16px",
  fontWeight: "bold",
  margin: "0 0 16px",
};

const itemRow = {
  marginBottom: "8px",
};

const itemColLeft = {
  width: "70%",
};

const itemColRight = {
  width: "30%",
  textAlign: "right" as const,
};

const itemText = {
  margin: "0",
  color: "#525f7f",
  fontSize: "14px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "12px 0",
};

const totalText = {
  margin: "0",
  color: "#333",
  fontSize: "16px",
  fontWeight: "bold",
};

const shippingBox = {
  marginBottom: "24px",
};

const shippingText = {
  margin: "0",
  color: "#525f7f",
  fontSize: "14px",
  lineHeight: "20px",
  whiteSpace: "pre-wrap" as const,
};

export default OrderConfirmationEmail;
