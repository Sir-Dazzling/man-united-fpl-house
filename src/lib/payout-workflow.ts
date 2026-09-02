export type PayoutWorkflowRow = {
  id: string;
  managerName: string;
  placeLabel: string;
  amountNgn: number;
  status: string;
  paidAt: Date | null;
};

export type PayoutWorkflowPhase = "preview" | "announced" | "paid";

export function getPayoutWorkflowPhase(
  payouts: PayoutWorkflowRow[],
): PayoutWorkflowPhase {
  if (payouts.length === 0) return "preview";
  if (payouts.every((p) => p.status === "paid")) return "paid";
  return "announced";
}

export function sumPayoutAmount(payouts: PayoutWorkflowRow[]): number {
  return payouts.reduce((sum, p) => sum + p.amountNgn, 0);
}
