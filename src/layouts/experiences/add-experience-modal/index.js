import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  CircularProgress,
  IconButton,
  Icon,
} from "@mui/material";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftSelect from "components/SoftSelect";
import SoftEditor from "components/SoftEditor";

import { ExperienceService } from "services/experienceService";
import { MediaService } from "services/mediaService";
import { EXPERIENCE_TYPES } from "utils/experienceTypeUtils";

import { useCurrencySelect } from "context/CurrencyContext";

import { INITIAL_FORM_DATA, EXPERIENCE_CURRENCY_ORDER } from "./constants";
import ExperienceGallerySection, {
  mapExperienceImagesToGalleryState,
} from "./components/ExperienceGallerySection";
import {
  stripNullishFields,
  toNullablePrice,
  toNullableRichText,
  toNullableString,
} from "./experienceFormUtils";

function SortableListRow({ id, disabled, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return children({ setNodeRef, attributes, listeners, style });
}

SortableListRow.propTypes = {
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.func.isRequired,
};

const normalizeStringList = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
};

function ExperienceModal({ open, onClose, mode, experienceData, onSuccess }) {
  const isView = mode === "view";
  const canEdit = mode === "add" || mode === "edit";
  const currencySelect = useCurrencySelect(EXPERIENCE_CURRENCY_ORDER);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (mode === "add") {
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      return;
    }

    const load = async () => {
      if (!experienceData?.id) return;
      setLoading(true);
      try {
        const full =
          experienceData.description !== undefined
            ? experienceData
            : await ExperienceService.getExperienceById(experienceData.id);
        setFormData({
          name: full.name || "",
          type: full.type || "cultural",
          isActive: full.isActive !== false,
          description: full.description || "",
          fullDescription: full.fullDescription || "",
          price: full.price != null && full.price !== "" ? String(full.price) : "",
          currency: full.currency || "EUR",
          duration: full.duration || "",
          location: full.location || "",
          includedItems: normalizeStringList(full.includedItems),
          images: mapExperienceImagesToGalleryState(full),
          videoUrl: full.videoUrl || "",
        });
        setErrors({});
      } catch (err) {
        console.error(err);
        setErrors({ submit: err?.message || "Failed to load experience" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, mode, experienceData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addIncludedItem = () => {
    setFormData((prev) => ({
      ...prev,
      includedItems: [...(prev.includedItems || []), ""],
    }));
  };

  const updateIncludedItem = (index, value) => {
    setFormData((prev) => {
      const next = [...(prev.includedItems || [])];
      next[index] = value;
      return { ...prev, includedItems: next };
    });
  };

  const removeIncludedItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      includedItems: (prev.includedItems || []).filter((_, i) => i !== index),
    }));
  };

  const includedSortableIds = (formData.includedItems || []).map((_, i) => `included-${i}`);

  const includedSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleIncludedDragEnd = ({ active, over }) => {
    if (!canEdit || !over || active.id === over.id) return;
    const oldIndex = includedSortableIds.indexOf(String(active.id));
    const newIndex = includedSortableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setFormData((prev) => ({
      ...prev,
      includedItems: arrayMove([...(prev.includedItems || [])], oldIndex, newIndex),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = "Name is required";
    if (!formData.type) newErrors.type = "Type is required";
    if (!formData.description?.trim()) newErrors.description = "Short description is required";
    if (formData.videoUrl?.trim()) {
      try {
        // eslint-disable-next-line no-new
        new URL(formData.videoUrl.trim());
      } catch {
        newErrors.videoUrl = "Enter a valid URL";
      }
    }
    const priceRaw = String(formData.price ?? "").trim();
    if (priceRaw !== "") {
      const priceNum = parseFloat(priceRaw);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        newErrors.price = "Enter a valid price (0 or greater)";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildPayload = async () => {
    let imagesPayload = [];
    const gallerySlots = (formData.images || []).filter((img) => {
      if (!img) return false;
      if (img.file) return true;
      return String(img.imageUrl || "").trim().length > 0;
    });

    if (gallerySlots.length > 0) {
      const uploaded = await MediaService.uploadExperienceImages(
        gallerySlots,
        formData.name || "experience"
      );
      imagesPayload = uploaded.map((row) => ({
        imageUrl: row.imageUrl,
      }));
    }

    const price = toNullablePrice(formData.price);
    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      isActive: !!formData.isActive,
      description: formData.description.trim(),
      fullDescription: toNullableRichText(formData.fullDescription),
      duration: toNullableString(formData.duration),
      location: toNullableString(formData.location),
      price,
      currency: price == null ? null : formData.currency || "EUR",
      includedItems: normalizeStringList(formData.includedItems),
      videoUrl: toNullableString(formData.videoUrl),
      images: imagesPayload,
    };

    if (mode === "edit") {
      return payload;
    }

    if (payload.images.length === 0) {
      delete payload.images;
    }

    return stripNullishFields(payload);
  };

  const handleSubmit = async () => {
    if (!validateForm() || !canEdit) return;
    setSaving(true);
    try {
      const payload = await buildPayload();
      if (mode === "add") {
        await ExperienceService.createExperience(payload);
      } else {
        await ExperienceService.updateExperience(experienceData.id, payload);
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setErrors({ submit: err?.message || "Failed to save experience" });
    } finally {
      setSaving(false);
    }
  };

  const title =
    mode === "add"
      ? "Create new experience"
      : mode === "view"
        ? "View experience"
        : "Edit experience";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ overflowX: "hidden" }}>
        {loading ? (
          <SoftBox display="flex" justifyContent="center" py={6}>
            <CircularProgress color="info" />
          </SoftBox>
        ) : (
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={canEdit ? 8 : 12}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Name *
              </SoftTypography>
              <SoftInput
                fullWidth
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={isView}
                error={!!errors.name}
                placeholder="e.g. Harry Potter Castle"
              />
              {errors.name && (
                <SoftTypography variant="caption" color="error">
                  {errors.name}
                </SoftTypography>
              )}
            </Grid>
            {canEdit && (
              <Grid item xs={4}>
                <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                  Status *
                </SoftTypography>
                <SoftBox display="flex" alignItems="center" pt={1}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive}
                        onChange={(e) => handleInputChange("isActive", e.target.checked)}
                        color="info"
                      />
                    }
                    label={formData.isActive ? "Active" : "Inactive"}
                    sx={{ margin: 0 }}
                  />
                </SoftBox>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Type *
              </SoftTypography>
              <SoftSelect
                value={EXPERIENCE_TYPES.find((t) => t.value === formData.type) || null}
                onChange={(opt) => handleInputChange("type", opt?.value || "")}
                options={EXPERIENCE_TYPES}
                isDisabled={isView}
                placeholder="Select type"
              />
              {errors.type && (
                <SoftTypography variant="caption" color="error">
                  {errors.type}
                </SoftTypography>
              )}
            </Grid>
            {isView && (
              <Grid item xs={12} sm={6}>
                <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                  Status
                </SoftTypography>
                <SoftTypography variant="body2">
                  {formData.isActive ? "Active" : "Inactive"}
                </SoftTypography>
              </Grid>
            )}
            <Grid item xs={12}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Short description *
              </SoftTypography>
              <SoftInput
                fullWidth
                multiline
                minRows={2}
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                disabled={isView}
                error={!!errors.description}
                placeholder="Brief summary shown in lists and chips"
              />
              {errors.description && (
                <SoftTypography variant="caption" color="error">
                  {errors.description}
                </SoftTypography>
              )}
            </Grid>
            <Grid item xs={12}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Full description
              </SoftTypography>
              <SoftBox
                dir="ltr"
                sx={{ direction: "ltr", textAlign: "left", minWidth: 0, maxWidth: "100%" }}
              >
                <SoftEditor
                  value={formData.fullDescription || ""}
                  onChange={(html) => handleInputChange("fullDescription", html)}
                  disabled={isView}
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} sm={6}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Duration
              </SoftTypography>
              <SoftInput
                fullWidth
                value={formData.duration}
                onChange={(e) => handleInputChange("duration", e.target.value)}
                disabled={isView}
                placeholder="e.g. Full day · 8h"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Location
              </SoftTypography>
              <SoftInput
                fullWidth
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                disabled={isView}
                placeholder="e.g. Historic castle near Edinburgh"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Price
              </SoftTypography>
              <SoftInput
                fullWidth
                type="number"
                inputProps={{ min: 0, step: "0.01" }}
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                disabled={isView}
                error={!!errors.price}
                placeholder="e.g. 60"
              />
              {errors.price && (
                <SoftTypography variant="caption" color="error">
                  {errors.price}
                </SoftTypography>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Currency
              </SoftTypography>
              <SoftSelect
                value={currencySelect.toOption(formData.currency)}
                onChange={(opt) => handleInputChange("currency", opt?.value || "EUR")}
                options={currencySelect.options}
                isLoading={currencySelect.isLoading}
                loadingMessage={currencySelect.loadingMessage}
                onMenuOpen={currencySelect.onMenuOpen}
                isDisabled={isView || !String(formData.price ?? "").trim()}
                placeholder="Select currency"
              />
              <SoftTypography variant="caption" color="text" display="block" mt={0.5}>
                Required when price is set
              </SoftTypography>
            </Grid>
            <Grid item xs={12}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <SoftTypography variant="caption" fontWeight="bold">
                  What&apos;s included
                </SoftTypography>
                {canEdit && (
                  <SoftButton
                    variant="outlined"
                    color="dark"
                    size="small"
                    onClick={addIncludedItem}
                    startIcon={<Icon fontSize="small">add</Icon>}
                  >
                    Add item
                  </SoftButton>
                )}
              </SoftBox>
              {(formData.includedItems || []).length === 0 ? (
                <SoftTypography variant="caption" color="text.secondary">
                  No items yet.
                </SoftTypography>
              ) : (
                <DndContext
                  sensors={includedSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleIncludedDragEnd}
                >
                  <SortableContext
                    items={includedSortableIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {(formData.includedItems || []).map((item, index) => {
                      const itemId = includedSortableIds[index];
                      return (
                        <SortableListRow key={itemId} id={itemId} disabled={isView}>
                          {({ setNodeRef, attributes, listeners, style }) => (
                            <SoftBox
                              ref={setNodeRef}
                              style={style}
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={1}
                            >
                              {!isView && (
                                <Icon
                                  sx={{ cursor: "grab", color: "text.secondary" }}
                                  {...attributes}
                                  {...listeners}
                                >
                                  drag_indicator
                                </Icon>
                              )}
                              <SoftInput
                                fullWidth
                                value={item}
                                onChange={(e) => updateIncludedItem(index, e.target.value)}
                                disabled={isView}
                                placeholder="e.g. Round-trip transport"
                              />
                              {!isView && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeIncludedItem(index)}
                                >
                                  <Icon fontSize="small">close</Icon>
                                </IconButton>
                              )}
                            </SoftBox>
                          )}
                        </SortableListRow>
                      );
                    })}
                  </SortableContext>
                </DndContext>
              )}
            </Grid>
            <Grid item xs={12}>
              <ExperienceGallerySection
                images={formData.images}
                onChange={(next) => handleInputChange("images", next)}
                disabled={isView}
                isSubmitting={saving}
              />
            </Grid>
            <Grid item xs={12}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Video URL
              </SoftTypography>
              <SoftInput
                fullWidth
                value={formData.videoUrl}
                onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                disabled={isView}
                error={!!errors.videoUrl}
                placeholder="https://youtube.com/watch?v=..."
              />
              {errors.videoUrl && (
                <SoftTypography variant="caption" color="error">
                  {errors.videoUrl}
                </SoftTypography>
              )}
            </Grid>
            {errors.submit && (
              <Grid item xs={12}>
                <SoftTypography variant="caption" color="error">
                  {errors.submit}
                </SoftTypography>
              </Grid>
            )}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        {canEdit && (
          <SoftButton
            variant="gradient"
            color="info"
            onClick={handleSubmit}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : mode === "add" ? "Create experience" : "Save changes"}
          </SoftButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

ExperienceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["add", "edit", "view"]),
  experienceData: PropTypes.object,
  onSuccess: PropTypes.func,
};

ExperienceModal.defaultProps = {
  mode: "add",
  experienceData: null,
  onSuccess: null,
};

export default ExperienceModal;
