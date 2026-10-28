import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import TruncatedText from "components/TruncatedText";

import { ICON_COLOR } from "./constants";

function ActionsCell({ row, onView, onEdit, onDelete, onToggleStatus, isUpdating, hideRowMutations }) {
  const handleView = (e) => {
    e.stopPropagation();
    onView(row);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(row);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(row);
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (!isUpdating && onToggleStatus) {
      onToggleStatus(row);
    }
  };

  const isActive = row.isActive !== undefined ? row.isActive : true;

  return (
    <SoftBox display="flex" alignItems="center" justifyContent="center" gap={2}>
      {!hideRowMutations && onToggleStatus && (
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
      <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
        <Tooltip title="View location" placement="top">
          <Icon sx={{ color: ICON_COLOR }} fontSize="medium" onClick={handleView}>
            visibility
          </Icon>
        </Tooltip>
      </SoftTypography>
      {!hideRowMutations && (
        <>
          <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
            <Tooltip title="Edit location" placement="top">
              <Icon sx={{ color: ICON_COLOR }} fontSize="medium" onClick={handleEdit}>
                edit
              </Icon>
            </Tooltip>
          </SoftTypography>
          <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
            <Tooltip title="Delete location" placement="left">
              <Icon sx={{ color: ICON_COLOR }} fontSize="medium" onClick={handleDelete}>
                delete
              </Icon>
            </Tooltip>
          </SoftTypography>
        </>
      )}
    </SoftBox>
  );
}

ActionsCell.propTypes = {
  row: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func,
  isUpdating: PropTypes.bool,
  hideRowMutations: PropTypes.bool,
};

function ActionsCellWrapper({ value }) {
  return <ActionsCell {...value} />;
}

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

function CampusNameCell({ value }) {
  return <TruncatedText text={value} maxLength={20} />;
}

CampusNameCell.propTypes = {
  value: PropTypes.string,
};

const dataTableData = {
  columns: [
    {
      Header: "Location Name",
      accessor: "name",
      align: "left",
      Cell: CampusNameCell,
    },
    { Header: "Address", accessor: "address", align: "left" },
    { Header: "Avg Participants/Class", accessor: "avgStudentsPerClass", align: "center" },
    { Header: "Currency", accessor: "currency", align: "center" },
    { Header: "Website", accessor: "website", align: "left" },
    {
      Header: "Actions",
      accessor: "actions",
      align: "center",
      Cell: ActionsCellWrapper,
    },
  ],
  rows: [],
};

export default dataTableData;
