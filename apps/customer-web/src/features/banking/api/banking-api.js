import { api } from "@/lib/api";

export const bankingApi = {
  summary: () => api.get("/banking/account").then((response) => response.data),
  linkedAccounts: () => api.get("/banking/accounts").then((response) => response.data.accounts),
  demoAccounts: () => api.get("/banking/demo-accounts").then((response) => response.data.accounts),
  lookup: (accountNumber) => api.get(`/banking/lookup/${accountNumber}`).then((response) => response.data.account),
  removeAccount: (id) => api.delete(`/banking/accounts/${id}`).then((response) => response.data),
  verifyBank: (payload) => api.post("/banking/verify-bank", payload).then((response) => response.data),
  transfer: (payload) => api.post("/banking/transfer", payload).then((response) => response.data),
  addBeneficiary: (payload) => api.post("/banking/beneficiary", payload).then((response) => response.data),
  transactions: (range) => api.get(`/banking/transactions?range=${range}`).then((response) => response.data.transactions),
  notifications: () => api.get("/banking/notifications").then((response) => response.data.notifications),
  dismissNotification: (id) => api.delete(`/banking/notifications/${id}`).then((response) => response.data),
  adminUsers: () => api.get("/banking/admin/users").then((response) => response.data.accounts),
  adminTransactions: () => api.get("/banking/admin/transactions").then((response) => response.data.transactions),
  freeze: (id, frozen) => api.patch(`/banking/admin/users/${id}/freeze`, { frozen }).then((response) => response.data),
  resetBalance: (id, balance) => api.patch(`/banking/admin/users/${id}/reset-balance`, { balance }).then((response) => response.data)
};
