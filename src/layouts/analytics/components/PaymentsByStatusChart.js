import React from "react";
import PropTypes from "prop-types";
import SoftBox from "../../../components/SoftBox";
import SoftTypography from "../../../components/SoftTypography";
import PieChart from "../../../examples/Charts/PieChart";

const PaymentsByStatusChart = ({ data }) => {
  if (!data || !data.byStatus) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" height={300}>
        <SoftTypography>No data available</SoftTypography>
      </SoftBox>
    );
  }

  const total =
    (data.byStatus.success || 0) + (data.byStatus.failed || 0) + (data.byStatus.refunded || 0);

  if (total === 0) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" height={300}>
        <SoftTypography>No payment data available</SoftTypography>
      </SoftBox>
    );
  }

  const chartConfig = {
    labels: ["Paid", "Failed", "Refunded"],
    datasets: {
      label: "Payments",
      data: [data.byStatus.success || 0, data.byStatus.failed || 0, data.byStatus.refunded || 0],
      backgroundColors: ["success", "error", "secondary"],
    },
  };

  return (
    <PieChart
      chart={chartConfig}
    />
  );
};

PaymentsByStatusChart.propTypes = {
  data: PropTypes.shape({
    byStatus: PropTypes.shape({
      success: PropTypes.number,
      failed: PropTypes.number,
      refunded: PropTypes.number,
    }),
  }),
};

export default PaymentsByStatusChart;
