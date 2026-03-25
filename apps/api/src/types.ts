export type BotState = {
  isAutomationEnabled: boolean;
  lastCycleAt: string | null;
  pnlSol: number;
  pnlUsd: number;
  totalDepositsSol: number;
  totalClaimsSol: number;
  claimableByWallet: Record<string, number>;
  userDepositAddressByWallet: Record<string, string>;
  depositLedger: Array<{
    wallet: string;
    signature: string;
    depositAddress: string;
    sweepSignature: string | null;
    sweptAmountSol: number;
    amountSol: number;
    timestamp: string;
  }>;
  claimLedger: Array<{
    wallet: string;
    signature: string;
    amountSol: number;
    timestamp: string;
  }>;
};

export type RunCycleResult = {
  strategyState: string;
  netPnlSol: number;
  netPnlUsd: number;
  timestamp: string;
};
