import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { formatMoney } from "services/currencyService";

const STATUS = {
  success: { color: "success", icon: "check_circle", label: "Paid" },
  pending: { color: "warning", icon: "pending", label: "Pending" },
  failed: { color: "error", icon: "cancel", label: "Failed" },
  refunded: { color: "secondary", icon: "undo", label: "Refunded" },
};

const statusOf = (status) => STATUS[String(status || "").toLowerCase()] || STATUS.pending;

const METHOD = {
  card: { icon: "credit_card", label: "Card" },
  wallet: { icon: "account_balance_wallet", label: "Wallet" },
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

function PaymentStatus({ payments, order }) {
  const total = Number(order.totalAmount) || 0;
  const paid = payments
    .filter((p) => String(p.status).toLowerCase() === "success")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const refunded = payments
    .filter((p) => String(p.status).toLowerCase() === "refunded")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const outstanding = Math.max(0, total - paid - refunded);
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const currency = order.currency || "EUR";

  return (
    <Card sx={{ height: "100%" }}>
      <SoftBox p={3}>
        <SoftTypography variant="h6" fontWeight="medium" mb={2}>
          Payment Status
        </SoftTypography>

        <SoftBox display="flex" justifyContent="space-between" mb={1}>
          <SoftTypography variant="body2" color="text" fontWeight="medium">
            Paid {formatMoney(paid, currency)} of {formatMoney(total, currency)}
          </SoftTypography>
          <SoftTypography variant="body2" color="text" fontWeight="bold">
            {progress}%
          </SoftTypography>
        </SoftBox>
        <SoftBox
          mb={1}
          sx={{ width: "100%", height: 8, backgroundColor: "#ECEAF4", borderRadius: 4, overflow: "hidden" }}
        >
          <SoftBox
            sx={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#12B886",
              transition: "width 0.3s ease",
            }}
          />
        </SoftBox>
        <SoftTypography variant="caption" color="text" display="block" mb={3}>
          {refunded > 0
            ? `Refunded ${formatMoney(refunded, currency)}`
            : paid > total
            ? `Overpaid by ${formatMoney(paid - total, currency)} after an edit: refund the difference`
            : outstanding > 0
            ? `Outstanding ${formatMoney(outstanding, currency)}`
            : "Paid in full"}
        </SoftTypography>

        <SoftTypography variant="body2" color="text" fontWeight="medium" mb={2}>
          Payment History
        </SoftTypography>
        <SoftBox display="flex" flexDirection="column" gap={1.5}>
          {payments.length > 0 ? (
            payments.map((payment) => {
              const status = statusOf(payment.status);
              const method = METHOD[payment.method] || METHOD.card;
              return (
                <SoftBox
                  key={payment.id}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    padding: "12px",
                    backgroundColor: "#F7F6FB",
                    borderRadius: "8px",
                    border: "1px solid #ECEAF4",
                  }}
                >
                  <SoftBox display="flex" alignItems="center" gap={1.5}>
                    <Icon sx={{ color: "#6D4AFF" }}>{method.icon}</Icon>
                    <SoftBox>
                      <SoftTypography variant="button" fontWeight="medium" display="block">
                        {payment.description || method.label}
                      </SoftTypography>
                      <SoftBox display="flex" alignItems="center" gap={0.5}>
                        <Icon color={status.color} sx={{ fontSize: "14px !important" }}>
                          {status.icon}
                        </Icon>
                        <SoftTypography variant="caption" color={status.color} fontWeight="bold">
                          {status.label}
                        </SoftTypography>
                        <SoftTypography variant="caption" color="text">
                          · {formatDate(payment.paidAt || payment.createdAt)}
                        </SoftTypography>
                      </SoftBox>
                    </SoftBox>
                  </SoftBox>
                  <SoftTypography variant="body2" fontWeight="bold">
                    {formatMoney(payment.amount, payment.currency || currency)}
                  </SoftTypography>
                </SoftBox>
              );
            })
          ) : (
            <SoftBox
              sx={{
                padding: "24px",
                backgroundColor: "#F7F6FB",
                borderRadius: "8px",
                border: "1px dashed #dee2e6",
                textAlign: "center",
              }}
            >
              <SoftTypography variant="body2" color="text">
                No payments yet
              </SoftTypography>
            </SoftBox>
          )}
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

PaymentStatus.propTypes = {
  payments: PropTypes.array.isRequired,
  order: PropTypes.object.isRequired,
};

export default PaymentStatus;
