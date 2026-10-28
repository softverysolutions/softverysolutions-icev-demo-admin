import PropTypes from "prop-types";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import CampusFirstDaysInstructions from "../CampusFirstDaysInstructions";

function CampusDescription({ description, campus }) {
  const stripHtmlTags = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "");
  };

  const createMarkup = (html) => {
    return { __html: html };
  };

  const displayHtml = true;

  return (
    <SoftBox mb={3}>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Description
      </SoftTypography>
      {displayHtml ? (
        <SoftTypography
          variant="body2"
          color="text"
          dangerouslySetInnerHTML={createMarkup(description)}
        />
      ) : (
        <SoftTypography variant="body2" color="text">
          {stripHtmlTags(description)}
        </SoftTypography>
      )}

      {campus && <CampusFirstDaysInstructions campus={campus} />}
    </SoftBox>
  );
}

CampusDescription.propTypes = {
  description: PropTypes.string.isRequired,
  campus: PropTypes.object,
};

export default CampusDescription;
