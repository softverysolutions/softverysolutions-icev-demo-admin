import { COLUMN_WIDTHS, ActionsCell } from "../utils";
import PropTypes from "prop-types";
import TruncatedText from "components/TruncatedText";

const ActionsCellWrapper = ({ value }) => (
  <ActionsCell
    row={value.row}
    onView={value.onView}
    onEdit={value.onEdit}
    onDelete={value.onDelete}
    onPriceList={value.onPriceList}
    onDuplicate={value.onDuplicate}
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
    onPriceList: PropTypes.func,
    onDuplicate: PropTypes.func,
    onToggleStatus: PropTypes.func,
    isUpdating: PropTypes.bool,
    hideRowMutations: PropTypes.bool,
  }).isRequired,
};

const NameCell = ({ value }) => <TruncatedText text={value || "N/A"} maxLength={24} />;
const PeriodicityCell = ({ value }) => <TruncatedText text={value || "N/A"} maxLength={16} />;
const TypeCell = ({ value }) => <TruncatedText text={value || "N/A"} maxLength={36} />;
const DurationCell = ({ value }) => <TruncatedText text={value || "N/A"} maxLength={20} />;
const PriceCell = ({ value }) => <TruncatedText text={String(value ?? "N/A")} maxLength={12} />;
const CurrencyCell = ({ value }) => <TruncatedText text={value || "N/A"} maxLength={8} />;

NameCell.propTypes = { value: PropTypes.string };
PeriodicityCell.propTypes = { value: PropTypes.string };
TypeCell.propTypes = { value: PropTypes.string };
DurationCell.propTypes = { value: PropTypes.string };
PriceCell.propTypes = { value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) };
CurrencyCell.propTypes = { value: PropTypes.string };

const dataTableData = {
  columns: [
    { Header: "Name", accessor: "name", width: COLUMN_WIDTHS.NAME, align: "left", Cell: NameCell },
    { Header: "Periodicity", accessor: "periodicity", Cell: PeriodicityCell, disableSortBy: true },
    { Header: "Type", accessor: "type", width: COLUMN_WIDTHS.TYPE, align: "left", Cell: TypeCell, disableSortBy: true },
    {
      Header: "Workload",
      accessor: "duration",
      width: COLUMN_WIDTHS.DURATION,
      align: "left",
      Cell: DurationCell,
      disableSortBy: true,
    },
    {
      Header: "Price",
      accessor: "price",
      width: COLUMN_WIDTHS.PRICE,
      align: "center",
      Cell: PriceCell,
      disableSortBy: true,
    },
    {
      Header: "Currency",
      accessor: "currency",
      width: COLUMN_WIDTHS.CURRENCY,
      align: "center",
      Cell: CurrencyCell,
      disableSortBy: true,
    },
    {
      Header: "Actions",
      accessor: "actions",
      width: COLUMN_WIDTHS.ACTIONS,
      align: "center",
      Cell: ActionsCellWrapper,
      disableSortBy: true,
    },
  ],
  rows: [],
};

export default dataTableData;
