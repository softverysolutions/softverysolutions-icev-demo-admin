import { CountryService } from "services/countryService";
import { PROMO_ENTITY_PAGE_SIZE } from "../promo-code-form/constants";

let promoMasterOptionsCache = null;
let promoMasterOptionsInflight = null;

export async function loadPromoMasterOptions() {
  if (promoMasterOptionsCache) {
    return promoMasterOptionsCache;
  }
  if (promoMasterOptionsInflight) {
    return promoMasterOptionsInflight;
  }

  promoMasterOptionsInflight = (async () => {
    const countriesRes = await CountryService.getAllCountries({
      limit: PROMO_ENTITY_PAGE_SIZE,
      page: 1,
    });
    const countryOptions = (countriesRes.data || []).map((c) => ({
      value: c.id,
      label: c.name || c.id,
    }));
    const result = {
      countryOptions,
      countryMeta: countriesRes.meta || {
        currentPage: 1,
        totalPages: 1,
        totalItems: countryOptions.length,
      },
    };
    promoMasterOptionsCache = result;
    return result;
  })();

  try {
    return await promoMasterOptionsInflight;
  } finally {
    promoMasterOptionsInflight = null;
  }
}

export function clearPromoMasterOptionsCache() {
  promoMasterOptionsCache = null;
}
