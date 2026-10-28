import PropTypes from "prop-types";
import Card from "@mui/material/Card";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import { TimelineProvider } from "examples/Timeline/context";
import TimelineItem from "examples/Timeline/TimelineItem";

const STEPS = [
  { status: "notPaid", icon: "payments", title: "Booked, awaiting payment" },
  { status: "registration", icon: "how_to_reg", title: "Registration" },
  { status: "readyForTheStart", icon: "flight_takeoff", title: "Ready to start" },
  { status: "inProgress", icon: "school", title: "In progress" },
  { status: "finished", icon: "emoji_events", title: "Finished" },
];

const normalizeStatus = (value) => String(value || "").replace(/[^a-z0-9]/gi, "").toLowerCase();

function TrackOrder({ order }) {
  const current = normalizeStatus(order?.status);
  const cancelled = current === "cancelled" || current === "canceled";
  const currentIndex = STEPS.findIndex((step) => normalizeStatus(step.status) === current);

  const timelineData = STEPS.map((step, index) => {
    let color = "secondary";
    if (!cancelled && index < currentIndex) color = "dark";
    if (!cancelled && index === currentIndex) color = "success";
    return { ...step, color };
  });
  if (cancelled) {
    timelineData.push({ status: "cancelled", icon: "block", title: "Cancelled", color: "error" });
  }

  return (
    <Card>
      <SoftBox p={3}>
        <TimelineProvider value={false}>
          <SoftTypography variant="h6" fontWeight="medium" mb={3}>
            Track order
          </SoftTypography>
          <SoftBox mt={2}>
            {timelineData.map((item, index) => (
              <TimelineItem
                key={index}
                color={item.color}
                icon={item.icon}
                title={item.title}
                lastItem={index === timelineData.length - 1}
              />
            ))}
          </SoftBox>
        </TimelineProvider>
      </SoftBox>
    </Card>
  );
}

TrackOrder.propTypes = {
  order: PropTypes.shape({
    status: PropTypes.string,
  }),
};

export default TrackOrder;
