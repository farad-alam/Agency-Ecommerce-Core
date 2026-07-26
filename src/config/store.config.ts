export interface StoreConfig {
  name: string;
  currency: string;
  locale: string;
  timezone: string;
  taxMode: "NONE" | "FLAT_RATE" | "REGIONAL";
  taxRate: number;
  auth: {
    customerRegistrationEnabled: boolean;
    googleEnabled: boolean;
    emailVerificationRequired: boolean;
    guestCheckoutEnabled: boolean;
    passwordMinLength: number;
  };
  paymentProviders: string[]; // e.g. ["sslcommerz"] — populated when payment is implemented
  inventory: {
    allowOversell: boolean;
    decrementOn: "on_checkout" | "on_payment";
    lowStockThreshold: number;
  };
  email: {
    adminAlertEmails: string[];
    lowStockThreshold: number;
  };
  rateLimits: {
    authWindowMinutes: number;
    authMaxRequests: number;
    apiWindowSeconds: number;
    apiMaxRequests: number;
  };
}

export const storeConfig: StoreConfig = {
  name: "My Store",
  currency: "BDT",
  locale: "en",
  timezone: "Asia/Dhaka",
  taxMode: "NONE",
  taxRate: 0,

  auth: {
    customerRegistrationEnabled: true,
    googleEnabled: false,
    emailVerificationRequired: false,
    guestCheckoutEnabled: true,
    passwordMinLength: 8,
  },

  // Payment providers — SSLCommerz will be added here at end of project
  paymentProviders: [],

  inventory: {
    allowOversell: false,
    decrementOn: "on_checkout",
    lowStockThreshold: 5,
  },

  email: {
    adminAlertEmails: ["admin@store.com"],
    lowStockThreshold: 5,
  },

  rateLimits: {
    authWindowMinutes: 15,
    authMaxRequests: 5,
    apiWindowSeconds: 60,
    apiMaxRequests: 60,
  },
};
