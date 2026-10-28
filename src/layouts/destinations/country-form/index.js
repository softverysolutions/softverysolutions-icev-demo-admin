import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftEditor from "components/SoftEditor";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { CountryService } from "services/countryService";
import { CountryFaqService } from "services/countryFaqService";
import {
  collectEntityImageGallery,
  formatImageUrl,
  inferImageMimeType,
  isAllowedImageFile,
} from "utils/imageUtils";

const MAX_COUNTRY_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_COUNTRY_GALLERY_ITEMS = 15;
const ACCEPTED_COUNTRY_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const PROGRAM_TYPE_DEFINITIONS = [
  { key: "shortCamp", defaultName: "Short camp", hasDuration: true },
  { key: "bootcamp", defaultName: "Bootcamp", hasDuration: true },
  { key: "certification", defaultName: "Certification track", hasDuration: false },
];
const PROGRAM_TYPE_LABELS = {
  sectionTitle: "Programme formats",
  sectionDescription:
    "Duration-based formats offered in this country. Certification tracks are informational only.",
  nameLabel: "Name *",
  durationLabel: "Duration Range (weeks)",
  fromLabel: "From weeks *",
  toLabel: "To weeks *",
  shortDescriptionLabel: "Short description",
  longDescriptionLabel: "Long description",
  rulesLabel: "Rules",
  rulesHelper: "Add, edit, and remove rules (one line per item).",
  noteLabel: "Note",
  tagsLabel: "Tags",
  tagsHelper: "Add, edit, and remove tags.",
};

function pickStringArrayFromCountry(data, camelKey, snakeKey) {
  if (!data || typeof data !== "object") return [];
  const camel = data[camelKey];
  if (Array.isArray(camel)) return camel;
  const snake = data[snakeKey];
  if (Array.isArray(snake)) return snake;
  return [];
}

function rowsFromApiStrings(arr, idPrefix) {
  const list = Array.isArray(arr) ? arr : [];
  return list.map((text, i) => ({
    id: `${idPrefix}-row-${i}`,
    text: text != null ? String(text) : "",
  }));
}

function payloadFromStringRows(rows) {
  return rows.map((r) => String(r.text).trim()).filter(Boolean);
}

function getProgramTypeDefinition(typeKey) {
  return PROGRAM_TYPE_DEFINITIONS.find((row) => row.key === typeKey) || null;
}

