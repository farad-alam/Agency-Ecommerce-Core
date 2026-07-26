import * as React from 'react';

export const OrderShippedEmail = ({ orderNumber, trackingUrl }: { orderNumber: string, trackingUrl?: string }) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
    <h2>Your order has shipped!</h2>
    <p>Good news! Order <strong>{orderNumber}</strong> is on its way.</p>
    {trackingUrl && <a href={trackingUrl}>Track your package</a>}
  </div>
);

export const OrderCancelledEmail = ({ orderNumber }: { orderNumber: string }) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
    <h2>Order Cancelled</h2>
    <p>Your order <strong>{orderNumber}</strong> has been cancelled and refunded.</p>
  </div>
);

export const StaffInviteEmail = ({ role, inviteLink }: { role: string, inviteLink: string }) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
    <h2>You've been invited to join the team!</h2>
    <p>You have been invited as a {role}.</p>
    <a href={inviteLink}>Accept Invitation</a>
  </div>
);

export const LowStockAlertEmail = ({ productTitle, sku, currentStock }: { productTitle: string, sku: string, currentStock: number }) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
    <h2>Low Stock Alert</h2>
    <p>The following item is running low on stock:</p>
    <ul>
      <li>Product: {productTitle}</li>
      <li>SKU: {sku}</li>
      <li>Remaining Stock: {currentStock}</li>
    </ul>
  </div>
);

export const WelcomeEmail = ({ name }: { name: string }) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
    <h2>Welcome to Agency Ecommerce, {name}!</h2>
    <p>We're thrilled to have you here.</p>
  </div>
);

export const ReviewRequestEmail = ({ productTitle, reviewLink }: { productTitle: string, reviewLink: string }) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
    <h2>How did you like your recent purchase?</h2>
    <p>We hope you are enjoying your {productTitle}.</p>
    <a href={reviewLink}>Leave a Review</a>
  </div>
);
