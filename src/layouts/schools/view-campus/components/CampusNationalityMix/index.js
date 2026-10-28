import { useMemo } from "react";
import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import UltimateDoughnutChart from "./UltimateDoughnutChart";

function CampusNationalityMix({ nationalityMix = [], nationalities = [] }) {
  const chartData = useMemo(() => {
    const colors = [
      "info",
      "primary",
      "secondary",
      "success",
      "warning",
      "error",
      "dark",
      "light",
      "info",
      "primary",
    ];

    let data = [];
    let labels = [];

    if (nationalities && nationalities.length > 0) {
      data = nationalities.map((item) => item.percent || 0);
      labels = nationalities.map((item) => `${item.name} (${item.percent}%)`);
    } else if (nationalityMix && nationalityMix.length > 0) {
      const generateStableRandom = (seed) => {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
          const char = seed.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash;
        }
        return (Math.abs(hash) % 30) + 10;
      };
      data = nationalityMix.map((nationality) => generateStableRandom(nationality));
      labels = nationalityMix;
    }

    return {
      labels: labels,
      datasets: {
        label: "Participants from",
        backgroundColors: colors.slice(0, data.length),
        data: data,
      },
    };
  }, [nationalityMix, nationalities]);

  const totalStudents = chartData.datasets.data.reduce((sum, value) => sum + value, 0);

  return (
    <SoftBox mb={3}>
      <UltimateDoughnutChart
        icon="people"
        title="Participants"
        count={totalStudents}
        chart={chartData}
        color="info"
        showLabelsInside={true}
        showLegend={true}
        showHeader={false}
        cutout={60}
        borderWidth={3}
        size={250}
        animate={true}
      />
    </SoftBox>
  );
}

CampusNationalityMix.propTypes = {
  nationalityMix: PropTypes.arrayOf(PropTypes.string),
  nationalities: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      percent: PropTypes.number,
    })
  ),
};

export default CampusNationalityMix;
