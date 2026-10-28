import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "assets/theme";
import { AmountCell } from "./components";

const renderCell = (value) =>
  render(
    <ThemeProvider theme={theme}>
      <AmountCell value={value} />
    </ThemeProvider>
  );

describe("AmountCell", () => {
  it("shows the bare amount when the currency is unknown", () => {
    renderCell({ amount: 2562.64, currency: undefined });

    expect(screen.queryByText(/^2,562\.64$/)).toBeTruthy();
  });

  it("shows the euro symbol for EUR orders", () => {
    renderCell({ amount: 2562.64, currency: "EUR" });

    expect(screen.queryByText(/^€2,562\.64$/)).toBeTruthy();
  });
});
