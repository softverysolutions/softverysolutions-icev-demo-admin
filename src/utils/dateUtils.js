export const formatDateToUTC = (dateInput) => {
  if (!dateInput) return dateInput;

  if (dateInput instanceof Date) {
    const utcDate = new Date(
      Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate())
    );
    return utcDate.toISOString();
  }

  if (typeof dateInput === "string") {
    const dateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const day = parseInt(dateMatch[3]);

      const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      return utcDate.toISOString();
    }

    const date = new Date(dateInput);
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return utcDate.toISOString();
  }

  const date = new Date(dateInput);
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  return utcDate.toISOString();
};

export const formatDateForAPI = (dateString) => {
  if (!dateString) {
    return null;
  }
  const result = formatDateToUTC(dateString);
  return result;
};

/** Parse API UTC date into a local Date for date pickers (calendar day from UTC, not local offset). */
export const parseUtcDateForPicker = (dateInput) => {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;

  const iso =
    typeof dateInput === "string"
      ? dateInput
      : new Date(dateInput).toISOString();
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(
      parseInt(match[1], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[3], 10)
    );
  }

  return new Date(dateInput);
};

export const formatDateOnly = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    
    return `${day}.${month}.${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return null;
  }
};

export const formatDateOnlyGB = (dateString) => {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return null;
  }
};
