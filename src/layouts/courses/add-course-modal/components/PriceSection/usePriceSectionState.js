import { useState, useEffect, useRef, useCallback } from "react";
import {
  updateHighSeasonFeeRow,
  addHighSeasonFeeRow,
  removeHighSeasonFeeRow,
} from "../../utils/formUtils";
import { formatFeeRowForApi, apiToRulesFormat } from "./utils";
import { validatePricingRules } from "../PricingRulesTable";
import { executeSavePriceList } from "./savePriceListLogic";
import { parseUtcDateForPicker } from "utils/dateUtils";

// New price lists default to a one-year window starting today.
const defaultPriceListWindow = () => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);
  return { startDate, endDate };
};

export function usePriceSectionState({
  initialPriceLists = [],
  initialCourseFees = [],
  seedFromInitialPriceList = false,
  externalCurrentPriceList,
  externalSetCurrentPriceList,
  hideActionButtons = false,
  courseId = null,
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
  syncFeesOnSavePriceList = true,
  onRegisterSaveHandler,
  onRegisterCancelHandler,
  clearFieldErrorOnChange,
}) {
  const [priceLists, setPriceLists] = useState([]);
  const [editingPriceListId, setEditingPriceListId] = useState(null);
  const [pricingRules, setPricingRules] = useState([]);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [priceListToDelete, setPriceListToDelete] = useState(null);
  const [fullPaymentDiscount, setFullPaymentDiscount] = useState(null);
  const [internalCurrentPriceList, setInternalCurrentPriceList] = useState(defaultPriceListWindow);
  const [highSeasonFees, setHighSeasonFees] = useState([]);
  const [isHighSeasonFeesInitialized, setIsHighSeasonFeesInitialized] = useState(false);
  const [initialHighSeasonFees, setInitialHighSeasonFees] = useState([]);

  const prevInitialCourseFeesRef = useRef(initialCourseFees);
  const prevCourseIdRef = useRef(courseId);
  const isInitialLoadRef = useRef(true);
  const prevHighSeasonFeesRef = useRef([]);
  const saveHandlerRef = useRef(null);
  const cancelHandlerRef = useRef(null);
  const seededFromInitialRef = useRef(false);

  const currentPriceList = externalCurrentPriceList || internalCurrentPriceList;
  const setCurrentPriceList = externalSetCurrentPriceList || setInternalCurrentPriceList;

  useEffect(() => {
    if (Array.isArray(initialPriceLists)) setPriceLists(initialPriceLists);
  }, [initialPriceLists]);

  useEffect(() => {
    if (!seedFromInitialPriceList) return;
    if (!Array.isArray(initialPriceLists) || initialPriceLists.length === 0) return;
    if (seededFromInitialRef.current || editingPriceListId) return;

    const firstPriceList = initialPriceLists[0];
    if (!firstPriceList?.startDate || !firstPriceList?.endDate) return;

    seededFromInitialRef.current = true;
    const rules = apiToRulesFormat(firstPriceList);
    setPricingRules(rules.length > 0 ? rules : []);
    setCurrentPriceList({
      startDate: parseUtcDateForPicker(firstPriceList.startDate),
      endDate: parseUtcDateForPicker(firstPriceList.endDate),
    });
    if (firstPriceList.id) {
      setEditingPriceListId(firstPriceList.id);
    }
    if (firstPriceList.fullPaymentDiscount?.status) {
      const discount = firstPriceList.fullPaymentDiscount;
      const defaultVal = discount.type === "fixed" ? "0" : "5";
      setFullPaymentDiscount({
        status: discount.status,
        applyToBasePrice: discount.applyToBasePrice !== false,
        type: discount.type || "percent",
        value:
          discount.value !== undefined && discount.value !== null && discount.value !== ""
            ? String(discount.value)
            : defaultVal,
      });
    }
  }, [
    seedFromInitialPriceList,
    initialPriceLists,
    courseId,
    currentPriceList.startDate,
    editingPriceListId,
    setCurrentPriceList,
  ]);

  useEffect(() => {
    if (prevCourseIdRef.current !== courseId) {
      prevCourseIdRef.current = courseId;
      setIsHighSeasonFeesInitialized(false);
      setHighSeasonFees([]);
      prevInitialCourseFeesRef.current = [];
      setPricingRules([]);
      setEditingPriceListId(null);
      setFullPaymentDiscount(null);
      setCurrentPriceList(defaultPriceListWindow());
    }
  }, [courseId, setCurrentPriceList]);

  useEffect(() => {
    if (!Array.isArray(initialCourseFees)) return;
    const feesChanged =
      JSON.stringify(prevInitialCourseFeesRef.current) !== JSON.stringify(initialCourseFees);
    if (feesChanged || !isHighSeasonFeesInitialized) {
      prevInitialCourseFeesRef.current = initialCourseFees;
      const feesToSet = initialCourseFees.length > 0 ? initialCourseFees : [];
      setHighSeasonFees(feesToSet);
      setInitialHighSeasonFees(feesToSet);
      setIsHighSeasonFeesInitialized(true);
    }
  }, [initialCourseFees, isHighSeasonFeesInitialized, courseId]);

  useEffect(() => {
    if (prevCourseIdRef.current !== courseId) setInitialHighSeasonFees([]);
  }, [courseId]);

  useEffect(() => {
    if (isHighSeasonFeesInitialized && isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      prevHighSeasonFeesRef.current = highSeasonFees;
      return;
    }
    const feesChanged =
      JSON.stringify(prevHighSeasonFeesRef.current) !== JSON.stringify(highSeasonFees);
    if (feesChanged && typeof onHighSeasonFeesChange === "function") {
      prevHighSeasonFeesRef.current = highSeasonFees;
      onHighSeasonFeesChange(highSeasonFees);
    }
  }, [highSeasonFees, onHighSeasonFeesChange, isHighSeasonFeesInitialized]);

  useEffect(() => {
    isInitialLoadRef.current = true;
    prevHighSeasonFeesRef.current = [];
  }, [courseId]);

  useEffect(() => {
    if (typeof onRegisterSaveHandler === "function") {
      onRegisterSaveHandler(() => {
        if (typeof saveHandlerRef.current === "function") return saveHandlerRef.current();
      });
    }
  }, [onRegisterSaveHandler]);

  useEffect(() => {
    if (typeof onRegisterCancelHandler === "function") {
      onRegisterCancelHandler(() => {
        if (typeof cancelHandlerRef.current === "function") cancelHandlerRef.current();
      });
    }
  }, [onRegisterCancelHandler]);

  const handlePricingRulesChange = useCallback(
    (newRules) => {
      setPricingRules(newRules);
      clearFieldErrorOnChange?.("pricingRules");
    },
    [clearFieldErrorOnChange]
  );

  const handleSavePriceList = useCallback(async () => {
    try {
      await executeSavePriceList({
        priceLists,
        editingPriceListId,
        currentPriceList,
        pricingRules,
        fullPaymentDiscount,
        highSeasonFees,
        hideActionButtons,
        courseId,
        syncFeesOnSavePriceList,
        onSavePriceList,
        onUpdatePriceList,
        onDeletePriceList,
        onPriceListSaved,
        onSaveCourseFees,
        onUpdateCourseFees,
        initialHighSeasonFees,
      });
      if (!hideActionButtons) {
        setCurrentPriceList(defaultPriceListWindow());
        setEditingPriceListId(null);
        setPricingRules([]);
        setFullPaymentDiscount(null);
        setIsHighSeasonFeesInitialized(false);
      }
    } catch (e) {
      if (e.message === "Validation failed" || e.message === "Invalid fees") {
        throw e;
      }
      console.error("Failed to save price list via API", e);
      alert(`Failed to save price list: ${e.message}`);
    }
  }, [
    priceLists,
    editingPriceListId,
    currentPriceList,
    pricingRules,
    fullPaymentDiscount,
    highSeasonFees,
    hideActionButtons,
    courseId,
    syncFeesOnSavePriceList,
    onSavePriceList,
    onUpdatePriceList,
    onDeletePriceList,
    onPriceListSaved,
    onSaveCourseFees,
    onUpdateCourseFees,
    initialHighSeasonFees,
    setCurrentPriceList,
  ]);

  const handleCancelPriceList = useCallback(() => {
    setCurrentPriceList(defaultPriceListWindow());
    setEditingPriceListId(null);
    setPricingRules([]);
    setFullPaymentDiscount(null);
    if (Array.isArray(initialCourseFees)) {
      setHighSeasonFees(initialCourseFees.length > 0 ? initialCourseFees : []);
      setIsHighSeasonFeesInitialized(false);
    }
  }, [initialCourseFees, setCurrentPriceList]);

  const handleEditPriceList = useCallback(
    (priceListToEdit) => {
      const rules = apiToRulesFormat(priceListToEdit);
      setPricingRules(rules.length > 0 ? rules : []);
      setCurrentPriceList({
        startDate: parseUtcDateForPicker(priceListToEdit.startDate),
        endDate: parseUtcDateForPicker(priceListToEdit.endDate),
      });
      setEditingPriceListId(priceListToEdit.id);
      if (
        priceListToEdit.fullPaymentDiscount &&
        priceListToEdit.fullPaymentDiscount.status
      ) {
        const v = priceListToEdit.fullPaymentDiscount.value;
        const defaultVal =
          priceListToEdit.fullPaymentDiscount.type === "fixed" ? "0" : "5";
        setFullPaymentDiscount({
          status: priceListToEdit.fullPaymentDiscount.status,
          applyToBasePrice:
            priceListToEdit.fullPaymentDiscount.applyToBasePrice !== false,
          type: priceListToEdit.fullPaymentDiscount.type || "percent",
          value: v !== undefined && v !== null && v !== "" ? String(v) : defaultVal,
        });
      } else {
        setFullPaymentDiscount(null);
      }
      if (typeof onEditPriceList === "function") onEditPriceList(priceListToEdit);
    },
    [setCurrentPriceList, onEditPriceList]
  );

  const handleDeletePriceList = useCallback(
    async (priceListId) => {
      if (typeof onDeletePriceList === "function" && typeof priceListId === "string") {
        try {
          await onDeletePriceList(priceListId);
          setPriceLists((prev) => prev.filter((p) => p.id !== priceListId));
        } catch (e) {
          console.error("Failed to delete price list via API", e);
          if (e.message.includes("Cannot delete active price list")) {
            alert("Cannot delete active price list. Only future price lists can be deleted.");
          } else {
            alert(`Failed to delete price list: ${e.message}`);
          }
          return;
        }
      } else {
        setPriceLists((prev) => prev.filter((p) => p.id !== priceListId));
      }
      setShowDeleteConfirmDialog(false);
      setPriceListToDelete(null);
      if (priceListId === editingPriceListId) {
        setCurrentPriceList(defaultPriceListWindow());
        setEditingPriceListId(null);
        setPricingRules([]);
        setFullPaymentDiscount(null);
      }
    },
    [onDeletePriceList, editingPriceListId, setCurrentPriceList]
  );

  const confirmDeletePriceList = useCallback((priceListId) => {
    setPriceListToDelete(priceListId);
    setShowDeleteConfirmDialog(true);
  }, []);

  const handleRemoveFeeRow = useCallback(
    async (index) => {
      const updated = removeHighSeasonFeeRow(highSeasonFees, index);
      setHighSeasonFees(updated);
      if (courseId && typeof onDeleteCourseFees === "function") {
        try {
          await onDeleteCourseFees();
          const validRemaining = updated.filter(
            (fee) =>
              fee.startDate &&
              fee.endDate &&
              fee.pricePerWeek &&
              fee.pricePerWeek !== "0" &&
              fee.pricePerWeek !== ""
          );
          if (validRemaining.length > 0 && typeof onSaveCourseFees === "function") {
            await onSaveCourseFees(validRemaining.map(formatFeeRowForApi));
          }
          if (typeof onCourseFeesSynced === "function") await onCourseFeesSynced();
        } catch (e) {
          console.error("Failed to sync fee removal:", e);
          setHighSeasonFees(highSeasonFees);
        }
      }
    },
    [
      highSeasonFees,
      courseId,
      onDeleteCourseFees,
      onSaveCourseFees,
      onCourseFeesSynced,
    ]
  );

  const updateHighSeasonFees = useCallback(
    (index, field, value) => {
      setHighSeasonFees((prev) =>
        updateHighSeasonFeeRow(prev, index, field, value)
      );
    },
    []
  );

  const addHighSeasonFeeRowHandler = useCallback(() => {
    setHighSeasonFees((prev) => addHighSeasonFeeRow(prev));
  }, []);

  saveHandlerRef.current = handleSavePriceList;
  cancelHandlerRef.current = handleCancelPriceList;

  const isSaveButtonEnabled = useCallback(() => {
    if (!currentPriceList.startDate || !currentPriceList.endDate) return false;
    const validRules = pricingRules.filter(
      (r) => r.fromWeeks && r.toWeeks && r.amount && Number(r.fromWeeks) > 0
    );
    if (validRules.length === 0) return false;
    const validation = validatePricingRules(pricingRules);
    return validation.errors.length === 0;
  }, [currentPriceList, pricingRules]);

  return {
    priceLists,
    editingPriceListId,
    pricingRules,
    fullPaymentDiscount,
    setFullPaymentDiscount,
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
  };
}
