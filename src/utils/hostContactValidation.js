export const validateHostPhone = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return { valid: true };

  if (!trimmed.startsWith("+")) {
    return {
      valid: false,
      message: "Phone number must start with a country code (e.g. +353 86 555 0142)",
    };
  }

  if (!/^\+[\d\s\-()]+$/.test(trimmed)) {
    return {
      valid: false,
      message: "Phone number can only contain digits, spaces, dashes, and parentheses",
    };
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return {
      valid: false,
      message: "Enter a valid phone number with country code (e.g. +353 86 555 0142)",
    };
  }

  return { valid: true };
};

export const validateHostWhatsapp = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return { valid: true };

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const isWhatsappLink = host === "wa.me" || host.endsWith("whatsapp.com");

    if (!isWhatsappLink) {
      return {
        valid: false,
        message: "Enter a valid WhatsApp link (e.g. https://wa.me/353871234567)",
      };
    }

    if (host === "wa.me") {
      const phone = url.pathname.replace(/^\//, "").replace(/[+\-\s()]/g, "");
      if (phone && !/^\d+$/.test(phone)) {
        return {
          valid: false,
          message: "WhatsApp link must contain a valid phone number (e.g. https://wa.me/353871234567)",
        };
      }
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      message: "Enter a valid WhatsApp link (e.g. https://wa.me/353871234567)",
    };
  }
};

export const validateHostEmail = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return { valid: true };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return {
      valid: false,
      message: "Enter a valid email address (e.g. host@example.com)",
    };
  }

  return { valid: true };
};

export const validateHostContactFields = ({ hostPhone, hostWhatsapp, hostEmail }) => {
  const phoneResult = validateHostPhone(hostPhone);
  if (!phoneResult.valid) return phoneResult;

  const whatsappResult = validateHostWhatsapp(hostWhatsapp);
  if (!whatsappResult.valid) return whatsappResult;

  return validateHostEmail(hostEmail);
};
