import React from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import { usePerformedTasks } from "../hooks/usePerformedTasks.jsx";
import { MIN_YEAR } from "../constants/globalConstants.js";
import { unitTypeTranslations } from "../constants/performedTaskConstants.js";
import { formatDateTime, formatNumber } from "../utils/formatters.js";
import { fetchImage } from "../api/api.js";
import {
    Button,
    Modal,
    Spinner,
    Table,
} from "@heroui/react";
import MonthYearPicker from "../components/MonthYearPicker.jsx";
import {useIsMobile} from "../hooks/useMediaQuery.js";
import {sortByKey} from "../utils/sorting.js";
import {Eye, QrCode} from "lucide-react";
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

    const [qrCodeUrl, setQrCodeUrl] = React.useState(null);
    const [isQrModalOpen, setIsQrModalOpen] = React.useState(false);
    const [isLoadingQr, setIsLoadingQr] = React.useState(false);
    const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);
    const [selectedPerformedTask, setSelectedPerformedTask] = React.useState(null);

    const [sortDescriptor, setSortDescriptor] = React.useState({
        column: "date",
        direction: "descending",
    });
    const isMobile = useIsMobile();

    const getInitialMonthYearFilter = () => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const monthParam = Number(searchParams.get("month"));
        const yearParam = Number(searchParams.get("year"));
        const month = (monthParam >= 1 && monthParam <= 12) ? monthParam - 1 : currentMonth;
        const year = (yearParam >= MIN_YEAR && yearParam <= currentYear) ? yearParam : currentYear;
        return { month, year };
    };

    const [monthYearFilter, setMonthYearFilter] = React.useState(getInitialMonthYearFilter);

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

    React.useEffect(() => {
        if (!user?.clientId) return;
        fetchPerformedTasks({
            clientId: user.clientId,
            month: monthYearFilter.month,
            year: monthYearFilter.year,
        });
    }, [monthYearFilter, user]);

    React.useEffect(() => {
        setQrCodeUrl(null);
    }, [monthYearFilter]);


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

    const handleOpenQrModal = async () => {
        setIsQrModalOpen(true);
        if (qrCodeUrl) return;
        setIsLoadingQr(true);
        const month = monthYearFilter.month + 1;
        const { year } = monthYearFilter;
        try {
            const url = await fetchImage(`/performed-tasks/payment-qr?clientId=${user.clientId}&month=${month}&year=${year}`);
            setQrCodeUrl(url);
        } catch {
            setIsQrModalOpen(false);
        } finally {
            setIsLoadingQr(false);
        }
    };

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
                    <Button isIconOnly size="sm" variant="ghost" onPress={() => handleOpenDetailModal(performedTask.id)}>
                        <Eye size={20} />
                    </Button>
                )
            default:
                return performedTask[columnKey] || "-";
        }
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex justify-between gap-3 items-end mb-4">
                <span className="text-sm">
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

                {topContent}
                <Table variant="secondary">
                    <Table.ScrollContainer>
                        <Table.Content
                            aria-label="Měsíční přehled úkonů"
                            sortDescriptor={sortDescriptor}
                            onSortChange={setSortDescriptor}
                        >
                            <Table.Header columns={columns}>
                                {(column) => (
                                    <Table.Column
                                        key={column.key}
                                        id={column.key}
                                        className={column.key === "detail" ? "text-end" : ""}
                                        isRowHeader={column.key === "date"}
                                    >
                                        {column.name}
                                    </Table.Column>
                                )}
                            </Table.Header>
                            <Table.Body
                                items={loading ? [] : performedTasks}
                                renderEmptyState={() => (
                                    loading ? (
                                        <div className="flex flex-col items-center gap-2 mt-72">
                                            <Spinner />
                                            <p className="text-sm text-foreground/60">Načítání přehledu...</p>
                                        </div>
                                    ) : (
                                        <p>V tomto měsíci nebyly provedeny žádné úkony</p>
                                    )
                                )}
                            >
                                {(item) => (
                                    <Table.Row key={item.id} id={item.id} columns={columns}>
                                        {(column) =>
                                            <Table.Cell className="py-1">
                                                {renderCell(item, column.key)}
                                            </Table.Cell>
                                        }
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table.Content>
                    </Table.ScrollContainer>
                </Table>

                {!loading && performedTasks.length > 0 && (
                    <div className="flex justify-between items-end">
                        <Button variant="ghost" onPress={handleOpenQrModal}><QrCode className="size-4.5" /> QR Platba</Button>
                        <span className="text-lg font-semibold">
                            Celkem: {formatNumber(totalPrice)} Kč
                        </span>
                    </div>
                )}
            </div>

            <Modal>
                <Modal.Backdrop isOpen={isQrModalOpen} onOpenChange={(open) => !open && setIsQrModalOpen(false)}>
                    <Modal.Container size="sm">
                        <Modal.Dialog>
                            <Modal.CloseTrigger />
                            <Modal.Body className="flex items-center justify-center py-6">
                                {isLoadingQr ? <Spinner size="md" /> : <img src={qrCodeUrl} alt="QR platba" width={300} height={300} />}
                            </Modal.Body>
                        </Modal.Dialog>
                    </Modal.Container>
                </Modal.Backdrop>
            </Modal>

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
