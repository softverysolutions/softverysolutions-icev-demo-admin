import { useState } from "react";
import PropTypes from "prop-types";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
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
import SoftInput from "components/SoftInput";

function normalizeNonEmptyStrings(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => (typeof v === "string" ? v.trim() : String(v?.label ?? v ?? "").trim()))
    .filter(Boolean);
}

function SortableImportantRow({ id, disabled, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : 1,
  };

  return children({ setNodeRef, attributes, listeners, style });
}

SortableImportantRow.propTypes = {
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.func.isRequired,
};

SortableImportantRow.defaultProps = {
  disabled: false,
};

function ImportantInformationBlock({ title, value, options, disabled, onChange, idPrefix }) {
  const rows = Array.isArray(value) ? [...value] : [];
  const nonEmptyLabels = normalizeNonEmptyStrings(rows);
  const mergedOptions = Array.from(
    new Set([
      ...(options || []).map((o) => String(o).trim()).filter(Boolean),
      ...nonEmptyLabels,
    ])
  ).sort((a, b) => a.localeCompare(b));

  const sortableIds = rows.map((_, index) => `${idPrefix}-${index}`);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [searchInput, setSearchInput] = useState("");

  const handleDragEnd = ({ active, over }) => {
    if (disabled) return;
    if (!over || active.id === over.id) return;
    const oldIndex = sortableIds.indexOf(String(active.id));
    const newIndex = sortableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    onChange(arrayMove([...rows], oldIndex, newIndex));
  };

  const handleRowChange = (index, nextText) => {
    if (disabled) return;
    const next = [...rows];
    next[index] = nextText;
    onChange(next);
  };

  const removeRow = (index) => {
    if (disabled) return;
    onChange(rows.filter((_, i) => i !== index));
  };

  const selectedLower = new Set(
    normalizeNonEmptyStrings(rows).map((s) => s.toLowerCase())
  );
  const pickOptions = mergedOptions.filter((o) => !selectedLower.has(o.toLowerCase()));

  const appendFromSearch = (raw) => {
    if (disabled) return;
    const s = String(raw ?? "").trim();
    if (!s) return;
    const low = s.toLowerCase();
    if (rows.some((x) => String(x).trim().toLowerCase() === low)) return;
    onChange([...rows, s]);
    setSearchInput("");
  };

  return (
    <SoftBox mb={3}>
      <SoftTypography variant="button" fontWeight="bold" display="block" mb={1.5}>
        {title}
      </SoftTypography>

      {!disabled && (
        <SoftBox mb={2}>
          <Autocomplete
            freeSolo
            options={pickOptions}
            value={null}
            inputValue={searchInput}
            onInputChange={(_, v, reason) => {
              if (reason === "reset") return;
              setSearchInput(v ?? "");
            }}
            onChange={(_, newValue) => {
              if (newValue != null) appendFromSearch(newValue);
            }}
            disabled={disabled}
            selectOnFocus
            handleHomeEndKeys
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search the catalog or type a new item, then Enter"
                size="small"
                inputProps={{
                  ...params.inputProps,
                  onKeyDown: (e) => {
                    params.inputProps?.onKeyDown?.(e);
                    if (e.defaultPrevented) return;
                    if (e.key !== "Enter") return;
                    const s = searchInput.trim();
                    if (!s) return;
                    e.preventDefault();
                    appendFromSearch(s);
                  },
                }}
              />
            )}
          />
          <SoftTypography variant="caption" color="text" display="block" mt={0.75}>
            Pick from suggestions or add a custom line. Order below is saved with the package.
          </SoftTypography>
        </SoftBox>
      )}

      <SoftTypography variant="caption" fontWeight="bold" color="text" display="block" mb={1}>
        Selected items:
      </SoftTypography>

      {rows.length === 0 ? (
        <SoftBox
          p={2}
          borderRadius={2}
          border="1px solid"
          borderColor="grey.300"
          bgcolor="grey.50"
        >
          <SoftTypography variant="caption" color="text.secondary">
            {disabled ? "No items." : "No items yet. Use the field above to add some."}
          </SoftTypography>
        </SoftBox>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
            {rows.map((item, index) => {
              const itemId = sortableIds[index];
              return (
                <SortableImportantRow key={itemId} id={itemId} disabled={disabled}>
                  {({ setNodeRef, attributes, listeners, style }) => (
                    <SoftBox
                      ref={setNodeRef}
                      style={style}
                      display="flex"
                      alignItems="center"
                      gap={1}
                      mb={1.25}
                    >
                      {!disabled && (
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
                            flexShrink: 0,
                            width: 28,
                          }}
                          aria-label="Drag to reorder"
                        >
                          <Icon>drag_indicator</Icon>
                        </SoftBox>
                      )}
                      {disabled ? (
                        <SoftTypography variant="body2" sx={{ flex: 1, py: 0.5 }}>
                          {item || "—"}
                        </SoftTypography>
                      ) : (
                        <SoftInput
                          fullWidth
                          size="small"
                          value={item}
                          onChange={(e) => handleRowChange(index, e.target.value)}
                          disabled={disabled}
                          sx={{ flex: 1, minWidth: 0 }}
                        />
                      )}
                      {!disabled && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeRow(index)}
                          aria-label="Remove item"
                          sx={{ flexShrink: 0 }}
                        >
                          <Icon fontSize="small">delete</Icon>
                        </IconButton>
                      )}
                    </SoftBox>
                  )}
                </SortableImportantRow>
              );
            })}
          </SortableContext>
        </DndContext>
      )}
    </SoftBox>
  );
}

