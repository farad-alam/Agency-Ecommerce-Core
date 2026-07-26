import * as React from 'react';

interface PasswordResetEmailProps {
  resetLink: string;
  customerName?: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  resetLink,
  customerName = "Valued Customer",
}) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
    <h2>Password Reset Request</h2>
    <p>Hello {customerName},</p>
    <p>We received a request to reset your password. Click the link below to set a new password:</p>
    <a href={resetLink} style={{ display: 'inline-block', padding: '10px 20px', background: '#4F46E5', color: '#fff', textDecoration: 'none', borderRadius: '5px' }}>
      Reset Password
    </a>
    <p>If you didn't request this, you can safely ignore this email.</p>
  </div>
);

export default PasswordResetEmail;
