import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import { useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftDatePicker from "components/SoftDatePicker";
import SoftButton from "components/SoftButton";
import Icon from "@mui/material/Icon";
import { formatDateOnlyGB } from "utils/dateUtils";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const SKILL_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const skillLevelLabel = (value) =>
  SKILL_LEVEL_OPTIONS.find((opt) => opt.value === String(value || "").toLowerCase())?.label ||
  value ||
  "—";

function StudentInfo({
  travelers,
  userId,
  userFirstName,
  userLastName,
  isEditMode = false,
  onStudentChange,
}) {
  const navigate = useNavigate();

  const getStudentName = () => {
    if (userFirstName) {
      return userLastName ? `${userFirstName} ${userLastName}` : userFirstName;
    }
    return "Participant";
  };

  const handleNameClick = () => {
    if (userId) {
      navigate(`/users/view/${userId}`);
    }
  };
  const renderStudentInfo = (student, index) => (
    <SoftBox key={index}>
      <SoftBox display="flex" flexDirection="column" gap={2.5}>
        <SoftBox>
          <SoftTypography
            variant="body2"
            color="dark"
            fontWeight="bold"
            sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
          >
            Participant:
          </SoftTypography>
          <SoftBox
            display="flex"
            alignItems="center"
            gap={1}
            onClick={handleNameClick}
            sx={{
              backgroundColor: "#F7F6FB",
              borderRadius: "6px",
              padding: "6px 10px",
              border: "1px solid #F1EDFF",
              cursor: userId ? "pointer" : "default",
              "&:hover": {
                backgroundColor: userId ? "#F1EDFF" : "#F7F6FB",
                borderColor: userId ? "#6D4AFF" : "#F1EDFF",
              },
            }}
          >
            <Icon sx={{ color: "#6D4AFF", fontSize: "16px" }}>person</Icon>
            <SoftTypography
              variant="body2"
              color="info"
              sx={{
                fontWeight: "500",
                fontSize: "0.875rem",
              }}
            >
              {getStudentName()}
            </SoftTypography>
            {userId && (
              <Icon sx={{ color: "#6D4AFF", fontSize: "14px", marginLeft: "auto" }}>
                open_in_new
              </Icon>
            )}
          </SoftBox>
        </SoftBox>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <SoftBox>
              <SoftTypography
                variant="body2"
                color="dark"
                fontWeight="bold"
                sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
              >
                Email:
              </SoftTypography>
              <SoftTypography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.875rem", fontWeight: "400", wordBreak: "break-all" }}
              >
                {student?.email || "—"}
              </SoftTypography>
            </SoftBox>
          </Grid>

          <Grid item xs={12} md={6}>
            <SoftBox>
              <SoftTypography
                variant="body2"
                color="dark"
                fontWeight="bold"
                sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
              >
                Phone Number:
              </SoftTypography>
              {isEditMode ? (
                <SoftInput
                  value={student?.phoneNumber || student?.phone || ""}
                  onChange={(e) =>
                    onStudentChange && onStudentChange(index, "phoneNumber", e.target.value)
                  }
                  placeholder="Enter phone number"
                  disabled={!isEditMode}
                />
              ) : (
                <SoftTypography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                >
                  {student?.phoneNumber || student?.phone || "—"}
                </SoftTypography>
              )}
            </SoftBox>
          </Grid>

          <Grid item xs={12} md={6}>
            <SoftBox>
              <SoftTypography
                variant="body2"
                color="dark"
                fontWeight="bold"
                sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
              >
                Skill level:
              </SoftTypography>
              {isEditMode ? (
                <SoftSelect
                  value={
                    SKILL_LEVEL_OPTIONS.find(
                      (opt) => opt.value === String(student?.skillLevel || "").toLowerCase()
                    ) || null
                  }
                  onChange={(option) =>
                    onStudentChange && onStudentChange(index, "skillLevel", option?.value || "")
                  }
                  options={SKILL_LEVEL_OPTIONS}
                  placeholder="Select skill level"
                  isClearable
                />
              ) : (
                <SoftTypography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                >
                  {skillLevelLabel(student?.skillLevel)}
                </SoftTypography>
              )}
            </SoftBox>
          </Grid>

          <Grid item xs={12} md={6}>
            <SoftBox>
              <SoftTypography
                variant="body2"
                color="dark"
                fontWeight="bold"
                sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
              >
                Gender:
              </SoftTypography>
              {isEditMode ? (
                <SoftSelect
                  value={
                    GENDER_OPTIONS.find((opt) => {
                      const studentGender = student?.gender || "";
                      const genderMap = {
                        "Male": "male",
                        "Female": "female",
                        "Undisclosed": "other",
                      };
                      const mappedGender = genderMap[studentGender] || studentGender.toLowerCase();
                      return opt.value === mappedGender || opt.value === studentGender.toLowerCase();
                    }) || null
                  }
                  onChange={(option) =>
                    onStudentChange && onStudentChange(index, "gender", option?.value || "")
                  }
                  options={GENDER_OPTIONS}
                  placeholder="Select gender"
                  isClearable
                  disabled={!isEditMode}
                />
              ) : (
                <SoftTypography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                >
                  {(() => {
                    const gender = student?.gender || "";
                    const genderMap = {
                      "Male": "Male",
                      "Female": "Female",
                      "Undisclosed": "Undisclosed",
                      "male": "Male",
                      "female": "Female",
                      "other": "Other",
                    };
                    return genderMap[gender] || gender || "—";
                  })()}
                </SoftTypography>
              )}
            </SoftBox>
          </Grid>

          <Grid item xs={12} md={6}>
            <SoftBox>
              <SoftTypography
                variant="body2"
                color="dark"
                fontWeight="bold"
                sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
              >
                Date of Birth:
              </SoftTypography>
              {isEditMode ? (
                <SoftDatePicker
                  value={
                    student?.birthDate || student?.dateOfBirth
                      ? new Date(student.birthDate || student.dateOfBirth)
                      : null
                  }
                  onChange={(date) => {
                    if (date && date[0]) {
                      const d = date[0];
                      const year = d.getFullYear();
                      const month = String(d.getMonth() + 1).padStart(2, "0");
                      const day = String(d.getDate()).padStart(2, "0");
                      const dateValue = `${year}-${month}-${day}`;
                      onStudentChange && onStudentChange(index, "birthDate", dateValue);
                    } else {
                      onStudentChange && onStudentChange(index, "birthDate", "");
                    }
                  }}
                  options={{
                    dateFormat: "Y-m-d",
                    altInput: true,
                    altFormat: "F j, Y",
                    locale: "en",
                  }}
                  input={{ placeholder: "Select date of birth" }}
                  disabled={!isEditMode}
                />
              ) : (
                <SoftTypography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                >
                  {student?.birthDate || student?.dateOfBirth
                    ? formatDateOnlyGB(student.birthDate || student.dateOfBirth) || "—"
                    : "—"}
                </SoftTypography>
              )}
            </SoftBox>
          </Grid>
        </Grid>

        <SoftBox>
          <SoftTypography
            variant="body2"
            color="dark"
            fontWeight="bold"
            sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
          >
            Nationality:
          </SoftTypography>
          <SoftTypography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "0.875rem", fontWeight: "400" }}
          >
            {student?.nationality || "—"}
          </SoftTypography>
        </SoftBox>

        <SoftBox sx={{ borderTop: "1px solid #e0e0e0", marginTop: "16px", paddingTop: "16px" }}>
          <SoftTypography
            variant="body1"
            color="dark"
            fontWeight="bold"
            sx={{ fontSize: "1rem", marginBottom: "12px" }}
          >
            Emergency Contact
          </SoftTypography>

          {isEditMode ? (
            <SoftBox display="flex" flexDirection="column" gap={2}>
              <SoftBox>
                <SoftTypography
                  variant="body2"
                  color="dark"
                  fontWeight="bold"
                  sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                >
                  Full Name:
                </SoftTypography>
                <SoftInput
                  value={
                    typeof student?.emergencyContact === "string"
                      ? ""
                      : student?.emergencyContact?.fullName || ""
                  }
                  onChange={(e) => {
                    const currentContact = typeof student?.emergencyContact === "string"
                      ? { fullName: "", phoneNumber: "", relationship: "" }
                      : (student?.emergencyContact || { fullName: "", phoneNumber: "", relationship: "" });
                    onStudentChange && onStudentChange(index, "emergencyContact", {
                      ...currentContact,
                      fullName: e.target.value,
                    });
                  }}
                  placeholder="Enter full name"
                  disabled={!isEditMode}
                />
              </SoftBox>

              <SoftBox>
                <SoftTypography
                  variant="body2"
                  color="dark"
                  fontWeight="bold"
                  sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                >
                  Phone Number:
                </SoftTypography>
                <SoftInput
                  value={
                    typeof student?.emergencyContact === "string"
                      ? ""
                      : student?.emergencyContact?.phoneNumber || ""
                  }
                  onChange={(e) => {
                    const currentContact = typeof student?.emergencyContact === "string"
                      ? { fullName: "", phoneNumber: "", relationship: "" }
                      : (student?.emergencyContact || { fullName: "", phoneNumber: "", relationship: "" });
                    onStudentChange && onStudentChange(index, "emergencyContact", {
                      ...currentContact,
                      phoneNumber: e.target.value,
                    });
                  }}
                  placeholder="Enter phone number"
                  disabled={!isEditMode}
                />
              </SoftBox>

              <SoftBox>
                <SoftTypography
                  variant="body2"
                  color="dark"
                  fontWeight="bold"
                  sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                >
                  Relationship:
                </SoftTypography>
                <SoftInput
                  value={
                    typeof student?.emergencyContact === "string"
                      ? ""
                      : student?.emergencyContact?.relationship || ""
                  }
                  onChange={(e) => {
                    const currentContact = typeof student?.emergencyContact === "string"
                      ? { fullName: "", phoneNumber: "", relationship: "" }
                      : (student?.emergencyContact || { fullName: "", phoneNumber: "", relationship: "" });
                    onStudentChange && onStudentChange(index, "emergencyContact", {
                      ...currentContact,
                      relationship: e.target.value,
                    });
                  }}
                  placeholder="Enter relationship"
                  disabled={!isEditMode}
                />
              </SoftBox>
            </SoftBox>
          ) : (
            <SoftBox display="flex" flexDirection="column" gap={2}>
              {student?.emergencyContact &&
                student.emergencyContact.fullName &&
                student.emergencyContact.fullName !== "Text" &&
                student.emergencyContact.phoneNumber &&
                student.emergencyContact.phoneNumber !== "Text" && (
                  <>
                    <SoftBox>
                      <SoftTypography
                        variant="body2"
                        color="dark"
                        fontWeight="bold"
                        sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                      >
                        Full Name:
                      </SoftTypography>
                      <SoftTypography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                      >
                        {student?.emergencyContact?.fullName || "—"}
                      </SoftTypography>
                    </SoftBox>

                    <SoftBox>
                      <SoftTypography
                        variant="body2"
                        color="dark"
                        fontWeight="bold"
                        sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                      >
                        Phone Number:
                      </SoftTypography>
                      <SoftTypography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                      >
                        {student?.emergencyContact?.phoneNumber || "—"}
                      </SoftTypography>
                    </SoftBox>

                    <SoftBox>
                      <SoftTypography
                        variant="body2"
                        color="dark"
                        fontWeight="bold"
                        sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                      >
                        Relationship:
                      </SoftTypography>
                      <SoftTypography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                      >
                        {student?.emergencyContact?.relationship || "—"}
                      </SoftTypography>
                    </SoftBox>
                  </>
                )}
              {(!student?.emergencyContact ||
                (typeof student.emergencyContact === "string" && !student.emergencyContact) ||
                (!student.emergencyContact.fullName && !student.emergencyContact.phoneNumber)) && (
                <SoftTypography variant="body2" color="text.secondary">
                  {typeof student?.emergencyContact === "string" && student.emergencyContact
                    ? student.emergencyContact
                    : "No emergency contact"}
                </SoftTypography>
              )}
            </SoftBox>
          )}
        </SoftBox>
      </SoftBox>
    </SoftBox>
  );

  return (
    <Card sx={{ display: "flex", flexDirection: "column" }}>
      <SoftBox p={3} sx={{ display: "flex", flexDirection: "column" }}>
        <SoftTypography variant="h6" fontWeight="medium" mb={3}>
          Participant
        </SoftTypography>

        <SoftBox>
          {travelers.length > 0 ? renderStudentInfo(travelers[0], 0) : renderStudentInfo(null, 0)}
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

StudentInfo.propTypes = {
  travelers: PropTypes.array.isRequired,
  userId: PropTypes.string,
  userFirstName: PropTypes.string,
  userLastName: PropTypes.string,
  isEditMode: PropTypes.bool,
  onStudentChange: PropTypes.func,
};

export default StudentInfo;
