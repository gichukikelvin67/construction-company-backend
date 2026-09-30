import "dotenv/config";
import "./config/env.js";
import app from "./app.js";
import connectDatabase from "./config/database.js";
import { startOverdueInvoiceJob } from "./jobs/overdueInvoiceJob.js";

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDatabase();

  

  app.listen(PORT, () => {
    console.log(`Aesthetics API running on http://localhost:${PORT}`);
     startOverdueInvoiceJob();
  });
};

startServer();