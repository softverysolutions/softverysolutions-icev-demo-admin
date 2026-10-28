import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Collapse from "@mui/material/Collapse";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import DataTableHeadCell from "examples/Tables/DataTable/DataTableHeadCell";
import DataTableBodyCell from "examples/Tables/DataTable/DataTableBodyCell";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { CountryService } from "services/countryService";
import { CityService } from "services/cityService";
import { fetchAllCities, groupCitiesByCountry } from "./utils";

function StatusChip({ isActive }) {
  return isActive ? (
    <Chip label="Active" size="small" color="success" sx={{ height: 24, fontWeight: 500 }} />
  ) : (
    <Chip
      label="Inactive"
      size="small"
      sx={{ height: 24, fontWeight: 500, backgroundColor: "grey.400", color: "grey.800" }}
    />
  );
}

StatusChip.propTypes = {
  isActive: PropTypes.bool.isRequired,
};

function DestinationsList() {
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [citiesByCountry, setCitiesByCountry] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  // One request for the countries and one for every city.
  const loadDestinations = useCallback(async () => {
    try {
      setLoading(true);
      const [countriesRes, cities] = await Promise.all([
        CountryService.getAllCountries({ limit: 500 }),
        fetchAllCities((params) => CityService.searchCities(params)),
      ]);
      setCountries(countriesRes.data || []);
      setCitiesByCountry(groupCitiesByCountry(cities));
    } catch (err) {
      console.error("Error loading destinations:", err);
      setCountries([]);
      setCitiesByCountry({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDestinations();
  }, [loadDestinations]);

  const toggleExpand = (countryId) => {
    const willOpen = !expanded[countryId];
    setExpanded((prev) => ({ ...prev, [countryId]: willOpen }));
  };

  const faqsCount = (country) => (country.faqs ? country.faqs.length : 0);
  const citiesCount = (countryId) => (citiesByCountry[countryId] || []).length;

  const handleAddCountry = () => {
    navigate("/orders/destinations/country/new");
  };

  const handleEditCountry = (e, country) => {
    e.stopPropagation();
    navigate(`/orders/destinations/country/${country.id}`);
  };

  const handleAddCity = (e, country) => {
    e.stopPropagation();
    navigate("/orders/destinations/city/new", { state: { countryId: country.id } });
  };

  const handleEditCity = (city) => {
    navigate(`/orders/destinations/city/${city.id}`);
  };

  const handleDeleteCountry = async (e, country) => {
    e.stopPropagation();
    const message = `Delete country "${country.name}"? This may affect cities and related data.`;
    if (!window.confirm(message)) return;
    try {
      await CountryService.deleteCountry(country.id);
      await loadDestinations();
    } catch (err) {
      console.error("Error deleting country:", err);
      window.alert(err?.message || "Failed to delete country.");
    }
  };

  const handleDeleteCity = async (e, city, countryId) => {
    e.stopPropagation();
    const message = `Delete city "${city.name || city.engName}"?`;
    if (!window.confirm(message)) return;
    try {
      await CityService.deleteCity(city.id);
      setCitiesByCountry((prev) => ({
        ...prev,
        [countryId]: (prev[countryId] || []).filter((c) => c.id !== city.id),
      }));
    } catch (err) {
      console.error("Error deleting city:", err);
      window.alert(err?.message || "Failed to delete city.");
    }
  };

  const totalCities = countries.reduce((sum, c) => sum + (citiesByCountry[c.id] || []).length, 0);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" p={3}>
            <SoftBox lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                Destinations
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Manage countries and cities.
              </SoftTypography>
              <SoftTypography variant="caption" color="text" sx={{ display: "block", mt: 0.5 }}>
                {countries.length} countries • {totalCities} cities
              </SoftTypography>
            </SoftBox>
            <SoftButton
              variant="gradient"
              color="info"
              size="small"
              onClick={handleAddCountry}
              startIcon={<Icon>add</Icon>}
            >
              Add Country
            </SoftButton>
          </SoftBox>

          <SoftBox px={3} pb={3}>
            {loading ? (
              <SoftBox py={4} textAlign="center">
                <SoftTypography variant="body2" color="text.secondary">
                  Loading...
                </SoftTypography>
              </SoftBox>
            ) : (
              countries.map((country) => (
                <Card
                  key={country.id}
                  sx={{
                    mb: 3.5,
                    overflow: "hidden",
                    boxShadow: 2,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <SoftBox
                    onClick={() => toggleExpand(country.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 2,
                      cursor: "pointer",
                      bgcolor: "grey.50",
                      borderBottom: expanded[country.id] ? "1px solid" : "none",
                      borderColor: "divider",
                      "&:hover": { bgcolor: "grey.100" },
                    }}
                  >
                    <SoftBox display="flex" alignItems="center" gap={1.5}>
                      <Icon
                        sx={{
                          transform: expanded[country.id] ? "rotate(0deg)" : "rotate(-90deg)",
                          transition: "transform 0.2s",
                        }}
                      >
                        expand_more
                      </Icon>
                      {country.image ? (
                        <SoftBox
                          component="img"
                          src={country.image}
                          alt=""
                          sx={{ width: 24, height: 16, objectFit: "cover", borderRadius: "2px" }}
                        />
                      ) : (
                        <Icon color="inherit" fontSize="small">
                          public
                        </Icon>
                      )}
                      <SoftTypography variant="button" fontWeight="medium">
                        {country.name}
                        {country.code ? ` (${country.code})` : ""}
                      </SoftTypography>
                      <StatusChip isActive={country.isActive !== false} />
                    </SoftBox>
                    <SoftBox display="flex" alignItems="center" gap={1}>
                      <SoftTypography variant="caption" color="text.secondary">
                        {citiesCount(country.id)} cities • {faqsCount(country)} FAQs
                      </SoftTypography>
                      <SoftButton
                        variant="outlined"
                        color="dark"
                        size="small"
                        onClick={(e) => handleEditCountry(e, country)}
                        startIcon={<Icon fontSize="small">edit</Icon>}
                      >
                        Edit
                      </SoftButton>
                      <SoftButton
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={(e) => handleDeleteCountry(e, country)}
                        startIcon={<Icon fontSize="small">delete</Icon>}
                      >
                        Delete
                      </SoftButton>
                      <SoftButton
                        variant="gradient"
                        color="info"
                        size="small"
                        onClick={(e) => handleAddCity(e, country)}
                        startIcon={<Icon fontSize="small">add</Icon>}
                      >
                        Add City
                      </SoftButton>
                    </SoftBox>
                  </SoftBox>
                  <Collapse in={expanded[country.id]}>
                    <SoftBox
                      sx={{
                        bgcolor: "background.paper",
                        borderTop: "1px solid",
                        borderColor: "divider",
                        p: 2,
                        mx: 1.5,
                        mb: 1.5,
                      }}
                    >
                      <TableContainer sx={{ overflow: "visible" }}>
                        <Table size="small" sx={{ width: "100%", minWidth: 620 }}>
                          <SoftBox component="thead">
                            <TableRow>
                              <DataTableHeadCell width="22%" align="left" sorted={false}>
                                City
                              </DataTableHeadCell>
                              <DataTableHeadCell width="22%" align="left" sorted={false}>
                                Subtitle
                              </DataTableHeadCell>
                              <DataTableHeadCell width="22%" align="left" sorted={false}>
                                Tech scene
                              </DataTableHeadCell>
                              <DataTableHeadCell width="14%" align="left" sorted={false}>
                                Surf &amp; sport season
                              </DataTableHeadCell>
                              <DataTableHeadCell width="20%" align="right" sorted={false}>
                                Actions
                              </DataTableHeadCell>
                            </TableRow>
                          </SoftBox>
                          <TableBody>
                            {(citiesByCountry[country.id] || []).map((city, idx) => (
                              <TableRow
                                key={city.id}
                                hover
                                sx={{
                                  bgcolor: idx % 2 === 0 ? "transparent" : "grey.50",
                                }}
                              >
                                <DataTableBodyCell align="left" noBorder={false}>
                                  <SoftBox display="flex" alignItems="center" gap={1}>
                                    <Icon fontSize="small" color="action">
                                      place
                                    </Icon>
                                    <SoftTypography variant="button">
                                      {city.name || "—"}
                                    </SoftTypography>
                                    <StatusChip isActive={city.isActive !== false} />
                                  </SoftBox>
                                </DataTableBodyCell>
                                <DataTableBodyCell align="left" noBorder={false}>
                                  <SoftTypography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: "block",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      maxWidth: 280,
                                    }}
                                    title={city.subtitle || ""}
                                  >
                                    {city.subtitle || "—"}
                                  </SoftTypography>
                                </DataTableBodyCell>
                                <DataTableBodyCell align="left" noBorder={false}>
                                  <SoftTypography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: "block",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      maxWidth: 240,
                                    }}
                                    title={city.techScene || ""}
                                  >
                                    {city.techScene || "—"}
                                  </SoftTypography>
                                </DataTableBodyCell>
                                <DataTableBodyCell align="left" noBorder={false}>
                                  <SoftTypography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      display: "block",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      maxWidth: 180,
                                    }}
                                    title={city.surfSeason || ""}
                                  >
                                    {city.surfSeason || "—"}
                                  </SoftTypography>
                                </DataTableBodyCell>
                                <DataTableBodyCell align="right" noBorder={false}>
                                  <SoftBox
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="flex-end"
                                    gap={0.5}
                                  >
                                    <SoftButton
                                      variant="text"
                                      color="dark"
                                      size="small"
                                      onClick={() => handleEditCity(city)}
                                      startIcon={<Icon fontSize="small">edit</Icon>}
                                    >
                                      Edit
                                    </SoftButton>
                                    <SoftButton
                                      variant="text"
                                      color="error"
                                      size="small"
                                      onClick={(e) => handleDeleteCity(e, city, country.id)}
                                      startIcon={<Icon fontSize="small">delete</Icon>}
                                    >
                                      Delete
                                    </SoftButton>
                                  </SoftBox>
                                </DataTableBodyCell>
                              </TableRow>
                            ))}
                            {(citiesByCountry[country.id] || []).length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, px: 3 }}>
                                  <SoftTypography variant="caption" color="text.secondary">
                                    No cities yet. Click &ldquo;+ Add City&rdquo; to add one.
                                  </SoftTypography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </SoftBox>
                  </Collapse>
                </Card>
              ))
            )}
            {!loading && countries.length === 0 && (
              <SoftBox py={4} textAlign="center">
                <SoftTypography variant="body2" color="text.secondary">
                  No countries yet. Click &ldquo;+ Add Country&rdquo; to create one.
                </SoftTypography>
              </SoftBox>
            )}
          </SoftBox>
        </Card>
      </SoftBox>
    </DashboardLayout>
  );
}

export default DestinationsList;
