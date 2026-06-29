import test from "node:test";
import assert from "node:assert/strict";
import { verifyKycWithRulesFallback } from "../modules/ocr/services/kyc-verification.service.js";

test("verifyKycWithRulesFallback returns reject when identity is missing", () => {
  const result = verifyKycWithRulesFallback({
    userEntered: {
      name: "Anurag Swarnakar",
      panNumber: "QMRPS6975K",
      aadhaarNumber: "634441264716"
    },
    identity: null,
    ocrExtracted: {
      pan: { name: "Anurag Swarnakar", panNumber: "QMRPS6975K" },
      aadhaar: { name: "Anurag Swarnakar", aadhaarNumber: "634441264716" }
    }
  });

  assert.equal(result.overallScore, 0);
  assert.equal(result.recommendation, "reject");
  assert.equal(result.verificationSource, "rules_fallback");
});

test("verifyKycWithRulesFallback scores perfect match as approve", () => {
  const identity = {
    name: "Anurag Swarnakar",
    panNumber: "QMRPS6975K",
    aadhaarNumber: "634441264716"
  };

  const result = verifyKycWithRulesFallback({
    userEntered: identity,
    identity,
    ocrExtracted: {
      pan: { name: "Anurag Swarnakar", panNumber: "QMRPS6975K" },
      aadhaar: { name: "Anurag Swarnakar", aadhaarNumber: "634441264716" }
    }
  });

  assert.equal(result.overallScore, 100);
  assert.equal(result.recommendation, "approve");
  assert.equal(result.fields.panNumber.score, 100);
  assert.equal(result.alignments.userInputVsIdentity, 100);
  assert.equal(result.alignments.ocrVsIdentity, 100);
});

test("verifyKycWithRulesFallback lowers score when user name mismatches identity", () => {
  const identity = {
    name: "Anurag Swarnakar",
    panNumber: "QMRPS6975K",
    aadhaarNumber: "634441264716"
  };

  const result = verifyKycWithRulesFallback({
    userEntered: {
      name: "Wrong Name",
      panNumber: "QMRPS6975K",
      aadhaarNumber: "634441264716"
    },
    identity,
    ocrExtracted: {
      pan: { name: "Anurag Swarnakar", panNumber: "QMRPS6975K" },
      aadhaar: { name: "Anurag Swarnakar", aadhaarNumber: "634441264716" }
    }
  });

  assert.ok(result.overallScore < 100);
  assert.equal(result.fields.name.score, 50);
  assert.ok(result.alignments.userInputVsIdentity < 100);
});
