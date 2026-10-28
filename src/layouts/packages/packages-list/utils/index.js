import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { formatImageUrl } from "utils/imageUtils";
import { formatMoney } from "services/currencyService";
import { formatDateOnly } from "utils/dateUtils";

export const COLUMN_WIDTHS = {
  IMAGE: "8%",
  NAME: "20%",
  COURSE: "15%",
  LOCATION: "15%",
  DATES: "15%",
  PRICE: "12%",
  ACTIONS: "15%",
};

export function PackageImageCell({ value }) {
  if (!value) {
    return (
      <SoftBox display="flex" alignItems="center" justifyContent="center">
        <Icon sx={{ color: "text.secondary" }} fontSize="small">
          image
        </Icon>
      </SoftBox>
    );
  }

  return (
    <SoftBox
      component="img"
      src={formatImageUrl(value)}
      alt="package image"
      borderRadius="lg"
      shadow="md"
      width="40px"
      height="40px"
      sx={{
        objectFit: "cover",
        backgroundColor: "grey.100",
      }}
      onError={(e) => {
        e.target.style.display = "none";
      }}
    />
  );
}

PackageImageCell.propTypes = {
  value: PropTypes.string,
};

export function PackageNameCell({ value }) {
  const maxLength = 25;
  const displayText = value && value.length > maxLength 
    ? `${value.substring(0, maxLength)}...` 
    : value || "-";
  
  return (
    <Tooltip title={value || ""} placement="top">
      <SoftTypography variant="button" fontWeight="medium">
        {displayText}
      </SoftTypography>
    </Tooltip>
  );
}

PackageNameCell.propTypes = {
  value: PropTypes.string,
};

export function CourseCell({ value }) {
  const maxLength = 20;
  const displayText = value && value.length > maxLength 
    ? `${value.substring(0, maxLength)}...` 
    : value || "-";
  
  return (
    <Tooltip title={value || ""} placement="top">
      <SoftTypography variant="caption" color="text">
        {displayText}
      </SoftTypography>
    </Tooltip>
  );
}

CourseCell.propTypes = {
  value: PropTypes.string,
};

export function LocationCell({ value }) {
  return (
    <SoftTypography variant="caption" color="text">
      {value || "-"}
    </SoftTypography>
  );
}

LocationCell.propTypes = {
  value: PropTypes.string,
};

export function DatesCell({ value }) {
  if (!value || !value.length) {
    return (
      <SoftTypography variant="caption" color="text">
        -
      </SoftTypography>
    );
  }

  // Package dates are saved as UTC midnight; show that day in every time zone.
  const formatDate = (dateString) => formatDateOnly(dateString) || "-";

  const firstDate = value[0];
  const displayText = `${formatDate(firstDate.startDate)} (${firstDate.duration}w)`;
  const hasMore = value.length > 1;

  return (
    <Tooltip 
      title={value.map(d => `${formatDate(d.startDate)} - ${d.duration} weeks${d.tag ? ` (${d.tag})` : ""}`).join(", ")} 
      placement="top"
    >
      <SoftTypography variant="caption" color="text">
        {displayText}{hasMore ? ` +${value.length - 1}` : ""}
      </SoftTypography>
    </Tooltip>
  );
}

DatesCell.propTypes = {
  value: PropTypes.array,
};

export function PriceCell({ value }) {
  if (!value) {
    return (
      <SoftTypography variant="caption" color="text">
        -
      </SoftTypography>
    );
  }

  const { travelTotal, travelBase, discountAmount } = value;
  
  return (
    <SoftBox>
      <SoftTypography variant="button" fontWeight="medium" color="success">
        {travelTotal != null ? formatMoney(travelTotal, "EUR") : "-"}
      </SoftTypography>
      {discountAmount > 0 && (
        <SoftTypography variant="caption" color="text" sx={{ textDecoration: "line-through", ml: 1 }}>
          {travelBase != null && formatMoney(travelBase, "EUR")}
        </SoftTypography>
      )}
    </SoftBox>
  );
}

PriceCell.propTypes = {
  value: PropTypes.shape({
    travelTotal: PropTypes.number,
    travelBase: PropTypes.number,
    discountAmount: PropTypes.number,
  }),
};

export function ActionsCell({
  row,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  isUpdating,
  hideRowMutations,
}) {
  const handleClick = (e, action) => {
    e.stopPropagation();
    action(row);
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (!isUpdating && onToggleStatus) {
      onToggleStatus(row);
    }
  };

  const isActive = row.isActive !== undefined ? row.isActive : true;

  return (
    <Stack direction="row" spacing={1} justifyContent="center" onClick={(e) => e.stopPropagation()}>
      {onToggleStatus && !hideRowMutations && (
        <Tooltip title={isActive ? "Active" : "Inactive"} placement="top">
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
        </Tooltip>
      )}
      <Tooltip title="View" placement="top">
        <IconButton onClick={(e) => handleClick(e, onView)} size="small">
          <Icon fontSize="small">visibility</Icon>
        </IconButton>
      </Tooltip>
      {!hideRowMutations && (
        <>
          <Tooltip title="Edit" placement="top">
            <IconButton onClick={(e) => handleClick(e, onEdit)} size="small">
              <Icon fontSize="small">edit</Icon>
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete" placement="top">
            <IconButton onClick={(e) => handleClick(e, onDelete)} size="small">
              <Icon fontSize="small">delete</Icon>
            </IconButton>
          </Tooltip>
        </>
      )}
    </Stack>
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
