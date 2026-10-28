import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import theme from "assets/theme";
import AdditionalServices from "./index";

// A 6-week order in AUD whose programme offers "Laptop rental" priced in AED at 90 per week
// and "NEW" priced in EUR.
const options = [
  { value: "svc-aed", label: "Laptop rental", price: 540, currency: "AED", isMandatory: false },
  { value: "svc-eur", label: "NEW", price: 100, currency: "EUR", isMandatory: false },
];

describe("AdditionalServices in edit mode", () => {
  it("prices each extra in its own currency, not the order's", () => {
    render(
      <ThemeProvider theme={theme}>
        <AdditionalServices isEditMode services={[]} servicesOptions={options} currency="EUR" />
      </ThemeProvider>
    );

    expect(screen.queryByText(/€\s?540/)).toBeNull();
    expect(screen.queryByText(/AED\s?540/)).toBeTruthy();
    expect(screen.queryByText(/€\s?100/)).toBeTruthy();
  });
});

describe("AdditionalServices in view mode", () => {
  const renderSaved = (services) =>
    render(
      <ThemeProvider theme={theme}>
        <AdditionalServices services={services} currency="EUR" />
      </ThemeProvider>
    );

  it("prices each saved extra in its own currency and totals per currency", () => {
    renderSaved([
      { id: "svc-aed", name: "Laptop rental", cost: 540, currency: "AED", isMandatory: false },
      { id: "svc-eur", name: "NEW", cost: 100, currency: "EUR", isMandatory: false },
    ]);

    expect(screen.queryByText(/^AED 540\.00$/)).toBeTruthy();
    expect(screen.queryByText(/^€100\.00$/)).toBeTruthy();
    expect(screen.queryByText(/Total: AED 540\.00 \+ €100\.00/)).toBeTruthy();
  });

  it("keeps one total in the order currency when no extra says otherwise", () => {
    renderSaved([
      { id: "svc-1", name: "One", cost: 100, isMandatory: false },
      { id: "svc-2", name: "Two", cost: 40, isMandatory: false },
    ]);

    expect(screen.queryByText(/Total: €140\.00$/)).toBeTruthy();
  });
});
