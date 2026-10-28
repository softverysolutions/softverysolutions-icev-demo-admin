import PropTypes from "prop-types";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";

import SoftBox from "components/SoftBox";
import DataTableHeadCell from "examples/Tables/DataTable/DataTableHeadCell";
import DataTableBodyCell from "examples/Tables/DataTable/DataTableBodyCell";

function TableContent({
  getTableProps,
  getTableBodyProps,
  headerGroups,
  page,
  prepareRow,
  rows,
  isSorted,
  noEndBorder,
  setSortedValue,
  onRowClick,
}) {
  return (
    <Table {...getTableProps()}>
      <SoftBox component="thead">
        {headerGroups.map((headerGroup, key) => (
          <TableRow key={key} {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column, key) => (
              <DataTableHeadCell
                key={key}
                {...column.getHeaderProps(isSorted && column.getSortByToggleProps())}
                width={column.width ? column.width : "auto"}
                align={column.align ? column.align : "left"}
                sorted={setSortedValue(column)}
              >
                {column.render("Header")}
              </DataTableHeadCell>
            ))}
          </TableRow>
        ))}
      </SoftBox>
      <TableBody {...getTableBodyProps()}>
        {page.map((row, rowIndex) => {
          prepareRow(row);
          return (
            <TableRow
              key={rowIndex}
              {...row.getRowProps()}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              sx={
                onRowClick
                  ? { cursor: "pointer", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" } }
                  : {}
              }
            >
              {row.cells.map((cell, cellIndex) => (
                <DataTableBodyCell
                  key={cellIndex}
                  noBorder={noEndBorder && page.length - 1 === rowIndex}
                  align={cell.column.align ? cell.column.align : "left"}
                  {...cell.getCellProps()}
                >
                  {cell.render("Cell")}
                </DataTableBodyCell>
              ))}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

TableContent.propTypes = {
  getTableProps: PropTypes.func.isRequired,
  getTableBodyProps: PropTypes.func.isRequired,
  headerGroups: PropTypes.array.isRequired,
  page: PropTypes.array.isRequired,
  prepareRow: PropTypes.func.isRequired,
  rows: PropTypes.array.isRequired,
  isSorted: PropTypes.bool,
  noEndBorder: PropTypes.bool,
  setSortedValue: PropTypes.func.isRequired,
  onRowClick: PropTypes.func,
};

export default TableContent;
