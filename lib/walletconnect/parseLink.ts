export interface ParsedPaymentLink {
  paymentId: string;
  raw: string;
}

const WC_PAY_REGEX = /wc:pay\?id=([a-zA-Z0-9_-]+)/;
const WC_PAY_URL_REGEX = /pay\.walletconnect\.com\/([a-zA-Z0-9_-]+)/;

export function parsePaymentLink(input: string): ParsedPaymentLink | null {
  // Try WC deep link format
  const wcMatch = input.match(WC_PAY_REGEX);
  if (wcMatch) {
    return { paymentId: wcMatch[1], raw: input };
  }

  // Try URL format
  const urlMatch = input.match(WC_PAY_URL_REGEX);
  if (urlMatch) {
    return { paymentId: urlMatch[1], raw: input };
  }

  // Try raw payment ID (alphanumeric)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(input.trim())) {
    return { paymentId: input.trim(), raw: input };
  }

  return null;
}
