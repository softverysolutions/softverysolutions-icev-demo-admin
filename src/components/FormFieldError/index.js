import PropTypes from "prop-types";
import SoftTypography from "components/SoftTypography";

function FormFieldError({ error, sx = {} }) {
  if (!error) return null;

  return (
    <SoftTypography
      variant="caption"
      color="error"
      sx={{
        display: "block",
        mt: 0.5,
        fontSize: "0.75rem",
        ...sx,
      }}
    >
      {error}
    </SoftTypography>
  );
}

FormFieldError.propTypes = {
  error: PropTypes.string,
  sx: PropTypes.object,
};

export default FormFieldError;
