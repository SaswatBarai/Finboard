import { api } from "@/lib/api";

export const kycApi = {
  me: () => api.get("/kyc/me").then((response) => response.data),
  currentApplication: () => api.get("/kyc/me").then((response) => response.data.application),
  submit: (payload) => {
    const form = new FormData();
    form.append("name", payload.name);
    form.append("panNumber", payload.panNumber);
    form.append("aadhaarNumber", payload.aadhaarNumber);
    form.append("pan", payload.panFile);
    form.append("aadhaar", payload.aadhaarFile);
    return api.post("/kyc/submit", form).then((response) => response.data.application);
  },
  adminList: () => api.get("/kyc/admin/applications").then((response) => response.data.applications),
  adminGet: (id) => api.get(`/kyc/admin/applications/${id}`).then((response) => response.data),
  approve: (id, remarks) => api.post(`/kyc/admin/applications/${id}/approve`, { remarks }).then((response) => response.data.application),
  reject: (id, remarks) => api.post(`/kyc/admin/applications/${id}/reject`, { remarks }).then((response) => response.data.application)
};

