import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import { formatMoney, getCurrencyPrefix } from "services/currencyService";

import { ICON_COLOR } from "./constants";
import { travelStatusOf, paymentStatusOf } from "./statuses";

export const DateCell = ({ value }) => (
  <SoftBox display="flex" alignItems="center" justifyContent="center">
    <SoftBox sx={dateCellStyles}>{value}</SoftBox>
  </SoftBox>
);

DateCell.propTypes = {
  value: PropTypes.string.isRequired,
};

export const BuyerNameCell = ({ value }) => (
  <SoftTypography variant="body2">{value}</SoftTypography>
);

BuyerNameCell.propTypes = {
  value: PropTypes.string.isRequired,
};

export const DurationCell = ({ value }) => (
  <SoftBox display="flex" alignItems="center" justifyContent="center">
    <SoftButton variant="gradient" color="info" size="small" sx={durationCellStyles}>
      {value}
    </SoftButton>
  </SoftBox>
);

DurationCell.propTypes = {
  value: PropTypes.string.isRequired,
};

export const AmountCell = ({ value }) => {
  if (typeof value === "object" && value !== null) {
    const { amount, currency } = value;

    return (
      <SoftTypography variant="button" fontWeight="medium" sx={amountCellStyles}>
        {typeof amount === "number"
          ? formatMoney(amount, currency)
          : `${getCurrencyPrefix(currency)}${amount}`}
      </SoftTypography>
    );
  }

  return (
    <SoftTypography variant="button" fontWeight="medium" sx={amountCellStyles}>
      {typeof value === "number" ? formatMoney(value, "EUR") : `€${value}`}
    </SoftTypography>
  );
};

AmountCell.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      amount: PropTypes.number,
      currency: PropTypes.string,
    }),
  ]).isRequired,
};

export const ActionsCell = ({ value }) => (
  <SoftBox display="flex" alignItems="center" justifyContent="center" gap={2}>
    <SoftTypography variant="body1" color="secondary" sx={actionsCellStyles}>
      <Tooltip title="View order details" placement="top">
        <Icon
          sx={{ color: ICON_COLOR, cursor: "pointer" }}
          fontSize="medium"
          onClick={(e) => {
            e.stopPropagation();
            value.onView(value.row);
          }}
        >
          visibility
        </Icon>
      </Tooltip>
    </SoftTypography>
  </SoftBox>
);

ActionsCell.propTypes = {
  value: PropTypes.shape({
    row: PropTypes.object.isRequired,
    onView: PropTypes.func.isRequired,
  }).isRequired,
};

export const TravelStatusCell = ({ value }) => {
  const status = travelStatusOf(value);
  return (
    <SoftBadge color={status.color} variant="contained" size="xs" badgeContent={status.label} container />
  );
};

TravelStatusCell.propTypes = {
  value: PropTypes.string,
};

export const PaymentStatusCell = ({ value }) => {
  const status = paymentStatusOf(value);
  return (
    <SoftBadge color={status.color} variant="gradient" size="xs" badgeContent={status.label} container />
  );
};

PaymentStatusCell.propTypes = {
  value: PropTypes.string,
};

export const StudentsCell = ({ value }) => (
  <SoftBox display="flex" alignItems="center" justifyContent="center">
    <SoftBadge color={value > 2 ? "info" : "secondary"} variant="contained" size="sm">
      {value} {value === 1 ? "student" : "students"}
    </SoftBadge>
  </SoftBox>
);

StudentsCell.propTypes = {
  value: PropTypes.number.isRequired,
};

export const TruncatedTextCell = ({ value, maxLength = 30 }) => {
  const truncatedText = value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
  const fullText = value.length > maxLength ? value : null;

  return (
    <Tooltip
      title={fullText}
      placement="bottom"
      componentsProps={{
        tooltip: {
          sx: tooltipStyles,
        },
      }}
    >
      <div style={truncatedTextStyles}>
        <SoftTypography variant="body2">{truncatedText}</SoftTypography>
      </div>
    </Tooltip>
  );
};

TruncatedTextCell.propTypes = {
  value: PropTypes.string.isRequired,
  maxLength: PropTypes.number,
};

export const CourseCell = ({ value }) => <TruncatedTextCell value={value} maxLength={25} />;

CourseCell.propTypes = {
  value: PropTypes.string.isRequired,
};

export const AdditionalServicesCell = ({ value }) => (
  <TruncatedTextCell value={value} maxLength={20} />
);

AdditionalServicesCell.propTypes = {
  value: PropTypes.string.isRequired,
};

const dateCellStyles = {
  backgroundColor: "white",
  border: "1px solid #6D4AFF",
  borderRadius: "8px",
  padding: "6px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "auto",
  fontWeight: "bold",
  textTransform: "uppercase",
  fontSize: "12px",
  color: "#6D4AFF",
};

const durationCellStyles = {
  fontSize: "12px",
  fontWeight: "bold",
  textTransform: "uppercase",
  padding: "6px 12px",
  borderRadius: "8px",
  minWidth: "auto",
};

const amountCellStyles = {
  color: "#12B886",
  fontSize: "14px",
};

const actionsCellStyles = {
  cursor: "pointer",
  lineHeight: 0,
};

const tooltipStyles = {
  backgroundColor: "rgba(0, 0, 0, 0.8)",
  color: "#fff",
  fontSize: "12px",
  maxWidth: "300px",
  padding: "8px 12px",
  borderRadius: "4px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
};

const truncatedTextStyles = {
  cursor: "pointer",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
  maxWidth: "100%",
};
