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

// @mui material components
import { styled } from "@mui/material/styles";

export default styled("div")(({ theme, ownerState }) => {
  const { palette, borders } = theme;
  const { darkMode, inModal } = ownerState;

  const { borderRadius } = borders;
  const { inputBorderColor, grey, white } = palette;

  return {
    direction: "ltr",
    textAlign: "left",
    overflow: "visible",
    position: "relative",
    "& .rdw-editor-wrapper": {
      borderRadius: borderRadius.md,
      border: `1px solid ${inputBorderColor ?? grey[400]}`,
      direction: "ltr",
      maxWidth: "100%",
      overflow: "visible",
      position: "relative",
    },

    "& .rdw-editor-toolbar": {
      border: 0,
      borderBottom: `1px solid ${inputBorderColor ?? grey[400]}`,
      borderRadius: `${borderRadius.md} ${borderRadius.md} 0 0`,
      backgroundColor: "transparent",
      maxWidth: "100%",
      overflow: "visible",
    },

    "& .rdw-option-wrapper, & .rdw-dropdown-wrapper": {
      borderColor: grey[200],
      backgroundColor: darkMode ? grey[500] : white,

      "&:hover": {
        boxShadow: "none",
        borderColor: grey[400],
      },
    },

    "& .rdw-option-active": {
      boxShadow: "none",
      borderColor: grey[600],
    },

    "& .public-DraftStyleDefault-block": {
      margin: 0,
      padding: "8px",
    },
    "& .rdw-editor-main": {
      direction: "ltr !important",
    },
    "& .public-DraftEditor-content": {
      direction: "ltr !important",
      textAlign: "left !important",
    },
    "& .public-DraftStyleDefault-ltr": {
      direction: "ltr !important",
      textAlign: "left !important",
    },
    "& [class*='DraftEditor']": {
      direction: "ltr !important",
    },

    "& .rdw-emoji-wrapper": {
      position: "relative",
      overflow: "visible",
      zIndex: 2,
    },

    "& .rdw-emoji-modal": {
      zIndex: inModal ? "1500 !important" : "10 !important",
      maxHeight: "240px",
      overflowY: "auto",
      left: "auto !important",
      right: "0 !important",
      ...(inModal
        ? {
            position: "absolute !important",
            top: "auto !important",
            bottom: "calc(100% + 4px) !important",
          }
        : {}),
    },

    "& .rdw-link-modal, & .rdw-image-modal": {
      zIndex: inModal ? "1500 !important" : "10 !important",
      left: "auto !important",
      right: "0 !important",
      ...(inModal
        ? {
            top: "auto !important",
            bottom: "calc(100% + 4px) !important",
          }
        : {}),
    },

    "& .rdw-link-wrapper, & .rdw-image-wrapper, & .rdw-dropdown-wrapper": {
      overflow: "visible",
    },
  };
});
