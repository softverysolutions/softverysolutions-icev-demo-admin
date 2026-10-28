import PropTypes from "prop-types";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

const stripHtml = (html) => {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

function SchoolDescription({ description }) {
  const cleanDescription = stripHtml(description);

  return (
    <SoftBox mb={3}>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Description
      </SoftTypography>
      <SoftTypography variant="body2" color="text">
        {cleanDescription}
      </SoftTypography>
    </SoftBox>
  );
}

SchoolDescription.propTypes = {
  description: PropTypes.string.isRequired,
};

export default SchoolDescription;
