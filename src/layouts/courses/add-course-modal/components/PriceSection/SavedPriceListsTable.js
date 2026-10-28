import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";
import DataTable from "examples/Tables/DataTable";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { formatPriceDetails, getColorValue } from "./utils";
import { formatDateOnlyGB } from "utils/dateUtils";

function SavedPriceListsTable({
  priceLists,
  currency,
  onEditPriceList,
  onConfirmDelete,
  disabled,
}) {
  if (!priceLists || priceLists.length === 0) return null;

  return (
    <SoftBox mt={4} mb={3}>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Saved Price Lists
      </SoftTypography>
      <DataTable
        table={{
          columns: [
            { Header: "Price Details", accessor: "priceDetails", width: "60%", align: "left" },
            { Header: "Start Date", accessor: "startDate", width: "15%", align: "center" },
            { Header: "End Date", accessor: "endDate", width: "15%", align: "center" },
            { Header: "Actions", accessor: "actions", width: "10%", align: "center" },
          ],
          rows: priceLists.map((priceList) => {
            const details = formatPriceDetails(priceList, currency);
            return {
              priceDetails: (
                <SoftBox>
                  {details.map((detail, index) => (
                    <SoftBox key={index} display="flex" alignItems="center" gap={1} mb={1}>
                      <SoftTypography variant="body2" fontWeight="medium">
                        {detail.text}
                      </SoftTypography>
                      {detail.tag && (
                        <Chip
                          label={detail.tag}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: "0.75rem",
                            backgroundColor: "#f5f5f5",
                            color: "#424242",
                            fontWeight: 500,
                          }}
                        />
                      )}
                      {detail.color && (
                        <Chip
                          label={detail.color}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: "0.75rem",
                            backgroundColor: getColorValue(detail.color),
                            color: "#ffffff",
                            fontWeight: 500,
                            textTransform: "capitalize",
                          }}
                        />
                      )}
                    </SoftBox>
                  ))}
                </SoftBox>
              ),
              startDate: formatDateOnlyGB(priceList.startDate) || "—",
              endDate: formatDateOnlyGB(priceList.endDate) || "—",
              actions: (
                <SoftBox display="flex" gap={1} justifyContent="center">
                  <SoftButton
                    variant="gradient"
                    color="info"
                    size="small"
                    onClick={() => onEditPriceList(priceList)}
                    disabled={disabled}
                    sx={{ minWidth: "auto", px: 1, py: 0.5 }}
                  >
                    <Icon fontSize="small">edit</Icon>
                  </SoftButton>
                  <SoftButton
                    variant="gradient"
                    color="error"
                    size="small"
                    onClick={() => onConfirmDelete(priceList.id)}
                    disabled={disabled}
                    sx={{ minWidth: "auto", px: 1, py: 0.5 }}
                  >
                    <Icon fontSize="small">delete</Icon>
                  </SoftButton>
                </SoftBox>
              ),
            };
          }),
        }}
        showTotalEntries={false}
        entriesPerPage={false}
      />
    </SoftBox>
  );
}

SavedPriceListsTable.propTypes = {
  priceLists: PropTypes.array.isRequired,
  currency: PropTypes.string,
  onEditPriceList: PropTypes.func.isRequired,
  onConfirmDelete: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default SavedPriceListsTable;
