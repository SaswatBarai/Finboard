import { api } from "@/lib/api";

export const auditApi = {
  byResource: (resourceType, resourceId) =>
    api.get(`/audit/${resourceType}/${resourceId}`).then((response) => response.data.entries)
};
