"use client";

import { useCallback } from "react";
import { useAlien, usePayment } from "@alien_org/react";

type UseBountyPaymentOptions = {
  onPaid?: () => void;
  onCancelled?: () => void;
  onFailed?: () => void;
};

export function useBountyPayment({
  onPaid,
  onCancelled,
  onFailed,
}: UseBountyPaymentOptions) {
  const { authToken } = useAlien();

  const payment = usePayment({
    onPaid,
    onCancelled,
    onFailed,
  });

  const payBounty = useCallback(
    async (bountyId: string) => {
      if (!authToken) return;

      const res = await fetch(`/api/bounties/${bountyId}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to create bounty invoice");
      }

      const data = await res.json();

      payment.pay({
        recipient: data.recipient,
        amount: data.amount,
        token: data.token,
        network: data.network,
        invoice: data.invoice,
        item: data.item,
      });
    },
    [authToken, payment],
  );

  return {
    payBounty,
    status: payment.status,
    isLoading: payment.isLoading,
    isPaid: payment.isPaid,
    isCancelled: payment.isCancelled,
    isFailed: payment.isFailed,
    txHash: payment.txHash,
    error: payment.error,
    reset: payment.reset,
    supported: payment.supported,
  };
}
