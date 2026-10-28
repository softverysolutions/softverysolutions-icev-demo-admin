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

// Soft UI Dashboard PRO React base styles
import colors from "assets/theme/base/colors";

// Soft UI Dashboard PRO React helper functions
import rgba from "assets/theme/functions/rgba";

const { info, white, gradients } = colors;

const timepicker = {
  ".flatpickr-time": {
    background: white.main,
    borderTop: `1px solid ${rgba(info.main, 0.1)}`,
  },

  ".flatpickr-time input": {
    color: info.main,
    fontSize: "14px",
    fontWeight: "500",
  },

  ".flatpickr-time input:hover": {
    background: rgba(info.main, 0.1),
  },

  ".flatpickr-time input:focus": {
    background: rgba(info.main, 0.2),
    border: `1px solid ${info.main}`,
  },

  ".flatpickr-time .numInputWrapper": {
    border: `1px solid ${rgba(info.main, 0.2)}`,
    borderRadius: "8px",
  },

  ".flatpickr-time .numInputWrapper:hover": {
    border: `1px solid ${info.main}`,
  },

  ".flatpickr-time .flatpickr-am-pm": {
    color: info.main,
    fontWeight: "500",
  },

  ".flatpickr-time .flatpickr-am-pm:hover": {
    background: rgba(info.main, 0.1),
  },
};

export default timepicker;
