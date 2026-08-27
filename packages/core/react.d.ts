import type { SVGProps } from "react";
import type { PayloadError, PayloadOptions } from "./index.js";

export interface PaymentQrState {
  /** Null when the input is invalid. */
  path: string | null;
  extent: number;
  payload: string | null;
  error: PayloadError | null;
}

/** Builds the code without throwing — this renders on a live checkout page. */
export function usePaymentQr(options: PayloadOptions): PaymentQrState;

export interface PaymentQRCodeProps
  extends Omit<SVGProps<SVGSVGElement>, "color">,
    PayloadOptions {
  size?: number;
  color?: string;
  title?: string;
  onError?: (error: PayloadError) => void;
}

/** Renders nothing and calls `onError` on invalid input. */
export function PaymentQRCode(props: PaymentQRCodeProps): JSX.Element | null;

export interface PaymentQRProps extends PayloadOptions {
  /** Shown at checkout so a shopper can confirm who they are paying. */
  accountTitle?: string;
  bankName?: string;
  size?: number;
  color?: string;
  currency?: string;
  className?: string;
  onError?: (error: PayloadError) => void;
}

export function PaymentQR(props: PaymentQRProps): JSX.Element;

/** Groups an IBAN into fours for display. */
export function formatIban(iban: string): string;
