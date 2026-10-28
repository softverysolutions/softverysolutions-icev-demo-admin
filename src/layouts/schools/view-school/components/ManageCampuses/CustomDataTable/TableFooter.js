import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftSelect from "components/SoftSelect";
import SoftInput from "components/SoftInput";
import SoftPagination from "components/SoftPagination";

function TableFooter({
  entriesPerPage,
  showTotalEntries,
  pageOptions,
  entriesStart,
  entriesEnd,
  rows,
  defaultValue,
  entries,
  setEntriesPerPage,
  pagination,
  canPreviousPage,
  canNextPage,
  previousPage,
  nextPage,
  renderPagination,
  pageIndex,
  customizedPageOptions,
  handleInputPagination,
  handleInputPaginationValue,
}) {
  return (
    <SoftBox
      display="flex"
      flexDirection={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      p={!showTotalEntries && pageOptions.length === 1 ? 0 : 3}
    >
      {entriesPerPage && (
        <SoftBox display="flex" alignItems="center" mb={{ xs: 2, sm: 0 }}>
          <SoftSelect
            defaultValue={{ value: defaultValue, label: defaultValue }}
            options={entries.map((entry) => ({ value: entry, label: entry }))}
            onChange={setEntriesPerPage}
            size="small"
          />
          <SoftTypography variant="caption" color="secondary">
            &nbsp;&nbsp;entries per page
          </SoftTypography>
        </SoftBox>
      )}
      {showTotalEntries && (
        <SoftBox mb={{ xs: 3, sm: 0 }}>
          <SoftTypography variant="button" color="secondary" fontWeight="regular">
            Showing {entriesStart} to {entriesEnd} of {rows.length} entries
          </SoftTypography>
        </SoftBox>
      )}

      {pageOptions.length > 1 && (
        <SoftPagination
          variant={pagination.variant ? pagination.variant : "gradient"}
          color={pagination.color ? pagination.color : "info"}
        >
          {canPreviousPage && (
            <SoftPagination item onClick={() => previousPage()}>
              <Icon sx={{ fontWeight: "bold" }}>chevron_left</Icon>
            </SoftPagination>
          )}
          {renderPagination.length > 6 ? (
            <SoftBox width="5rem" mx={1}>
              <SoftInput
                inputProps={{ type: "number", min: 1, max: customizedPageOptions.length }}
                value={customizedPageOptions[pageIndex]}
                onChange={(handleInputPagination, handleInputPaginationValue)}
              />
            </SoftBox>
          ) : (
            renderPagination
          )}
          {canNextPage && (
            <SoftPagination item onClick={() => nextPage()}>
              <Icon sx={{ fontWeight: "bold" }}>chevron_right</Icon>
            </SoftPagination>
          )}
        </SoftPagination>
      )}
    </SoftBox>
  );
}

TableFooter.propTypes = {
  entriesPerPage: PropTypes.oneOfType([
    PropTypes.shape({
      defaultValue: PropTypes.number,
      entries: PropTypes.arrayOf(PropTypes.number),
    }),
    PropTypes.bool,
  ]),
  showTotalEntries: PropTypes.bool,
  pageOptions: PropTypes.array.isRequired,
  entriesStart: PropTypes.number.isRequired,
  entriesEnd: PropTypes.number.isRequired,
  rows: PropTypes.array.isRequired,
  defaultValue: PropTypes.number.isRequired,
  entries: PropTypes.array.isRequired,
  setEntriesPerPage: PropTypes.func.isRequired,
  pagination: PropTypes.object.isRequired,
  canPreviousPage: PropTypes.bool.isRequired,
  canNextPage: PropTypes.bool.isRequired,
  previousPage: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  renderPagination: PropTypes.array.isRequired,
  pageIndex: PropTypes.number.isRequired,
  customizedPageOptions: PropTypes.array.isRequired,
  handleInputPagination: PropTypes.func.isRequired,
  handleInputPaginationValue: PropTypes.func.isRequired,
};

export default TableFooter;
