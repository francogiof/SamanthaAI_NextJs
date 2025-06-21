import { initUserTable } from "../lib/db";

// Simple script to run DB migrations (for now, just user table)
function migrate() {
  initUserTable();
  console.log("User table migration complete.");
}

migrate();
