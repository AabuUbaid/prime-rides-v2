import { apiClient } from "./client";

export async function getLedgerSummary() {
  return apiClient("/ledger-accounts/summary/");
}
