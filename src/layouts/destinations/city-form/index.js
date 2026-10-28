import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftEditor from "components/SoftEditor";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { CountryService } from "services/countryService";
import { CityService } from "services/cityService";
import {
  collectEntityImageGallery,
  formatImageUrl,
  inferImageMimeType,
  isAllowedImageFile,
} from "utils/imageUtils";

const MAX_CITY_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_CITY_GALLERY_ITEMS = 15;
const ACCEPTED_CITY_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

const defaultCity = {
  countryId: "",
  isActive: true,
  name: "",
  engName: "",
  subtitle: "",
  description: "",
  longDescription: "",
  climateDescription: "",
  climateWinter: "",
  climateSpring: "",
  climateSummer: "",
  climateAutumn: "",
  costMonthlyAverage: "",
  costRent: "",
  costUtilities: "",
  costFood: "",
  costTransport: "",
  climateImageUrl: "",
  costOfLivingImageUrl: "",
  techScene: "",
  surfSeason: "",
};

function SortableCityBenefitRow({ id, index, text, onTextChange, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : 1,
    zIndex: isDragging ? 2 : undefined,
    position: "relative",
  };

  return (
    <Card ref={setNodeRef} style={style} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <SoftBox display="flex" alignItems="flex-start" gap={1} mb={1.5}>
        <SoftBox
          component="span"
          {...attributes}
          {...listeners}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "grab",
            touchAction: "none",
            color: "text.secondary",
          }}
          aria-label="Drag to reorder benefit"
        >
          <Icon>drag_indicator</Icon>
        </SoftBox>
        <SoftTypography variant="button">Benefit #{index + 1}</SoftTypography>
        <SoftBox ml="auto" display="flex" gap={0.5}>
          <IconButton size="small" onClick={onRemove} color="error" aria-label="Remove benefit">
            <Icon fontSize="small">delete</Icon>
          </IconButton>
        </SoftBox>
      </SoftBox>
      <SoftBox mb={0}>
        <SoftTypography
          component="label"
          variant="caption"
          fontWeight="bold"
          display="block"
          mb={0.5}
        >
          Text
        </SoftTypography>
        <SoftInput
          fullWidth
          placeholder="e.g. Surf 20 minutes from the city"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          size="small"
        />
      </SoftBox>
    </Card>
  );
}

