import PropTypes from "prop-types";
import ErrorIcon from "@mui/icons-material/Error";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import FormFieldError from "components/FormFieldError";
import HighSeasonFeesList from "../HighSeasonFeesList";
import PricingRulesTable from "../PricingRulesTable";
import SavedPriceListsTable from "./SavedPriceListsTable";
import PriceListSettingsDates from "./PriceListSettingsDates";
import DeletePriceListDialog from "./DeletePriceListDialog";
import { usePriceSectionState } from "./usePriceSectionState";

function PriceSection({
  formData,
  onInputChange,
  disabled = false,
  errors = {},
  clearFieldErrorOnChange,
  initialPriceLists = [],
  initialCourseFees = [],
  seedFromInitialPriceList = false,
  currentPriceList: externalCurrentPriceList,
  setCurrentPriceList: externalSetCurrentPriceList,
  onSavePriceList,
  onUpdatePriceList,
  onPriceListSaved,
  onDeletePriceList,
  onEditPriceList,
  showBottomMargin = false,
  courseId = null,
  onSaveCourseFees,
  onUpdateCourseFees,
  onDeleteCourseFees,
  onHighSeasonFeesChange,
  onCourseFeesSynced,
  syncFeesOnSavePriceList = true,
  hideActionButtons = false,
  onRegisterSaveHandler,
  onRegisterCancelHandler,
}) {
  const currency = formData?.currency || "EUR";

  const {
    priceLists,
    pricingRules,
    fullPaymentDiscount,
    currentPriceList,
    setCurrentPriceList,
    highSeasonFees,
    showDeleteConfirmDialog,
    setShowDeleteConfirmDialog,
    priceListToDelete,
    handlePricingRulesChange,
    handleSavePriceList,
    handleCancelPriceList,
    handleEditPriceList,
    handleDeletePriceList,
    confirmDeletePriceList,
    handleRemoveFeeRow,
    updateHighSeasonFees,
    addHighSeasonFeeRowHandler,
    isSaveButtonEnabled,
  } = usePriceSectionState({
    initialPriceLists,
    initialCourseFees,
    seedFromInitialPriceList,
    externalCurrentPriceList,
    externalSetCurrentPriceList,
    hideActionButtons,
    courseId,
    onSavePriceList,
    onUpdatePriceList,
    onDeletePriceList,
    onEditPriceList,
    onPriceListSaved,
    onSaveCourseFees,
    onUpdateCourseFees,
    onDeleteCourseFees,
    onCourseFeesSynced,
    onHighSeasonFeesChange,
    syncFeesOnSavePriceList,
    onRegisterSaveHandler,
    onRegisterCancelHandler,
    clearFieldErrorOnChange,
  });

  return (
    <SoftBox mb={showBottomMargin ? 5.5 : 0}>
      <SoftBox display="flex" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          PRICE *
        </SoftTypography>
        {errors.pricingRules && (
          <>
            <ErrorIcon color="error" sx={{ ml: 1, fontSize: 20 }} />
            <FormFieldError error="At least one pricing rule is required" sx={{ ml: 1, mb: 0 }} />
          </>
        )}
      </SoftBox>

      <PriceListSettingsDates
        currentPriceList={currentPriceList}
        setCurrentPriceList={setCurrentPriceList}
        disabled={disabled}
      />

      <SoftBox mb={3}>
        <PricingRulesTable
          pricingRules={pricingRules}
          onRulesChange={handlePricingRulesChange}
          disabled={disabled}
          currency={currency}
        />
      </SoftBox>

      {!hideActionButtons && (
        <SoftBox display="flex" gap={2} justifyContent="flex-end" mt={3}>
          <SoftButton color="light" onClick={handleCancelPriceList} disabled={disabled}>
            Cancel
          </SoftButton>
          <SoftButton
            variant="gradient"
            color="info"
            onClick={handleSavePriceList}
            disabled={disabled || !isSaveButtonEnabled()}
          >
            Save Price List
          </SoftButton>
        </SoftBox>
      )}

      <HighSeasonFeesList
        highSeasonFees={highSeasonFees}
        currency={currency}
        onUpdateRow={updateHighSeasonFees}
        onRemoveRow={handleRemoveFeeRow}
        onAddRow={addHighSeasonFeeRowHandler}
        disabled={disabled}
      />

      <SavedPriceListsTable
        priceLists={priceLists}
        currency={currency}
        onEditPriceList={handleEditPriceList}
        onConfirmDelete={confirmDeletePriceList}
        disabled={disabled}
      />

      <DeletePriceListDialog
        open={showDeleteConfirmDialog}
        onClose={() => setShowDeleteConfirmDialog(false)}
        onConfirm={handleDeletePriceList}
        priceListId={priceListToDelete}
      />
    </SoftBox>
  );
}

PriceSection.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  clearFieldErrorOnChange: PropTypes.func,
  initialPriceLists: PropTypes.array,
  initialCourseFees: PropTypes.array,
  seedFromInitialPriceList: PropTypes.bool,
  currentPriceList: PropTypes.object,
  setCurrentPriceList: PropTypes.func,
  onSavePriceList: PropTypes.func,
  onUpdatePriceList: PropTypes.func,
  onPriceListSaved: PropTypes.func,
  onDeletePriceList: PropTypes.func,
  onEditPriceList: PropTypes.func,
  showBottomMargin: PropTypes.bool,
  courseId: PropTypes.string,
  onSaveCourseFees: PropTypes.func,
  onUpdateCourseFees: PropTypes.func,
  onDeleteCourseFees: PropTypes.func,
  onHighSeasonFeesChange: PropTypes.func,
  onCourseFeesSynced: PropTypes.func,
  syncFeesOnSavePriceList: PropTypes.bool,
  hideActionButtons: PropTypes.bool,
  onRegisterSaveHandler: PropTypes.func,
  onRegisterCancelHandler: PropTypes.func,
};

export default PriceSection;