ImportantInformationBlock.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.string),
  options: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  idPrefix: PropTypes.string.isRequired,
};

ImportantInformationBlock.defaultProps = {
  value: [],
  options: [],
  disabled: false,
};

function ImportantInformationSection({
  whatToBring,
  notAllowed,
  goodToKnow,
  optionsWhatToBring,
  optionsNotAllowed,
  optionsGoodToKnow,
  disabled,
  onWhatToBringChange,
  onNotAllowedChange,
  onGoodToKnowChange,
}) {
  return (
    <SoftBox mb={2}>
      <SoftTypography variant="h6" fontWeight="medium" mb={1}>
        Important information
      </SoftTypography>
      <SoftTypography variant="caption" color="text" display="block" mb={2}>
        New labels you add are saved to the global catalog when you save the package.
      </SoftTypography>

      <ImportantInformationBlock
        title="What to bring"
        value={whatToBring}
        options={optionsWhatToBring}
        disabled={disabled}
        onChange={onWhatToBringChange}
        idPrefix="what-to-bring"
      />
      <ImportantInformationBlock
        title="Not allowed"
        value={notAllowed}
        options={optionsNotAllowed}
        disabled={disabled}
        onChange={onNotAllowedChange}
        idPrefix="not-allowed"
      />
      <ImportantInformationBlock
        title="Good to know"
        value={goodToKnow}
        options={optionsGoodToKnow}
        disabled={disabled}
        onChange={onGoodToKnowChange}
        idPrefix="good-to-know"
      />
    </SoftBox>
  );
}

ImportantInformationSection.propTypes = {
  whatToBring: PropTypes.arrayOf(PropTypes.string),
  notAllowed: PropTypes.arrayOf(PropTypes.string),
  goodToKnow: PropTypes.arrayOf(PropTypes.string),
  optionsWhatToBring: PropTypes.arrayOf(PropTypes.string),
  optionsNotAllowed: PropTypes.arrayOf(PropTypes.string),
  optionsGoodToKnow: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  onWhatToBringChange: PropTypes.func.isRequired,
  onNotAllowedChange: PropTypes.func.isRequired,
  onGoodToKnowChange: PropTypes.func.isRequired,
};

ImportantInformationSection.defaultProps = {
  whatToBring: [],
  notAllowed: [],
  goodToKnow: [],
  optionsWhatToBring: [],
  optionsNotAllowed: [],
  optionsGoodToKnow: [],
  disabled: false,
};

export default ImportantInformationSection;
