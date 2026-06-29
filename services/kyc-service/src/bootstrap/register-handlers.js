import { registerLocalIdentityHandler } from "@finboard/contracts";
import { DummyIdentity } from "../modules/kyc/models/dummy-identity.model.js";

export function registerKycHandlers() {
  registerLocalIdentityHandler(({ panNumber, aadhaarNumber }) =>
    DummyIdentity.findOne({ panNumber, aadhaarNumber }).lean()
  );
}
