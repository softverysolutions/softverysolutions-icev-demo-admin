import PropTypes from "prop-types";
import Tooltip from "@mui/material/Tooltip";
import SoftTypography from "components/SoftTypography";

function TruncatedText({ text, maxLength = 20, variant = "body2", ...props }) {
  if (!text) return null;

  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate ? `${text.substring(0, maxLength)}...` : text;

  if (shouldTruncate) {
    return (
      <Tooltip
        title={text}
        placement="bottom"
        componentsProps={{
          tooltip: {
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "#fff",
              fontSize: "12px",
              maxWidth: "300px",
              padding: "8px 12px",
              borderRadius: "4px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
              backdropFilter: "blur(4px)",
            },
          },
        }}
      >
        <SoftTypography variant={variant} {...props}>
          {displayText}
        </SoftTypography>
      </Tooltip>
    );
  }

  return (
    <SoftTypography variant={variant} {...props}>
      {displayText}
    </SoftTypography>
  );
}

TruncatedText.propTypes = {
  text: PropTypes.string,
  maxLength: PropTypes.number,
  variant: PropTypes.string,
};

export default TruncatedText;
