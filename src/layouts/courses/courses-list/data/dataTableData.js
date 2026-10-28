import { useState } from "react";
import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import TruncatedText from "components/TruncatedText";

const ActionsCellWrapper = ({ value }) => {
  const {
    row,
    onView,
    onEdit,
    onDelete,
    onPriceList,
    onDuplicate,
    onToggleStatus,
    isUpdating,
    hideRowMutations,
  } = value;

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (!isUpdating && onToggleStatus) {
      onToggleStatus(row);
    }
  };

  const isActive = row.isActive !== undefined ? row.isActive : true;

  return (
    <SoftBox display="flex" alignItems="center" justifyContent="center" gap={2}>
      {onToggleStatus && !hideRowMutations && (
        <FormControlLabel
          control={
            <Checkbox
              checked={isActive}
              onChange={handleCheckboxChange}
              disabled={isUpdating}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          }
          label=""
          sx={{ margin: 0 }}
        />
      )}
      {onView && (
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Tooltip title="View programme" placement="top">
            <Icon
              sx={{ color: "#241A5C" }}
              fontSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                onView(row);
              }}
            >
              visibility
            </Icon>
          </Tooltip>
        </SoftTypography>
      )}
      {onDuplicate && !hideRowMutations && (
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Tooltip title="Duplicate programme" placement="top">
            <Icon
              sx={{ color: "#241A5C" }}
              fontSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(row);
              }}
            >
              content_copy
            </Icon>
          </Tooltip>
        </SoftTypography>
      )}
      {onEdit && !hideRowMutations && (
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Tooltip title="Edit programme" placement="top">
            <Icon
              sx={{ color: "#241A5C" }}
              fontSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
            >
              edit
            </Icon>
          </Tooltip>
        </SoftTypography>
      )}
      {onPriceList && !hideRowMutations && (
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Tooltip title="Manage Price Lists" placement="top">
            <Icon
              sx={{ color: "#241A5C" }}
              fontSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                onPriceList(row);
              }}
            >
              receipt_long
            </Icon>
          </Tooltip>
        </SoftTypography>
      )}
      {onDelete && !hideRowMutations && (
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Tooltip title="Delete programme" placement="left">
            <Icon
              sx={{ color: "#241A5C" }}
              fontSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
            >
              delete
            </Icon>
          </Tooltip>
        </SoftTypography>
      )}
    </SoftBox>
  );
};

ActionsCellWrapper.propTypes = {
  value: PropTypes.shape({
    row: PropTypes.object.isRequired,
    onView: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    onPriceList: PropTypes.func,
    onDuplicate: PropTypes.func,
    onToggleStatus: PropTypes.func,
    isUpdating: PropTypes.bool,
    hideRowMutations: PropTypes.bool,
  }).isRequired,
};

const NameCell = ({ value }) => {
  return <TruncatedText text={value} maxLength={20} />;
};

NameCell.propTypes = {
  value: PropTypes.string,
};

const CampusCell = ({ value }) => {
  return <TruncatedText text={value} maxLength={20} />;
};

CampusCell.propTypes = {
  value: PropTypes.string,
};

const PeriodicityCell = ({ value }) => {
  return <TruncatedText text={value || "N/A"} maxLength={16} />;
};

PeriodicityCell.propTypes = {
  value: PropTypes.string,
};

const ProgramTypeCell = ({ value }) => {
  return <TruncatedText text={value || "N/A"} maxLength={40} />;
};

ProgramTypeCell.propTypes = {
  value: PropTypes.string,
};

const PriceCell = ({ value }) => {
  return <TruncatedText text={value || "N/A"} maxLength={14} />;
};

PriceCell.propTypes = {
  value: PropTypes.string,
};

const SchoolCell = ({ value, row }) => {
  const schoolLogo = row?.original?.schoolLogo;
  const [imageError, setImageError] = useState(false);
  
  if (schoolLogo && typeof schoolLogo === "string" && schoolLogo.trim() !== "" && !imageError) {
    return (
      <SoftBox display="flex" alignItems="center">
        <img
          src={schoolLogo}
          alt={value || "Provider logo"}
          style={{
            width: "40px",
            height: "40px",
            objectFit: "contain",
            borderRadius: "4px",
          }}
          onError={() => setImageError(true)}
        />
      </SoftBox>
    );
  }
  
  return <TruncatedText text={value || "N/A"} maxLength={20} />;
};

SchoolCell.propTypes = {
  value: PropTypes.string,
  row: PropTypes.object,
};

const dataTableData = {
  columns: [
    {
      Header: "Programme Name",
      accessor: "name",
      width: "25%",
      align: "left",
      Cell: NameCell,
    },
    {
      Header: "Periodicity",
      accessor: "periodicity",
      Cell: PeriodicityCell,
      disableSortBy: true,
    },
    {
      Header: "Programme Type",
      accessor: "programType",
      width: "15%",
      align: "left",
      Cell: ProgramTypeCell,
      disableSortBy: true,
    },
    {
      Header: "Provider",
      accessor: "school",
      width: "20%",
      align: "left",
      Cell: SchoolCell,
      disableSortBy: true,
    },
    {
      Header: "Location",
      accessor: "campus",
      width: "20%",
      align: "left",
      Cell: CampusCell,
      disableSortBy: true,
    },
    {
      Header: "From / week",
      accessor: "price",
      width: "10%",
      align: "center",
      Cell: PriceCell,
      disableSortBy: true,
    },
    {
      Header: "Actions",
      accessor: "actions",
      width: "10%",
      align: "center",
      Cell: ActionsCellWrapper,
      disableSortBy: true,
    },
  ],
  rows: [],
};

export default dataTableData;
