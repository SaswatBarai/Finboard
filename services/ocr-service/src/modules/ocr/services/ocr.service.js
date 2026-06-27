import { readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";
import Tesseract from "tesseract.js";
import { getServiceEnv } from "@finboard/config";

const langPath = join(dirname(fileURLToPath(import.meta.url)), "../../../../");
const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_OCR_URL = "https://api.mistral.ai/v1/ocr";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

function normalizePan(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .toUpperCase()
    .match(/[A-Z]{5}[0-9]{4}[A-Z]/)?.[0] || "";
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

function parseFallback(text, type) {
  const panNumber = normalizePan(text.match(/[A-Z]{5}\s?[0-9]{4}\s?[A-Z]/i)?.[0] || "");
  const aadhaarNumber = normalizeAadhaar(text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/)?.[0]);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean);
  const name = lines.find((line) => /^[A-Za-z][A-Za-z ]{2,}$/.test(line) && !/government|income|aadhaar|unique|dob|birth|male|female|year|address|permanent/i.test(line));

  return type === "pan"
    ? { panNumber: panNumber || "", name: name || "" }
    : { aadhaarNumber: aadhaarNumber || "", name: name || "" };
}

function isValidName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts.length >= 2 && parts.every((part) => part.length >= 2) && parts.join(" ").length >= 5;
}

function hasExtractedFields(extracted, type) {
  if (type === "pan") {
    return extracted.panNumber?.length === 10 && isValidName(extracted.name);
  }

  return extracted.aadhaarNumber?.length === 12 && isValidName(extracted.name);
}

