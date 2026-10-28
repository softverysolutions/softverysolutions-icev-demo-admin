import PropTypes from "prop-types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableListRow({ id, disabled, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    position: "relative",
    zIndex: isDragging ? 2 : undefined,
  };

  return children({ setNodeRef, attributes, listeners, style, isDragging });
}

SortableListRow.propTypes = {
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.func.isRequired,
};

SortableListRow.defaultProps = {
  disabled: false,
};

export default SortableListRow;
