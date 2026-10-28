import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import Slider from "@mui/material/Slider";
import Box from "@mui/material/Box";

// Soft UI Dashboard PRO React components
import SoftInput from "components/SoftInput";
import SoftTypography from "components/SoftTypography";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";

// @mui icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";

function SoftTimePicker({ value, onChange, disabled, placeholder, ...rest }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState("AM");
  const anchorRef = useRef(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const getCurrentTime = () => {
    const now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();
    const period = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    minute = Math.round(minute / 5) * 5;
    if (minute === 60) {
      minute = 0;
      hour = (hour % 12) + 1;
      if (hour === 13) hour = 1;
    }

    return { hour, minute, period };
  };

  useEffect(() => {
    if (value) {
      const [time, period] = value.split(" ");
      if (time) {
        const [hour, minute] = time.split(":");
        setSelectedHour(Number.parseInt(hour) || 12);
        setSelectedMinute(Number.parseInt(minute) || 0);
        setSelectedPeriod(period || "AM");
      }
    } else {
      const currentTime = getCurrentTime();
      setSelectedHour(currentTime.hour);
      setSelectedMinute(currentTime.minute);
      setSelectedPeriod(currentTime.period);
    }
  }, [value]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen((prevOpen) => !prevOpen);
    }
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setIsOpen(false);
  };

  const handleTimeSelect = () => {
    const formattedTime = `${selectedHour.toString().padStart(2, "0")}:${selectedMinute
      .toString()
      .padStart(2, "0")} ${selectedPeriod}`;
    if (onChange) {
      onChange({ target: { value: formattedTime } });
    }
    setIsOpen(false);
  };

  const displayValue = value || placeholder || "--:--";

  return (
    <>
      <SoftInput
        {...rest}
        ref={anchorRef}
        value={displayValue}
        onClick={handleToggle}
        placeholder={placeholder}
        disabled={disabled}
        icon={{
          component: <AccessTimeIcon />,
          direction: "right",
        }}
        sx={{
          cursor: "pointer",
          "& input": {
            cursor: "pointer",
          },
          "& .MuiInputBase-root": {
            borderColor: isOpen ? "rgb(94, 114, 228)" : undefined,
            boxShadow: isOpen ? "0 0 0 0.2rem rgba(94, 114, 228, 0.25)" : undefined,
          },
        }}
      />

      <Popper
        open={isOpen}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        style={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={handleClose}>
          <Paper
            elevation={8}
            sx={{
              p: 4,
              width: 280,
              borderRadius: 4,
              background: "white",
              border: "1px solid rgba(0, 0, 0, 0.125)",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <SoftBox textAlign="center" mb={4}>
              <SoftTypography
                variant="h3"
                fontWeight="light"
                color="text"
                sx={{
                  fontSize: "2rem",
                  letterSpacing: "0.1em",
                  color: "rgba(0, 0, 0, 0.8)",
                }}
              >
                {selectedHour.toString().padStart(2, "0")}:
                {selectedMinute.toString().padStart(2, "0")}
              </SoftTypography>
            </SoftBox>

            <SoftBox display="flex" gap={2} mb={4}>
              <SoftBox flex={1}>
                <SoftTypography
                  variant="caption"
                  fontWeight="semibold"
                  color="text"
                  mb={2}
                  sx={{
                    fontSize: "0.75rem",
                    color: "rgba(0, 0, 0, 0.4)",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Hour
                </SoftTypography>
                <Box
                  sx={{
                    height: 128,
                    overflowY: "auto",
                    "&::-webkit-scrollbar": {
                      width: "4px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(0, 0, 0, 0.1)",
                      borderRadius: "2px",
                    },
                  }}
                >
                  <SoftBox sx={{ spaceY: 0.5 }}>
                    {hours.map((hour) => (
                      <SoftBox
                        key={hour}
                        onClick={() => setSelectedHour(hour)}
                        sx={{
                          px: 2,
                          py: 1.5,
                          cursor: "pointer",
                          textAlign: "center",
                          borderRadius: 3,
                          fontSize: "0.875rem",
                          fontWeight: "medium",
                          transition: "all 0.2s",
                          background:
                            selectedHour === hour
                              ? "linear-gradient(195deg, rgb(94, 114, 228), rgb(73, 163, 241))"
                              : "transparent",
                          color: selectedHour === hour ? "white" : "rgba(0, 0, 0, 0.7)",
                          boxShadow:
                            selectedHour === hour ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
                          "&:hover": {
                            background:
                              selectedHour === hour
                                ? "linear-gradient(195deg, rgb(94, 114, 228), rgb(73, 163, 241))"
                                : "rgba(0, 0, 0, 0.05)",
                          },
                        }}
                      >
                        {hour.toString().padStart(2, "0")}
                      </SoftBox>
                    ))}
                  </SoftBox>
                </Box>
              </SoftBox>

              <SoftBox flex={1}>
                <SoftTypography
                  variant="caption"
                  fontWeight="semibold"
                  color="text"
                  mb={2}
                  sx={{
                    fontSize: "0.75rem",
                    color: "rgba(0, 0, 0, 0.4)",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Minute
                </SoftTypography>
                <Box
                  sx={{
                    height: 128,
                    overflowY: "auto",
                    "&::-webkit-scrollbar": {
                      width: "4px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(0, 0, 0, 0.1)",
                      borderRadius: "2px",
                    },
                  }}
                >
                  <SoftBox sx={{ spaceY: 0.5 }}>
                    {minutes.map((minute) => (
                      <SoftBox
                        key={minute}
                        onClick={() => setSelectedMinute(minute)}
                        sx={{
                          px: 2,
                          py: 1.5,
                          cursor: "pointer",
                          textAlign: "center",
                          borderRadius: 3,
                          fontSize: "0.875rem",
                          fontWeight: "medium",
                          transition: "all 0.2s",
                          background:
                            selectedMinute === minute
                              ? "linear-gradient(195deg, rgb(94, 114, 228), rgb(73, 163, 241))"
                              : "transparent",
                          color: selectedMinute === minute ? "white" : "rgba(0, 0, 0, 0.7)",
                          boxShadow:
                            selectedMinute === minute
                              ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                              : "none",
                          "&:hover": {
                            background:
                              selectedMinute === minute
                                ? "linear-gradient(195deg, rgb(94, 114, 228), rgb(73, 163, 241))"
                                : "rgba(0, 0, 0, 0.05)",
                          },
                        }}
                      >
                        {minute.toString().padStart(2, "0")}
                      </SoftBox>
                    ))}
                  </SoftBox>
                </Box>
              </SoftBox>

              <SoftBox flex={1}>
                <SoftTypography
                  variant="caption"
                  fontWeight="semibold"
                  color="text"
                  mb={2}
                  sx={{
                    fontSize: "0.75rem",
                    color: "rgba(0, 0, 0, 0.4)",
                    textAlign: "center",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Period
                </SoftTypography>
                <SoftBox display="flex" flexDirection="column" gap={2}>
                  {["AM", "PM"].map((period) => (
                    <SoftBox
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      sx={{
                        px: 1.5,
                        py: 1.5,
                        cursor: "pointer",
                        textAlign: "center",
                        borderRadius: 3,
                        fontSize: "0.75rem",
                        fontWeight: "medium",
                        transition: "all 0.2s",
                        background:
                          selectedPeriod === period
                            ? "linear-gradient(195deg, rgb(94, 114, 228), rgb(73, 163, 241))"
                            : "transparent",
                        color: selectedPeriod === period ? "white" : "rgba(0, 0, 0, 0.7)",
                        boxShadow:
                          selectedPeriod === period ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
                        border:
                          selectedPeriod !== period ? "1px solid rgba(0, 0, 0, 0.125)" : "none",
                        "&:hover": {
                          background:
                            selectedPeriod === period
                              ? "linear-gradient(195deg, rgb(94, 114, 228), rgb(73, 163, 241))"
                              : "rgba(0, 0, 0, 0.05)",
                        },
                      }}
                    >
                      {period}
                    </SoftBox>
                  ))}
                </SoftBox>
              </SoftBox>
            </SoftBox>

            <SoftBox display="flex" gap={2}>
              <SoftButton
                variant="outlined"
                color="info"
                size="small"
                onClick={() => setIsOpen(false)}
                sx={{
                  flex: 1,
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: "0.875rem",
                  fontWeight: "medium",
                  textTransform: "none",
                }}
              >
                Cancel
              </SoftButton>
              <SoftButton
                variant="gradient"
                color="info"
                size="small"
                onClick={handleTimeSelect}
                sx={{
                  flex: 1,
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: "0.875rem",
                  fontWeight: "medium",
                  textTransform: "none",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              >
                Select
              </SoftButton>
            </SoftBox>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
}

SoftTimePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
};

export default SoftTimePicker;
