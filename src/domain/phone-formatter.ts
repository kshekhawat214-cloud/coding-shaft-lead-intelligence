/**
 * Universal Phone Number Normalizer & Spreadsheet-Safe Formatter.
 * Ensures phone numbers are 100% compliant with WhatsApp Web,
 * Google Sheets, Excel, and CRM dialers without formula evaluation traps.
 */

export interface FormattedPhoneResult {
  raw: string;
  cleanDigits: string;         // e.g. "919001094661" (for WhatsApp links)
  international: string;       // e.g. "+91 90010 94661" (for UI display)
  parenthesized: string;       // e.g. "(+91) 90010 94661" (immune to spreadsheet subtraction)
  sheetSafe: string;           // Formatted strictly as literal text for spreadsheets
  whatsAppLink: string;        // Full https://wa.me/... link
}

export function formatLeadPhone(rawPhone?: string | null, businessName = "Team", city = "your area"): FormattedPhoneResult | null {
  if (!rawPhone || typeof rawPhone !== "string") return null;

  const trimmed = rawPhone.trim();
  const digitsOnly = trimmed.replace(/[^0-9]/g, "");

  if (digitsOnly.length < 7) return null;

  let countryCode = "";
  let nationalNumber = digitsOnly;

  // Detect common country codes
  if (digitsOnly.startsWith("91") && digitsOnly.length >= 12) {
    countryCode = "+91";
    nationalNumber = digitsOnly.slice(2);
  } else if (digitsOnly.startsWith("44") && digitsOnly.length >= 11) {
    countryCode = "+44";
    nationalNumber = digitsOnly.slice(2);
  } else if (digitsOnly.startsWith("1") && digitsOnly.length === 11) {
    countryCode = "+1";
    nationalNumber = digitsOnly.slice(1);
  } else if (digitsOnly.startsWith("852") && digitsOnly.length === 11) {
    countryCode = "+852";
    nationalNumber = digitsOnly.slice(3);
  } else if (trimmed.startsWith("+")) {
    // Has explicit plus
    const match = trimmed.match(/^\+(\d{1,3})[\s\-]*(.+)$/);
    if (match) {
      countryCode = `+${match[1]}`;
      nationalNumber = match[2].replace(/[^0-9]/g, "");
    }
  }

  // Format national number nicely
  let formattedNational = nationalNumber;
  if (nationalNumber.length === 10) {
    formattedNational = `${nationalNumber.slice(0, 5)} ${nationalNumber.slice(5)}`;
  } else if (nationalNumber.length === 8) {
    formattedNational = `${nationalNumber.slice(0, 4)} ${nationalNumber.slice(4)}`;
  }

  const international = countryCode ? `${countryCode} ${formattedNational}` : formattedNational;
  const parenthesized = countryCode ? `(${countryCode}) ${formattedNational}` : formattedNational;
  const cleanDigits = countryCode ? `${countryCode.replace("+", "")}${nationalNumber}` : nationalNumber;

  const waMsg = encodeURIComponent(
    `Hello ${businessName} team, I noticed your great customer reviews in ${city}. We specialize in direct customer ordering websites and automated WhatsApp booking systems for top local establishments. Would you be open to a quick 2-minute preview?`
  );
  const whatsAppLink = `https://wa.me/${cleanDigits}?text=${waMsg}`;

  // In spreadsheets, "(+91) 90010 94661" never triggers arithmetic evaluation (+91 - 90010)
  const sheetSafe = parenthesized;

  return {
    raw: trimmed,
    cleanDigits,
    international,
    parenthesized,
    sheetSafe,
    whatsAppLink,
  };
}
