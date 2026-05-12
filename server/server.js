import app from "./app.js";
import { config } from "./config.js";
import { disconnectAll } from "./utils/prismaForTenant.js";
import pool from "./db.js";

import {
  events_checker_per_tenant,
  scheduleEventsChecker,
} from "./utils/hikEventChecker.js";
import { startNotificationsWorker } from "./workers/notificationsWorker.js";
import { startDoorTasksWorker } from "./workers/doorTasksWorker.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

async function shutdown() {
  await disconnectAll();
  await pool.end();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

app.listen(config.port, "0.0.0.0", () => {
  console.log(`Server running on port ${config.port}`);
  // startDoorTasksWorker();
  // startNotificationsWorker();
  // scheduleEventsChecker();
  // events_checker_per_tenant(-1);
});