SortableCityBenefitRow.propTypes = {
  id: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired,
  onTextChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

function CityFormPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const stateCountryId = location.state?.countryId;

  const [countries, setCountries] = useState([]);
  const [form, setForm] = useState(defaultCity);
  const [cityBenefits, setCityBenefits] = useState([]);
  const [existingCityGallery, setExistingCityGallery] = useState([]);
  const [pendingCityImages, setPendingCityImages] = useState([]);
  const [cityImageError, setCityImageError] = useState(null);
  const [removingCityMediaId, setRemovingCityMediaId] = useState("");
  const [isCityImageDragging, setIsCityImageDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [sectionImageUploadKey, setSectionImageUploadKey] = useState("");
  const cityImageInputRef = useRef(null);
  const pendingCityImagesRef = useRef([]);
  const existingCityGalleryRef = useRef([]);

  const benefitSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    pendingCityImagesRef.current = pendingCityImages;
  }, [pendingCityImages]);

  useEffect(() => {
    existingCityGalleryRef.current = existingCityGallery;
  }, [existingCityGallery]);

  useEffect(() => {
    return () => {
      pendingCityImagesRef.current.forEach((p) => {
        if (p.previewUrl && String(p.previewUrl).startsWith("blob:")) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
    };
  }, []);

  const countryOptions = countries.map((c) => ({
    value: c.id,
    label: c.code ? `${c.name} (${c.code})` : c.name,
  }));

  const loadCountries = useCallback(async () => {
    try {
      const res = await CountryService.getAllCountries({ limit: 500 });
      setCountries(res.data || []);
    } catch (err) {
      console.error(err);
      setCountries([]);
    }
  }, []);

  const loadCity = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await CityService.getCityById(id);
      setForm({
        countryId: data.country?.id || data.countryId || "",
        isActive: data.isActive !== false,
        name: data.name || "",
        engName: data.engName || "",
        subtitle: data.subtitle || data.sub_title || "",
        description: data.description || "",
        longDescription: data.longDescription || data.long_description || "",
        climateDescription: data.climateDescription || data.climate_description || "",
        climateWinter: data.climateWinter || data.climate_winter || "",
        climateSpring: data.climateSpring || data.climate_spring || "",
        climateSummer: data.climateSummer || data.climate_summer || "",
        climateAutumn: data.climateAutumn || data.climate_autumn || "",
        costMonthlyAverage: data.costMonthlyAverage || data.cost_monthly_average || "",
        costRent: data.costRent || data.cost_rent || "",
        costUtilities: data.costUtilities || data.cost_utilities || "",
        costFood: data.costFood || data.cost_food || "",
        costTransport: data.costTransport || data.cost_transport || "",
        climateImageUrl: data.climateImageUrl || data.climate_image_url || "",
        costOfLivingImageUrl: data.costOfLivingImageUrl || data.cost_of_living_image_url || "",
        techScene: data.techScene || "",
        surfSeason: data.surfSeason || "",
      });
      const benefitList = Array.isArray(data.benefits) ? data.benefits : [];
      setCityBenefits(
        benefitList.map((text, i) => ({
          id: `benefit-${id}-${i}`,
          text: text != null ? String(text) : "",
        }))
      );
      setExistingCityGallery(collectEntityImageGallery(data));
      setPendingCityImages([]);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  useEffect(() => {
    if (isEdit) {
      loadCity();
    } else {
      setForm((prev) => ({ ...prev, countryId: stateCountryId || prev.countryId }));
      setCityBenefits([]);
      setExistingCityGallery([]);
      setPendingCityImages([]);
      setLoading(false);
    }
  }, [isEdit, id, stateCountryId, loadCity]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const benefitsPayload = () =>
    cityBenefits.map((b) => b.text.trim()).filter(Boolean);

  const addCityBenefit = () => {
    setCityBenefits((prev) => [...prev, { id: `new-${Date.now()}`, text: "" }]);
  };

  const updateCityBenefit = (index, text) => {
    setCityBenefits((prev) =>
      prev.map((item, i) => (i === index ? { ...item, text } : item))
    );
  };

  const handleBenefitsDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setCityBenefits((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const removeCityBenefit = (index) => {
    setCityBenefits((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllPendingCityImages = useCallback(() => {
    setPendingCityImages((prev) => {
      prev.forEach((p) => {
        if (p.previewUrl && String(p.previewUrl).startsWith("blob:")) {
          URL.revokeObjectURL(p.previewUrl);
        }
      });
      return [];
    });
    if (cityImageInputRef.current) cityImageInputRef.current.value = "";
  }, []);

  const removePendingCityImage = useCallback((clientId) => {
    setPendingCityImages((prev) => {
      const row = prev.find((p) => p.id === clientId);
      if (row?.previewUrl && String(row.previewUrl).startsWith("blob:")) {
        URL.revokeObjectURL(row.previewUrl);
      }
      return prev.filter((p) => p.id !== clientId);
    });
    if (cityImageInputRef.current) cityImageInputRef.current.value = "";
  }, []);

  const removeExistingCityImage = useCallback(
    async (mediaId) => {
      if (!isEdit || !id || !mediaId) return;
      if (!window.confirm("Remove this image from the gallery?")) return;
      setRemovingCityMediaId(String(mediaId));
      setCityImageError(null);
      try {
        await CityService.deleteCityMedia(mediaId);
        const refreshed = await CityService.getCityById(id);
        if (refreshed) setExistingCityGallery(collectEntityImageGallery(refreshed));
      } catch (err) {
        console.error(err);
        const msg = err?.message || "Failed to remove image.";
        setCityImageError(msg);
        alert(msg);
      } finally {
        setRemovingCityMediaId("");
      }
    },
    [id, isEdit]
  );

  const processCityImageFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (files.length === 0) return;
    setCityImageError(null);

    const existingLen = existingCityGalleryRef.current.length;
    const pendingLen = pendingCityImagesRef.current.length;
    const additions = [];
    let error = null;

    for (const file of files) {
      const room = MAX_CITY_GALLERY_ITEMS - existingLen - pendingLen - additions.length;
      if (room <= 0) {
        error = `You can add at most ${MAX_CITY_GALLERY_ITEMS} images in total.`;
        break;
      }
      if (!isAllowedImageFile(file, ACCEPTED_CITY_IMAGE_TYPES)) {
        error = "Please choose JPG, PNG, or WebP images only.";
        continue;
      }
      if (file.size > MAX_CITY_IMAGE_BYTES) {
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
      setCityImageError(error);
      return;
    }

    if (additions.length) {
      setPendingCityImages((prev) => [...prev, ...additions]);
    }
  }, []);

  const putCityImageToPresignedUrl = async (cityId, file) => {
    const contentType = inferImageMimeType(file) || "image/jpeg";
    const uploadData = await CityService.getCityImageUploadUrl(cityId, contentType);
    const uploadRes = await fetch(uploadData.url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": contentType },
    });
    if (!uploadRes.ok) {
      throw new Error(
        `City image upload failed (${uploadRes.status}). Check your connection and try again.`
      );
    }
  };

  const handleSectionImageUpload = async (formField, file) => {
    if (!file) return;
    if (!isAllowedImageFile(file, ACCEPTED_CITY_IMAGE_TYPES)) {
      window.alert("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_CITY_IMAGE_BYTES) {
      window.alert("Image must be 5 MB or smaller.");
      return;
    }
    setSectionImageUploadKey(formField);
    try {
      const { MediaService } = await import("services/mediaService");
      const cityKey = id || "new";
      const prefix = formField === "climateImageUrl" ? "climate" : "cost-of-living";
      const safeName = (file.name || "image").replace(/[^a-zA-Z0-9.-]/g, "_");
      const key = `city-section-images/${cityKey}/${prefix}-${Date.now()}-${safeName}`;
      const contentType = inferImageMimeType(file) || "image/jpeg";
      const presignedData = await MediaService.getPresignedUploadUrl(key, contentType, true);
      await MediaService.uploadFileToS3WithFallback(presignedData.url, file);
      const publicUrl = presignedData.publicUrl || presignedData.fileUrl;
      updateField(formField, publicUrl);
    } catch (err) {
      console.error(err);
      window.alert(err?.message || "Failed to upload image.");
    } finally {
      setSectionImageUploadKey("");
    }
  };

  const handleSubmit = async () => {
    if (!form.countryId) {
      alert("Country is required.");
      return;
    }
    if (!form.name?.trim()) {
      alert("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const benefits = benefitsPayload();
      if (isEdit) {
        await CityService.updateCity(id, { ...form, benefits });

        if (pendingCityImages.length) {
          for (const row of pendingCityImages) {
            await putCityImageToPresignedUrl(id, row.file);
          }
          const refreshed = await CityService.getCityById(id);
          if (refreshed) setExistingCityGallery(collectEntityImageGallery(refreshed));
          clearAllPendingCityImages();
        }
      } else {
        const created = await CityService.createCity({ ...form, benefits });
        if (pendingCityImages.length && created?.id) {
          for (const row of pendingCityImages) {
            await putCityImageToPresignedUrl(created.id, row.file);
          }
          clearAllPendingCityImages();
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
          <SoftTypography variant="h4" fontWeight="bold">
            {isEdit ? "Edit City" : "New City"}
          </SoftTypography>
          <SoftTypography variant="button" color="text">
            Manage city details, conditions and images
          </SoftTypography>
          <SoftBox mt={1}>
            <SoftTypography
              component={Link}
              to="/orders/destinations"
              variant="button"
              color="info"
              sx={{ textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
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
            City Information
          </SoftTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography
                  component="label"
                  variant="caption"
                  fontWeight="bold"
                  display="block"
                  mb={0.5}
                >
                  Country *
                </SoftTypography>
                <SoftSelect
                  options={countryOptions}
                  value={countryOptions.find((o) => o.value === form.countryId) || null}
                  onChange={(opt) => updateField("countryId", opt?.value || "")}
                  placeholder="Select country"
                  isClearable={false}
                  styles={{
                    control: (base) => ({ ...base, minHeight: 40, borderRadius: 8 }),
                  }}
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={6} display="flex" alignItems="center">
              <SoftBox>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isActive !== false}
                      onChange={(e) => updateField("isActive", e.target.checked)}
                      color="info"
                    />
                  }
                  label="Active"
                />
                <SoftTypography variant="caption" color="text" display="block">
                  Inactive takes the city and its campuses, courses, accommodations and packages
                  off sale.
                </SoftTypography>
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
                  Name *
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder="City name"
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
                <SoftTypography variant="caption" color="text.secondary" display="block" mb={0.5}>
                  Short tagline on the city page (e.g. &ldquo;The city that never sleeps&rdquo;).
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder="Short subtitle"
                  value={form.subtitle || ""}
                  onChange={(e) => updateField("subtitle", e.target.value)}
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
                  Long Description
                </SoftTypography>
                <SoftBox dir="ltr" sx={{ direction: "ltr", textAlign: "left" }}>
                  <SoftEditor
                    value={form.longDescription || ""}
                    onChange={(html) => updateField("longDescription", html)}
                  />
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
                  placeholder="City description..."
                  value={form.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
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
                  City images
                </SoftTypography>
                <SoftTypography variant="caption" color="text" display="block" mb={1}>
                  JPG, PNG, or WebP — max 5 MB each, up to {MAX_CITY_GALLERY_ITEMS} images total.
                  Shown on the public city page. You can select multiple files; new files upload when
                  you save. All images returned by the server are shown in the gallery below. Use × on
                  a thumbnail to remove a saved image (removes immediately).
                </SoftTypography>
                {cityImageError && (
                  <SoftBox mb={1} p={1} borderRadius={1} bgColor="error" opacity={0.92}>
                    <SoftTypography variant="caption" color="white">
                      {cityImageError}
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
                        cityImageInputRef.current?.click();
                      }
                    }}
                    onClick={() => cityImageInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsCityImageDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsCityImageDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsCityImageDragging(false);
                      if (e.dataTransfer.files?.length) {
                        processCityImageFiles(e.dataTransfer.files);
                      }
                    }}
                    sx={{
                      width: "100%",
                      height: 160,
                      boxSizing: "border-box",
                      border: "2px dashed",
                      borderColor: isCityImageDragging ? "info.main" : "grey.400",
                      borderRadius: 2,
                      bgcolor: isCityImageDragging ? "grey.100" : "grey.50",
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
                      ref={cityImageInputRef}
                      type="file"
                      multiple
                      hidden
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        processCityImageFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </SoftBox>

                  {(existingCityGallery.length > 0 || pendingCityImages.length > 0) && (
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
                      {existingCityGallery.map((item) => (
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
                              disabled={Boolean(removingCityMediaId)}
                              onClick={() => removeExistingCityImage(item.id)}
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
                      {pendingCityImages.map((p) => (
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
                            onClick={() => removePendingCityImage(p.id)}
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

                  {pendingCityImages.length > 0 && (
                    <SoftTypography variant="caption" color="text.secondary" display="block" mt={1}>
                      {pendingCityImages.length} new file{pendingCityImages.length > 1 ? "s" : ""} —
                      uploads when you save.
                    </SoftTypography>
                  )}
                  {pendingCityImages.length === 0 && existingCityGallery.length > 0 && (
                    <SoftTypography variant="caption" color="text.secondary" display="block" mt={1}>
                      {existingCityGallery.length} image{existingCityGallery.length > 1 ? "s" : ""} on
                      file.
                    </SoftTypography>
                  )}
                </SoftBox>
              </SoftBox>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftTypography variant="h6" fontWeight="bold" gutterBottom>
            Climate & Best Time
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
                  Climate Description
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder='e.g. "Sunny and mild, with Atlantic breezes"'
                  value={form.climateDescription || ""}
                  onChange={(e) => updateField("climateDescription", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                  Winter
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder='e.g. "2°C – 8°C"'
                  value={form.climateWinter || ""}
                  onChange={(e) => updateField("climateWinter", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                  Spring
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder='e.g. "8°C – 14°C"'
                  value={form.climateSpring || ""}
                  onChange={(e) => updateField("climateSpring", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                  Summer
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder='e.g. "14°C – 24°C"'
                  value={form.climateSummer || ""}
                  onChange={(e) => updateField("climateSummer", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                  Autumn
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder='e.g. "8°C – 13°C"'
                  value={form.climateAutumn || ""}
                  onChange={(e) => updateField("climateAutumn", e.target.value)}
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
                  Climate section image
                </SoftTypography>
                <SoftTypography variant="caption" color="text.secondary" display="block" mb={1}>
                  Optional hero image for the climate block on the city page (
                  <code style={{ fontSize: "0.85em" }}>climateImageUrl</code>). JPG, PNG, or WebP —
                  max 5 MB.
                </SoftTypography>
                <SoftBox display="flex" alignItems="flex-start" gap={1} flexWrap="wrap">
                  <SoftInput
                    fullWidth
                    placeholder="https://… or upload a file"
                    value={form.climateImageUrl || ""}
                    onChange={(e) => updateField("climateImageUrl", e.target.value)}
                    size="small"
                    sx={{ flex: "1 1 220px" }}
                  />
                  <SoftButton
                    variant="outlined"
                    color="dark"
                    size="small"
                    component="label"
                    disabled={Boolean(sectionImageUploadKey)}
                    startIcon={<Icon fontSize="small">image</Icon>}
                    sx={{ flexShrink: 0 }}
                  >
                    Upload
                    <input
                      type="file"
                      hidden
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSectionImageUpload("climateImageUrl", file);
                        e.target.value = "";
                      }}
                    />
                  </SoftButton>
                  {sectionImageUploadKey === "climateImageUrl" && (
                    <SoftTypography variant="caption" color="text.secondary">
                      Uploading…
                    </SoftTypography>
                  )}
                </SoftBox>
                {form.climateImageUrl && (
                  <SoftBox
                    component="img"
                    src={formatImageUrl(form.climateImageUrl) || form.climateImageUrl}
                    alt="Climate preview"
                    sx={{
                      mt: 1.5,
                      maxWidth: "100%",
                      width: 280,
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "grey.300",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </SoftBox>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftTypography variant="h6" fontWeight="bold" gutterBottom>
            Tech scene &amp; sport seasons
          </SoftTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Tech scene
              </SoftTypography>
              <SoftInput
                fullWidth
                multiline
                minRows={2}
                placeholder="e.g. Coworking hubs, weekly JS meetups, demo days"
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
                minRows={2}
                placeholder="e.g. Consistent waves all year, big swell October–March"
                value={form.surfSeason || ""}
                onChange={(e) => updateField("surfSeason", e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftTypography variant="h6" fontWeight="bold" gutterBottom>
            Cost of Living
          </SoftTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                  Monthly average
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder='e.g. "€700 – €1,600"'
                  value={form.costMonthlyAverage || ""}
                  onChange={(e) => updateField("costMonthlyAverage", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                  Rent
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder='e.g. "€450 – €1,500"'
                  value={form.costRent || ""}
                  onChange={(e) => updateField("costRent", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={4}>
              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                  Utilities
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder='e.g. "€60 – €100"'
                  value={form.costUtilities || ""}
                  onChange={(e) => updateField("costUtilities", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={4}>
              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                  Food
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder='e.g. "€250 – €350"'
                  value={form.costFood || ""}
                  onChange={(e) => updateField("costFood", e.target.value)}
                  size="small"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={4}>
              <SoftBox mb={2}>
                <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                  Transport
                </SoftTypography>
                <SoftInput
                  fullWidth
                  placeholder='e.g. "€90 – €128/month"'
                  value={form.costTransport || ""}
                  onChange={(e) => updateField("costTransport", e.target.value)}
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
                  Cost of living section image
                </SoftTypography>
                <SoftTypography variant="caption" color="text.secondary" display="block" mb={1}>
                  Optional image for the cost-of-living block (
                  <code style={{ fontSize: "0.85em" }}>costOfLivingImageUrl</code>). JPG, PNG, or WebP
                  — max 5 MB.
                </SoftTypography>
                <SoftBox display="flex" alignItems="flex-start" gap={1} flexWrap="wrap">
                  <SoftInput
                    fullWidth
                    placeholder="https://… or upload a file"
                    value={form.costOfLivingImageUrl || ""}
                    onChange={(e) => updateField("costOfLivingImageUrl", e.target.value)}
                    size="small"
                    sx={{ flex: "1 1 220px" }}
                  />
                  <SoftButton
                    variant="outlined"
                    color="dark"
                    size="small"
                    component="label"
                    disabled={Boolean(sectionImageUploadKey)}
                    startIcon={<Icon fontSize="small">image</Icon>}
                    sx={{ flexShrink: 0 }}
                  >
                    Upload
                    <input
                      type="file"
                      hidden
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSectionImageUpload("costOfLivingImageUrl", file);
                        e.target.value = "";
                      }}
                    />
                  </SoftButton>
                  {sectionImageUploadKey === "costOfLivingImageUrl" && (
                    <SoftTypography variant="caption" color="text.secondary">
                      Uploading…
                    </SoftTypography>
                  )}
                </SoftBox>
                {form.costOfLivingImageUrl && (
                  <SoftBox
                    component="img"
                    src={formatImageUrl(form.costOfLivingImageUrl) || form.costOfLivingImageUrl}
                    alt="Cost of living preview"
                    sx={{
                      mt: 1.5,
                      maxWidth: "100%",
                      width: 280,
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "grey.300",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </SoftBox>
            </Grid>
          </Grid>
        </Card>

        <Card sx={{ p: 3, mb: 3 }}>
          <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <SoftBox>
              <SoftTypography variant="h6" fontWeight="bold">
                City Benefits
              </SoftTypography>
              <SoftTypography variant="caption" color="text" display="block" mt={0.5}>
                Optional. Short bullet-style lines shown for this city in the app. Leave empty or
                remove all rows if none apply. Drag the grip icon to reorder.
              </SoftTypography>
            </SoftBox>
            <SoftButton
              variant="gradient"
              color="info"
              size="small"
              onClick={addCityBenefit}
              startIcon={<Icon>add</Icon>}
            >
              Add benefit
            </SoftButton>
          </SoftBox>
          {cityBenefits.length === 0 && (
            <SoftTypography variant="caption" color="text.secondary" display="block" mb={2}>
              {`No benefits yet. Click "Add benefit" to add a line.`}
            </SoftTypography>
          )}
          {cityBenefits.length > 0 && (
            <DndContext
              sensors={benefitSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleBenefitsDragEnd}
            >
              <SortableContext
                items={cityBenefits.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {cityBenefits.map((row, index) => (
                  <SortableCityBenefitRow
                    key={row.id}
                    id={row.id}
                    index={index}
                    text={row.text}
                    onTextChange={(value) => updateCityBenefit(index, value)}
                    onRemove={() => removeCityBenefit(index)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
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
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create City"}
          </SoftButton>
        </SoftBox>
      </SoftBox>
    </DashboardLayout>
  );
}

export default CityFormPage;
