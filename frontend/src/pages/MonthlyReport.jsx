import React from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import { usePerformedTasks } from "../hooks/usePerformedTasks.jsx";
import { minYear } from "../constants/globalConstants.js";
import { unitTypeTranslations } from "../constants/performedTaskConstants.js";
import { formatDateTime, formatNumber } from "../utils/formatters.js";
import {
    Button,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
} from "@heroui/react";
import MonthYearPicker from "../components/MonthYearPicker.jsx";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {sortByKey} from "../utils/sorting.js";
import {Eye} from "lucide-react";
import {PerformedTaskDetailModal} from "../components/modals/performedTask/PerformedTaskDetailModal.jsx";

const columns = [
    { name: "DATUM", key: "date" },
    { name: "ÚKON", key: "task" },
    { name: "POČET", key: "unitCount" },
    { name: "CENA", key: "price" },
    { name: "DETAIL", key: "detail" },
];

function MonthlyReport() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const { performedTasks, loading, fetchPerformedTasks, fetchPerformedTask } = usePerformedTasks();

    const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const [selectedPerformedTask, setSelectedPerformedTask] = React.useState(null);

    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "date",
        direction: "descending",
    });
    const [maxTableHeight, setMaxTableHeight] = React.useState("calc(100dvh - 16rem)");
    const isMobile = useIsMobile();

    const getInitialMonthYearFilter = () => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const monthParam = Number(searchParams.get("month"));
        const yearParam = Number(searchParams.get("year"));
        const month = (monthParam >= 1 && monthParam <= 12) ? monthParam - 1 : currentMonth;
        const year = (yearParam >= minYear && yearParam <= currentYear) ? yearParam : currentYear;
        return { month, year };
    };

    const [monthYearFilter, setMonthYearFilter] = React.useState(getInitialMonthYearFilter);

    // Filtrované sloupce pro mobile - jen jméno a akce
    const visibleColumns = React.useMemo(() => {
        if (isMobile) {
            return columns.filter(col => ["date", "task", "detail"].includes(col.key));
        }
        return columns;
    }, [isMobile]);

    const sortedItems = React.useMemo(() => {
        return sortByKey(performedTasks, sortDescriptor.column, sortDescriptor.direction);
    }, [sortDescriptor, performedTasks]);

    // Synchronizovat month/year do URL
    React.useEffect(() => {
        const params = new URLSearchParams();
        params.set("month", monthYearFilter.month + 1);
        params.set("year", monthYearFilter.year);
        setSearchParams(params, { replace: true });
    }, [monthYearFilter]);

    // Načíst provedené úkony při změně filtru
    React.useEffect(() => {
        if (!user?.clientId) return;
        fetchPerformedTasks({
            clientId: user.clientId,
            month: monthYearFilter.month,
            year: monthYearFilter.year,
        });
    }, [monthYearFilter, user]);

    React.useEffect(() => {
        setMaxTableHeight(isMobile ? "calc(100dvh - 13rem)" : "calc(100dvh - 16rem)");
    }, [isMobile]);

    const totalPrice = React.useMemo(() => {
        return performedTasks.reduce((sum, task) => sum + (task.price || 0), 0);
    }, [performedTasks]);

    async function handleSelectPerformedTask(performedTaskId) {
        try {
            const performedTaskData = await fetchPerformedTask(performedTaskId);
            setSelectedPerformedTask(performedTaskData);
        } catch (error) {
            console.error("Failed to load performed task:", error);
            throw error;
        }
    }

    const handleOpenDetailModal = async (taskId) => {
        setIsLoadingDetail(true);
        setIsDetailModalOpen(true);

        try {
            await handleSelectPerformedTask(taskId);
        } catch {
            setIsDetailModalOpen(false);
        }

        setIsLoadingDetail(false);
    }

    const handleCloseDetailModal = () => {
        setSelectedPerformedTask(null);
        setIsDetailModalOpen(false);
    }

    const renderCell = React.useCallback((performedTask, columnKey) => {
        switch (columnKey) {
            case "date":
                return formatDateTime(performedTask.date);
            case "task":
                return performedTask.taskName;
            case "unitCount":
                return `${formatNumber(performedTask.unitCount)} ${unitTypeTranslations[performedTask.unitType] || "-"}`;
            case "price":
                return `${formatNumber(performedTask.price)} Kč`;
            case "detail":
                return (
                    <Button isIconOnly size="sm" variant="light" onPress={() => handleOpenDetailModal(performedTask.id)}>
                        <Eye size={20} />
                    </Button>
                )
            default:
                return performedTask[columnKey] || "-";
        }
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex justify-between gap-3 items-end">
                <span className="text-small">
                        Celkem {performedTasks.length} {performedTasks.length === 1 ? "úkon" : performedTasks.length >= 2 && performedTasks.length <= 4 ? "úkony" : "úkonů"}
                </span>
                <MonthYearPicker
                    onChange={setMonthYearFilter}
                    defaultValue={monthYearFilter}
                />
            </div>
        )
    }, [monthYearFilter, performedTasks.length]);

    return (
        <>
            <div className="flex flex-col gap-6">
                <div className="text-center">
                    <h1>Měsíční přehled</h1>
                </div>

                <Table
                    isHeaderSticky
                    aria-label="Měsíční přehled úkonů"
                    maxTableHeight={maxTableHeight}
                    sortDescriptor={sortDescriptor}
                    topContent={topContent}
                    topContentPlacement="outside"
                    onSortChange={setSortDescriptor}
                >
                    <TableHeader columns={columns}>
                        {(column) => (
                            <TableColumn
                                key={column.key}
                                align={column.key === "detail" ? "end" : "start"}
                            >
                                {column.name}
                            </TableColumn>
                        )}
                    </TableHeader>
                    <TableBody
                        isLoading={loading}
                        loadingContent={<Spinner label="Načítání přehledu..." />}
                        emptyContent="V tomto měsíci nebyly provedeny žádné úkony"
                        items={performedTasks}
                    >
                        {(item) => (
                            <TableRow key={item.id}>
                                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {!loading && performedTasks.length > 0 && (
                    <span className="text-large font-semibold self-end">
                        Celkem: {formatNumber(totalPrice)} Kč
                    </span>
                )}

                {/* TODO: QR kód pro platbu */}
            </div>

            <PerformedTaskDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                isLoading={isLoadingDetail}
                performedTask={selectedPerformedTask}
                readOnly
            />
        </>
    );
}

export default MonthlyReport;
