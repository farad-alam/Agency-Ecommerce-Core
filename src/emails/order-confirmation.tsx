import * as React from 'react';

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  total: string;
}

export const OrderConfirmationEmail: React.FC<OrderConfirmationEmailProps> = ({
  orderNumber,
  customerName,
  total,
}) => (
  <div style={{ fontFamily: 'sans-serif', padding: '20px' }}>
    <h2>Thank you for your order, {customerName}!</h2>
    <p>Your order <strong>{orderNumber}</strong> has been received and is currently pending.</p>
    <p>Order Total: {total}</p>
    <br />
    <p>We'll notify you once it ships.</p>
  </div>
);

export default OrderConfirmationEmail;