function createProgramTypeRow(typeKey) {
  const definition = getProgramTypeDefinition(typeKey);
  return {
    id: `program-type-${typeKey}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    typeKey: typeKey || "",
    name: definition?.defaultName || "",
    fromWeeks: "",
    toWeeks: "",
    shortDescription: "",
    longDescription: "",
    rules: [],
    note: "",
    tags: [],
  };
}

function mapRulesFromApi(item, typeKey, index) {
  const raw = item?.rules ?? item?.rule;
  if (Array.isArray(raw)) {
    return raw.map((line, lineIdx) => ({
      id: `pt-rule-${typeKey || "unknown"}-${index}-${lineIdx}`,
      text: line != null ? String(line) : "",
    }));
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(/\r?\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text, lineIdx) => ({
        id: `pt-rule-${typeKey || "unknown"}-${index}-${lineIdx}`,
        text,
      }));
  }
  return [];
}

function mapProgramTypeFromApi(item, index) {
  const typeKey = item?.typeKey || item?.type_key || "";
  const definition = getProgramTypeDefinition(typeKey);
  const tags = Array.isArray(item?.tags)
    ? item.tags.map((tag, tagIdx) => ({
        id: `pt-tag-${typeKey || "unknown"}-${index}-${tagIdx}`,
        text: tag != null ? String(tag) : "",
      }))
    : [];
  const rules = mapRulesFromApi(item, typeKey, index);
  return {
    id: `program-type-loaded-${typeKey || "unknown"}-${index}`,
    typeKey,
    name: item?.name || definition?.defaultName || "",
    fromWeeks:
      item?.fromWeeks != null
        ? String(item.fromWeeks)
        : item?.from_weeks != null
        ? String(item.from_weeks)
        : "",
    toWeeks:
      item?.toWeeks != null
        ? String(item.toWeeks)
        : item?.to_weeks != null
        ? String(item.to_weeks)
        : "",
    shortDescription: item?.shortDescription || item?.short_description || "",
    longDescription: item?.longDescription || item?.long_description || "",
    rules,
    note: item?.note != null ? String(item.note) : "",
    tags,
  };
}

function toNullableNumber(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function toNullableText(value) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function buildProgramTypePayload(rows) {
  return rows.map((row) => {
    const definition = getProgramTypeDefinition(row.typeKey);
    const rulesPayload = (Array.isArray(row.rules) ? row.rules : [])
      .map((r) => String(r.text || "").trim())
      .filter(Boolean);
    const tagsPayload = row.tags.map((t) => String(t.text || "").trim()).filter(Boolean);
    const payload = {
      typeKey: row.typeKey,
      name: String(row.name || "").trim(),
      shortDescription: toNullableText(row.shortDescription),
      longDescription: toNullableText(row.longDescription),
      rules: rulesPayload.length > 0 ? rulesPayload : null,
      tags: tagsPayload.length > 0 ? tagsPayload : null,
      note: toNullableText(row.note),
      fromWeeks: null,
      toWeeks: null,
    };
    if (definition?.hasDuration) {
      payload.fromWeeks = toNullableNumber(row.fromWeeks);
      payload.toWeeks = toNullableNumber(row.toWeeks);
    }
    return payload;
  });
}

function hasProgramTypeUserContent(row) {
  if (!row || typeof row !== "object") return false;
  const hasRules =
    Array.isArray(row.rules) && row.rules.some((r) => String(r?.text || "").trim() !== "");
  return (
    String(row.name || "").trim() !== "" ||
    String(row.shortDescription || "").trim() !== "" ||
    String(row.longDescription || "").trim() !== "" ||
    String(row.note || "").trim() !== "" ||
    hasRules ||
    String(row.fromWeeks || "").trim() !== "" ||
    String(row.toWeeks || "").trim() !== "" ||
    (Array.isArray(row.tags) && row.tags.some((t) => String(t?.text || "").trim() !== ""))
  );
}

function validateProgramTypes(rows) {
  const seenTypeKeys = new Set();
  const ranges = [];
  for (const row of rows) {
    const definition = getProgramTypeDefinition(row.typeKey);
    if (!definition) {
      return `Unknown program type key: ${row.typeKey || "empty"}.`;
    }
    if (seenTypeKeys.has(row.typeKey)) {
      return `Program type "${definition.defaultName}" is configured more than once.`;
    }
    seenTypeKeys.add(row.typeKey);
    if (!String(row.name || "").trim()) {
      return `Name is required for "${definition.defaultName}".`;
    }
    if (definition.hasDuration) {
      const fromRaw = String(row.fromWeeks || "").trim();
      const toRaw = String(row.toWeeks || "").trim();
      if (!fromRaw || !toRaw) {
        return `Duration range is required for "${definition.defaultName}".`;
      }
      if (!/^\d+$/.test(fromRaw) || !/^\d+$/.test(toRaw)) {
        return `Duration values must be whole numbers for "${definition.defaultName}".`;
      }
      const from = Number(fromRaw);
      const to = Number(toRaw);
      if (from <= 0 || to <= 0) {
        return `Duration values must be greater than 0 for "${definition.defaultName}".`;
      }
      if (to < from) {
        return `"To weeks" must be greater than or equal to "From weeks" for "${definition.defaultName}".`;
      }
      ranges.push({ typeLabel: definition.defaultName, from, to });
    }
  }

  ranges.sort((a, b) => a.from - b.from);
  for (let i = 1; i < ranges.length; i += 1) {
    const prev = ranges[i - 1];
    const current = ranges[i];
    if (current.from <= prev.to) {
      return `Duration ranges overlap between "${prev.typeLabel}" and "${current.typeLabel}".`;
    }
  }
  return null;
}

function CountryStringListBlock({ title, helper, items, setItems, idPrefix }) {
  const addItem = () => {
    setItems((prev) => [...prev, { id: `${idPrefix}-new-${Date.now()}`, text: "" }]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index, nextText) => {
    setItems((prev) => prev.map((r, i) => (i === index ? { ...r, text: nextText } : r)));
  };

  return (
    <SoftBox mb={2}>
      <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <SoftBox>
          <SoftTypography variant="button" fontWeight="bold" display="block">
            {title}
          </SoftTypography>
          <SoftTypography variant="caption" color="text" display="block">
            {helper}
          </SoftTypography>
        </SoftBox>
        <SoftButton
          variant="outlined"
          color="dark"
          size="small"
          onClick={addItem}
          startIcon={<Icon fontSize="small">add</Icon>}
        >
          Add
        </SoftButton>
      </SoftBox>
      {items.length === 0 ? (
        <SoftBox p={2} borderRadius={2} border="1px solid" borderColor="grey.300" bgcolor="grey.50">
          <SoftTypography variant="caption" color="text.secondary">
            No items yet.
          </SoftTypography>
        </SoftBox>
      ) : (
        items.map((row, index) => (
          <SoftBox key={row.id} display="flex" alignItems="center" gap={1} mb={1.5}>
            <SoftInput
              fullWidth
              size="small"
              value={row.text}
              onChange={(e) => updateItem(index, e.target.value)}
              sx={{ flex: 1, minWidth: 0 }}
            />
            <IconButton
              size="small"
              color="error"
              onClick={() => removeItem(index)}
              aria-label="Remove item"
              sx={{ flexShrink: 0 }}
            >
              <Icon fontSize="small">delete</Icon>
            </IconButton>
          </SoftBox>
        ))
      )}
    </SoftBox>
  );
}

CountryStringListBlock.propTypes = {
  title: PropTypes.string.isRequired,
  helper: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, text: PropTypes.string.isRequired })
  ).isRequired,
  setItems: PropTypes.func.isRequired,
  idPrefix: PropTypes.string.isRequired,
};

const defaultCountry = {
  name: "",
  engName: "",
  subtitle: "",
  image: "",
  code: "",
  description: "",
  idealForStudyAndTravel: "",
  highlights: "",
  climate: "",
  visaInfo: "",
  benefits: [],
  techScene: "",
  surfSeason: "",
  isActive: true,
  localEmergencyNumber: "",
};

function CountryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(defaultCountry);
  const [benefitsText, setBenefitsText] = useState("");
  const [faqs, setFaqs] = useState([]);
  const [tagsShortTerm, setTagsShortTerm] = useState([]);
  const [tagsLongTerm, setTagsLongTerm] = useState([]);
  const [highlightsShortTerm, setHighlightsShortTerm] = useState([]);
  const [highlightsLongTerm, setHighlightsLongTerm] = useState([]);
  const [programTypes, setProgramTypes] = useState([]);
  const [programTypesError, setProgramTypesError] = useState("");
  const [existingGallery, setExistingGallery] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
  const [imageFieldError, setImageFieldError] = useState(null);
  const [flagFile, setFlagFile] = useState(null);
  const [flagError, setFlagError] = useState(null);
  const [removingCountryMediaId, setRemovingCountryMediaId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const loadedCountryCodeRef = useRef("");
  const fileInputRef = useRef(null);
  const flagInputRef = useRef(null);
  const flagFileRef = useRef(null);
  const pendingImagesRef = useRef([]);
  const existingGalleryRef = useRef([]);
  const initialProgramTypeKeysRef = useRef([]);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    existingGalleryRef.current = existingGallery;
  }, [existingGallery]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((p) => {
        if (p.previewUrl && String(p.previewUrl).startsWith("blob:")) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    flagFileRef.current = flagFile;
  }, [flagFile]);

  useEffect(() => {
    return () => {
      const preview = flagFileRef.current?.previewUrl;
      if (preview && String(preview).startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, []);

  const loadCountry = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await CountryService.getCountryById(id);
      if (!data) {
        setError("Failed to load country.");
        return;
      }
      const rawCode = [data.code, data.alpha2Code, data.countryCode].find(
        (c) => c != null && String(c).trim() !== ""
      );
      let code = rawCode != null ? String(rawCode).trim() : "";
      if (!code) {
        try {
          const list = await CountryService.getAllCountriesList();
          const row = Array.isArray(list) ? list.find((c) => String(c.id) === String(id)) : null;
          if (row?.code) code = String(row.code).trim();
        } catch (_) {
          /* ignore */
        }
      }
      loadedCountryCodeRef.current = code;
      const flagUrl = typeof data.image === "string" ? data.image : data.image?.url || "";
      setForm({
        name: data.name || "",
        engName: data.engName || "",
        subtitle: data.subtitle || "",
        image: flagUrl,
        code,
        description: data.description || "",
        idealForStudyAndTravel: data.idealForStudyAndTravel || "",
        highlights: data.highlights || "",
        climate: data.climate || "",
        visaInfo: data.visaInfo || "",
        benefits: data.benefits || [],
        techScene: data.techScene || "",
        surfSeason: data.surfSeason || "",
        isActive: data.isActive !== undefined ? data.isActive : true,
        localEmergencyNumber:
          data.localEmergencyNumber != null ? String(data.localEmergencyNumber) : "",
      });
      setBenefitsText((data.benefits || []).join("\n"));
      setTagsShortTerm(
        rowsFromApiStrings(
          pickStringArrayFromCountry(data, "tagsShortTerm", "tags_short_term"),
          `tst-${id}`
        )
      );
      setTagsLongTerm(
        rowsFromApiStrings(
          pickStringArrayFromCountry(data, "tagsLongTerm", "tags_long_term"),
          `tlt-${id}`
        )
      );
      setHighlightsShortTerm(
        rowsFromApiStrings(
          pickStringArrayFromCountry(data, "highlightsShortTerm", "highlights_short_term"),
          `hst-${id}`
        )
      );
      setHighlightsLongTerm(
        rowsFromApiStrings(
          pickStringArrayFromCountry(data, "highlightsLongTerm", "highlights_long_term"),
          `hlt-${id}`
        )
      );
      let programTypeRows = [];
      try {
        const programTypesData = await CountryService.getCountryProgramTypes(id);
        programTypeRows = Array.isArray(programTypesData)
          ? programTypesData.map((item, index) => mapProgramTypeFromApi(item, index))
          : [];
      } catch (_) {
        programTypeRows = Array.isArray(data.programTypes)
          ? data.programTypes.map((item, index) => mapProgramTypeFromApi(item, index))
          : [];
      }
      setProgramTypes(programTypeRows);
      initialProgramTypeKeysRef.current = programTypeRows
        .map((row) => String(row.typeKey || "").trim())
        .filter(Boolean);
      setExistingGallery(
        collectEntityImageGallery(data).filter((it) => !flagUrl || it.url !== flagUrl)
      );
      setPendingImages([]);
      const faqList = await CountryFaqService.getByCountryId(id);
      setFaqs(Array.isArray(faqList) ? faqList : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCountry();
  }, [loadCountry]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const addProgramType = (typeKey) => {
    setProgramTypes((prev) => [...prev, createProgramTypeRow(typeKey)]);
    setProgramTypesError("");
  };
  const updateProgramTypeField = (rowId, field, value) => {
    setProgramTypes((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (field === "typeKey") {
          const definition = getProgramTypeDefinition(value);
          const nextName = String(row.name || "").trim() ? row.name : definition?.defaultName || "";
          return { ...row, typeKey: value, name: nextName };
        }
        return { ...row, [field]: value };
      })
    );
    setProgramTypesError("");
  };
  const removeProgramType = (rowId) => {
    setProgramTypes((prev) => prev.filter((row) => row.id !== rowId));
    setProgramTypesError("");
  };
  const addProgramTypeTag = (rowId) => {
    setProgramTypes((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          tags: [...row.tags, { id: `pt-tag-${Date.now()}-${Math.random()}`, text: "" }],
        };
      })
    );
    setProgramTypesError("");
  };
  const updateProgramTypeTag = (rowId, tagId, value) => {
    setProgramTypes((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              tags: row.tags.map((tag) => (tag.id === tagId ? { ...tag, text: value } : tag)),
            }
          : row
      )
    );
    setProgramTypesError("");
  };
  const removeProgramTypeTag = (rowId, tagId) => {
    setProgramTypes((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, tags: row.tags.filter((tag) => tag.id !== tagId) } : row
      )
    );
    setProgramTypesError("");
  };
  const addProgramTypeRule = (rowId) => {
    setProgramTypes((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const existing = Array.isArray(row.rules) ? row.rules : [];
        return {
          ...row,
          rules: [...existing, { id: `pt-rule-${Date.now()}-${Math.random()}`, text: "" }],
        };
      })
    );
    setProgramTypesError("");
  };
  const updateProgramTypeRule = (rowId, ruleId, value) => {
    setProgramTypes((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              rules: (Array.isArray(row.rules) ? row.rules : []).map((r) =>
                r.id === ruleId ? { ...r, text: value } : r
              ),
            }
          : row
      )
    );
    setProgramTypesError("");
  };
  const removeProgramTypeRule = (rowId, ruleId) => {
    setProgramTypes((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              rules: (Array.isArray(row.rules) ? row.rules : []).filter((r) => r.id !== ruleId),
            }
          : row
      )
    );
    setProgramTypesError("");
  };

  const clearAllPendingCountryImages = useCallback(() => {
    setPendingImages((prev) => {
      prev.forEach((p) => {
        if (p.previewUrl && String(p.previewUrl).startsWith("blob:")) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removePendingCountryImage = useCallback((clientId) => {
    setPendingImages((prev) => {
      const row = prev.find((p) => p.id === clientId);
      if (row?.previewUrl && String(row.previewUrl).startsWith("blob:")) {
        URL.revokeObjectURL(row.previewUrl);
      }
      return prev.filter((p) => p.id !== clientId);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeExistingCountryImage = useCallback(
    async (mediaId) => {
      if (!isEdit || !id || !mediaId) return;
      if (!window.confirm("Remove this image from the gallery?")) return;
      setRemovingCountryMediaId(String(mediaId));
      setImageFieldError(null);
      try {
        await CountryService.deleteCountryMedia(mediaId);
        const refreshed = await CountryService.getCountryById(id);
        if (refreshed) setExistingGallery(collectEntityImageGallery(refreshed));
      } catch (err) {
        console.error(err);
        const msg = err?.message || "Failed to remove image.";
        setImageFieldError(msg);
        alert(msg);
      } finally {
        setRemovingCountryMediaId("");
      }
    },
    [id, isEdit]
  );

  const processCountryImageFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (files.length === 0) return;
    setImageFieldError(null);

    const existingLen = existingGalleryRef.current.length;
    const pendingLen = pendingImagesRef.current.length;
    const additions = [];
    let error = null;

    for (const file of files) {
      const room = MAX_COUNTRY_GALLERY_ITEMS - existingLen - pendingLen - additions.length;
      if (room <= 0) {
        error = `You can add at most ${MAX_COUNTRY_GALLERY_ITEMS} images in total.`;
        break;
      }
      if (!isAllowedImageFile(file, ACCEPTED_COUNTRY_IMAGE_TYPES)) {
        error = "Please choose JPG, PNG, or WebP images only.";
        continue;
      }
      if (file.size > MAX_COUNTRY_IMAGE_BYTES) {
        error = "Each image must be 5 MB or smaller.";
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      additions.push({
        id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        file,
        previewUrl,
      });
    }

    if (error) {
      additions.forEach((p) => {
        if (p.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(p.previewUrl);
      });
      setImageFieldError(error);
      return;
    }

    if (additions.length) {
      setPendingImages((prev) => [...prev, ...additions]);
    }
  }, []);

  const putCountryImageToPresignedUrl = async (countryId, file) => {
    const contentType = inferImageMimeType(file) || "image/jpeg";
    const uploadData = await CountryService.getCountryImageUploadUrl(countryId, contentType);
    const uploadRes = await fetch(uploadData.url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType },
    });
    if (!uploadRes.ok) {
      throw new Error(`Upload failed (${uploadRes.status}). Check your connection and try again.`);
    }
  };

  const processCountryFlagFile = useCallback((fileList) => {
    const file = Array.from(fileList || []).filter(Boolean)[0];
    if (!file) return;
    setFlagError(null);
    if (!isAllowedImageFile(file, ACCEPTED_COUNTRY_IMAGE_TYPES)) {
      setFlagError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_COUNTRY_IMAGE_BYTES) {
      setFlagError("The flag must be 5 MB or smaller.");
      return;
    }
    setFlagFile((prev) => {
      if (prev?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(prev.previewUrl);
      return { file, previewUrl: URL.createObjectURL(file) };
    });
  }, []);

  const clearFlagSelection = useCallback(() => {
    setFlagFile((prev) => {
      if (prev?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    setFlagError(null);
    if (flagInputRef.current) flagInputRef.current.value = "";
  }, []);

  const putCountryFlagToPresignedUrl = async (countryId, file) => {
    const contentType = inferImageMimeType(file) || "image/jpeg";
    const uploadData = await CountryService.getCountryFlagUploadUrl(countryId, contentType);
    const uploadRes = await fetch(uploadData.url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType },
    });
    if (!uploadRes.ok) {
      throw new Error(
        `Flag upload failed (${uploadRes.status}). Check your connection and try again.`
      );
    }
  };

  const handleBenefitsBlur = () => {
    const lines = benefitsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    setForm((prev) => ({ ...prev, benefits: lines }));
  };

  const addFaq = () => {
    setFaqs((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, question: "", answer: "", order: prev.length },
    ]);
  };

  const updateFaq = (index, field, value) => {
    setFaqs((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const moveFaq = (index, direction) => {
    const newFaqs = [...faqs];
    const target = index + direction;
    if (target < 0 || target >= newFaqs.length) return;
    [newFaqs[index], newFaqs[target]] = [newFaqs[target], newFaqs[index]];
    setFaqs(newFaqs.map((f, i) => ({ ...f, order: i })));
  };

  const removeFaq = (index) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      alert("Name is required.");
      return;
    }
    if (!isEdit && !form.code?.trim()) {
      alert("Code is required.");
      return;
    }
    const programTypeValidationError = validateProgramTypes(programTypes);
    if (programTypeValidationError) {
      setProgramTypesError(programTypeValidationError);
      alert(programTypeValidationError);
      return;
    }
    setProgramTypesError("");

    setSaving(true);
    setError(null);
    try {
      const benefits = benefitsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const travelMatchFields = {
        engName: form.name.trim(),
        tagsShortTerm: payloadFromStringRows(tagsShortTerm),
        tagsLongTerm: payloadFromStringRows(tagsLongTerm),
        highlightsShortTerm: payloadFromStringRows(highlightsShortTerm),
        highlightsLongTerm: payloadFromStringRows(highlightsLongTerm),
      };
      const programTypePayload = buildProgramTypePayload(programTypes).filter((row) =>
        hasProgramTypeUserContent(row)
      );
      const removedProgramTypeKeys =
        isEdit && initialProgramTypeKeysRef.current.length
          ? initialProgramTypeKeysRef.current
              .filter((initialKey) => !programTypePayload.some((row) => row.typeKey === initialKey))
              .filter(Boolean)
          : [];

      if (isEdit) {
        const codeForSave = form.code?.trim() || loadedCountryCodeRef.current?.trim() || "";
        await CountryService.updateCountry(id, {
          ...form,
          code: codeForSave,
          benefits,
          ...travelMatchFields,
        });
        for (const row of programTypePayload) {
          await CountryService.upsertCountryProgramType(id, row);
        }
        for (const typeKey of removedProgramTypeKeys) {
          await CountryService.deleteCountryProgramType(id, typeKey);
        }
        initialProgramTypeKeysRef.current = programTypePayload
          .map((row) => String(row.typeKey || "").trim())
          .filter(Boolean);

        if (pendingImages.length) {
          for (const row of pendingImages) {
            await putCountryImageToPresignedUrl(id, row.file);
          }
          const refreshed = await CountryService.getCountryById(id);
          if (refreshed) {
            const refreshedFlag =
              typeof refreshed.image === "string" ? refreshed.image : refreshed.image?.url || "";
            setExistingGallery(
              collectEntityImageGallery(refreshed).filter(
                (it) => !refreshedFlag || it.url !== refreshedFlag
              )
            );
          }
          clearAllPendingCountryImages();
        }

        if (flagFile) {
          await putCountryFlagToPresignedUrl(id, flagFile.file);
          clearFlagSelection();
        }

        for (let i = 0; i < faqs.length; i++) {
          const faq = faqs[i];
          if (faq.id.startsWith("new-")) {
            await CountryFaqService.create({
              countryId: id,
              question: faq.question,
              answer: faq.answer,
              order: i,
            });
          } else {
            await CountryFaqService.update(faq.id, {
              countryId: id,
              question: faq.question,
              answer: faq.answer,
              order: i,
            });
          }
        }
        const existingIds = new Set(
          faqs.map((f) => f.id).filter((id) => !String(id).startsWith("new-"))
        );
        const currentFaqs = await CountryFaqService.getByCountryId(id);
        for (const f of currentFaqs) {
          if (!existingIds.has(f.id)) {
            await CountryFaqService.remove(f.id);
          }
        }
      } else {
        const created = await CountryService.createCountry({
          ...form,
          benefits,
          ...travelMatchFields,
        });
        if (created?.id) {
          for (const row of programTypePayload) {
            await CountryService.upsertCountryProgramType(created.id, row);
          }
          initialProgramTypeKeysRef.current = programTypePayload
            .map((row) => String(row.typeKey || "").trim())
            .filter(Boolean);
        }

        if (pendingImages.length && created?.id) {
          for (const row of pendingImages) {
            await putCountryImageToPresignedUrl(created.id, row.file);
          }
          clearAllPendingCountryImages();
        }

        if (flagFile && created?.id) {
          await putCountryFlagToPresignedUrl(created.id, flagFile.file);
          clearFlagSelection();
        }

        for (let i = 0; i < faqs.length; i++) {
          const faq = faqs[i];
          await CountryFaqService.create({
            countryId: created.id,
            question: faq.question,
            answer: faq.answer,
            order: i,
          });
        }
      }
      navigate("/orders/destinations");
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && isEdit) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox p={3}>
          <SoftTypography>Loading...</SoftTypography>
        </SoftBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <SoftBox mb={2}>
          <SoftBox
            display="flex"
            justifyContent="space-between"
            alignItems="flex-start"
            flexWrap="wrap"
            gap={1}
          >
            <SoftBox>
              <SoftTypography variant="h4" fontWeight="bold">
                {isEdit ? "Edit Country" : "New Country"}
              </SoftTypography>
              <SoftTypography variant="button" color="text">
                {isEdit ? "Manage country details and FAQs" : "Manage country details and FAQs"}
              </SoftTypography>
            </SoftBox>
            <SoftTypography
              component={Link}
              to="/orders/destinations"
              variant="button"
              color="info"
              sx={{
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
                whiteSpace: "nowrap",
              }}
            >
              ← Back to Destinations
            </SoftTypography>
          </SoftBox>
        </SoftBox>

        {error && (
          <SoftBox mb={2} p={2} borderRadius={1} bgColor="error" opacity={0.9}>
            <SoftTypography variant="caption" color="white">
              {error}
            </SoftTypography>
          </SoftBox>
        )}

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftTypography variant="h6" fontWeight="bold" gutterBottom>
            General Information
          </SoftTypography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SoftBox mb={2}>
                <SoftTypography
                  component="label"
                  variant="caption"
                  fontWeight="bold"
                  display="block"
                  mb={0.5}
                >
                  Name *
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder="e.g. Germany"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12}>
              <SoftBox mb={2}>
                <SoftTypography
                  component="label"
                  variant="caption"
                  fontWeight="bold"
                  display="block"
                  mb={0.5}
                >
                  Subtitle
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder="e.g. Startups, engineering and a lively tech scene"
                  value={form.subtitle}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography
                  component="label"
                  variant="caption"
                  fontWeight="bold"
                  display="block"
                  mb={0.5}
                >
                  Code *
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder="e.g. DE"
                  value={form.code}
                  onChange={(e) => updateField("code", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={6} display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => updateField("isActive", e.target.checked)}
                    color="info"
                  />
                }
                label="Active"
              />
            </Grid>
            <Grid item xs={12}>
              <SoftBox mb={2}>
                <SoftTypography
                  component="label"
                  variant="caption"
                  fontWeight="bold"
                  display="block"
                  mb={0.5}
                >
                  Country flag
                </SoftTypography>
                <SoftTypography variant="caption" color="text" display="block" mb={1}>
                  JPG, PNG, or WebP — max 5 MB. A single image used as the country flag. The new flag
                  uploads when you save.
                </SoftTypography>
                {flagError && (
                  <SoftBox mb={1} p={1} borderRadius={1} bgColor="error" opacity={0.92}>
                    <SoftTypography variant="caption" color="white">
                      {flagError}
                    </SoftTypography>
                  </SoftBox>
                )}
                <SoftBox sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                  {(flagFile?.previewUrl || formatImageUrl(form.image)) && (
                    <SoftBox
                      sx={{
                        position: "relative",
                        width: 96,
                        height: 96,
                        flexShrink: 0,
                        borderRadius: 1,
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "grey.300",
                        bgcolor: "background.paper",
                      }}
                    >
                      <SoftBox
                        component="img"
                        src={flagFile?.previewUrl || formatImageUrl(form.image)}
                        alt="Country flag"
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                      {flagFile && (
                        <IconButton
                          size="small"
                          onClick={clearFlagSelection}
                          aria-label="Remove selected flag"
                          sx={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            bgcolor: "rgba(255,255,255,0.85)",
                            "&:hover": { bgcolor: "white" },
                          }}
                        >
                          <Icon fontSize="small" color="error">
                            close
                          </Icon>
                        </IconButton>
                      )}
                    </SoftBox>
                  )}
                  <SoftBox
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        flagInputRef.current?.click();
                      }
                    }}
                    onClick={() => flagInputRef.current?.click()}
                    sx={{
                      width: 220,
                      height: 96,
                      boxSizing: "border-box",
                      border: "2px dashed",
                      borderColor: "grey.400",
                      borderRadius: 2,
                      bgcolor: "grey.50",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Icon color="info" sx={{ fontSize: 28, mb: 0.5 }}>
                      cloud_upload
                    </Icon>
                    <SoftTypography variant="button" color="text" textAlign="center">
                      {flagFile?.previewUrl || formatImageUrl(form.image)
                        ? "Replace flag"
                        : "Choose flag"}
                    </SoftTypography>
                    <input
                      ref={flagInputRef}
                      type="file"
                      hidden
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        processCountryFlagFile(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </SoftBox>
                </SoftBox>
                {flagFile && (
                  <SoftTypography variant="caption" color="text" display="block" mt={1}>
                    New flag selected — uploads when you save.
                  </SoftTypography>
                )}
              </SoftBox>
            </Grid>
            <Grid item xs={12}>
              <SoftBox mb={2}>
                <SoftTypography
                  component="label"
                  variant="caption"
                  fontWeight="bold"
                  display="block"
                  mb={0.5}
                >
                  Country images
                </SoftTypography>
                <SoftTypography variant="caption" color="text" display="block" mb={1}>
                  JPG, PNG, or WebP — max 5 MB each, up to {MAX_COUNTRY_GALLERY_ITEMS} images total.
                  You can select multiple files. New files upload when you save; all images from the
                  server are shown in the gallery below. Use × on a thumbnail to remove a saved
                  image (removes immediately).
                </SoftTypography>
                {imageFieldError && (
                  <SoftBox mb={1} p={1} borderRadius={1} bgColor="error" opacity={0.92}>
                    <SoftTypography variant="caption" color="white">
                      {imageFieldError}
                    </SoftTypography>
                  </SoftBox>
                )}
                <SoftBox sx={{ width: "100%", maxWidth: 720 }}>
                  <SoftBox
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDragging(false);
                      if (e.dataTransfer.files?.length) {
                        processCountryImageFiles(e.dataTransfer.files);
                      }
                    }}
                    sx={{
                      width: "100%",
                      height: 160,
                      boxSizing: "border-box",
                      border: "2px dashed",
                      borderColor: isDragging ? "info.main" : "grey.400",
                      borderRadius: 2,
                      bgcolor: isDragging ? "grey.100" : "grey.50",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "border-color 0.2s, background-color 0.2s",
                    }}
                  >
                    <Icon color="info" sx={{ fontSize: 40, mb: 0.5 }}>
                      cloud_upload
                    </Icon>
                    <SoftTypography variant="button" color="text" textAlign="center">
                      Drop images or click to choose
                    </SoftTypography>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      hidden
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        processCountryImageFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </SoftBox>

                  {(existingGallery.length > 0 || pendingImages.length > 0) && (
                    <SoftBox
                      sx={{
                        mt: 2,
                        width: "100%",
                        height: 112,
                        boxSizing: "border-box",
                        overflowX: "auto",
                        overflowY: "hidden",
                        display: "flex",
                        gap: 1,
                        alignItems: "stretch",
                        p: 1,
                        border: "1px solid",
                        borderColor: "grey.300",
                        borderRadius: 2,
                        bgcolor: "grey.50",
                      }}
                    >
                      {existingGallery.map((item) => (
                        <SoftBox
                          key={`ex-${item.id}-${item.url}`}
                          sx={{
                            flex: "0 0 auto",
                            width: 96,
                            height: 96,
                            position: "relative",
                            borderRadius: 1,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "grey.300",
                            bgcolor: "background.paper",
                          }}
                        >
                          <SoftBox
                            component="img"
                            src={formatImageUrl(item.url) || ""}
                            alt=""
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                          {item.canDelete && (
                            <IconButton
                              size="small"
                              disabled={Boolean(removingCountryMediaId)}
                              onClick={() => removeExistingCountryImage(item.id)}
                              sx={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                bgcolor: "background.paper",
                              }}
                              color="error"
                              aria-label="Remove saved image"
                            >
                              <Icon fontSize="small">close</Icon>
                            </IconButton>
                          )}
                        </SoftBox>
                      ))}
                      {pendingImages.map((p) => (
                        <SoftBox
                          key={p.id}
                          sx={{
                            flex: "0 0 auto",
                            width: 96,
                            height: 96,
                            position: "relative",
                            borderRadius: 1,
                            overflow: "hidden",
                            border: "1px dashed",
                            borderColor: "info.main",
                            bgcolor: "background.paper",
                          }}
                        >
                          <SoftBox
                            component="img"
                            src={p.previewUrl}
                            alt=""
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => removePendingCountryImage(p.id)}
                            sx={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              bgcolor: "background.paper",
                            }}
                            color="error"
                            aria-label="Remove pending image"
                          >
                            <Icon fontSize="small">close</Icon>
                          </IconButton>
                        </SoftBox>
                      ))}
                    </SoftBox>
                  )}

                  {pendingImages.length > 0 && (
                    <SoftTypography variant="caption" color="text.secondary" display="block" mt={1}>
                      {pendingImages.length} new file{pendingImages.length > 1 ? "s" : ""} — uploads
                      when you save.
                    </SoftTypography>
                  )}
                  {pendingImages.length === 0 && existingGallery.length > 0 && (
                    <SoftTypography variant="caption" color="text.secondary" display="block" mt={1}>
                      {existingGallery.length} image{existingGallery.length > 1 ? "s" : ""} on file.
                    </SoftTypography>
                  )}
                </SoftBox>
              </SoftBox>
            </Grid>
            <Grid item xs={12}>
              <SoftBox mb={2}>
                <SoftTypography
                  component="label"
                  variant="caption"
                  fontWeight="bold"
                  display="block"
                  mb={0.5}
                >
                  Description
                </SoftTypography>
                <SoftInput
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Country description..."
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftTypography variant="h6" fontWeight="bold" gutterBottom>
            Tech scene &amp; sport seasons
          </SoftTypography>
          <SoftTypography variant="caption" color="text" display="block" mb={2}>
            Conditions shown to visitors comparing destinations for tech and sport programmes.
          </SoftTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Tech scene
              </SoftTypography>
              <SoftInput
                fullWidth
                multiline
                minRows={3}
                placeholder="e.g. 3,000+ startups, weekly meetups and hiring days"
                value={form.techScene || ""}
                onChange={(e) => updateField("techScene", e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Surf &amp; sport season
              </SoftTypography>
              <SoftInput
                fullWidth
                multiline
                minRows={3}
                placeholder="e.g. All year; best swell September–April"
                value={form.surfSeason || ""}
                onChange={(e) => updateField("surfSeason", e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftTypography variant="h6" fontWeight="bold" gutterBottom>
            Tech programmes
          </SoftTypography>
          <SoftTypography variant="caption" color="text" display="block" mb={2}>
            Content shown to visitors browsing tech programmes in this country.
          </SoftTypography>
          <CountryStringListBlock
            title="Tags"
            helper="Short keywords displayed as chips."
            items={tagsShortTerm}
            setItems={setTagsShortTerm}
            idPrefix="tst"
          />
          <CountryStringListBlock
            title="Highlights"
            helper="Bullet points for tech programmes."
            items={highlightsShortTerm}
            setItems={setHighlightsShortTerm}
            idPrefix="hst"
          />
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftTypography variant="h6" fontWeight="bold" gutterBottom>
            Sport programmes
          </SoftTypography>
          <SoftTypography variant="caption" color="text" display="block" mb={2}>
            Content shown to visitors browsing sport camps in this country.
          </SoftTypography>
          <CountryStringListBlock
            title="Tags"
            helper="Short keywords displayed as chips."
            items={tagsLongTerm}
            setItems={setTagsLongTerm}
            idPrefix="tlt"
          />
          <CountryStringListBlock
            title="Highlights"
            helper="Bullet points for sport camps (season, equipment, coaching)."
            items={highlightsLongTerm}
            setItems={setHighlightsLongTerm}
            idPrefix="hlt"
          />
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <SoftBox>
              <SoftTypography variant="h6" fontWeight="bold" gutterBottom>
                {PROGRAM_TYPE_LABELS.sectionTitle}
              </SoftTypography>
              <SoftTypography variant="caption" color="text" display="block">
                {PROGRAM_TYPE_LABELS.sectionDescription}
              </SoftTypography>
            </SoftBox>
          </SoftBox>

          <SoftBox display="flex" flexWrap="wrap" gap={1} mb={2}>
            <SoftButton
              variant="outlined"
              color="dark"
              size="small"
              onClick={() => addProgramType("")}
              startIcon={<Icon fontSize="small">add</Icon>}
            >
              Add format
            </SoftButton>
          </SoftBox>
          {programTypesError && (
            <SoftTypography variant="caption" color="error" display="block" mb={2}>
              {programTypesError}
            </SoftTypography>
          )}

          {programTypes.length === 0 && (
            <SoftBox
              p={2}
              borderRadius={2}
              border="1px solid"
              borderColor="grey.300"
              bgcolor="grey.50"
            >
              <SoftTypography variant="caption" color="text.secondary">
                No programme formats configured yet.
              </SoftTypography>
            </SoftBox>
          )}

          {programTypes.map((row) => {
            const definition = getProgramTypeDefinition(row.typeKey);
            return (
              <Card key={row.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <SoftTypography variant="button" fontWeight="bold">
                    {definition?.defaultName || row.typeKey}
                  </SoftTypography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => removeProgramType(row.id)}
                    aria-label="Remove programme format"
                  >
                    <Icon fontSize="small">delete</Icon>
                  </IconButton>
                </SoftBox>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={definition?.hasDuration ? 6 : 12}>
                    <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                      Type key *
                    </SoftTypography>
                    <SoftSelect
                      options={PROGRAM_TYPE_DEFINITIONS.map((item) => ({
                        value: item.key,
                        label: item.defaultName,
                      }))}
                      value={
                        row.typeKey
                          ? {
                              value: row.typeKey,
                              label:
                                getProgramTypeDefinition(row.typeKey)?.defaultName || row.typeKey,
                            }
                          : null
                      }
                      onChange={(opt) =>
                        updateProgramTypeField(row.id, "typeKey", opt?.value || "")
                      }
                      placeholder="Select type"
                      isClearable={false}
                    />
                  </Grid>
                  <Grid item xs={12} md={definition?.hasDuration ? 6 : 12}>
                    <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                      {PROGRAM_TYPE_LABELS.nameLabel}
                    </SoftTypography>
                    <SoftInput
                      fullWidth
                      size="small"
                      value={row.name}
                      onChange={(e) => updateProgramTypeField(row.id, "name", e.target.value)}
                    />
                  </Grid>
                  {definition?.hasDuration && (
                    <Grid item xs={12} md={6}>
                      <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                        {PROGRAM_TYPE_LABELS.durationLabel}
                      </SoftTypography>
                      <SoftBox display="flex" gap={1}>
                        <SoftInput
                          fullWidth
                          type="number"
                          size="small"
                          placeholder={PROGRAM_TYPE_LABELS.fromLabel}
                          value={row.fromWeeks}
                          onChange={(e) =>
                            updateProgramTypeField(row.id, "fromWeeks", e.target.value)
                          }
                        />
                        <SoftInput
                          fullWidth
                          type="number"
                          size="small"
                          placeholder={PROGRAM_TYPE_LABELS.toLabel}
                          value={row.toWeeks}
                          onChange={(e) =>
                            updateProgramTypeField(row.id, "toWeeks", e.target.value)
                          }
                        />
                      </SoftBox>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                      {PROGRAM_TYPE_LABELS.shortDescriptionLabel}
                    </SoftTypography>
                    <SoftInput
                      fullWidth
                      size="small"
                      value={row.shortDescription}
                      onChange={(e) =>
                        updateProgramTypeField(row.id, "shortDescription", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                      {PROGRAM_TYPE_LABELS.longDescriptionLabel}
                    </SoftTypography>
                    <SoftBox dir="ltr" sx={{ direction: "ltr", textAlign: "left" }}>
                      <SoftEditor
                        value={row.longDescription}
                        onChange={(html) => updateProgramTypeField(row.id, "longDescription", html)}
                      />
                    </SoftBox>
                  </Grid>
                  <Grid item xs={12}>
                    <SoftBox
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                    >
                      <SoftBox>
                        <SoftTypography variant="caption" fontWeight="bold" display="block">
                          {PROGRAM_TYPE_LABELS.tagsLabel}
                        </SoftTypography>
                        <SoftTypography variant="caption" color="text" display="block">
                          {PROGRAM_TYPE_LABELS.tagsHelper}
                        </SoftTypography>
                      </SoftBox>
                      <SoftButton
                        variant="outlined"
                        color="dark"
                        size="small"
                        onClick={() => addProgramTypeTag(row.id)}
                        startIcon={<Icon fontSize="small">add</Icon>}
                      >
                        Add
                      </SoftButton>
                    </SoftBox>
                    {row.tags.length === 0 ? (
                      <SoftBox
                        p={2}
                        borderRadius={2}
                        border="1px solid"
                        borderColor="grey.300"
                        bgcolor="grey.50"
                      >
                        <SoftTypography variant="caption" color="text.secondary">
                          No tags yet.
                        </SoftTypography>
                      </SoftBox>
                    ) : (
                      row.tags.map((tag, tagIndex) => (
                        <SoftBox key={tag.id} display="flex" alignItems="center" gap={1} mb={1.5}>
                          <SoftTypography
                            variant="caption"
                            color="text.secondary"
                            sx={{ minWidth: 54, flexShrink: 0 }}
                          >
                            Tag #{tagIndex + 1}
                          </SoftTypography>
                          <SoftInput
                            fullWidth
                            size="small"
                            value={tag.text}
                            onChange={(e) => updateProgramTypeTag(row.id, tag.id, e.target.value)}
                            sx={{ flex: 1, minWidth: 0 }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeProgramTypeTag(row.id, tag.id)}
                            aria-label="Remove tag"
                            sx={{ flexShrink: 0 }}
                          >
                            <Icon fontSize="small">delete</Icon>
                          </IconButton>
                        </SoftBox>
                      ))
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <SoftBox
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={1}
                    >
                      <SoftBox>
                        <SoftTypography variant="caption" fontWeight="bold" display="block">
                          {PROGRAM_TYPE_LABELS.rulesLabel}
                        </SoftTypography>
                        <SoftTypography variant="caption" color="text" display="block">
                          {PROGRAM_TYPE_LABELS.rulesHelper}
                        </SoftTypography>
                      </SoftBox>
                      <SoftButton
                        variant="outlined"
                        color="dark"
                        size="small"
                        onClick={() => addProgramTypeRule(row.id)}
                        startIcon={<Icon fontSize="small">add</Icon>}
                      >
                        Add
                      </SoftButton>
                    </SoftBox>
                    {!Array.isArray(row.rules) || row.rules.length === 0 ? (
                      <SoftBox
                        p={2}
                        borderRadius={2}
                        border="1px solid"
                        borderColor="grey.300"
                        bgcolor="grey.50"
                      >
                        <SoftTypography variant="caption" color="text.secondary">
                          No rules yet.
                        </SoftTypography>
                      </SoftBox>
                    ) : (
                      row.rules.map((ruleLine, ruleIndex) => (
                        <SoftBox
                          key={ruleLine.id}
                          display="flex"
                          alignItems="center"
                          gap={1}
                          mb={1.5}
                        >
                          <SoftTypography
                            variant="caption"
                            color="text.secondary"
                            sx={{ minWidth: 54, flexShrink: 0 }}
                          >
                            Rule #{ruleIndex + 1}
                          </SoftTypography>
                          <SoftInput
                            fullWidth
                            size="small"
                            value={ruleLine.text}
                            onChange={(e) =>
                              updateProgramTypeRule(row.id, ruleLine.id, e.target.value)
                            }
                            sx={{ flex: 1, minWidth: 0 }}
                          />
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeProgramTypeRule(row.id, ruleLine.id)}
                            aria-label="Remove rule"
                            sx={{ flexShrink: 0 }}
                          >
                            <Icon fontSize="small">delete</Icon>
                          </IconButton>
                        </SoftBox>
                      ))
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                      {PROGRAM_TYPE_LABELS.noteLabel}
                    </SoftTypography>
                    <SoftInput
                      fullWidth
                      size="small"
                      placeholder="Optional note shown alongside rules and descriptions"
                      value={row.note || ""}
                      onChange={(e) => updateProgramTypeField(row.id, "note", e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Card>
            );
          })}
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftTypography variant="h6" fontWeight="bold" gutterBottom>
            Emergency contacts
          </SoftTypography>
          <SoftTypography variant="caption" color="text" display="block" mb={2}>
            Shown to participants in the emergency contacts section of their trip.
          </SoftTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftBox display="flex" alignItems="center" gap={0.75} mb={0.5}>
                  <Icon fontSize="small" color="error">
                    emergency
                  </Icon>
                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                    Local Emergency Number
                  </SoftTypography>
                </SoftBox>
                <SoftInput
                  fullWidth
                  placeholder="e.g., 112"
                  value={form.localEmergencyNumber || ""}
                  onChange={(e) =>
                    updateField(
                      "localEmergencyNumber",
                      e.target.value.replace(/[^0-9+\-() #]/g, "").slice(0, 20)
                    )
                  }
                  inputProps={{ maxLength: 20 }}
                  size="small"
                />
              </SoftBox>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftTypography variant="h6" fontWeight="bold" gutterBottom>
            Details
          </SoftTypography>
          <Grid container spacing={3}>
            {[
              { key: "idealForStudyAndTravel", label: "Why learn here" },
              { key: "highlights", label: "Highlights" },
              { key: "climate", label: "Climate" },
              { key: "visaInfo", label: "Entry requirements" },
            ].map(({ key, label }) => (
              <Grid item xs={12} key={key}>
                <SoftBox mb={2}>
                  <SoftTypography
                    component="label"
                    variant="caption"
                    fontWeight="bold"
                    display="block"
                    mb={0.5}
                  >
                    {label}
                  </SoftTypography>
                  <SoftInput
                    fullWidth
                    multiline
                    minRows={3}
                    placeholder={`${label}...`}
                    value={form[key] || ""}
                    onChange={(e) => updateField(key, e.target.value)}
                    size="small"
                  />
                </SoftBox>
              </Grid>
            ))}
            <Grid item xs={12}>
              <SoftBox mb={2}>
                <SoftTypography
                  component="label"
                  variant="caption"
                  fontWeight="bold"
                  display="block"
                  mb={0.5}
                >
                  Benefits (one per line)
                </SoftTypography>
                <SoftInput
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="One per line: e.g. Small groups, Senior mentors"
                  value={benefitsText}
                  onChange={(e) => setBenefitsText(e.target.value)}
                  onBlur={handleBenefitsBlur}
                  size="small"
                />
              </SoftBox>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <SoftTypography variant="h6" fontWeight="bold">
              FAQs
            </SoftTypography>
            <SoftButton
              variant="gradient"
              color="info"
              size="small"
              onClick={addFaq}
              startIcon={<Icon>add</Icon>}
            >
              + Add FAQ
            </SoftButton>
          </SoftBox>
          {faqs.map((faq, index) => (
            <Card key={faq.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <SoftBox display="flex" alignItems="flex-start" gap={1} mb={2}>
                <Icon sx={{ color: "text.secondary", cursor: "grab" }}>drag_indicator</Icon>
                <SoftTypography variant="button">FAQ #{index + 1}</SoftTypography>
                <SoftBox ml="auto" display="flex" gap={0.5}>
                  <IconButton
                    size="small"
                    onClick={() => moveFaq(index, -1)}
                    disabled={index === 0}
                  >
                    <Icon fontSize="small">arrow_upward</Icon>
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => moveFaq(index, 1)}
                    disabled={index === faqs.length - 1}
                  >
                    <Icon fontSize="small">arrow_downward</Icon>
                  </IconButton>
                  <IconButton size="small" onClick={() => removeFaq(index)} color="error">
                    <Icon fontSize="small">delete</Icon>
                  </IconButton>
                </SoftBox>
              </SoftBox>
              <SoftBox mb={1.5}>
                <SoftTypography
                  component="label"
                  variant="caption"
                  fontWeight="bold"
                  display="block"
                  mb={0.5}
                >
                  Question
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder="Enter question..."
                  value={faq.question || ""}
                  onChange={(e) => updateFaq(index, "question", e.target.value)}
                  size="small"
                />
              </SoftBox>
              <SoftBox>
                <SoftTypography
                  component="label"
                  variant="caption"
                  fontWeight="bold"
                  display="block"
                  mb={0.5}
                >
                  Answer
                </SoftTypography>
                <SoftInput
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder="Enter answer..."
                  value={faq.answer || ""}
                  onChange={(e) => updateFaq(index, "answer", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Card>
          ))}
        </Card>

        <SoftBox display="flex" justifyContent="flex-end" gap={1}>
          <SoftButton
            variant="outlined"
            color="dark"
            onClick={() => navigate("/orders/destinations")}
          >
            Cancel
          </SoftButton>
          <SoftButton variant="gradient" color="info" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Country"}
          </SoftButton>
        </SoftBox>
      </SoftBox>
    </DashboardLayout>
  );
}

export default CountryFormPage;
