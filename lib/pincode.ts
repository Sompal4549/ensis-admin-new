/**
 * Utility for fetching location details (City, District, State, Country)
 * from 6-digit Indian Postal Pincodes with in-memory caching, deduplication,
 * timeout handling, and state normalization.
 */

export interface PincodeLocation {
  pincode: string;
  city: string;
  district: string;
  state: string;
  country: string;
}

export const ALL_INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

// Cache fetched pincodes so repeated lookups or re-typing are instantaneous
const pincodeCache = new Map<string, PincodeLocation>();
// Deduplicate concurrent requests for the same pincode
const pendingRequests = new Map<string, Promise<PincodeLocation | null>>();

function cleanString(str: string): string {
  return str
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

const STATE_ALIASES: Record<string, string[]> = {
  delhi: ["delhi", "newdelhi", "nctofdelhi", "nationalcapitalterritoryofdelhi", "centraldelhi"],
  odisha: ["odisha", "orissa"],
  uttarakhand: ["uttarakhand", "uttaranchal"],
  puducherry: ["puducherry", "pondicherry"],
  jammuandkashmir: ["jammuandkashmir", "jammukashmir", "jk"],
  andamanandnicobarislands: ["andamanandnicobar", "andamanandnicobarislands", "andaman"],
  dadraandnagarhavelianddamandiu: [
    "dadraandnagarhavelianddamandiu",
    "dadraandnagarhaveli",
    "damandiu",
    "daman",
    "diu",
  ],
};

/**
 * Finds the best matching option from a state options list (which may contain
 * `{ value: string; label: string }` or plain strings like `"Delhi"`).
 */
export function matchStateOption<
  T extends { value?: string; id?: string; label?: string } | string
>(options: readonly T[] | T[], fetchedState: string): T | undefined {
  if (!fetchedState || !Array.isArray(options) || options.length === 0) {
    return undefined;
  }

  const getLabel = (opt: T): string =>
    typeof opt === "string" ? opt : opt.label || opt.value || opt.id || "";
  const getValue = (opt: T): string =>
    typeof opt === "string" ? opt : opt.value || opt.id || opt.label || "";

  const targetClean = cleanString(fetchedState);

  // 1. Exact cleaned match on label or value (handles "maharashtra" vs "Maharashtra")
  let match = options.find((opt) => {
    const valClean = cleanString(getValue(opt));
    const lblClean = cleanString(getLabel(opt));
    return valClean === targetClean || lblClean === targetClean;
  });
  if (match) return match;

  // 2. Check canonical aliases / alternate names
  for (const variants of Object.values(STATE_ALIASES)) {
    const targetIsVariant = variants.some((v) => targetClean.includes(v) || v.includes(targetClean));
    if (targetIsVariant) {
      match = options.find((opt) => {
        const valClean = cleanString(getValue(opt));
        const lblClean = cleanString(getLabel(opt));
        return variants.some((v) => valClean.includes(v) || lblClean.includes(v) || v.includes(lblClean));
      });
      if (match) return match;
    }
  }

  // 3. Substring match for longer state names (> 4 chars)
  match = options.find((opt) => {
    const lblClean = cleanString(getLabel(opt));
    if (lblClean.length >= 4 && (targetClean.includes(lblClean) || lblClean.includes(targetClean))) {
      return true;
    }
    const valClean = cleanString(getValue(opt));
    if (valClean.length >= 4 && (targetClean.includes(valClean) || valClean.includes(targetClean))) {
      return true;
    }
    return false;
  });

  return match;
}

/**
 * Fetches location details for a given 6-digit Indian pincode.
 */
export async function fetchLocationByPincode(
  pincode: string | number,
  options?: { timeoutMs?: number }
): Promise<PincodeLocation | null> {
  const cleanZip = String(pincode ?? "").replace(/\D/g, "");
  if (cleanZip.length !== 6) {
    return null;
  }

  if (pincodeCache.has(cleanZip)) {
    return pincodeCache.get(cleanZip)!;
  }

  if (pendingRequests.has(cleanZip)) {
    return pendingRequests.get(cleanZip)!;
  }

  const timeoutMs = options?.timeoutMs ?? 8000;

  const requestPromise = (async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanZip}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (
        Array.isArray(data) &&
        data[0]?.Status === "Success" &&
        Array.isArray(data[0]?.PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const postOffices = data[0].PostOffice;
        const po =
          postOffices.find((p: any) => String(p?.DeliveryStatus || "").toLowerCase() === "delivery") ||
          postOffices[0];

        const district = String(po.District || "").trim();
        const block = String(po.Block || "").trim();
        const name = String(po.Name || "").trim();
        const state = String(po.State || "").trim();
        const country = String(po.Country || "India").trim();

        const city = district || block || name;

        const result: PincodeLocation = {
          pincode: cleanZip,
          city,
          district,
          state,
          country,
        };

        pincodeCache.set(cleanZip, result);
        return result;
      }

      return null;
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.warn("Failed to fetch location from pincode:", cleanZip, err?.message || err);
      }
      return null;
    } finally {
      clearTimeout(timeoutId);
      pendingRequests.delete(cleanZip);
    }
  })();

  pendingRequests.set(cleanZip, requestPromise);
  return requestPromise;
}
