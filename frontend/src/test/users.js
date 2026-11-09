const employee = (role, employeeRole, overrides = {}) => ({
    isLoggedIn: true,
    username: `${role.toLowerCase()}@caretracker.test`,
    role,
    employeeRole,
    fullName: 'Jana Testová',
    employeeId: 10,
    organizationId: 1,
    departmentId: 2,
    pictureId: null,
    ...overrides,
});

export const caregiver = (overrides) => employee('CAREGIVER', 'CAREGIVER', overrides);
export const coordinator = (overrides) => employee('COORDINATOR', 'COORDINATOR', overrides);
export const admin = (overrides) => employee('ADMIN', 'MANAGER', overrides);

export const superadmin = (overrides = {}) => ({
    isLoggedIn: true,
    username: 'superadmin@caretracker.test',
    role: 'SUPERADMIN',
    fullName: 'Super Admin',
    ...overrides,
});

export const client = (overrides = {}) => ({
    isLoggedIn: true,
    username: 'client@caretracker.test',
    role: 'CLIENT',
    fullName: 'Karel Klient',
    clientId: 20,
    ...overrides,
});