function mergeExtracted(primary, secondary, type) {
  if (type === "pan") {
    return {
      name: isValidName(primary.name) ? primary.name : secondary.name || primary.name,
      panNumber: primary.panNumber?.length === 10 ? primary.panNumber : secondary.panNumber || primary.panNumber
    };
  }

  return {
    name: isValidName(primary.name) ? primary.name : secondary.name || primary.name,
    aadhaarNumber:
      primary.aadhaarNumber?.length === 12 ? primary.aadhaarNumber : secondary.aadhaarNumber || primary.aadhaarNumber
  };
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

function extractionPrompt(type) {
  if (type === "pan") {
    return {
      expectedKeys: "name, panNumber",
      textPrompt: "Extract the Indian PAN card holder name and PAN number from OCR text.",
      visionPrompt: "Read this Indian PAN card image and extract the card holder name and PAN number."
    };
  }

  return {
    expectedKeys: "name, aadhaarNumber",
    textPrompt: "Extract the Aadhaar holder name and 12 digit Aadhaar number from OCR text.",
    visionPrompt:
      "Read this Indian Aadhaar document image and extract the holder full name and 12-digit Aadhaar number (digits only, no spaces)."
  };
}

function mapParsedFields(parsed, type, fallback = {}) {
  if (type === "pan") {
    return {
      name: String(parsed.name || fallback.name || "").trim(),
      panNumber: normalizePan(parsed.panNumber || fallback.panNumber)
    };
  }

  return {
    name: String(parsed.name || fallback.name || "").trim(),
    aadhaarNumber: normalizeAadhaar(parsed.aadhaarNumber || fallback.aadhaarNumber)
  };
}

function emptyExtraction(type) {
  return type === "pan" ? { panNumber: "", name: "" } : { aadhaarNumber: "", name: "" };
}

async function runTesseractOcr(filePath) {
  const result = await Tesseract.recognize(filePath, "eng", {
    langPath,
    logger: () => {}
  });

  return result.data?.text?.trim() || "";
}

async function runMistralDocumentOcr(filePath) {
  const env = getServiceEnv();
  if (!env.mistralApiKey) {
    return "";
  }

  try {
    const response = await axios.post(
      MISTRAL_OCR_URL,
      {
        model: env.mistralOcrModel,
        document: {
          type: "image_url",
          image_url: imageDataUri(filePath)
        }
      },
      {
        headers: {
          Authorization: `Bearer ${env.mistralApiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    const pages = response.data?.pages || [];
    return pages
      .map((page) => page.markdown || page.text || "")
      .join("\n")
      .trim();
  } catch (error) {
    console.warn("Mistral document OCR failed:", error.response?.data || error.message);
    return "";
  }
}

async function callMistralChat(model, messages) {
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
      timeout: 60000
    }
  );

  return cleanJsonContent(response.data.choices?.[0]?.message?.content || "{}");
}

async function callOpenRouterChat(model, messages) {
  const env = getServiceEnv();
  const response = await axios.post(
    OPENROUTER_CHAT_URL,
    {
      model,
      messages,
      temperature: 0,
      max_tokens: env.llmMaxTokens
    },
    {
      headers: {
        Authorization: `Bearer ${env.openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:4000",
        "X-Title": "Finboard KYC OCR"
      },
      timeout: 60000
    }
  );

  return cleanJsonContent(response.data.choices?.[0]?.message?.content || "{}");
}

async function extractWithLlmText(ocrText, type, provider) {
  const fallback = parseFallback(ocrText, type);
  const env = getServiceEnv();
  const { expectedKeys, textPrompt } = extractionPrompt(type);

  if (!ocrText) {
    return fallback;
  }

  if (provider === "mistral" && !env.mistralApiKey) {
    return fallback;
  }

  if (provider === "openrouter" && !env.openRouterApiKey) {
    return fallback;
  }

  try {
    const messages = [
      {
        role: "system",
        content: `Return valid minified JSON only with keys: ${expectedKeys}. Use empty string for missing values. Do not include markdown.`
      },
      {
        role: "user",
        content: `${textPrompt}\n\nOCR TEXT:\n${ocrText}`
      }
    ];

    const content =
      provider === "mistral"
        ? await callMistralChat(env.mistralTextModel, messages)
        : await callOpenRouterChat(env.openRouterModel, messages);

    return mapParsedFields(JSON.parse(content), type, fallback);
  } catch (error) {
    const label = provider === "mistral" ? "Mistral" : "OpenRouter";
    console.warn(`${label} text extraction fallback for ${type}:`, error.response?.data || error.message);
    return fallback;
  }
}

async function extractWithMistralVision(filePath, type) {
  const env = getServiceEnv();
  if (!env.mistralApiKey) {
    return emptyExtraction(type);
  }

  const { expectedKeys, visionPrompt } = extractionPrompt(type);

  try {
    const content = await callMistralChat(env.mistralVisionModel, [
      {
        role: "system",
        content: `Return valid minified JSON only with keys: ${expectedKeys}. Use empty string for missing values. Do not include markdown.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: visionPrompt },
          { type: "image_url", image_url: imageDataUri(filePath) }
        ]
      }
    ]);

    return mapParsedFields(JSON.parse(content), type);
  } catch (error) {
    console.warn(`Mistral vision extraction failed for ${type}:`, error.response?.data || error.message);
    return emptyExtraction(type);
  }
}

async function extractWithOpenRouterVision(filePath, type) {
  const env = getServiceEnv();
  if (!env.openRouterApiKey) {
    return emptyExtraction(type);
  }

  const { expectedKeys, visionPrompt } = extractionPrompt(type);
  const mimeType = mimeTypeForPath(filePath);
  const imageBase64 = readFileSync(filePath).toString("base64");

  try {
    const content = await callOpenRouterChat(env.openRouterVisionModel, [
      {
        role: "system",
        content: `Return valid minified JSON only with keys: ${expectedKeys}. Use empty string for missing values. Do not include markdown.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: visionPrompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
        ]
      }
    ]);

    return mapParsedFields(JSON.parse(content), type);
  } catch (error) {
    console.warn(`OpenRouter vision extraction failed for ${type}:`, error.response?.data || error.message);
    return emptyExtraction(type);
  }
}

async function extractWithVision(filePath, type) {
  const env = getServiceEnv();

  if (env.mistralApiKey) {
    const mistralExtracted = await extractWithMistralVision(filePath, type);
    if (hasExtractedFields(mistralExtracted, type)) {
      return { extracted: mistralExtracted, source: "mistral_vision" };
    }

    if (env.openRouterApiKey) {
      const openRouterExtracted = await extractWithOpenRouterVision(filePath, type);
      return {
        extracted: mergeExtracted(openRouterExtracted, mistralExtracted, type),
        source: hasExtractedFields(openRouterExtracted, type) ? "openrouter_vision" : ""
      };
    }

    return { extracted: mistralExtracted, source: "" };
  }

  if (env.openRouterApiKey) {
    const openRouterExtracted = await extractWithOpenRouterVision(filePath, type);
    return {
      extracted: openRouterExtracted,
      source: hasExtractedFields(openRouterExtracted, type) ? "openrouter_vision" : ""
    };
  }

  return { extracted: emptyExtraction(type), source: "" };
}

export async function processDocument(filePath, type) {
  try {
    const env = getServiceEnv();
    const tesseractText = await runTesseractOcr(filePath);
    const mistralText = env.mistralApiKey ? await runMistralDocumentOcr(filePath) : "";
    const ocrText = [tesseractText, mistralText].filter(Boolean).join("\n\n").trim();

    let extracted = parseFallback(ocrText, type);
    let extractionSource = "tesseract_regex";

    if (env.mistralApiKey) {
      extracted = await extractWithLlmText(ocrText, type, "mistral");
      extractionSource = "tesseract_mistral";
    } else if (env.openRouterApiKey) {
      extracted = await extractWithLlmText(ocrText, type, "openrouter");
      extractionSource = "tesseract_openrouter";
    }

    const hasLlmProvider = Boolean(env.mistralApiKey || env.openRouterApiKey);

    if (hasLlmProvider && !hasExtractedFields(extracted, type)) {
      const visionResult = await extractWithVision(filePath, type);
      extracted = mergeExtracted(visionResult.extracted, extracted, type);

      if (visionResult.source) {
        extractionSource = visionResult.source;
      }
    }

    return {
      ocrText,
      extracted,
      extractionSource
    };
  } catch (error) {
    console.warn(`Tesseract OCR failed for ${type}:`, error.message);
    return {
      ocrText: "",
      extracted: {},
      extractionSource: "ocr_error"
    };
  }
}
