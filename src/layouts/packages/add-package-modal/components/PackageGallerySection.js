import { useCallback, useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
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
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftDropzone from "components/SoftDropzone";
import { formatImageUrl } from "utils/imageUtils";

const MAX_GALLERY_IMAGES = 12;

function getImageSrc(image) {
  if (image?.preview && String(image.preview).startsWith("blob:")) {
    return image.preview;
  }
  if (image?.imageUrl) {
    const u = String(image.imageUrl).trim();
    if (u.startsWith("blob:") || u.startsWith("http")) {
      return u.startsWith("http") ? formatImageUrl(u) : u;
    }
  }
  return null;
}

function SortableGalleryTile({ image, disabled, isSubmitting, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
    disabled: disabled || isSubmitting,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.88 : 1,
    zIndex: isDragging ? 2 : 0,
  };

  return (
    <Grid item xs={12} sm={6} md={4}>
      <SoftBox
        ref={setNodeRef}
        style={style}
        position="relative"
        borderRadius="lg"
        overflow="hidden"
        boxShadow="md"
      >
        <img
          src={getImageSrc(image)}
          alt=""
          style={{
            width: "100%",
            height: "160px",
            objectFit: "cover",
            display: "block",
          }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        {!disabled && (
          <SoftBox
            display="flex"
            gap={0.5}
            position="absolute"
            top={8}
            left={8}
            right={8}
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <SoftBox
              component="span"
              {...attributes}
              {...listeners}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 1,
                bgcolor: "rgba(255,255,255,0.92)",
                cursor: isSubmitting ? "default" : "grab",
                touchAction: "none",
                color: "text.secondary",
                flexShrink: 0,
              }}
              aria-label="Drag to reorder image"
            >
              <Icon>drag_indicator</Icon>
            </SoftBox>
            <IconButton
              size="small"
              color="error"
              sx={{ bgcolor: "rgba(255,255,255,0.92)" }}
              onClick={() => onRemove(image.id)}
              disabled={isSubmitting}
              aria-label="Remove image"
            >
              <Icon fontSize="small">delete</Icon>
            </IconButton>
          </SoftBox>
        )}
      </SoftBox>
    </Grid>
  );
}

SortableGalleryTile.propTypes = {
  image: PropTypes.shape({
    id: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    preview: PropTypes.string,
    file: PropTypes.object,
  }).isRequired,
  disabled: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  onRemove: PropTypes.func.isRequired,
};

SortableGalleryTile.defaultProps = {
  disabled: false,
  isSubmitting: false,
};

function PackageGallerySection({ images, onImagesChange, disabled, isSubmitting }) {
  const [showWarning, setShowWarning] = useState(false);
  const imagesRef = useRef(images);
  const pendingFilesRef = useRef([]);
  const processingTimeoutRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const handleImageUpload = useCallback(
    (acceptedFiles) => {
      if (disabled) return;

      pendingFilesRef.current.push(...acceptedFiles);

      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      processingTimeoutRef.current = setTimeout(() => {
        const filesToProcess = pendingFilesRef.current;
        pendingFilesRef.current = [];

        const current = imagesRef.current || [];
        if (current.length >= MAX_GALLERY_IMAGES) {
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 3000);
          return;
        }

        const remaining = MAX_GALLERY_IMAGES - current.length;
        const slice = filesToProcess.slice(0, remaining);

        if (filesToProcess.length > slice.length) {
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 3000);
        }

        const additions = slice.map((file) => ({
          id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          file,
          preview: URL.createObjectURL(file),
          imageUrl: "",
        }));

        onImagesChange([...current, ...additions]);
      }, 10);
    },
    [disabled, onImagesChange]
  );

  const handleRemove = (id) => {
    if (disabled) return;
    const next = (images || []).filter((img) => img.id !== id);
    const removed = (images || []).find((img) => img.id === id);
    if (removed?.preview && String(removed.preview).startsWith("blob:")) {
      try {
        URL.revokeObjectURL(removed.preview);
      } catch {
        /* ignore */
      }
    }
    onImagesChange(next);
  };

  const handleDragEnd = ({ active, over }) => {
    if (disabled || isSubmitting) return;
    if (!over || active.id === over.id) return;
    const list = [...(images || [])];
    const oldIndex = list.findIndex((img) => img.id === active.id);
    const newIndex = list.findIndex((img) => img.id === over.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
    onImagesChange(arrayMove(list, oldIndex, newIndex));
  };

  const dropzoneOptions = useCallback(
    () => ({
      addRemoveLinks: true,
      maxFiles: Math.max(0, MAX_GALLERY_IMAGES - (images?.length || 0)),
      maxFilesize: 10,
      acceptedFiles: "image/*",
      accept: (file, done) => {
        if (disabled) {
          done("Editing is disabled");
          return;
        }
        if ((images?.length || 0) >= MAX_GALLERY_IMAGES) {
          done("Maximum number of images reached");
          return;
        }
        done();
      },
      addedfile: (file) => {
        handleImageUpload([file]);
      },
      maxfilesexceeded: () => {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      },
    }),
    [disabled, images?.length, handleImageUpload]
  );

  const sortableIds = (images || []).map((img) => img.id);

  return (
    <SoftBox mb={3}>
      <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1} display="block">
        Gallery (app package page)
      </SoftTypography>
      <SoftTypography variant="caption" color="text" display="block" mb={2}>
        Upload up to {MAX_GALLERY_IMAGES} images. Reorder by dragging the handle (dots); the first image
        is the main slide. ({images?.length || 0}/{MAX_GALLERY_IMAGES})
      </SoftTypography>

      {showWarning && (
        <SoftBox mb={2} p={1.5} borderRadius={2} bgcolor="warning.light" color="warning.dark">
          <SoftTypography variant="caption">
            Some files were skipped (limit {MAX_GALLERY_IMAGES} images, 10MB each).
          </SoftTypography>
        </SoftBox>
      )}

      {(images || []).length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <Grid container spacing={2} mb={2}>
              {(images || []).map((image) => (
                <SortableGalleryTile
                  key={image.id}
                  image={image}
                  disabled={disabled}
                  isSubmitting={isSubmitting}
                  onRemove={handleRemove}
                />
              ))}
            </Grid>
          </SortableContext>
        </DndContext>
      )}

      {(images || []).length < MAX_GALLERY_IMAGES && (
        <SoftBox sx={{ height: "180px" }}>
          <SoftDropzone options={dropzoneOptions()} disabled={disabled} />
        </SoftBox>
      )}
    </SoftBox>
  );
}

PackageGallerySection.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
      preview: PropTypes.string,
      file: PropTypes.object,
    })
  ),
  onImagesChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isSubmitting: PropTypes.bool,
};

PackageGallerySection.defaultProps = {
  images: [],
  disabled: false,
  isSubmitting: false,
};

export default PackageGallerySection;
