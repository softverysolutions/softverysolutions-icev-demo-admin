import React from "react";
import PropTypes from "prop-types";
import SoftBox from "../../../components/SoftBox";
import SoftTypography from "../../../components/SoftTypography";
import PieChart from "../../../examples/Charts/PieChart";

const PaymentsByMethodChart = ({ data }) => {
  if (!data || !data.byMethod) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" height={300}>
        <SoftTypography>No data available</SoftTypography>
      </SoftBox>
    );
  }

  const total = (data.byMethod.card || 0) + (data.byMethod.wallet || 0);

  if (total === 0) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" height={300}>
        <SoftTypography>No payment method data available</SoftTypography>
      </SoftBox>
    );
  }

  const chartConfig = {
    labels: ["Card", "Wallet (Apple Pay / Google Pay)"],
    datasets: {
      label: "Payments",
      data: [data.byMethod.card || 0, data.byMethod.wallet || 0],
      backgroundColors: ["info", "success"],
    },
  };

  return (
    <PieChart
      chart={chartConfig}
    />
  );
};

PaymentsByMethodChart.propTypes = {
  data: PropTypes.shape({
    byMethod: PropTypes.shape({
      card: PropTypes.number,
      wallet: PropTypes.number,
    }),
  }),
};

export default PaymentsByMethodChart;
