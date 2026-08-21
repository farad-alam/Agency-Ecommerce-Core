import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

interface StaffInviteEmailProps {
  role?: string;
  inviteLink?: string;
}

export const StaffInviteEmail = ({
  role = "STAFF",
  inviteLink = "https://agencyecommerce.com/invite?token=123",
}: StaffInviteEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>You have been invited to join the team</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Join the Team</Heading>
          <Text style={text}>Hello,</Text>
          <Text style={text}>
            You have been invited to join the store's dashboard as an <strong>{role}</strong>. 
            Click the button below to set up your account and get started.
          </Text>
          <Link href={inviteLink} style={button}>
            Accept Invitation
          </Link>
          <Text style={text}>
            This invitation will expire in 7 days. If you were not expecting this invitation, you can ignore this email.
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

const button = {
  backgroundColor: "#6366f1", // Indigo 500
  borderRadius: "5px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "bold",
  lineHeight: "50px",
  textAlign: "center" as const,
  textDecoration: "none",
  width: "100%",
  marginTop: "16px",
  marginBottom: "16px",
};

export default StaffInviteEmail;
