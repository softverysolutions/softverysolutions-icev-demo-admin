import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";

function SearchBar({ canSearch, search, onSearchChange }) {
  if (!canSearch) return null;

  return (
    <SoftBox display="flex" justifyContent="flex-end" alignItems="center" p={3}>
      <SoftBox width="12rem">
        <SoftInput
          placeholder="Search..."
          value={search}
          onChange={({ currentTarget }) => {
            onSearchChange(currentTarget.value);
          }}
        />
      </SoftBox>
    </SoftBox>
  );
}

SearchBar.propTypes = {
  canSearch: PropTypes.bool,
  search: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
};

export default SearchBar;
