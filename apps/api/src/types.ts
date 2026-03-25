export type BotState = {
  isAutomationEnabled: boolean;
  lastCycleAt: string | null;
  pnlSol: number;
  pnlUsd: number;
  totalDepositsSol: number;
  totalClaimsSol: number;
  claimableByWallet: Record<string, number>;
  depositLedger: Array<{
    wallet: string;
    signature: string;
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
