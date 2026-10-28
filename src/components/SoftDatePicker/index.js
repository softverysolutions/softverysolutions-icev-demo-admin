/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";
import { useEffect, useRef } from "react";

// react-flatpickr components
import Flatpickr from "react-flatpickr";

// react-flatpickr styles
import "flatpickr/dist/flatpickr.css";

// Soft UI Dashboard PRO React components
import SoftInput from "components/SoftInput";

function SoftDatePicker({ input = {}, options, onReady, ...rest }) {
  const fpRef = useRef(null);

  useEffect(() => {
    const fp = fpRef.current;
    if (!fp || !options) return;
    if ("minDate" in options) fp.set("minDate", options.minDate ?? null);
    if ("maxDate" in options) fp.set("maxDate", options.maxDate ?? null);
    if ("disable" in options) fp.set("disable", options.disable ?? []);
  }, [options]);

  return (
    <Flatpickr
      {...rest}
      options={options}
      onReady={(selectedDates, dateStr, instance) => {
        fpRef.current = instance;
        onReady?.(selectedDates, dateStr, instance);
      }}
      render={({ defaultValue }, ref) => (
        <SoftInput {...input} defaultValue={defaultValue} inputRef={ref} />
      )}
    />
  );
}

SoftDatePicker.propTypes = {
  input: PropTypes.objectOf(PropTypes.any),
  options: PropTypes.object,
  onReady: PropTypes.func,
};

export default SoftDatePicker;
