import PropTypes from "prop-types";
import { COLUMN_WIDTHS, PhotosCell, ActionsCell } from "../utils";
import TruncatedText from "components/TruncatedText";

const ActionsCellWrapper = ({ value }) => (
  <ActionsCell
    row={value.row}
    onView={value.onView}
    onEdit={value.onEdit}
    onDelete={value.onDelete}
  />
);

ActionsCellWrapper.propTypes = {
  value: PropTypes.shape({
    row: PropTypes.object.isRequired,
    onView: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
  }).isRequired,
};

const AccommodationNameCell = ({ value }) => {
  return <TruncatedText text={value} maxLength={20} />;
};

AccommodationNameCell.propTypes = {
  value: PropTypes.string,
};

const AccommodationLocationCell = ({ value }) => {
  return <TruncatedText text={value} maxLength={20} />;
};

AccommodationLocationCell.propTypes = {
  value: PropTypes.string,
};

const dataTableData = {
  columns: [
    {
      Header: "Accommodation Name",
      accessor: "name",
      width: COLUMN_WIDTHS.NAME,
      Cell: AccommodationNameCell,
    },
    { Header: "Acc. Type", accessor: "type", width: COLUMN_WIDTHS.TYPE },
    { Header: "Category", accessor: "category", width: COLUMN_WIDTHS.CATEGORY },
    {
      Header: "Location",
      accessor: "location",
      width: COLUMN_WIDTHS.LOCATION,
      Cell: AccommodationLocationCell,
    },
    { Header: "Price per Week", accessor: "price", width: COLUMN_WIDTHS.PRICE },
    { Header: "Regime", accessor: "regime", width: COLUMN_WIDTHS.REGIME },
    {
      Header: "Photos",
      accessor: "photos",
      width: COLUMN_WIDTHS.PHOTOS,
      Cell: PhotosCell,
    },
    {
      Header: "Actions",
      accessor: "actions",
      width: COLUMN_WIDTHS.ACTIONS,
      Cell: ActionsCellWrapper,
    },
  ],
  rows: [],
};

export default dataTableData;
