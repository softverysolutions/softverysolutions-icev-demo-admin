import PropTypes from "prop-types";
import TableContainer from "@mui/material/TableContainer";

import SearchBar from "./CustomDataTable/SearchBar";
import TableContent from "./CustomDataTable/TableContent";
import TableFooter from "./CustomDataTable/TableFooter";
import { useTableLogic } from "./CustomDataTable/useTableLogic";

function CustomDataTable({
  entriesPerPage = { defaultValue: 10, entries: [5, 10, 15, 20, 25] },
  canSearch = false,
  showTotalEntries = true,
  table,
  pagination = { variant: "gradient", color: "info" },
  isSorted = true,
  noEndBorder = false,
  onRowClick,
}) {
  const {
    // Table instance
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    page,
    pageOptions,
    canPreviousPage,
    canNextPage,
    nextPage,
    previousPage,
    pageIndex,

    // Pagination
    setEntriesPerPage,
    renderPagination,
    handleInputPagination,
    customizedPageOptions,
    handleInputPaginationValue,
    entriesStart,
    entriesEnd,

    // Search
    search,
    onSearchChange,

    // Sorting
    setSortedValue,

    // Config
    defaultValue,
    entries,
  } = useTableLogic(table, entriesPerPage, isSorted);

  return (
    <TableContainer sx={{ boxShadow: "none" }}>
      <SearchBar canSearch={canSearch} search={search} onSearchChange={onSearchChange} />

      <TableContent
        getTableProps={getTableProps}
        getTableBodyProps={getTableBodyProps}
        headerGroups={headerGroups}
        page={page}
        prepareRow={prepareRow}
        rows={rows}
        isSorted={isSorted}
        noEndBorder={noEndBorder}
        setSortedValue={setSortedValue}
        onRowClick={onRowClick}
      />

      <TableFooter
        entriesPerPage={entriesPerPage}
        showTotalEntries={showTotalEntries}
        pageOptions={pageOptions}
        entriesStart={entriesStart}
        entriesEnd={entriesEnd}
        rows={rows}
        defaultValue={defaultValue}
        entries={entries}
        setEntriesPerPage={setEntriesPerPage}
        pagination={pagination}
        canPreviousPage={canPreviousPage}
        canNextPage={canNextPage}
        previousPage={previousPage}
        nextPage={nextPage}
        renderPagination={renderPagination}
        pageIndex={pageIndex}
        customizedPageOptions={customizedPageOptions}
        handleInputPagination={handleInputPagination}
        handleInputPaginationValue={handleInputPaginationValue}
      />
    </TableContainer>
  );
}

CustomDataTable.propTypes = {
  entriesPerPage: PropTypes.oneOfType([
    PropTypes.shape({
      defaultValue: PropTypes.number,
      entries: PropTypes.arrayOf(PropTypes.number),
    }),
    PropTypes.bool,
  ]),
  canSearch: PropTypes.bool,
  showTotalEntries: PropTypes.bool,
  table: PropTypes.objectOf(PropTypes.array).isRequired,
  pagination: PropTypes.shape({
    variant: PropTypes.oneOf(["contained", "gradient"]),
    color: PropTypes.oneOf([
      "primary",
      "secondary",
      "info",
      "success",
      "warning",
      "error",
      "dark",
      "light",
    ]),
  }),
  isSorted: PropTypes.bool,
  noEndBorder: PropTypes.bool,
  onRowClick: PropTypes.func,
};

export default CustomDataTable;
