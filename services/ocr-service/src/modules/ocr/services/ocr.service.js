import { readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import axios from "axios";
import Tesseract from "tesseract.js";
import { getServiceEnv } from "@finboard/config";

const langPath = join(dirname(fileURLToPath(import.meta.url)), "../../../../");

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

function openRouterHeaders(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:4000",
    "X-Title": "Finboard KYC OCR"
  };
}

async function runTesseractOcr(filePath) {
  const result = await Tesseract.recognize(filePath, "eng", {
    langPath,
    logger: () => {}
  });

  return result.data?.text?.trim() || "";
}

async function callOpenRouter(model, messages) {
  const env = getServiceEnv();
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model,
      messages,
      temperature: 0
    },
    {
      headers: openRouterHeaders(env.openRouterApiKey)
    }
  );

  return cleanJsonContent(response.data.choices?.[0]?.message?.content || "{}");
}

async function extractWithOpenRouter(ocrText, type) {
  const fallback = parseFallback(ocrText, type);

  if (!getServiceEnv().openRouterApiKey || !ocrText) {
    return fallback;
  }

  const expectedKeys = type === "pan" ? "name, panNumber" : "name, aadhaarNumber";
  const prompt =
    type === "pan"
      ? "Extract the Indian PAN card holder name and PAN number from OCR text."
      : "Extract the Aadhaar holder name and 12 digit Aadhaar number from OCR text.";

  try {
    const content = await callOpenRouter(getServiceEnv().openRouterModel, [
      {
        role: "system",
        content: `Return valid minified JSON only with keys: ${expectedKeys}. Use empty string for missing values. Do not include markdown.`
      },
      {
        role: "user",
        content: `${prompt}\n\nOCR TEXT:\n${ocrText}`
      }
    ]);

    const parsed = JSON.parse(content);

    if (type === "pan") {
      return {
        name: parsed.name || fallback.name || "",
        panNumber: normalizePan(parsed.panNumber || fallback.panNumber)
      };
    }

    return {
      name: parsed.name || fallback.name || "",
      aadhaarNumber: normalizeAadhaar(parsed.aadhaarNumber || fallback.aadhaarNumber)
    };
  } catch (error) {
    console.warn(`OpenRouter text extraction fallback for ${type}:`, error.response?.data || error.message);
    return fallback;
  }
}

async function extractWithOpenRouterVision(filePath, type) {
  const env = getServiceEnv();

  if (!env.openRouterApiKey) {
    return type === "pan" ? { panNumber: "", name: "" } : { aadhaarNumber: "", name: "" };
  }

  const mimeType = mimeTypeForPath(filePath);
  const imageBase64 = readFileSync(filePath).toString("base64");
  const expectedKeys = type === "pan" ? "name, panNumber" : "name, aadhaarNumber";
  const prompt =
    type === "pan"
      ? "Read this Indian PAN card image and extract the card holder name and PAN number."
      : "Read this Indian Aadhaar document image and extract the holder full name and 12-digit Aadhaar number (digits only, no spaces).";

  try {
    const content = await callOpenRouter(env.openRouterVisionModel, [
      {
        role: "system",
        content: `Return valid minified JSON only with keys: ${expectedKeys}. Use empty string for missing values. Do not include markdown.`
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
        ]
      }
    ]);

    const parsed = JSON.parse(content);

    if (type === "pan") {
      return {
        name: String(parsed.name || "").trim(),
        panNumber: normalizePan(parsed.panNumber)
      };
    }

    return {
      name: String(parsed.name || "").trim(),
      aadhaarNumber: normalizeAadhaar(parsed.aadhaarNumber)
    };
  } catch (error) {
    console.warn(`OpenRouter vision extraction failed for ${type}:`, error.response?.data || error.message);
    return type === "pan" ? { panNumber: "", name: "" } : { aadhaarNumber: "", name: "" };
  }
}

export async function processDocument(filePath, type) {
  try {
    const env = getServiceEnv();
    const ocrText = await runTesseractOcr(filePath);
    let extracted = await extractWithOpenRouter(ocrText, type);
    let extractionSource = env.openRouterApiKey ? "tesseract_openrouter" : "tesseract_regex";

    if (env.openRouterApiKey && !hasExtractedFields(extracted, type)) {
      const visionExtracted = await extractWithOpenRouterVision(filePath, type);
      extracted = mergeExtracted(visionExtracted, extracted, type);

      if (hasExtractedFields(extracted, type)) {
        extractionSource = "openrouter_vision";
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
