import { useMemo, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftBadgeDot from "components/SoftBadgeDot";
import colors from "assets/theme/base/colors";

const { gradients } = colors;

function UltimateDoughnutChart({
  color = "info",
  icon,
  title,
  count = 0,
  height = "300px",
  chart,
  showLabelsInside = true,
  showLegend = true,
  showHeader = true,
  cutout = 60,
  borderWidth = 3,
  size = 250,
  animate = true,
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [animationProgress, setAnimationProgress] = useState(animate ? 0 : 1);
  const hasAnimatedRef = useRef(false);

  const backgroundColors = useMemo(() => {
    if (chart.datasets?.backgroundColors) {
      return chart.datasets.backgroundColors.map((color, index) => {
        if (gradients[color]) {
          return index === 0 ? gradients[color].main : gradients[color].state;
        }
        return gradients.info.main;
      });
    }
    return [gradients.info.main];
  }, [chart.datasets?.backgroundColors]);

  const chartData = useMemo(() => {
    const data = chart.datasets?.data || [];
    const total = data.reduce((sum, value) => sum + value, 0);

    return data.map((value, index) => ({
      value,
      percentage: value / total,
      color: backgroundColors[index] || backgroundColors[0],
      label: chart.labels?.[index] || `Item ${index + 1}`,
    }));
  }, [chart, backgroundColors]);

  useEffect(() => {
    if (!animate || hasAnimatedRef.current) {
      return;
    }

    hasAnimatedRef.current = true;
    const duration = 1000;
    const startTime = Date.now();

    const animateChart = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3);

      setAnimationProgress(easedProgress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateChart);
      }
    };

    animationRef.current = requestAnimationFrame(animateChart);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    const innerRadius = radius * (cutout / 100);

    ctx.clearRect(0, 0, size, size);

    let currentAngle = -Math.PI / 2;

    chartData.forEach((slice, index) => {
      const sliceAngle = slice.percentage * 2 * Math.PI * animationProgress;
      const endAngle = currentAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, currentAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = "white";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, endAngle);
      ctx.strokeStyle = "white";
      ctx.lineWidth = borderWidth;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, currentAngle, endAngle);
      ctx.strokeStyle = "white";
      ctx.lineWidth = borderWidth;
      ctx.stroke();

      if (showLabelsInside && slice.percentage > 0.05 && animationProgress > 0.5) {
        const midAngle = currentAngle + sliceAngle / 2;
        const textRadius = (radius + innerRadius) / 2;
        const textX = centerX + Math.cos(midAngle) * textRadius;
        const textY = centerY + Math.sin(midAngle) * textRadius;

        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillText(slice.value.toString(), textX, textY - 8);

        ctx.font = "11px Arial";
        ctx.fillText(`${(slice.percentage * 100).toFixed(1)}%`, textX, textY + 8);

        ctx.restore();
      }

      currentAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.stroke();

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 1)");
    ctx.fillStyle = gradient;
    ctx.fill();
  }, [chartData, size, cutout, borderWidth, showLabelsInside, animationProgress]);

  const renderBadgeDots = chart.labels
    ? chart.labels.map((label, index) => {
        const badgeDotKey = `badge-dot-${index}`;
        const value = chart.datasets?.data?.[index] || 0;
        const total = chart.datasets?.data?.reduce((a, b) => a + b, 0) || 0;
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;

        return (
          <SoftBadgeDot
            key={badgeDotKey}
            variant="gradient"
            color={
              chart.datasets?.backgroundColors ? chart.datasets.backgroundColors[index] : "info"
            }
            size="md"
            badgeContent={`${label}: ${value} (${percentage}%)`}
            font={{ color: "text", weight: "medium", size: "h6" }}
            px={2}
          />
        );
      })
    : null;

  return (
    <Card>
      <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" pt={2} px={2}>
        {showHeader ? (
          <SoftBox width="45%">
            <SoftBox display="flex" alignItems="center">
              <SoftBox
                width="3rem"
                height="3rem"
                display="grid"
                justifyContent="center"
                alignItems="center"
                borderRadius="md"
                shadow="md"
                color="white"
                bgColor={color}
                variant="gradient"
              >
                <Icon fontSize="default">{icon}</Icon>
              </SoftBox>
              <SoftBox ml={2} lineHeight={1}>
                <SoftTypography
                  variant="h6"
                  fontWeight="medium"
                  textTransform="capitalize"
                  color="text"
                >
                  {title}
                </SoftTypography>
                {count ? (
                  <SoftTypography variant="h3" fontWeight="bold">
                    {count}
                  </SoftTypography>
                ) : null}
              </SoftBox>
            </SoftBox>
            {showLegend && (
              <SoftBox display="flex" flexDirection="column" mt={2}>
                {renderBadgeDots}
              </SoftBox>
            )}
          </SoftBox>
        ) : (
          <SoftBox width="45%">
            {showLegend && (
              <SoftBox display="flex" flexDirection="column">
                {renderBadgeDots}
              </SoftBox>
            )}
          </SoftBox>
        )}
        <SoftBox
          width={showHeader ? "55%" : "100%"}
          mb={2}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "8px",
            }}
          />
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

UltimateDoughnutChart.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  chart: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.array, PropTypes.object])).isRequired,
  showLabelsInside: PropTypes.bool,
  showLegend: PropTypes.bool,
  showHeader: PropTypes.bool,
  cutout: PropTypes.number,
  borderWidth: PropTypes.number,
  size: PropTypes.number,
  animate: PropTypes.bool,
};

export default UltimateDoughnutChart;
