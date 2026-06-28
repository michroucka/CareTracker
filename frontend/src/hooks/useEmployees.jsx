import {useRef, useState} from "react";
import {getJSON, postJSON, putJSON} from "../api/api.js";
import { showErrorToast } from "../utils/errorHandler.jsx";
import {CloudAlert, UserRoundCheck, UserRoundX, MailCheck, MailX} from "lucide-react";
import { sortByKey } from "../utils/sorting.js";
import { toast } from "@heroui/react";

export function useEmployees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const abortControllerRef = useRef(null);
    const filtersRef = useRef({});

    function mapEmployee(employee) {
        return ({
            ...employee,
            fullName: `${employee.firstName} ${employee.lastName}`
        });
    }

    function mapEmployees(employees) {
        return employees.map((employee) => mapEmployee(employee));
    }

    const fetchEmployees = async (filters = {}, { silent = false } = {}) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            filtersRef.current = filters;
            if (!silent) {
                setEmployees([]);
                setLoading(true);
            }

            const params = new URLSearchParams();

            if (filters.organizationId) {
                params.append("organizationId", filters.organizationId);
            }

            if (filters.status !== undefined && filters.status !== null) {
                params.append("status", filters.status);
            }

            if (filters.departmentIds && filters.departmentIds.length > 0) {
                filters.departmentIds.forEach((departmentId) => {
                    params.append("departmentIds", departmentId);
                })
            }

            const queryString = params.toString();
            const url = queryString ? `/employees?${queryString}` : "/employees";
            const employees = await getJSON(url, { signal: controller.signal });

            // Add fullName field
            const mappedEmployees = mapEmployees(employees);
            const sorted = sortByKey(mappedEmployees, 'lastName', 'ascending');
            setEmployees(sorted);

            if (!silent) setLoading(false);
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log("Request was cancelled");
                return;
            }

            console.error("Error fetching employees:", err);
            showErrorToast(err, "Chyba při načítání zaměstnanců", { icon: <CloudAlert /> });
            if (!silent) setLoading(false);
        }
    };

    const fetchEmployee = async (id) => {
        try {
            return await getJSON(`/employees/${id}`);
        } catch (err) {
            console.error("Error fetching employee:", err);
            showErrorToast(err, "Zaměstnanec nenalezen", {icon: <UserRoundX />});
            throw err;
        }
    };

    const createEmployee = async (employeeData) => {
        try {
            const newEmployee = await postJSON("/employees", employeeData);
            const mappedEmployee = mapEmployee(newEmployee);

            setEmployees(prev =>
                sortByKey([...prev, mappedEmployee], 'lastName', 'ascending')
            );

            toast.success("Zaměstnanec úspěšně vytvořen", { indicator: <UserRoundCheck /> });

            return newEmployee;
        } catch (err) {
            console.error("Error creating employee:", err);
            showErrorToast(err, "Chyba při vytváření zaměstnance", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const updateEmployee = async (id, updatedData) => {
        try {
            const updated = await putJSON(`/employees/${id}`, updatedData);

            fetchEmployees(filtersRef.current, { silent: true });

            toast.success("Zaměstnanec úspěšně aktualizován", { indicator: <UserRoundCheck /> });

            return updated;
        } catch (err) {
            console.error("Error updating employee:", err);
            showErrorToast(err, "Chyba při aktualizaci zaměstnance", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const terminateEmployee = async (id) => {
        try {
            const updated = await putJSON(`/employees/${id}/terminate`);

            fetchEmployees(filtersRef.current, { silent: true });

            toast.success("Zaměstnanec úspěšně deaktivován", { indicator: <UserRoundCheck /> });

            return updated;
        } catch (err) {
            console.error("Error terminating employee:", err);
            showErrorToast(err, "Chyba při deaktivaci zaměstnance", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const activateEmployee = async (id) => {
        try {
            const updated = await putJSON(`/employees/${id}/activate`);

            fetchEmployees(filtersRef.current, { silent: true });

            toast.success("Zaměstnanec úspěšně aktivován", { indicator: <UserRoundCheck /> });

            return updated;
        } catch (err) {
            console.error("Error activating client:", err);
            showErrorToast(err, "Chyba při aktivaci zaměstnance", { icon: <UserRoundX /> });
            throw err;
        }
    };

    const resendActivationEmail = async (id) => {
        try {
            const response = await postJSON(`/employees/${id}/resend`);

            if (response.success) {
                toast.success(response.message, { indicator: <MailCheck /> });
            } else {
                toast.danger(response.message, { indicator: <MailX /> });
            }
        } catch (err) {
            console.error("Error resending activation email:", err);
            showErrorToast(err, "Chyba při odesílání aktivačního emailu", { icon: <MailX /> });
            throw err;
        }
    }

    return {
        employees,
        setEmployees,
        loading,
        fetchEmployees,
        fetchEmployee,
        createEmployee,
        updateEmployee,
        terminateEmployee,
        activateEmployee,
        resendActivationEmail
    };
}
