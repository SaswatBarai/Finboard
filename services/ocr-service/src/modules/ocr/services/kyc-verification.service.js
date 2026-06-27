import { readFileSync } from "node:fs";
import { extname } from "node:path";
import axios from "axios";
import { getServiceEnv } from "@finboard/config";

const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizePan(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .toUpperCase();
}

function normalizeAadhaar(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 12);
}

function cleanJsonContent(content) {
  return String(content || "")
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function mimeTypeForPath(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

function imageDataUri(filePath) {
  const mimeType = mimeTypeForPath(filePath);
  const imageBase64 = readFileSync(filePath).toString("base64");
  return `data:${mimeType};base64,${imageBase64}`;
}

function fieldScore(matched) {
  return matched ? 100 : 0;
}

function averageScore(scores) {
  const values = scores.filter((score) => typeof score === "number");
  if (!values.length) {
    return 0;
  }

  return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length);
}

function recommendationFromScore(score) {
  if (score >= 80) {
    return "approve";
  }

  if (score >= 50) {
    return "review";
  }

  return "reject";
}

function buildFieldResult({ userValue, ocrValue, identityValue, userMatched, ocrMatched }) {
  const score = averageScore([fieldScore(userMatched), fieldScore(ocrMatched)]);
  return {
    score,
    userValue: userValue || "",
    ocrValue: ocrValue || "",
    identityValue: identityValue || "",
    imageConsistent: null,
    notes: userMatched && ocrMatched ? "Matches identity database." : "Mismatch against identity database."
  };
}

export function verifyKycWithRulesFallback({ userEntered, identity, ocrExtracted }) {
  if (!identity) {
    return {
      overallScore: 0,
      recommendation: "reject",
      fields: {
        name: buildFieldResult({
          userValue: userEntered?.name,
          ocrValue: ocrExtracted?.pan?.name || ocrExtracted?.aadhaar?.name,
          identityValue: "",
          userMatched: false,
          ocrMatched: false
        }),
        panNumber: buildFieldResult({
          userValue: userEntered?.panNumber,
          ocrValue: ocrExtracted?.pan?.panNumber,
          identityValue: "",
          userMatched: false,
          ocrMatched: false
        }),
        aadhaarNumber: buildFieldResult({
          userValue: userEntered?.aadhaarNumber,
          ocrValue: ocrExtracted?.aadhaar?.aadhaarNumber,
          identityValue: "",
          userMatched: false,
          ocrMatched: false
        })
      },
      alignments: {
        userInputVsIdentity: 0,
        ocrVsIdentity: 0,
        imagesVsIdentity: null
      },
      summary: "No matching identity record found in the government reference database.",
      verificationSource: "rules_fallback",
      model: "",
      verifiedAt: new Date()
    };
  }

  const identityName = identity.name || "";
  const identityPan = normalizePan(identity.panNumber);
  const identityAadhaar = normalizeAadhaar(identity.aadhaarNumber);

  const userName = userEntered?.name || "";
  const userPan = normalizePan(userEntered?.panNumber);
  const userAadhaar = normalizeAadhaar(userEntered?.aadhaarNumber);

  const ocrName = ocrExtracted?.pan?.name || ocrExtracted?.aadhaar?.name || "";
  const ocrPan = normalizePan(ocrExtracted?.pan?.panNumber);
  const ocrAadhaar = normalizeAadhaar(ocrExtracted?.aadhaar?.aadhaarNumber);

  const nameUserMatched = normalizeName(userName) === normalizeName(identityName);
  const panUserMatched = userPan === identityPan;
  const aadhaarUserMatched = userAadhaar === identityAadhaar;

  const nameOcrMatched = normalizeName(ocrName) === normalizeName(identityName);
  const panOcrMatched = ocrPan === identityPan;
  const aadhaarOcrMatched = ocrAadhaar === identityAadhaar;

  const fields = {
    name: buildFieldResult({
      userValue: userName,
      ocrValue: ocrName,
      identityValue: identityName,
      userMatched: nameUserMatched,
      ocrMatched: nameOcrMatched
    }),
    panNumber: buildFieldResult({
      userValue: userPan,
      ocrValue: ocrPan,
      identityValue: identityPan,
      userMatched: panUserMatched,
      ocrMatched: panOcrMatched
    }),
    aadhaarNumber: buildFieldResult({
      userValue: userAadhaar,
      ocrValue: ocrAadhaar,
      identityValue: identityAadhaar,
      userMatched: aadhaarUserMatched,
      ocrMatched: aadhaarOcrMatched
    })
  };

  const userInputVsIdentity = averageScore([
    fieldScore(nameUserMatched),
    fieldScore(panUserMatched),
    fieldScore(aadhaarUserMatched)
  ]);
  const ocrVsIdentity = averageScore([
    fieldScore(nameOcrMatched),
    fieldScore(panOcrMatched),
    fieldScore(aadhaarOcrMatched)
  ]);
  const overallScore = averageScore([
    userInputVsIdentity,
    ocrVsIdentity,
    fields.name.score,
    fields.panNumber.score,
    fields.aadhaarNumber.score
  ]);

  return {
    overallScore,
    recommendation: recommendationFromScore(overallScore),
    fields,
    alignments: {
      userInputVsIdentity,
      ocrVsIdentity,
      imagesVsIdentity: null
    },
    summary: "Rule-based verification against the identity database (AI unavailable).",
    verificationSource: "rules_fallback",
    model: "",
    verifiedAt: new Date()
  };
}

function normalizeAiVerification(parsed, fallback) {
  const overallScore = Number.isFinite(Number(parsed.overallScore))
    ? Math.max(0, Math.min(100, Math.round(Number(parsed.overallScore))))
    : fallback.overallScore;

  const recommendation = ["approve", "review", "reject"].includes(parsed.recommendation)
    ? parsed.recommendation
    : recommendationFromScore(overallScore);

  return {
    overallScore,
    recommendation,
    fields: {
      name: { ...fallback.fields.name, ...(parsed.fields?.name || {}) },
      panNumber: { ...fallback.fields.panNumber, ...(parsed.fields?.panNumber || {}) },
      aadhaarNumber: { ...fallback.fields.aadhaarNumber, ...(parsed.fields?.aadhaarNumber || {}) }
    },
    alignments: {
      userInputVsIdentity: Number(parsed.alignments?.userInputVsIdentity ?? fallback.alignments.userInputVsIdentity),
      ocrVsIdentity: Number(parsed.alignments?.ocrVsIdentity ?? fallback.alignments.ocrVsIdentity),
      imagesVsIdentity:
        parsed.alignments?.imagesVsIdentity === null || parsed.alignments?.imagesVsIdentity === undefined
          ? null
          : Number(parsed.alignments.imagesVsIdentity)
    },
    summary: String(parsed.summary || fallback.summary),
    verificationSource: "mistral_vision",
    model: parsed.model || "",
    verifiedAt: new Date()
  };
}

async function callMistralVerification(model, messages) {
  const env = getServiceEnv();
  const response = await axios.post(
    MISTRAL_CHAT_URL,
    {
      model,
      messages,
      temperature: 0,
      max_tokens: env.llmMaxTokens
    },
    {
      headers: {
        Authorization: `Bearer ${env.mistralApiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 90000
    }
  );

  return cleanJsonContent(response.data.choices?.[0]?.message?.content || "{}");
}

export async function verifyKycIdentity({
  userEntered,
  identity,
  ocrExtracted,
  panFilePath,
  aadhaarFilePath
}) {
  const fallback = verifyKycWithRulesFallback({ userEntered, identity, ocrExtracted });
  const env = getServiceEnv();

  if (!identity || !env.mistralApiKey) {
    return fallback;
  }

  const context = {
    groundTruth: {
      name: identity.name,
      panNumber: identity.panNumber,
      aadhaarNumber: identity.aadhaarNumber
    },
    userEntered,
    ocrExtracted: {
      pan: ocrExtracted?.pan || {},
      aadhaar: ocrExtracted?.aadhaar || {}
    }
  };

  const systemPrompt = `You verify Indian KYC documents for an admin review queue.
The seeded identity database is government ground truth. Priority order:
1. Identity database values are the expected truth.
2. Compare OCR-extracted values against identity database.
3. Visually inspect PAN and Aadhaar images against identity database.
4. Compare user-entered values against identity database.
Return valid minified JSON only with keys:
overallScore, recommendation, fields, alignments, summary.
recommendation must be one of: approve, review, reject.
overallScore and field scores are integers 0-100.
fields must include name, panNumber, aadhaarNumber objects with keys:
score, userValue, ocrValue, identityValue, imageConsistent, notes.
alignments must include userInputVsIdentity, ocrVsIdentity, imagesVsIdentity (0-100 or null).
Do not include markdown.`;

  try {
    const content = await callMistralVerification(env.mistralVisionModel, [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Verify this KYC submission against the identity database.\n\nCONTEXT:\n${JSON.stringify(context)}`
          },
          { type: "text", text: "PAN card image:" },
          { type: "image_url", image_url: imageDataUri(panFilePath) },
          { type: "text", text: "Aadhaar document image:" },
          { type: "image_url", image_url: imageDataUri(aadhaarFilePath) }
        ]
      }
    ]);

    const parsed = JSON.parse(content);
    const result = normalizeAiVerification(parsed, fallback);
    result.model = env.mistralVisionModel;
    return result;
  } catch (error) {
    console.warn("Mistral KYC verification failed:", error.response?.data || error.message);
    return fallback;
  }
}
