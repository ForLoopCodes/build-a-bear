import { runDefaultDevnetPaperTradingCycle } from "../src/live";

runDefaultDevnetPaperTradingCycle()
  .then(() => {
    process.stdout.write("devnet_paper_cycle_complete\n");
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
