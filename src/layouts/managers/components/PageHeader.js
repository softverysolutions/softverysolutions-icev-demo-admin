import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

function PageHeader({ onAddUser, addButtonDisabled, showAddUser = true }) {
  return (
    <SoftBox
      display="flex"
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      flexDirection={{ xs: "column", sm: "row" }}
      gap={2}
      mb={3}
    >
      <SoftBox>
        <SoftTypography variant="h4" fontWeight="bold" gutterBottom>
          Team and roles
        </SoftTypography>
        <SoftTypography variant="body2" color="text.secondary">
          Operators who run the demo: Super admins manage the team, Admins run the catalogue and sales, Consultants get a read-only view.
        </SoftTypography>
      </SoftBox>
      {showAddUser && (
        <SoftButton
          variant="gradient"
          color="info"
          onClick={onAddUser}
          disabled={addButtonDisabled}
          startIcon={<Icon>add</Icon>}
        >
          Add User
        </SoftButton>
      )}
    </SoftBox>
  );
}

PageHeader.propTypes = {
  onAddUser: PropTypes.func.isRequired,
  addButtonDisabled: PropTypes.bool,
  showAddUser: PropTypes.bool,
};

export default PageHeader;
