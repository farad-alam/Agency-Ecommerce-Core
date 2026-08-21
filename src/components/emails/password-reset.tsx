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

interface PasswordResetEmailProps {
  userFirstname?: string;
  resetPasswordLink?: string;
}

export const PasswordResetEmail = ({
  userFirstname = "Customer",
  resetPasswordLink = "https://agencyecommerce.com/reset-password?token=123",
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Password Reset</Heading>
          <Text style={text}>Hi {userFirstname},</Text>
          <Text style={text}>
            Someone recently requested a password change for your account. If this was you, you can set a new password here:
          </Text>
          <Link href={resetPasswordLink} style={button}>
            Reset password
          </Link>
          <Text style={text}>
            If you don't want to change your password or didn't request this, just ignore and delete this message.
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

export default PasswordResetEmail;
