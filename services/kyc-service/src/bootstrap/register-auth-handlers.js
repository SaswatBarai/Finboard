import { registerLocalAuthHandler } from "@finboard/contracts";
import { User } from "../../../auth-service/src/modules/auth/models/user.model.js";

function toSafeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    phoneVerified: user.phoneVerified,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

export function registerKycAuthHandlers() {
  registerLocalAuthHandler({
    async getUserById(userId) {
      return toSafeUser(await User.findById(userId).lean());
    },
    async getUsersByIds(ids = []) {
      const users = await User.find({ _id: { $in: ids } }).lean();
      return users.map(toSafeUser);
    }
  });
}
