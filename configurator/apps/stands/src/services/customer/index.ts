export {
    DEFAULT_CUSTOMER_PROJECT_PERMISSIONS,
    isCustomer,
    isCustomerProjectAccess,
    normalizeCustomerProjectPermissions,
    type AssignProjectToCustomerInput,
    type CreateCustomerInput,
    type Customer,
    type CustomerProjectAccess,
    type CustomerProjectPermissions,
    type CustomerProjectSummary
} from "./CustomerModel";
export {
    buildPortalPath,
    buildPortalProjectPath,
    buildPortalProjectUrl,
    isPortalPath,
    parsePortalProjectId
} from "./portalRouting";
export {
    LocalCustomerStorage,
    localCustomerStorage,
    mergeAssignProjectInput,
    type CustomerStorage
} from "./CustomerStorage";
export { SupabaseCustomerStorage } from "./SupabaseCustomerStorage";
export {
    CustomerService,
    assignProjectToCustomer,
    createCustomer,
    customerService,
    deleteCustomer,
    getCustomerProjects,
    listCustomers,
    removeProjectAccess
} from "./CustomerService";
