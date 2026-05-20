declare module '@cashfreepayments/cashfree-js' {
  interface CashfreeCheckoutResult {
    error?: { type: string; code: string; message: string };
    redirect?: boolean;
    paymentDetails?: Record<string, unknown>;
  }
  interface CashfreeInstance {
    checkout(options: { paymentSessionId: string; redirectTarget?: string }): Promise<CashfreeCheckoutResult>;
  }
  export function load(options: { mode: 'production' | 'sandbox' }): Promise<CashfreeInstance>;
}
