export const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  CONSULTANT: "consultant",
};

export const ROLE_LABELS = {
  [ADMIN_ROLES.SUPER_ADMIN]: "Super Admin",
  [ADMIN_ROLES.ADMIN]: "Admin",
  [ADMIN_ROLES.CONSULTANT]: "Consultant",
};

export const ROLE_OPTIONS = [
  { value: ADMIN_ROLES.SUPER_ADMIN, label: ROLE_LABELS[ADMIN_ROLES.SUPER_ADMIN] },
  { value: ADMIN_ROLES.ADMIN, label: ROLE_LABELS[ADMIN_ROLES.ADMIN] },
  { value: ADMIN_ROLES.CONSULTANT, label: ROLE_LABELS[ADMIN_ROLES.CONSULTANT] },
];
