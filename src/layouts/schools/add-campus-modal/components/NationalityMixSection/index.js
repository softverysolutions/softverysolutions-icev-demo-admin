import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import DataTable from "examples/Tables/DataTable";
import UltimateDoughnutChart from "../../../view-campus/components/CampusNationalityMix/UltimateDoughnutChart";

function EditablePercentageCell({ value, onChange, disabled }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleDoubleClick = () => {
    if (!disabled) {
      setIsEditing(true);
      setEditValue(value);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      onChange(parseFloat(editValue) || 0);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  if (isEditing) {
    return (
      <SoftInput
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
        autoFocus
        size="small"
        sx={{ width: "60px" }}
      />
    );
  }

  return (
    <SoftTypography
      variant="button"
      fontWeight="medium"
      sx={{ cursor: disabled ? "default" : "pointer" }}
      onDoubleClick={handleDoubleClick}
    >
      {value}%
    </SoftTypography>
  );
}

EditablePercentageCell.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

function FlagCell({ value }) {
  let flag = "🌐";

  if (
    value.groupLabel.toLowerCase().includes("ukrainian") ||
    value.groupLabel.toLowerCase().includes("ukraine")
  ) {
    flag = "🇺🇦";
  } else if (
    value.groupLabel.toLowerCase().includes("russian") ||
    value.groupLabel.toLowerCase().includes("russia")
  ) {
    flag = "🌐";
  } else if (
    value.groupLabel.toLowerCase().includes("kazakh") ||
    value.groupLabel.toLowerCase().includes("kazakhstan")
  ) {
    flag = "🇰🇿";
  } else if (
    value.groupLabel.toLowerCase().includes("uzbek") ||
    value.groupLabel.toLowerCase().includes("uzbekistan")
  ) {
    flag = "🇺🇿";
  } else if (
    value.groupLabel.toLowerCase().includes("tajik") ||
    value.groupLabel.toLowerCase().includes("tajikistan")
  ) {
    flag = "🇹🇯";
  } else if (
    value.groupLabel.toLowerCase().includes("kyrgyz") ||
    value.groupLabel.toLowerCase().includes("kyrgyzstan")
  ) {
    flag = "🇰🇬";
  } else if (
    value.groupLabel.toLowerCase().includes("turkmen") ||
    value.groupLabel.toLowerCase().includes("turkmenistan")
  ) {
    flag = "🇹🇲";
  } else if (
    value.groupLabel.toLowerCase().includes("belarus") ||
    value.groupLabel.toLowerCase().includes("belarusian")
  ) {
    flag = "🌐";
  } else if (
    value.groupLabel.toLowerCase().includes("moldova") ||
    value.groupLabel.toLowerCase().includes("moldovan")
  ) {
    flag = "🇲🇩";
  } else if (
    value.groupLabel.toLowerCase().includes("georgia") ||
    value.groupLabel.toLowerCase().includes("georgian")
  ) {
    flag = "🇬🇪";
  } else if (
    value.groupLabel.toLowerCase().includes("armenia") ||
    value.groupLabel.toLowerCase().includes("armenian")
  ) {
    flag = "🇦🇲";
  } else if (
    value.groupLabel.toLowerCase().includes("azerbaijan") ||
    value.groupLabel.toLowerCase().includes("azerbaijani")
  ) {
    flag = "🇦🇿";
  } else if (
    value.groupLabel.toLowerCase().includes("polish") ||
    value.groupLabel.toLowerCase().includes("poland")
  ) {
    flag = "🇵🇱";
  } else if (
    value.groupLabel.toLowerCase().includes("lithuania") ||
    value.groupLabel.toLowerCase().includes("lithuanian")
  ) {
    flag = "🇱🇹";
  } else if (
    value.groupLabel.toLowerCase().includes("latvia") ||
    value.groupLabel.toLowerCase().includes("latvian")
  ) {
    flag = "🇱🇻";
  } else if (
    value.groupLabel.toLowerCase().includes("estonia") ||
    value.groupLabel.toLowerCase().includes("estonian")
  ) {
    flag = "🇪🇪";
  } else if (
    value.groupLabel.toLowerCase().includes("romania") ||
    value.groupLabel.toLowerCase().includes("romanian")
  ) {
    flag = "🇷🇴";
  } else if (
    value.groupLabel.toLowerCase().includes("bulgaria") ||
    value.groupLabel.toLowerCase().includes("bulgarian")
  ) {
    flag = "🇧🇬";
  } else if (
    value.groupLabel.toLowerCase().includes("hungary") ||
    value.groupLabel.toLowerCase().includes("hungarian")
  ) {
    flag = "🇭🇺";
  } else if (
    value.groupLabel.toLowerCase().includes("czech") ||
    value.groupLabel.toLowerCase().includes("czechia")
  ) {
    flag = "🇨🇿";
  } else if (
    value.groupLabel.toLowerCase().includes("slovakia") ||
    value.groupLabel.toLowerCase().includes("slovak")
  ) {
    flag = "🇸🇰";
  } else if (
    value.groupLabel.toLowerCase().includes("slovenia") ||
    value.groupLabel.toLowerCase().includes("slovenian")
  ) {
    flag = "🇸🇮";
  } else if (
    value.groupLabel.toLowerCase().includes("croatia") ||
    value.groupLabel.toLowerCase().includes("croatian")
  ) {
    flag = "🇭🇷";
  } else if (
    value.groupLabel.toLowerCase().includes("serbia") ||
    value.groupLabel.toLowerCase().includes("serbian")
  ) {
    flag = "🇷🇸";
  } else if (
    value.groupLabel.toLowerCase().includes("bosnia") ||
    value.groupLabel.toLowerCase().includes("bosnian")
  ) {
    flag = "🇧🇦";
  } else if (
    value.groupLabel.toLowerCase().includes("montenegro") ||
    value.groupLabel.toLowerCase().includes("montenegrin")
  ) {
    flag = "🇲🇪";
  } else if (
    value.groupLabel.toLowerCase().includes("macedonia") ||
    value.groupLabel.toLowerCase().includes("macedonian")
  ) {
    flag = "🇲🇰";
  } else if (
    value.groupLabel.toLowerCase().includes("albania") ||
    value.groupLabel.toLowerCase().includes("albanian")
  ) {
    flag = "🇦🇱";
  } else if (
    value.groupLabel.toLowerCase().includes("greece") ||
    value.groupLabel.toLowerCase().includes("greek")
  ) {
    flag = "🇬🇷";
  } else if (
    value.groupLabel.toLowerCase().includes("turkey") ||
    value.groupLabel.toLowerCase().includes("turkish")
  ) {
    flag = "🇹🇷";
  } else if (
    value.groupLabel.toLowerCase().includes("china") ||
    value.groupLabel.toLowerCase().includes("chinese")
  ) {
    flag = "🇨🇳";
  } else if (
    value.groupLabel.toLowerCase().includes("japan") ||
    value.groupLabel.toLowerCase().includes("japanese")
  ) {
    flag = "🇯🇵";
  } else if (
    value.groupLabel.toLowerCase().includes("korea") ||
    value.groupLabel.toLowerCase().includes("korean")
  ) {
    flag = "🇰🇷";
  } else if (
    value.groupLabel.toLowerCase().includes("india") ||
    value.groupLabel.toLowerCase().includes("indian")
  ) {
    flag = "🇮🇳";
  } else if (
    value.groupLabel.toLowerCase().includes("pakistan") ||
    value.groupLabel.toLowerCase().includes("pakistani")
  ) {
    flag = "🇵🇰";
  } else if (
    value.groupLabel.toLowerCase().includes("bangladesh") ||
    value.groupLabel.toLowerCase().includes("bangladeshi")
  ) {
    flag = "🇧🇩";
  } else if (
    value.groupLabel.toLowerCase().includes("vietnam") ||
    value.groupLabel.toLowerCase().includes("vietnamese")
  ) {
    flag = "🇻🇳";
  } else if (
    value.groupLabel.toLowerCase().includes("thailand") ||
    value.groupLabel.toLowerCase().includes("thai")
  ) {
    flag = "🇹🇭";
  } else if (
    value.groupLabel.toLowerCase().includes("malaysia") ||
    value.groupLabel.toLowerCase().includes("malaysian")
  ) {
    flag = "🇲🇾";
  } else if (
    value.groupLabel.toLowerCase().includes("singapore") ||
    value.groupLabel.toLowerCase().includes("singaporean")
  ) {
    flag = "🇸🇬";
  } else if (
    value.groupLabel.toLowerCase().includes("indonesia") ||
    value.groupLabel.toLowerCase().includes("indonesian")
  ) {
    flag = "🇮🇩";
  } else if (
    value.groupLabel.toLowerCase().includes("philippines") ||
    value.groupLabel.toLowerCase().includes("filipino")
  ) {
    flag = "🇵🇭";
  } else if (
    value.groupLabel.toLowerCase().includes("iran") ||
    value.groupLabel.toLowerCase().includes("iranian")
  ) {
    flag = "🇮🇷";
  } else if (
    value.groupLabel.toLowerCase().includes("iraq") ||
    value.groupLabel.toLowerCase().includes("iraqi")
  ) {
    flag = "🇮🇶";
  } else if (
    value.groupLabel.toLowerCase().includes("syria") ||
    value.groupLabel.toLowerCase().includes("syrian")
  ) {
    flag = "🇸🇾";
  } else if (
    value.groupLabel.toLowerCase().includes("lebanon") ||
    value.groupLabel.toLowerCase().includes("lebanese")
  ) {
    flag = "🇱🇧";
  } else if (
    value.groupLabel.toLowerCase().includes("jordan") ||
    value.groupLabel.toLowerCase().includes("jordanian")
  ) {
    flag = "🇯🇴";
  } else if (
    value.groupLabel.toLowerCase().includes("israel") ||
    value.groupLabel.toLowerCase().includes("israeli")
  ) {
    flag = "🇮🇱";
  } else if (
    value.groupLabel.toLowerCase().includes("egypt") ||
    value.groupLabel.toLowerCase().includes("egyptian")
  ) {
    flag = "🇪🇬";
  } else if (
    value.groupLabel.toLowerCase().includes("morocco") ||
    value.groupLabel.toLowerCase().includes("moroccan")
  ) {
    flag = "🇲🇦";
  } else if (
    value.groupLabel.toLowerCase().includes("algeria") ||
    value.groupLabel.toLowerCase().includes("algerian")
  ) {
    flag = "🇩🇿";
  } else if (
    value.groupLabel.toLowerCase().includes("tunisia") ||
    value.groupLabel.toLowerCase().includes("tunisian")
  ) {
    flag = "🇹🇳";
  } else if (
    value.groupLabel.toLowerCase().includes("libya") ||
    value.groupLabel.toLowerCase().includes("libyan")
  ) {
    flag = "🇱🇾";
  } else if (
    value.groupLabel.toLowerCase().includes("sudan") ||
    value.groupLabel.toLowerCase().includes("sudanese")
  ) {
    flag = "🇸🇩";
  } else if (
    value.groupLabel.toLowerCase().includes("ethiopia") ||
    value.groupLabel.toLowerCase().includes("ethiopian")
  ) {
    flag = "🇪🇹";
  } else if (
    value.groupLabel.toLowerCase().includes("kenya") ||
    value.groupLabel.toLowerCase().includes("kenyan")
  ) {
    flag = "🇰🇪";
  } else if (
    value.groupLabel.toLowerCase().includes("nigeria") ||
    value.groupLabel.toLowerCase().includes("nigerian")
  ) {
    flag = "🇳🇬";
  } else if (
    value.groupLabel.toLowerCase().includes("south africa") ||
    value.groupLabel.toLowerCase().includes("south african")
  ) {
    flag = "🇿🇦";
  } else if (
    value.groupLabel.toLowerCase().includes("argentina") ||
    value.groupLabel.toLowerCase().includes("argentine")
  ) {
    flag = "🇦🇷";
  } else if (
    value.groupLabel.toLowerCase().includes("chile") ||
    value.groupLabel.toLowerCase().includes("chilean")
  ) {
    flag = "🇨🇱";
  } else if (
    value.groupLabel.toLowerCase().includes("peru") ||
    value.groupLabel.toLowerCase().includes("peruvian")
  ) {
    flag = "🇵🇪";
  } else if (
    value.groupLabel.toLowerCase().includes("colombia") ||
    value.groupLabel.toLowerCase().includes("colombian")
  ) {
    flag = "🇨🇴";
  } else if (
    value.groupLabel.toLowerCase().includes("venezuela") ||
    value.groupLabel.toLowerCase().includes("venezuelan")
  ) {
    flag = "🇻🇪";
  } else if (
    value.groupLabel.toLowerCase().includes("ecuador") ||
    value.groupLabel.toLowerCase().includes("ecuadorian")
  ) {
    flag = "🇪🇨";
  } else if (
    value.groupLabel.toLowerCase().includes("bolivia") ||
    value.groupLabel.toLowerCase().includes("bolivian")
  ) {
    flag = "🇧🇴";
  } else if (
    value.groupLabel.toLowerCase().includes("paraguay") ||
    value.groupLabel.toLowerCase().includes("paraguayan")
  ) {
    flag = "🇵🇾";
  } else if (
    value.groupLabel.toLowerCase().includes("uruguay") ||
    value.groupLabel.toLowerCase().includes("uruguayan")
  ) {
    flag = "🇺🇾";
  } else if (
    value.groupLabel.toLowerCase().includes("guyana") ||
    value.groupLabel.toLowerCase().includes("guyanese")
  ) {
    flag = "🇬🇾";
  } else if (
    value.groupLabel.toLowerCase().includes("suriname") ||
    value.groupLabel.toLowerCase().includes("surinamese")
  ) {
    flag = "🇸🇷";
  } else if (
    value.groupLabel.toLowerCase().includes("french guiana") ||
    value.groupLabel.toLowerCase().includes("french guianan")
  ) {
    flag = "🇬🇫";
  } else if (
    value.groupLabel.toLowerCase().includes("canada") ||
    value.groupLabel.toLowerCase().includes("canadian")
  ) {
    flag = "🇨🇦";
  } else if (
    value.groupLabel.toLowerCase().includes("mexico") ||
    value.groupLabel.toLowerCase().includes("mexican")
  ) {
    flag = "🇲🇽";
  } else if (
    value.groupLabel.toLowerCase().includes("united states") ||
    value.groupLabel.toLowerCase().includes("american")
  ) {
    flag = "🇺🇸";
  } else if (
    value.groupLabel.toLowerCase().includes("australia") ||
    value.groupLabel.toLowerCase().includes("australian")
  ) {
    flag = "🇦🇺";
  } else if (
    value.groupLabel.toLowerCase().includes("new zealand") ||
    value.groupLabel.toLowerCase().includes("new zealander")
  ) {
    flag = "🇳🇿";
  } else if (
    value.groupLabel.toLowerCase().includes("fiji") ||
    value.groupLabel.toLowerCase().includes("fijian")
  ) {
    flag = "🇫🇯";
  } else if (
    value.groupLabel.toLowerCase().includes("papua new guinea") ||
    value.groupLabel.toLowerCase().includes("papua new guinean")
  ) {
    flag = "🇵🇬";
  } else if (
    value.groupLabel.toLowerCase().includes("solomon islands") ||
    value.groupLabel.toLowerCase().includes("solomon islander")
  ) {
    flag = "🇸🇧";
  } else if (
    value.groupLabel.toLowerCase().includes("vanuatu") ||
    value.groupLabel.toLowerCase().includes("vanuatuan")
  ) {
    flag = "🇻🇺";
  } else if (
    value.groupLabel.toLowerCase().includes("new caledonia") ||
    value.groupLabel.toLowerCase().includes("new caledonian")
  ) {
    flag = "🇳🇨";
  } else if (
    value.groupLabel.toLowerCase().includes("french polynesia") ||
    value.groupLabel.toLowerCase().includes("french polynesian")
  ) {
    flag = "🇵🇫";
  } else if (
    value.groupLabel.toLowerCase().includes("samoa") ||
    value.groupLabel.toLowerCase().includes("samoan")
  ) {
    flag = "🇼🇸";
  } else if (
    value.groupLabel.toLowerCase().includes("tonga") ||
    value.groupLabel.toLowerCase().includes("tongan")
  ) {
    flag = "🇹🇴";
  } else if (
    value.groupLabel.toLowerCase().includes("kiribati") ||
    value.groupLabel.toLowerCase().includes("kiribati")
  ) {
    flag = "🇰🇮";
  } else if (
    value.groupLabel.toLowerCase().includes("tuvalu") ||
    value.groupLabel.toLowerCase().includes("tuvaluan")
  ) {
    flag = "🇹🇻";
  } else if (
    value.groupLabel.toLowerCase().includes("nauru") ||
    value.groupLabel.toLowerCase().includes("nauruan")
  ) {
    flag = "🇳🇷";
  } else if (
    value.groupLabel.toLowerCase().includes("palau") ||
    value.groupLabel.toLowerCase().includes("palauan")
  ) {
    flag = "🇵🇼";
  } else if (
    value.groupLabel.toLowerCase().includes("marshall islands") ||
    value.groupLabel.toLowerCase().includes("marshallese")
  ) {
    flag = "🇲🇭";
  } else if (
    value.groupLabel.toLowerCase().includes("micronesia") ||
    value.groupLabel.toLowerCase().includes("micronesian")
  ) {
    flag = "🇫🇲";
  } else if (
    value.groupLabel.toLowerCase().includes("northern mariana islands") ||
    value.groupLabel.toLowerCase().includes("northern mariana islander")
  ) {
    flag = "🇲🇵";
  } else if (
    value.groupLabel.toLowerCase().includes("guam") ||
    value.groupLabel.toLowerCase().includes("guamanian")
  ) {
    flag = "🇬🇺";
  } else if (
    value.groupLabel.toLowerCase().includes("american samoa") ||
    value.groupLabel.toLowerCase().includes("american samoan")
  ) {
    flag = "🇦🇸";
  } else if (
    value.groupLabel.toLowerCase().includes("cook islands") ||
    value.groupLabel.toLowerCase().includes("cook islander")
  ) {
    flag = "🇨🇰";
  } else if (
    value.groupLabel.toLowerCase().includes("niue") ||
    value.groupLabel.toLowerCase().includes("niuean")
  ) {
    flag = "🇳🇺";
  } else if (
    value.groupLabel.toLowerCase().includes("tokelau") ||
    value.groupLabel.toLowerCase().includes("tokelauan")
  ) {
    flag = "🇹🇰";
  } else if (
    value.groupLabel.toLowerCase().includes("pitcairn islands") ||
    value.groupLabel.toLowerCase().includes("pitcairn islander")
  ) {
    flag = "🇵🇳";
  } else if (
    value.groupLabel.toLowerCase().includes("wallis and futuna") ||
    value.groupLabel.toLowerCase().includes("wallisian") ||
    value.groupLabel.toLowerCase().includes("futunan")
  ) {
    flag = "🇼🇫";
  } else if (
    value.groupLabel.toLowerCase().includes("france") ||
    value.groupLabel.toLowerCase().includes("french")
  ) {
    flag = "🇫🇷";
  } else if (
    value.groupLabel.toLowerCase().includes("germany") ||
    value.groupLabel.toLowerCase().includes("german")
  ) {
    flag = "🇩🇪";
  } else if (
    value.groupLabel.toLowerCase().includes("italy") ||
    value.groupLabel.toLowerCase().includes("italian")
  ) {
    flag = "🇮🇹";
  } else if (
    value.groupLabel.toLowerCase().includes("spain") ||
    value.groupLabel.toLowerCase().includes("spanish")
  ) {
    flag = "🇪🇸";
  } else if (
    value.groupLabel.toLowerCase().includes("portugal") ||
    value.groupLabel.toLowerCase().includes("portuguese")
  ) {
    flag = "🇵🇹";
  } else if (
    value.groupLabel.toLowerCase().includes("netherlands") ||
    value.groupLabel.toLowerCase().includes("dutch")
  ) {
    flag = "🇳🇱";
  } else if (
    value.groupLabel.toLowerCase().includes("belgium") ||
    value.groupLabel.toLowerCase().includes("belgian")
  ) {
    flag = "🇧🇪";
  } else if (
    value.groupLabel.toLowerCase().includes("switzerland") ||
    value.groupLabel.toLowerCase().includes("swiss")
  ) {
    flag = "🇨🇭";
  } else if (
    value.groupLabel.toLowerCase().includes("austria") ||
    value.groupLabel.toLowerCase().includes("austrian")
  ) {
    flag = "🇦🇹";
  } else if (
    value.groupLabel.toLowerCase().includes("denmark") ||
    value.groupLabel.toLowerCase().includes("danish")
  ) {
    flag = "🇩🇰";
  } else if (
    value.groupLabel.toLowerCase().includes("norway") ||
    value.groupLabel.toLowerCase().includes("norwegian")
  ) {
    flag = "🇳🇴";
  } else if (
    value.groupLabel.toLowerCase().includes("sweden") ||
    value.groupLabel.toLowerCase().includes("swedish")
  ) {
    flag = "🇸🇪";
  } else if (
    value.groupLabel.toLowerCase().includes("finland") ||
    value.groupLabel.toLowerCase().includes("finnish")
  ) {
    flag = "🇫🇮";
  } else if (
    value.groupLabel.toLowerCase().includes("iceland") ||
    value.groupLabel.toLowerCase().includes("icelandic")
  ) {
    flag = "🇮🇸";
  } else if (
    value.groupLabel.toLowerCase().includes("ireland") ||
    value.groupLabel.toLowerCase().includes("irish")
  ) {
    flag = "🇮🇪";
  } else if (
    value.groupLabel.toLowerCase().includes("united kingdom") ||
    value.groupLabel.toLowerCase().includes("british")
  ) {
    flag = "🇬🇧";
  } else {
    flag = "🌐";
  }

  return (
    <SoftBox display="flex" alignItems="center">
      <SoftBox fontSize="1.5rem" mr={2}>
        {flag}
      </SoftBox>
      <SoftTypography variant="button" fontWeight="medium" textTransform="capitalize">
        {value.groupLabel}
      </SoftTypography>
    </SoftBox>
  );
}

FlagCell.propTypes = {
  value: PropTypes.object.isRequired,
};

function ActionsCell({ value, onDelete, disabled }) {
  return (
    <SoftBox display="flex" alignItems="center" justifyContent="center">
      <Tooltip title="Delete row" placement="top">
        <IconButton
          size="small"
          color="error"
          onClick={() => onDelete(value.id)}
          disabled={disabled}
          sx={{
            color: disabled ? "grey.500" : "error.main",
            "&:hover": {
              backgroundColor: "transparent",
            },
          }}
        >
          <Icon>delete</Icon>
        </IconButton>
      </Tooltip>
    </SoftBox>
  );
}

ActionsCell.propTypes = {
  value: PropTypes.object.isRequired,
  onDelete: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

function NationalityMixSection({ nationalityMix, onNationalityMixChange, disabled = false }) {
  const [newGroup, setNewGroup] = useState("");
  const [newPercentage, setNewPercentage] = useState("");

  const chartData = useMemo(() => {
    const colors = [
      "info",
      "primary",
      "secondary",
      "success",
      "warning",
      "error",
      "dark",
      "light",
      "info",
      "primary",
    ];

    return {
      labels: nationalityMix.map((item) => item.groupLabel),
      datasets: {
        label: "Participants from",
        backgroundColors: colors.slice(0, nationalityMix.length),
        data: nationalityMix.map((item) => item.percentage),
      },
    };
  }, [nationalityMix]);

  const totalPercentage = nationalityMix.reduce((sum, item) => sum + item.percentage, 0);

  const isTotalExceeded = totalPercentage > 100;

  const handlePercentageChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      const numValue = parseFloat(value);
      if (value === "" || (numValue >= 0 && numValue <= 100)) {
        setNewPercentage(value);
      }
    }
  };

  const handleAddMix = () => {
    if (!newGroup.trim() || !newPercentage.trim() || disabled) return;

    const percentage = parseFloat(newPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      alert("Please enter a valid percentage between 0 and 100");
      return;
    }

    const newTotalPercentage = totalPercentage + percentage;
    if (newTotalPercentage > 100) {
      alert(
        `Cannot add ${percentage}%. Total would exceed 100% (${newTotalPercentage}%). Please reduce existing percentages first.`
      );
      return;
    }

    const newMix = {
      id: Date.now(),
      group: newGroup.trim().toLowerCase().replace(/\s+/g, "_"),
      groupLabel: newGroup.trim(),
      percentage: percentage,
    };

    onNationalityMixChange([...nationalityMix, newMix]);
    setNewGroup("");
    setNewPercentage("");
  };

  const handleRemoveMix = (id) => {
    if (disabled) return;
    const updatedMix = nationalityMix.filter((item) => item.id !== id);
    onNationalityMixChange(updatedMix);
  };

  const handleEditPercentage = (id, newPercentage) => {
    if (disabled) return;

    const currentItem = nationalityMix.find((item) => item.id === id);
    const currentTotal = totalPercentage - currentItem.percentage;
    const newTotal = currentTotal + newPercentage;

    if (newTotal > 100) {
      alert(
        `Cannot set ${newPercentage}%. Total would exceed 100% (${newTotal}%). Please reduce other percentages first.`
      );
      return;
    }

    const updatedMix = nationalityMix.map((item) => {
      if (item.id === id) {
        return { ...item, percentage: newPercentage };
      }
      return item;
    });

    onNationalityMixChange(updatedMix);
  };

  const FlagCellWrapper = ({ value }) => {
    return <FlagCell value={value} />;
  };

  const EditablePercentageCellWrapper = ({ value, row }) => {
    return (
      <EditablePercentageCell
        value={value}
        onChange={(newValue) => handleEditPercentage(row.original.id, newValue)}
        disabled={disabled}
      />
    );
  };

  const ActionsCellWrapper = ({ value }) => {
    return <ActionsCell value={value} onDelete={handleRemoveMix} disabled={disabled} />;
  };

  FlagCellWrapper.propTypes = {
    value: PropTypes.object.isRequired,
  };

  EditablePercentageCellWrapper.propTypes = {
    value: PropTypes.number.isRequired,
    row: PropTypes.object.isRequired,
  };

  ActionsCellWrapper.propTypes = {
    value: PropTypes.object.isRequired,
  };

  const tableData = useMemo(() => {
    const columns = [
      {
        Header: "Region",
        accessor: "region",
        width: "50%",
        align: "left",
        Cell: FlagCellWrapper,
      },
      {
        Header: "Percentage",
        accessor: "percentage",
        width: "30%",
        align: "center",
        Cell: EditablePercentageCellWrapper,
      },
      {
        Header: "Actions",
        accessor: "actions",
        width: "20%",
        align: "center",
        Cell: ActionsCellWrapper,
      },
    ];

    const rows = nationalityMix.map((item) => ({
      id: item.id,
      region: { group: item.group, groupLabel: item.groupLabel },
      percentage: item.percentage,
      actions: item,
    }));

    return { columns, rows };
  }, [nationalityMix, disabled]);

  return (
    <>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Participants from
      </SoftTypography>

      {disabled && nationalityMix.length > 0 && (
        <SoftBox mb={4} p={3}>
          <UltimateDoughnutChart
            icon="people"
            title="Total Mix"
            count={`${totalPercentage}%`}
            chart={chartData}
            color="info"
            showLabelsInside={true}
            showLegend={true}
            cutout={60}
            borderWidth={3}
            size={280}
            animate={true}
          />
        </SoftBox>
      )}

      {!disabled && (
        <SoftBox mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                Nationality Name*
              </SoftTypography>
              <SoftInput
                placeholder="Country, e.g. Germany"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                disabled={disabled}
                type="text"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                Percentage*
              </SoftTypography>
              <SoftBox position="relative">
                <SoftInput
                  placeholder="% (required)"
                  value={newPercentage}
                  onChange={handlePercentageChange}
                  disabled={disabled}
                  type="text"
                  inputProps={{
                    maxLength: 5,
                  }}
                />
                <SoftBox
                  position="absolute"
                  right={12}
                  top="50%"
                  sx={{ transform: "translateY(-50%)" }}
                  color="text.secondary"
                >
                  %
                </SoftBox>
              </SoftBox>
            </Grid>
            <Grid item xs={12} sm={4}>
              <SoftBox display="flex" alignItems="center" sx={{ marginTop: "25px" }}>
                <SoftButton
                  variant="gradient"
                  color="info"
                  size="small"
                  onClick={handleAddMix}
                  disabled={disabled || !newGroup.trim() || !newPercentage.trim()}
                  startIcon={<Icon>add</Icon>}
                  fullWidth
                >
                  Add This Mix
                </SoftButton>
              </SoftBox>
            </Grid>
          </Grid>
        </SoftBox>
      )}

      {!disabled && nationalityMix.length > 0 && (
        <SoftBox>
          <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <SoftTypography variant="body2" fontWeight="medium">
              Current Mix:
            </SoftTypography>
            <SoftTypography variant="body2" fontWeight="medium" color="success.main">
              Total: {totalPercentage}%
            </SoftTypography>
          </SoftBox>
          <DataTable
            table={tableData}
            canSearch={false}
            showTotalEntries={false}
            isSorted={false}
            noEndBorder
            pagination={false}
            entriesPerPage={false}
          />
        </SoftBox>
      )}
    </>
  );
}

NationalityMixSection.propTypes = {
  nationalityMix: PropTypes.array.isRequired,
  onNationalityMixChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default NationalityMixSection;
