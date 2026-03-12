const WC_PAY_API = "https://pay.walletconnect.com/api/v1";

interface PaymentOption {
  chainId: string;
  tokenAddress: string;
  amount: string;
  recipient: string;
}

interface PaymentAction {
  type: string;
  chainId: string;
  to: string;
  data: string;
  value: string;
}

export async function getPaymentOptions(paymentId: string): Promise<PaymentOption[]> {
  const res = await fetch(`${WC_PAY_API}/payments/${paymentId}/options`, {
    headers: {
      "x-project-id": process.env.WALLETCONNECT_PROJECT_ID || "",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to get payment options: ${res.statusText}`);
  }

  const data = await res.json();
  return data.options || [];
}

export async function fetchPaymentAction(
  paymentId: string,
  option: { chainId: string; tokenAddress: string }
): Promise<PaymentAction> {
  const res = await fetch(`${WC_PAY_API}/payments/${paymentId}/action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-project-id": process.env.WALLETCONNECT_PROJECT_ID || "",
    },
    body: JSON.stringify(option),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch payment action: ${res.statusText}`);
  }

  return res.json();
}

export async function confirmPayment(
  paymentId: string,
  txHash: string
): Promise<{ status: string }> {
  const res = await fetch(`${WC_PAY_API}/payments/${paymentId}/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-project-id": process.env.WALLETCONNECT_PROJECT_ID || "",
    },
    body: JSON.stringify({ txHash }),
  });

  if (!res.ok) {
    throw new Error(`Failed to confirm payment: ${res.statusText}`);
  }

  return res.json();
}
