import { COLUMN_WIDTHS, LogoCell, ActionsCell } from "../utils";
import PropTypes from "prop-types";

const ActionsCellWrapper = ({ value }) => (
  <ActionsCell
    row={value.row}
    onView={value.onView}
    onEdit={value.onEdit}
    onDelete={value.onDelete}
    onToggleStatus={value.onToggleStatus}
    isUpdating={value.isUpdating}
    hideRowMutations={value.hideRowMutations}
  />
);

ActionsCellWrapper.propTypes = {
  value: PropTypes.shape({
    row: PropTypes.object.isRequired,
    onView: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onToggleStatus: PropTypes.func.isRequired,
    isUpdating: PropTypes.bool,
    hideRowMutations: PropTypes.bool,
  }).isRequired,
};

const dataTableData = {
  columns: [
    {
      Header: "Logo",
      accessor: "logo",
      width: COLUMN_WIDTHS.LOGO,
      align: "center",
      Cell: LogoCell,
    },
    { Header: "Provider Name", accessor: "name", width: COLUMN_WIDTHS.NAME, align: "left" },
    { Header: "Type", accessor: "type", width: COLUMN_WIDTHS.TYPE, align: "left" },
    {
      Header: "Actions",
      accessor: "actions",
      width: COLUMN_WIDTHS.ACTIONS,
      align: "center",
      Cell: ActionsCellWrapper,
    },
  ],
  rows: [],
};

export default dataTableData;
