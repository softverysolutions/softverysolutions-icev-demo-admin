export const formRadioGroupSx = {
  ml: 0,
  pl: 0,
  "& .MuiFormControlLabel-root": {
    marginLeft: 0,
    marginRight: 24,
  },
};

export const applyingScopeRadioGroupSx = {
  ...formRadioGroupSx,
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
  columnGap: 2,
  rowGap: 0.25,
  width: "100%",
  "& .MuiFormControlLabel-root": {
    marginLeft: 0,
    marginRight: 0,
    minWidth: 0,
  },
};
