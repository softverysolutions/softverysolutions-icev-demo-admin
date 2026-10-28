import React from "react";
import PropTypes from "prop-types";
import SoftBox from "../../../components/SoftBox";
import SoftTypography from "../../../components/SoftTypography";
import DefaultLineChart from "../../../examples/Charts/LineCharts/DefaultLineChart";

const RevenueChart = ({ data }) => {
  if (!data || !data.data) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" height={300}>
        <SoftTypography>No data available</SoftTypography>
      </SoftBox>
    );
  }

  const processData = (revenueData) => {
    if (revenueData.granularity === "day") {
      const dailyData = revenueData.data
        .map((item) => {
          const date = new Date(item.date);
          return {
            month: `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1)
              .toString()
              .padStart(2, "0")}`,
            courses: item.courses || 0,
            accommodation: item.accommodation || 0,
            services: item.services || 0,
          };
        })
        .sort((a, b) => {
          const [dayA, monthA] = a.month.split(".").map(Number);
          const [dayB, monthB] = b.month.split(".").map(Number);
          if (monthA !== monthB) return monthA - monthB;
          return dayA - dayB;
        });

      if (dailyData.length === 1) {
        const singleDay = dailyData[0];
        const [day, month] = singleDay.month.split(".").map(Number);
        const currentDate = new Date(new Date().getFullYear(), month - 1, day);
        const nextDate = new Date(currentDate);
        nextDate.setDate(currentDate.getDate() + 1);

        const nextDay = {
          month: `${nextDate.getDate().toString().padStart(2, "0")}.${(nextDate.getMonth() + 1)
            .toString()
            .padStart(2, "0")}`,
          courses: 0,
          accommodation: 0,
          services: 0,
        };

        dailyData.push(nextDay);
      }

      return dailyData;
    }

    if (revenueData.granularity === "month") {
      const monthlyData = revenueData.data.map((item) => {
        const date = new Date(item.date);
        return {
          month: date.toLocaleDateString("en-GB", { month: "short" }),
          courses: item.courses || 0,
          accommodation: item.accommodation || 0,
          services: item.services || 0,
        };
      });

      return monthlyData;
    }

    return [];
  };

  const chartData = processData(data);

  const chartConfig = {
    labels: chartData.map((item) => item.month),
    datasets: [
      {
        label: "Programmes",
        color: "info",
        data: chartData.map((item) => item.courses),
      },
      {
        label: "Accommodation",
        color: "dark",
        data: chartData.map((item) => item.accommodation),
      },
      {
        label: "Extras & experiences",
        color: "primary",
        data: chartData.map((item) => item.services),
      },
    ],
  };

  return (
    <DefaultLineChart
      chart={chartConfig}
    />
  );
};

RevenueChart.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string,
        courses: PropTypes.number,
        accommodation: PropTypes.number,
        services: PropTypes.number,
      })
    ),
  }),
};

export default RevenueChart;
