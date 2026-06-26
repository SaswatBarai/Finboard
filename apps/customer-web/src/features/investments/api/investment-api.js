import { api } from "@/lib/api";

export const investmentApi = {
  buy: (payload) => api.post("/investments/buy", payload).then((response) => response.data.holding),
  createSip: (payload) => api.post("/investments/sip", payload).then((response) => response.data.holding),
  portfolio: () => api.get("/investments/portfolio").then((response) => response.data.holdings),
  adminOverview: () => api.get("/investments/admin/overview").then((response) => response.data),
  updateOrderStatus: (id, status) => api.patch(`/investments/admin/orders/${id}/status`, { status }).then((response) => response.data.holding)
};
