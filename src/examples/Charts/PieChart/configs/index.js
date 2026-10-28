/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

/* eslint-disable no-dupe-keys */
// Soft UI Dashboard PRO React base styles
import colors from "assets/theme/base/colors";

const { gradients, dark } = colors;

function configs(labels, datasets) {
  const backgroundColors = [];

  if (datasets.backgroundColors) {
    datasets.backgroundColors.forEach((color) =>
      gradients[color]
        ? backgroundColors.push(gradients[color].state)
        : backgroundColors.push(dark.main)
    );
  } else {
    backgroundColors.push(dark.main);
  }

  return {
    data: {
      labels,
      datasets: [
        {
          label: datasets.label,
          weight: 9,
          cutout: 0,
          tension: 0.9,
          pointRadius: 2,
          borderWidth: 2,
          backgroundColor: backgroundColors,
          fill: false,
          data: datasets.data,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          filter: function(tooltipItem) {
            let value = 0;
            if (tooltipItem.dataIndex !== undefined && tooltipItem.dataset && tooltipItem.dataset.data) {
              value = tooltipItem.dataset.data[tooltipItem.dataIndex];
            } else if (tooltipItem.raw !== undefined && tooltipItem.raw !== null) {
              value = tooltipItem.raw;
            } else if (tooltipItem.parsed !== undefined && tooltipItem.parsed !== null) {
              value = typeof tooltipItem.parsed === 'number' ? tooltipItem.parsed : 0;
            }
            return value > 0;
          },
          callbacks: {
            label: function(context) {
      
              const label = context.label || '';
              const value = context.parsed || context.raw || 0;
              return `${label}: ${value}`;
            },
          },
        },
      },
      interaction: {
        intersect: true,
        mode: "point",
      },
      scales: {
        y: {
          grid: {
            drawBorder: false,
            display: false,
            drawOnChartArea: false,
            drawTicks: false,
          },
          ticks: {
            display: false,
          },
        },
        x: {
          grid: {
            drawBorder: false,
            display: false,
            drawOnChartArea: false,
            drawTicks: false,
          },
          ticks: {
            display: false,
          },
        },
      },
    },
  };
}

export default configs;
