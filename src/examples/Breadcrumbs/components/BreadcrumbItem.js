import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import SoftTypography from "components/SoftTypography";

const BreadcrumbItem = ({ item, light }) => {
  if (item.isClickable) {
    return (
      <Link to={item.url}>
        <SoftTypography
          component="span"
          variant="button"
          fontWeight="regular"
          textTransform="capitalize"
          color={light ? "white" : "dark"}
          opacity={light ? 0.8 : 0.5}
          sx={{
            lineHeight: 0,
            whiteSpace: "nowrap",
            overflow: "visible",
            maxWidth: "200px",
            px: 0.5,
          }}
        >
          {item.displayName}
        </SoftTypography>
      </Link>
    );
  } else {
    return (
      <SoftTypography
        component="span"
        variant="button"
        fontWeight="regular"
        textTransform="capitalize"
        color={light ? "white" : "dark"}
        sx={{
          lineHeight: 0,
          whiteSpace: "nowrap",
          overflow: "visible",
          maxWidth: "250px",
          px: 0.5,
        }}
      >
        {item.displayName}
      </SoftTypography>
    );
  }
};

BreadcrumbItem.propTypes = {
  item: PropTypes.shape({
    key: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired,
    url: PropTypes.string,
    isClickable: PropTypes.bool.isRequired,
  }).isRequired,
  light: PropTypes.bool,
};

export default BreadcrumbItem;
