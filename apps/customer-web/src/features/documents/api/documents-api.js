import { api } from "@/lib/api";

export const documentsApi = {
  kycApplication: () => api.get("/kyc/me").then((response) => response.data.application)
};
