import { registerLocalBankingHandler } from "@finboard/contracts";
import { debitForInvestment, getLinkedAccount } from "../modules/banking/index.js";

export function registerBankingHandlers() {
  registerLocalBankingHandler({ debitForInvestment, getLinkedAccount });
}
