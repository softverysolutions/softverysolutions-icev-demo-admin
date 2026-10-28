import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftSelect from "components/SoftSelect";

import { PROMO_STATUS_FILTER_OPTIONS } from "../constants";

const selectAlignSx = {
  "& .react-select__control": {
    minHeight: 40,
  },
};

function PromoSearchToolbar({
  filter,
  onFilterChange,
  searchInput,
  onSearchInputChange,
  onSearchKeyDown,
  onSearchSubmit,
}) {
  const statusValue =
    PROMO_STATUS_FILTER_OPTIONS.find((o) => o.value === filter) || PROMO_STATUS_FILTER_OPTIONS[0];

  return (
    <SoftBox
      display="flex"
      flexDirection={{ xs: "column", md: "row" }}
      alignItems={{ xs: "stretch", md: "flex-end" }}
      flexWrap="wrap"
      gap={2}
      sx={{
        marginTop: "-30px",
        marginBottom: "46px",
        paddingLeft: "20px",
        paddingRight: "20px",
      }}
    >
      <SoftBox sx={{ width: { xs: "100%", md: "auto" }, minWidth: { md: 200 }, maxWidth: { md: 280 }, flexShrink: 0 }}>
        <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1} display="block">
          Status
        </SoftTypography>
        <SoftBox sx={selectAlignSx}>
          <SoftSelect
            value={statusValue}
            onChange={(selected) => onFilterChange(selected?.value ?? "all")}
            options={PROMO_STATUS_FILTER_OPTIONS}
            placeholder="Select status"
            isClearable={false}
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
          />
        </SoftBox>
      </SoftBox>

      <SoftBox flex={1} minWidth={{ xs: "100%", md: 200 }}>
        <SoftInput
          placeholder="Search codes..."
          value={searchInput}
          onChange={({ currentTarget }) => onSearchInputChange(currentTarget.value)}
          onKeyDown={onSearchKeyDown}
          icon={{
            component: <Icon>search</Icon>,
            direction: "left",
          }}
        />
      </SoftBox>

      <SoftBox sx={{ flexShrink: 0, alignSelf: { xs: "stretch", md: "flex-end" } }}>
        <SoftButton variant="gradient" color="info" onClick={onSearchSubmit} startIcon={<Icon>search</Icon>}>
          Search
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

PromoSearchToolbar.propTypes = {
  filter: PropTypes.string.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  searchInput: PropTypes.string.isRequired,
  onSearchInputChange: PropTypes.func.isRequired,
  onSearchKeyDown: PropTypes.func.isRequired,
  onSearchSubmit: PropTypes.func.isRequired,
};

export default PromoSearchToolbar;
