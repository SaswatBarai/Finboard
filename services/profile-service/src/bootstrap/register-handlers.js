import { registerLocalProfileHandler } from "@finboard/contracts";
import { UserProfile } from "../modules/profile/index.js";

export function registerProfileHandlers() {
  registerLocalProfileHandler({
    createInitialProfile: (payload) => UserProfile.create(payload),
    getProfileByUserId: (userId) => UserProfile.findOne({ userId }),
    updateProfileKycStatus: (userId, patch) =>
      UserProfile.findOneAndUpdate({ userId }, { $set: patch }, { upsert: true, new: true })
  });
}
