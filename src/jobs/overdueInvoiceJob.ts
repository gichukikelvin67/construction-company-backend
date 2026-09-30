import { processOverdueInvoices } from "../services/overdueInvoiceService.js";

export const startOverdueInvoiceJob = (): void => {
  console.log("Overdue invoice job started.");

  const runCheck = async (): Promise<void> => {
    try {
      console.log("Running overdue invoice check...");

      await processOverdueInvoices();

      console.log("Overdue invoice check completed.");
    } catch (error) {
      console.error("Overdue invoice check failed:", error);
    }
  };

  // Run once when the server starts.
  void runCheck();

  // Check every hour.
  setInterval(() => {
    void runCheck();
  }, 60 * 60 * 1000);
};