import PropTypes from "prop-types";
import {
  COLUMN_WIDTHS,
  PackageImageCell,
  PackageNameCell,
  CourseCell,
  LocationCell,
  DatesCell,
  PriceCell,
  ActionsCell,
} from "../utils";

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
    onToggleStatus: PropTypes.func,
    isUpdating: PropTypes.bool,
    hideRowMutations: PropTypes.bool,
  }).isRequired,
};

const dataTableData = {
  columns: [
    {
      Header: "Image",
      accessor: "image",
      width: COLUMN_WIDTHS.IMAGE,
      align: "center",
      Cell: PackageImageCell,
    },
    {
      Header: "Package Name",
      accessor: "name",
      width: COLUMN_WIDTHS.NAME,
      align: "left",
      Cell: PackageNameCell,
    },
    {
      Header: "Programme",
      accessor: "course",
      width: COLUMN_WIDTHS.COURSE,
      align: "left",
      Cell: CourseCell,
    },
    {
      Header: "Location",
      accessor: "location",
      width: COLUMN_WIDTHS.LOCATION,
      align: "left",
      Cell: LocationCell,
    },
    {
      Header: "Dates",
      accessor: "dates",
      width: COLUMN_WIDTHS.DATES,
      align: "left",
      Cell: DatesCell,
    },
    {
      Header: "Price",
      accessor: "price",
      width: COLUMN_WIDTHS.PRICE,
      align: "left",
      Cell: PriceCell,
    },
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
