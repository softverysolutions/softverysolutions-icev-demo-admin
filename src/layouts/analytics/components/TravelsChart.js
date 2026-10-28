import React from "react";
import PropTypes from "prop-types";
import SoftBox from "../../../components/SoftBox";
import SoftTypography from "../../../components/SoftTypography";
import VerticalBarChart from "../../../examples/Charts/BarCharts/VerticalBarChart";

const TravelsChart = ({ data }) => {
  if (!data || !data.data) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" height={300}>
        <SoftTypography>No data available</SoftTypography>
      </SoftBox>
    );
  }

  const processData = (travelData) => {
    const dailyData = travelData.data.map((item) => {
      const totalTravels = Object.values(item.statuses || {}).reduce((sum, val) => sum + val, 0);
      return {
        date: item.date,
        count: totalTravels,
      };
    });

    if (dailyData.length === 1 && dailyData[0].date === "total") {
      return [
        {
          range: "Total",
          count: dailyData[0].count,
        },
      ];
    }

    if (travelData.granularity === "month") {
      return dailyData.map((item) => ({
        range: new Date(item.date).toLocaleDateString("en-GB", { month: "short" }),
        count: item.count,
      }));
    }

    if (travelData.granularity === "day") {
      const result = dailyData.map((item) => ({
        range: `${item.date.substring(8, 10)}.${item.date.substring(5, 7)}`,
        count: item.count,
      }));
      return result;
    }

    const weeklyData = {};
    dailyData.forEach((item) => {
      const date = new Date(item.date);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      const weekKey = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(startOfWeek.getDate()).padStart(2, "0")}`;

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { count: 0, dates: [] };
      }
      weeklyData[weekKey].count += item.count;
      weeklyData[weekKey].dates.push(item.date);
    });

    const weeklyArray = Object.keys(weeklyData)
      .map((key) => {
        const datesInWeek = weeklyData[key].dates.sort();
        const startDate = datesInWeek[0];
        const endDate = datesInWeek[datesInWeek.length - 1];
        return {
          range: `${startDate.substring(8, 10)}.${startDate.substring(5, 7)} - ${endDate.substring(
            8,
            10
          )}.${endDate.substring(5, 7)}`,
          count: weeklyData[key].count,
          sortKey: startDate,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    return weeklyArray.map(({ range, count }) => ({ range, count }));
  };

  const chartData = processData(data);

  if (chartData.length === 0) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" height={300}>
        <SoftTypography>No orders in this period</SoftTypography>
      </SoftBox>
    );
  }

  const chartConfig = {
    labels: chartData.map((item) => item.range),
    datasets: [
      {
        label: "Orders",
        color: "dark",
        data: chartData.map((item) => item.count),
      },
    ],
  };

  return <VerticalBarChart chart={chartConfig} />;
};

TravelsChart.propTypes = {
  data: PropTypes.shape({
    data: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string,
        statuses: PropTypes.shape({
          notPaid: PropTypes.number,
          paymentPending: PropTypes.number,
          registration: PropTypes.number,
          readyForTheStart: PropTypes.number,
        }),
      })
    ),
  }),
};

export default TravelsChart;
