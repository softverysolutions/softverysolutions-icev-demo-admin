/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useMemo, useEffect, useState } from "react";

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// react-table components
import { useTable, usePagination, useGlobalFilter, useAsyncDebounce, useSortBy } from "react-table";

// @mui material components
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard PRO React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftSelect from "components/SoftSelect";
import SoftInput from "components/SoftInput";
import SoftPagination from "components/SoftPagination";

// Soft UI Dashboard PRO React example components
import DataTableHeadCell from "examples/Tables/DataTable/DataTableHeadCell";
import DataTableBodyCell from "examples/Tables/DataTable/DataTableBodyCell";
import colors from "assets/theme/base/colors";
import borders from "assets/theme/base/borders";

function DataTable({
  entriesPerPage = { defaultValue: 10, entries: [5, 10, 15, 20, 25] },
  canSearch = false,
  showTotalEntries = true,
  table = {},
  pagination = { variant: "gradient", color: "info" },
  isSorted = true,
  noEndBorder = false,
  onRowClick,
  onPageChange,
  onPageSizeChange,
  onServerSearchChange,
  serverPagination,
  serverSortBy,
  onSortChange,
  isLoading = false,
  containerSx = {},
  resetPageKey,
}) {
  const defaultValue = entriesPerPage?.defaultValue ?? 10;
  const entries = Array.isArray(entriesPerPage?.entries) ? entriesPerPage.entries : [5, 10, 15, 20, 25];
  const columns = useMemo(() => (Array.isArray(table?.columns) ? table.columns : []), [table]);
  const data = useMemo(() => (Array.isArray(table?.rows) ? table.rows : []), [table]);
  const useServerPagination = !!serverPagination;
  const useServerSort = useServerPagination && (serverSortBy != null || onSortChange);

  const tableInstance = useServerPagination
    ? useTable(
        {
          columns,
          data,
          initialState: {
            pageIndex: 0,
            sortBy: useServerSort && Array.isArray(serverSortBy) ? serverSortBy : [],
          },
          manualPagination: true,
          manualSortBy: useServerSort,
          autoResetSortBy: false,
          state: useServerSort && Array.isArray(serverSortBy) ? { sortBy: serverSortBy } : undefined,
        },
        useGlobalFilter,
        useSortBy
      )
    : useTable(
        {
          columns,
          data,
          initialState: { pageIndex: 0 },
          autoResetPage: false,
        },
        useGlobalFilter,
        useSortBy,
        usePagination
      );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    page,
    pageOptions,
    canPreviousPage,
    canNextPage,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    setGlobalFilter,
    state: { pageIndex, pageSize, globalFilter },
  } = tableInstance;

  const safePageOptions = pageOptions || [];
  const safeCanPreviousPage = useServerPagination
    ? serverPagination.currentPage > 1
    : canPreviousPage;
  const safeCanNextPage = useServerPagination
    ? serverPagination.currentPage < serverPagination.totalPages
    : canNextPage;

  useEffect(() => {
    if (!useServerPagination && setPageSize) {
      setPageSize(defaultValue);
    }
  }, [defaultValue, useServerPagination]);

  // A list filtered or searched from outside starts again from its first page.
  useEffect(() => {
    if (!useServerPagination && gotoPage) gotoPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetPageKey]);

  // Never stay on a page past the end when the rows shrink ("Showing 11 to 20 of 10").
  const lastPageIndex = Math.max((pageOptions?.length || 0) - 1, 0);
  useEffect(() => {
    if (!useServerPagination && gotoPage && pageIndex > lastPageIndex) gotoPage(lastPageIndex);
  }, [useServerPagination, gotoPage, pageIndex, lastPageIndex]);

  const setEntriesPerPage = ({ value }) => {
    if (useServerPagination && onPageSizeChange) {
      onPageSizeChange(value);
    } else {
      setPageSize(value);
    }
  };

  const generateServerPagination = () => {
    const pages = [];
    const { totalPages, currentPage } = serverPagination;

    if (totalPages > 0) pages.push(0);

    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      if (i !== 0 && i !== totalPages - 1) {
        pages.push(i);
      }
    }

    if (totalPages > 1) pages.push(totalPages - 1);

    return [...new Set(pages)].sort((a, b) => a - b);
  };

  const renderPagination = useServerPagination
    ? generateServerPagination().map((option) => (
        <SoftPagination
          item
          key={option}
          onClick={() => onPageChange(option + 1)}
          active={serverPagination.currentPage === option + 1}
        >
          {option + 1}
        </SoftPagination>
      ))
    : pageOptions.map((option) => (
        <SoftPagination
          item
          key={option}
          onClick={() => gotoPage(Number(option))}
          active={pageIndex === option}
        >
          {option + 1}
        </SoftPagination>
      ));

  const handleInputPagination = ({ target: { value } }) => {
    if (useServerPagination && onPageChange) {
      const pageNumber = parseInt(value);
      if (pageNumber >= 1 && pageNumber <= serverPagination.totalPages) {
        onPageChange(pageNumber);
      }
    } else {
      value > pageOptions.length || value < 0 ? gotoPage(0) : gotoPage(Number(value));
    }
  };

  const customizedPageOptions = useServerPagination
    ? generateServerPagination().map((option) => option + 1)
    : pageOptions.map((option) => option + 1);

  const currentPageValue = useServerPagination
    ? serverPagination.currentPage
    : customizedPageOptions[pageIndex];

  const [pageInputValue, setPageInputValue] = useState(currentPageValue);

  useEffect(() => {
    setPageInputValue(currentPageValue);
  }, [currentPageValue]);

  const handlePageInputChange = (e) => {
    const inputValue = e.target.value;
    
    if (inputValue === "") {
      setPageInputValue("");
      return;
    }
    
    const numericValue = inputValue.replace(/[^0-9]/g, "");
    if (numericValue !== inputValue) {
      setPageInputValue(numericValue);
      return;
    }
    
    setPageInputValue(numericValue);
  };

  const handlePageInputBlur = (e) => {
    const inputValue = e.target.value.trim();

    if (inputValue === "") {
      setPageInputValue(currentPageValue);
      return;
    }
    
    const pageNumber = parseInt(inputValue, 10);
    
    if (isNaN(pageNumber)) {
      setPageInputValue(currentPageValue);
      return;
    }
    
    if (useServerPagination && onPageChange) {    
      if (pageNumber >= 1 && pageNumber <= serverPagination.totalPages) {
        onPageChange(pageNumber);
      } else {
        setPageInputValue(currentPageValue);
      }
    } else {
      const maxPage = customizedPageOptions.length;
      if (pageNumber >= 1 && pageNumber <= maxPage) {
        gotoPage(Number(pageNumber - 1));
      } else {
        setPageInputValue(currentPageValue);
      }
    }
  };

  const handlePageInputKeyPress = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  const [search, setSearch] = useState(globalFilter);

  const onSearchChange = useAsyncDebounce((value) => {
    if (useServerPagination && onServerSearchChange) {
      onServerSearchChange(value);
    } else {
      setGlobalFilter(value || undefined);
    }
  }, 300);

  const setSortedValue = (column) => {
    if (!isSorted) return false;
    if (column.isSorted) return column.isSortedDesc ? "desc" : "asce";
    return "none";
  };

  const entriesStart = useServerPagination
    ? serverPagination.currentPage === 1
      ? 1
      : (serverPagination.currentPage - 1) * serverPagination.itemsPerPage + 1
    : rows.length === 0
    ? 0
    : pageIndex * pageSize + 1;

  // Counted from the rows themselves, so a short list reads "Showing 1 to 5 of 5", not "1 to 10 of 5".
  const entriesEnd = useServerPagination
    ? Math.min(
        serverPagination.currentPage * serverPagination.itemsPerPage,
        serverPagination.totalItems
      )
    : Math.min((pageIndex + 1) * pageSize, rows.length);

  return (
    <TableContainer sx={{ boxShadow: "none", ...containerSx }}>
      {canSearch ? (
        <SoftBox p={3}>
          <SoftInput
            placeholder="Search..."
            value={search}
            onChange={({ currentTarget }) => {
              setSearch(currentTarget.value);
              onSearchChange(currentTarget.value);
            }}
            icon={{
              component: <Icon>search</Icon>,
              direction: "left",
            }}
          />
        </SoftBox>
      ) : null}
      <Table {...getTableProps()} sx={{ borderCollapse: "collapse" }}>
        <SoftBox component="thead">
          {headerGroups.map((headerGroup) => {
            const { key: headerGroupKey, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
            return (
              <TableRow key={headerGroupKey} {...headerGroupProps}>
                {headerGroup.headers.map((column) => {
                  const columnCanSort = column.canSort !== false;
                  const sortByToggleProps =
                    isSorted && columnCanSort && column.getSortByToggleProps
                      ? column.getSortByToggleProps()
                      : {};
                  const { key: columnKey, onClick: defaultOnClick, ...headerProps } = column.getHeaderProps(
                    isSorted && columnCanSort ? sortByToggleProps : {}
                  );
                  const handleHeaderClick = (e) => {
                    if (useServerSort && onSortChange && isSorted && columnCanSort) {
                      e.preventDefault();
                      const nextDesc = column.isSorted ? !column.isSortedDesc : false;
                      onSortChange(column.id, nextDesc);
                    } else if (defaultOnClick) {
                      defaultOnClick(e);
                    }
                  };
                  return (
                    <DataTableHeadCell
                      key={columnKey}
                      {...headerProps}
                      onClick={isSorted && columnCanSort ? handleHeaderClick : defaultOnClick}
                      width={column.width ? column.width : "auto"}
                      align={column.align ? column.align : "left"}
                      sorted={columnCanSort ? setSortedValue(column) : false}
                    >
                      {column.render("Header")}
                    </DataTableHeadCell>
                  );
                })}
              </TableRow>
            );
          })}
        </SoftBox>
        <TableBody {...getTableBodyProps()}>
          {isLoading ? (
            <TableRow>
              <DataTableBodyCell colSpan={columns.length} align="center">
                <SoftTypography variant="body2" color="text">
                  Loading...
                </SoftTypography>
              </DataTableBodyCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <DataTableBodyCell colSpan={columns.length} align="center">
                <SoftTypography variant="body2" color="text">
                  No data available
                </SoftTypography>
              </DataTableBodyCell>
            </TableRow>
          ) : (
            (useServerPagination ? rows : page).map((row, rowIndex) => {
              prepareRow(row);
              const currentRows = useServerPagination ? rows : page;
              const isLastRow = rowIndex === currentRows.length - 1;
              const showRowBorder = !noEndBorder || !isLastRow;
              const { key: rowKey, ...rowProps } = row.getRowProps();
              return (
                <TableRow
                  key={rowKey}
                  {...rowProps}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  sx={{
                    ...(onRowClick
                      ? { cursor: "pointer", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }
                      : {}),
                    ...(showRowBorder
                      ? {
                          borderBottom: `${borders.borderWidth[1]} solid ${colors.light.main}`,
                        }
                      : {}),
                  }}
                >
                  {row.cells.map((cell) => {
                    const { key: cellKey, ...cellProps } = cell.getCellProps();
                    return (
                      <DataTableBodyCell
                        key={cellKey}
                        noBorder
                        align={cell.column.align ? cell.column.align : "left"}
                        fullWidth={cell.column.fullWidth}
                        {...cellProps}
                      >
                        {cell.render("Cell")}
                      </DataTableBodyCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

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
              defaultValue={{
                value: useServerPagination ? serverPagination.itemsPerPage : defaultValue,
                label: useServerPagination ? serverPagination.itemsPerPage : defaultValue,
              }}
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
              Showing {entriesStart} to {entriesEnd} of{" "}
              {useServerPagination ? serverPagination.totalItems : rows.length} entries
            </SoftTypography>
          </SoftBox>
        )}
        {((useServerPagination && serverPagination.totalPages > 1) ||
          (!useServerPagination && safePageOptions.length > 1)) && (
          <SoftPagination
            variant={pagination.variant ? pagination.variant : "gradient"}
            color={pagination.color ? pagination.color : "info"}
          >
            {useServerPagination ? (
              <>
                {serverPagination.currentPage > 1 && (
                  <SoftPagination
                    item
                    onClick={() => onPageChange(serverPagination.currentPage - 1)}
                  >
                    <Icon sx={{ fontWeight: "bold" }}>chevron_left</Icon>
                  </SoftPagination>
                )}
                {renderPagination.length > 10 ? (
                  <SoftBox width="5rem" mx={1}>
                    <SoftInput
                      inputProps={{ type: "number", min: 1, max: serverPagination.totalPages }}
                      value={serverPagination.currentPage}
                      onChange={(handleInputPagination, handleInputPaginationValue)}
                    />
                  </SoftBox>
                ) : (
                  renderPagination
                )}
                {serverPagination.currentPage < serverPagination.totalPages && (
                  <SoftPagination
                    item
                    onClick={() => onPageChange(serverPagination.currentPage + 1)}
                  >
                    <Icon sx={{ fontWeight: "bold" }}>chevron_right</Icon>
                  </SoftPagination>
                )}
              </>
            ) : (
              <>
                {safeCanPreviousPage && (
                  <SoftPagination item onClick={() => previousPage()}>
                    <Icon sx={{ fontWeight: "bold" }}>chevron_left</Icon>
                  </SoftPagination>
                )}
                {renderPagination.length > 10 ? (
                  <SoftBox width="5rem" mx={1}>
                    <SoftInput
                      inputProps={{ 
                        type: "text",
                        inputMode: "numeric",
                        pattern: "[0-9]*"
                      }}
                      value={pageInputValue}
                      onChange={handlePageInputChange}
                      onBlur={handlePageInputBlur}
                      onKeyPress={handlePageInputKeyPress}
                    />
                  </SoftBox>
                ) : (
                  renderPagination
                )}
                {safeCanNextPage && (
                  <SoftPagination item onClick={() => nextPage()}>
                    <Icon sx={{ fontWeight: "bold" }}>chevron_right</Icon>
                  </SoftPagination>
                )}
              </>
            )}
          </SoftPagination>
        )}
      </SoftBox>
    </TableContainer>
  );
}

DataTable.propTypes = {
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
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
  onServerSearchChange: PropTypes.func,
  serverPagination: PropTypes.shape({
    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    totalItems: PropTypes.number,
    itemsPerPage: PropTypes.number,
  }),
  serverSortBy: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      desc: PropTypes.bool,
    })
  ),
  onSortChange: PropTypes.func,
  isLoading: PropTypes.bool,
  containerSx: PropTypes.object,
  resetPageKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default DataTable;
