import { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
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
import SoftSelect from "components/SoftSelect";

import { ExperienceService } from "services/experienceService";
import { formatExperienceType } from "utils/experienceTypeUtils";

function SortableExperienceCard({ id, disabled, children }) {
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

SortableExperienceCard.propTypes = {
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.func.isRequired,
};

function PackageExperiencesSection({
  selectedItems,
  onChange,
  isViewMode,
  canEdit,
  isSubmitting,
}) {
  const [searchOptions, setSearchOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const loadActiveExperiences = useCallback(async (searchTerm = "") => {
    setLoadingOptions(true);
    try {
      const response = await ExperienceService.searchExperiences({
        search: searchTerm,
        isActive: true,
        page: 1,
        limit: 50,
      });
      const data = Array.isArray(response) ? response : response.data || [];
      setSearchOptions(
        data.map((exp) => ({
          value: exp.id,
          label: exp.name,
          type: exp.type,
          location: exp.location,
          duration: exp.duration,
        }))
      );
    } catch (err) {
      console.error(err);
      setSearchOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadActiveExperiences(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput, loadActiveExperiences]);

  const selectedIds = useMemo(
    () => (selectedItems || []).map((item) => item.id),
    [selectedItems]
  );

  const availableOptions = useMemo(
    () => searchOptions.filter((opt) => !selectedIds.includes(opt.value)),
    [searchOptions, selectedIds]
  );

  const sortableIds = (selectedItems || []).map((item) => item.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAdd = (option) => {
    if (!option || isViewMode || !canEdit) return;
    const next = [
      ...(selectedItems || []),
      {
        id: option.value,
        name: option.label,
        type: option.type,
        location: option.location,
        duration: option.duration,
      },
    ];
    onChange?.(next);
    setSearchInput("");
  };

  const handleRemove = (id) => {
    if (isViewMode || !canEdit) return;
    onChange?.((selectedItems || []).filter((item) => item.id !== id));
  };

  const handleDragEnd = ({ active, over }) => {
    if (isViewMode || !canEdit || isSubmitting || !over || active.id === over.id) return;
    const oldIndex = sortableIds.indexOf(String(active.id));
    const newIndex = sortableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onChange?.(arrayMove([...(selectedItems || [])], oldIndex, newIndex));
  };

  const disabled = isViewMode || !canEdit || isSubmitting;

  return (
    <SoftBox mb={3}>
      <SoftTypography variant="h6" fontWeight="medium" mb={0.5}>
        Experiences
      </SoftTypography>
      <SoftTypography variant="caption" color="text" display="block" mb={2}>
        Search and add active experiences. Drag to reorder. No pricing at package level.
      </SoftTypography>

      {!disabled && (
        <SoftBox mb={2}>
          <SoftSelect
            value={null}
            onChange={handleAdd}
            options={availableOptions}
            isLoading={loadingOptions}
            isDisabled={disabled}
            placeholder="Search active experiences..."
            isClearable
            onInputChange={(value) => setSearchInput(value)}
            filterOption={() => true}
          />
        </SoftBox>
      )}

      {(selectedItems || []).length === 0 ? (
        <SoftBox
          p={2}
          borderRadius={2}
          border="1px dashed"
          borderColor="grey.300"
          bgcolor="grey.50"
        >
          <SoftTypography variant="caption" color="text.secondary">
            No experiences selected.
          </SoftTypography>
        </SoftBox>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {(selectedItems || []).map((item) => (
              <SortableExperienceCard key={item.id} id={item.id} disabled={disabled}>
                {({ setNodeRef, attributes, listeners, style }) => (
                  <SoftBox
                    ref={setNodeRef}
                    style={style}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    mb={1}
                    p={1.5}
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="grey.300"
                    bgcolor="background.paper"
                  >
                    {!disabled && (
                      <Icon
                        sx={{ cursor: "grab", color: "text.secondary", flexShrink: 0 }}
                        {...attributes}
                        {...listeners}
                      >
                        drag_indicator
                      </Icon>
                    )}
                    <SoftBox flex={1} minWidth={0}>
                      <SoftTypography variant="button" fontWeight="medium" display="block">
                        {item.name}
                      </SoftTypography>
                      <SoftBox display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                        {item.type && (
                          <Chip
                            label={formatExperienceType(item.type)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {item.location && (
                          <Chip label={item.location} size="small" variant="outlined" />
                        )}
                        {item.duration && (
                          <Chip label={item.duration} size="small" variant="outlined" />
                        )}
                      </SoftBox>
                    </SoftBox>
                    {!disabled && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemove(item.id)}
                        disabled={isSubmitting}
                      >
                        <Icon fontSize="small">close</Icon>
                      </IconButton>
                    )}
                  </SoftBox>
                )}
              </SortableExperienceCard>
            ))}
          </SortableContext>
        </DndContext>
      )}
    </SoftBox>
  );
}

PackageExperiencesSection.propTypes = {
  selectedItems: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  isViewMode: PropTypes.bool,
  canEdit: PropTypes.bool,
  isSubmitting: PropTypes.bool,
};

PackageExperiencesSection.defaultProps = {
  selectedItems: [],
  isViewMode: false,
  canEdit: true,
  isSubmitting: false,
};

export default PackageExperiencesSection;

export function mapPackageExperiencesToFormState(packageData) {
  if (!packageData?.experiences?.length) return [];
  return [...packageData.experiences]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((row) => {
      const exp = row.experience || {};
      return {
        id: row.experienceId || exp.id || row.id,
        name: exp.name || "Experience",
        type: exp.type,
        location: exp.location,
        duration: exp.duration,
      };
    })
    .filter((item) => item.id);
}
