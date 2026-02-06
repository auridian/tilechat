"use client";

import { useCallback } from "react";
import { useAlien, usePayment } from "@alien_org/react";
import type { DiamondProduct } from "../constants";

type UseDiamondPurchaseOptions = {
  onPaid?: () => void;
  onCancelled?: () => void;
  onFailed?: () => void;
};

export function useDiamondPurchase({
  onPaid,
  onCancelled,
  onFailed,
}: UseDiamondPurchaseOptions) {
  const { authToken } = useAlien();

  const payment = usePayment({
    onPaid,
    onCancelled,
    onFailed,
  });

  const purchase = useCallback(
    async (product: DiamondProduct) => {
      if (!authToken) return;

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          recipientAddress: product.recipientAddress,
          amount: product.amount,
          token: product.token,
          network: product.network,
          productId: product.id,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create invoice");
      }

      const { invoice } = await res.json();

      payment.pay({
        recipient: product.recipientAddress,
        amount: product.amount,
        token: product.token,
        network: product.network,
        invoice,
        item: {
          title: "Diamonds",
          iconUrl: product.iconUrl,
          quantity: product.diamonds,
        },
        test: product.test,
      });
    },
    [authToken, payment],
  );

  return {
    purchase,
    status: payment.status,
    isLoading: payment.isLoading,
    isPaid: payment.isPaid,
    isCancelled: payment.isCancelled,
    isFailed: payment.isFailed,
    txHash: payment.txHash,
    error: payment.error,
    errorCode: payment.errorCode,
    reset: payment.reset,
    supported: payment.supported,
  };
}
