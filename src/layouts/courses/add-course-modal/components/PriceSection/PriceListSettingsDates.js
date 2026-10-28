import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftDatePicker from "components/SoftDatePicker";

function PriceListSettingsDates({ currentPriceList, setCurrentPriceList, disabled }) {
  return (
    <SoftBox mb={3}>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Price List Settings
      </SoftTypography>
      <SoftBox display="flex" gap={2} alignItems="center" mb={2}>
        <SoftBox flex={1}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Price List Start Date *
          </SoftTypography>
          <SoftDatePicker
            value={currentPriceList.startDate}
            onChange={(date) => setCurrentPriceList({ ...currentPriceList, startDate: date })}
            disabled={disabled}
          />
        </SoftBox>
        <SoftBox flex={1}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Price List End Date *
          </SoftTypography>
          <SoftDatePicker
            value={currentPriceList.endDate}
            onChange={(date) => setCurrentPriceList({ ...currentPriceList, endDate: date })}
            disabled={disabled}
          />
        </SoftBox>
      </SoftBox>
    </SoftBox>
  );
}

PriceListSettingsDates.propTypes = {
  currentPriceList: PropTypes.shape({
    startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }).isRequired,
  setCurrentPriceList: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default PriceListSettingsDates;
