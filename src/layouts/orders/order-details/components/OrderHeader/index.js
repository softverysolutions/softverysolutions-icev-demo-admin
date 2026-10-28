import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import Card from "@mui/material/Card";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import { travelStatusOf } from "layouts/orders/orders-list/utils/statuses";

function OrderHeader({
  order,
  onBackClick,
  onCancelClick,
  onEditClick,
  onCancelEdit,
  onSave,
  canMutateOrder = false,
  isEditMode = false,
}) {
  return (
    <Card>
      <SoftBox p={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox display="flex" alignItems="center" gap={2}>
            <SoftButton
              variant="outlined"
              color="dark"
              size="small"
              onClick={onBackClick}
              startIcon={<Icon>arrow_back</Icon>}
            >
              Back
            </SoftButton>
            <SoftBox>
              <SoftTypography variant="h4" fontWeight="bold">
                Order #{order.id}
              </SoftTypography>
              <SoftTypography variant="body2" color="text">
                {order.buyerName}
                {order.orderDate
                  ? ` · ordered ${new Date(order.orderDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`
                  : ""}
              </SoftTypography>
            </SoftBox>
          </SoftBox>

          <SoftBox display="flex" alignItems="center" gap={2}>
            {isEditMode ? (
              <>
                <SoftButton
                  variant="outlined"
                  color="dark"
                  size="small"
                  onClick={onCancelEdit}
                  startIcon={<Icon>close</Icon>}
                >
                  Cancel
                </SoftButton>
                <SoftButton
                  variant="gradient"
                  color="success"
                  size="small"
                  onClick={onSave}
                  startIcon={<Icon>save</Icon>}
                >
                  Save Changes
                </SoftButton>
              </>
            ) : (
              <>
                {canMutateOrder && order.status !== "cancelled" && order.status !== "canceled" &&
                 order.status?.toLowerCase() !== "cancelled" && order.status?.toLowerCase() !== "canceled" && (
                  <>
                    <SoftButton
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={onCancelClick}
                      startIcon={<Icon>cancel</Icon>}
                    >
                      Cancel Order
                    </SoftButton>
                    <SoftButton
                      variant="gradient"
                      color="info"
                      size="small"
                      onClick={onEditClick}
                      startIcon={<Icon>edit</Icon>}
                    >
                      Edit Order
                    </SoftButton>
                  </>
                )}
                {order.isFixedPackage && (
                  <SoftBadge
                    variant="contained"
                    color="info"
                    size="large"
                    badgeContent={order.packageName ? `Package · ${order.packageName}` : "Package"}
                    container
                  />
                )}
                <SoftBadge
                  variant="contained"
                  color={travelStatusOf(order.status).color}
                  size="large"
                  badgeContent={travelStatusOf(order.status).label}
                  container
                />
              </>
            )}
          </SoftBox>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

OrderHeader.propTypes = {
  order: PropTypes.object.isRequired,
  onBackClick: PropTypes.func.isRequired,
  onCancelClick: PropTypes.func,
  onEditClick: PropTypes.func,
  onCancelEdit: PropTypes.func,
  onSave: PropTypes.func,
  canMutateOrder: PropTypes.bool,
  isEditMode: PropTypes.bool,
};

export default OrderHeader;
