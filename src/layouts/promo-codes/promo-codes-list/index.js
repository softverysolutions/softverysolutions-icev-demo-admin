import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";

import SoftBox from "components/SoftBox";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import NewUserPromoCard from "./components/NewUserPromoCard";
import PromoCodesListHeader from "./components/PromoCodesListHeader";
import PromoSearchToolbar from "./components/PromoSearchToolbar";
import { usePromoCodesList } from "./usePromoCodesList";

function PromoCodesList() {
  const navigate = useNavigate();
  const {
    isSuperAdmin,
    searchInput,
    setSearchInput,
    handleSearchSubmit,
    handleSearchKeyDown,
    filter,
    setFilter,
    newUserEnabled,
    setNewUserEnabled,
    newUserAmount,
    setNewUserAmount,
    newUserExpiryValue,
    setNewUserExpiryValue,
    newUserExpiryUnit,
    setNewUserExpiryUnit,
    newUserCombineWithSchool,
    setNewUserCombineWithSchool,
    handleSaveNewUserPromo,
    loadingNewUserConfig,
    savingNewUserConfig,
    tableRows,
    columns,
    handleRowClick,
    loading,
    serverPagination,
    onPageChange,
    onPageSizeChange,
  } = usePromoCodesList();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        {isSuperAdmin ? (
          <NewUserPromoCard
            enabled={newUserEnabled}
            onEnabledChange={setNewUserEnabled}
            amount={newUserAmount}
            onAmountChange={setNewUserAmount}
            expiryValue={newUserExpiryValue}
            onExpiryValueChange={setNewUserExpiryValue}
            expiryUnit={newUserExpiryUnit}
            onExpiryUnitChange={setNewUserExpiryUnit}
            combineWithSchool={newUserCombineWithSchool}
            onCombineWithSchoolChange={setNewUserCombineWithSchool}
            onSave={handleSaveNewUserPromo}
            saving={savingNewUserConfig}
            loadingConfig={loadingNewUserConfig}
          />
        ) : null}

        <Card>
          <PromoCodesListHeader onCreateClick={() => navigate("/promo-codes/new")} />

          <SoftBox
            sx={{
              "& .MuiTableContainer-root": {
                marginTop: "-40px",
              },
            }}
          >
            <PromoSearchToolbar
              filter={filter}
              onFilterChange={setFilter}
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onSearchKeyDown={handleSearchKeyDown}
              onSearchSubmit={handleSearchSubmit}
            />

            <DataTable
              table={{ columns, rows: tableRows }}
              entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 25] }}
              canSearch={false}
              isSorted={false}
              onRowClick={handleRowClick}
              isLoading={loading}
              serverPagination={serverPagination}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </SoftBox>
        </Card>
      </SoftBox>
    </DashboardLayout>
  );
}

export default PromoCodesList;
