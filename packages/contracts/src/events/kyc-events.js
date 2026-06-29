import { z } from "zod";

export const kycSubmittedEventSchema = z.object({
  applicationId: z.string(),
  userId: z.string(),
  status: z.string(),
  submittedAt: z.string()
});
