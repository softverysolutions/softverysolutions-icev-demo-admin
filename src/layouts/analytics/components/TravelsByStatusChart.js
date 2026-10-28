import React from "react";
import PropTypes from "prop-types";
import SoftBox from "../../../components/SoftBox";
import SoftTypography from "../../../components/SoftTypography";
import DefaultLineChart from "../../../examples/Charts/LineCharts/DefaultLineChart";

const SERIES = [
  { key: "registration", label: "Registration", color: "info" },
  { key: "readyForTheStart", label: "Ready to start", color: "primary" },
  { key: "inProgress", label: "In progress", color: "success" },
  { key: "finished", label: "Finished", color: "dark" },
];

const pad = (n) => String(n).padStart(2, "0");

const TravelsByStatusChart = ({ data }) => {
  if (!data || !data.data) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" height={300}>
        <SoftTypography>No data available</SoftTypography>
      </SoftBox>
    );
  }

  const buckets = new Map();
  data.data.forEach((item) => {
    const date = new Date(item.date);
    if (Number.isNaN(date.getTime())) return;
    const key =
      data.granularity === "day"
        ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
        : `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
    const label =
      data.granularity === "day"
        ? `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`
        : date.toLocaleDateString("en-GB", { month: "short" });
    if (!buckets.has(key)) buckets.set(key, { label, values: {} });
    const bucket = buckets.get(key);
    SERIES.forEach(({ key: status }) => {
      bucket.values[status] = (bucket.values[status] || 0) + (item.statuses?.[status] || 0);
    });
  });

  const rows = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);

  const chartConfig = {
    labels: rows.map((row) => row.label),
    datasets: SERIES.map(({ key, label, color }) => ({
      label,
      color,
      data: rows.map((row) => row.values[key] || 0),
    })),
  };

  return <DefaultLineChart chart={chartConfig} />;
};

TravelsByStatusChart.propTypes = {
  data: PropTypes.shape({
    granularity: PropTypes.string,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string,
        statuses: PropTypes.objectOf(PropTypes.number),
      })
    ),
  }),
};

export default TravelsByStatusChart;
