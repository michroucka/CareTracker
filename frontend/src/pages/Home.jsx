import React, { useState, useEffect, useMemo } from "react";
import {Card, CardHeader, CardBody, Button, Spinner, Divider} from "@heroui/react"
import {
    Plus, Clock, Users, Activity, CloudAlert, TrendingUp, Briefcase, CalendarClock,
    ClipboardPenLine, Smile, ArrowRight, Construction
} from 'lucide-react'
import {useAuth} from "../contexts/AuthContext.tsx";
import {useNavigate, Navigate} from "react-router-dom";
import {getLocalTimeZone, now, today} from "@internationalized/date";
import {formatDate, formatDateTime, formatTime} from "../utils/formatters.js";
import {getJSON} from "../api/api.js";
import {showErrorToast} from "../utils/errorHandler.jsx";
import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line} from "recharts";
import {ROLES} from "../constants/roles.js";
import {MONTHS} from "../constants/globalConstants.js";
import {unitTypeTranslations} from "../constants/performedTaskConstants.js";
import {useIsDesktop} from "../hooks/useMediaQuery.js";

function getLast12MonthLabels() {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        return MONTHS[d.getMonth()];
    });
}

const MONTH_LABELS = getLast12MonthLabels();


function DashboardContent() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const role = user?.role;
    const isDesktop = useIsDesktop();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);

    const historyChartData = useMemo(() => {
        const history = role === ROLES.CAREGIVER
            ? dashboard?.tasksPerformedCountHistory
            : dashboard?.monthlyIncomeHistory;
        if (!history?.length) return null;
        const labels = isDesktop ? MONTH_LABELS : MONTH_LABELS.slice(-6);
        const values = isDesktop ? history : history.slice(-6);
        return values.map((value, i) => ({ month: labels[i], value }));
    }, [dashboard, role, isDesktop]);

    const deptChartData = useMemo(() => {
        const counts = dashboard?.tasksPerformedByDepartment;
        if (!counts?.length) return null;
        return counts.map(item => ({ dept: item.departmentName, value: item.performedTasksCount }));
    }, [dashboard]);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const data = await getJSON("/dashboard");
            setDashboard(data);
        } catch (err) {
            console.error("Error fetching dashboard:", err);
            showErrorToast(err, "Chyba při načítání nástěnky", { icon: <CloudAlert /> });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const msToNextMinute = 60000 - (Date.now() % 60000);
        const timeout = setTimeout(() => {
            setNow(new Date());
            const interval = setInterval(() => setNow(new Date()), 60000);
            return () => clearInterval(interval);
        }, msToNextMinute);
        return () => clearTimeout(timeout);
    }, []);

    const isCaregiver = role === ROLES.CAREGIVER;
    const isCoordinator = role === ROLES.COORDINATOR;
    const isAdmin = role === ROLES.ADMIN;
    const isSuperadmin = role === ROLES.SUPERADMIN;

    return (
        <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex justify-between items-end">
                <div>
                    <h1>Nástěnka</h1>
                    <p className="text-default-500 mt-1">
                        Vítejte zpět, {user?.fullName || user?.username}!
                    </p>
                </div>
                <div className="flex gap-1 items-center">
                    <p className="text-lg font-semibold">{formatDateTime(now)}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <Spinner size="lg" label="Načítání nástěnky..." />
                </div>
            ) : isSuperadmin ? (
                <div className="flex flex-col justify-center items-center text-center cursor-default flex-1">
                    <p className="text-warning-100 text-2xl font-bold flex items-center justify-center gap-4"><Construction className="size-8" /> Zatím tady nic není <Construction className="size-8" /></p>
                </div>
            ) : (
                <>
                    {/* Statistiky */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
                        {isCaregiver && (
                            <>
                                <Card>
                                    <CardBody className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Activity className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Výkony tento měsíc</p>
                                            <p className="text-2xl font-bold">{dashboard?.tasksPerformedCount ?? 0}</p>
                                        </div>
                                    </CardBody>
                                </Card>
                                <Card>
                                    <CardBody className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-success/10 rounded-lg">
                                            <Users className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Moji klienti</p>
                                            <p className="text-2xl font-bold">{dashboard?.myClientsCount ?? 0}</p>
                                        </div>
                                    </CardBody>
                                </Card>
                                <Card className="col-span-2 lg:col-span-1">
                                    <CardBody className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-secondary/10 rounded-lg">
                                            <Clock className="w-6 h-6 text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Hodin tento měsíc</p>
                                            <p className="text-2xl font-bold">
                                                {Math.floor((dashboard?.totalMonthMinutes ?? 0) / 60)}h {(dashboard?.totalMonthMinutes ?? 0) % 60}m
                                            </p>
                                        </div>
                                    </CardBody>
                                </Card>
                            </>
                        )}
                        {isCoordinator && (
                            <>
                                <Card>
                                    <CardBody className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Activity className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Výkony tento měsíc</p>
                                            <p className="text-2xl font-bold">{dashboard?.tasksPerformedCount ?? 0}</p>
                                        </div>
                                    </CardBody>
                                </Card>
                                <Card>
                                    <CardBody className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-success/10 rounded-lg">
                                            <Users className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Klienti ve středisku</p>
                                            <p className="text-2xl font-bold">{dashboard?.clientCount ?? 0}</p>
                                        </div>
                                    </CardBody>
                                </Card>
                                <Card className="col-span-2 lg:col-span-1">
                                    <CardBody className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-secondary/10 rounded-lg">
                                            <TrendingUp className="w-6 h-6 text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Příjem tento měsíc</p>
                                            <p className="text-2xl font-bold">{(dashboard?.totalMonthlyIncome ?? 0).toLocaleString("cs-CZ")} Kč</p>
                                        </div>
                                    </CardBody>
                                </Card>
                            </>
                        )}
                        {isAdmin && (
                            <>
                                <Card>
                                    <CardBody className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-success/10 rounded-lg">
                                            <Users className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Aktivní klienti</p>
                                            <p className="text-2xl font-bold">{dashboard?.clientCount ?? 0}</p>
                                        </div>
                                    </CardBody>
                                </Card>
                                <Card>
                                    <CardBody className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Briefcase className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Zaměstnanci</p>
                                            <p className="text-2xl font-bold">{dashboard?.employeeCount ?? 0}</p>
                                        </div>
                                    </CardBody>
                                </Card>
                                <Card className="col-span-2 lg:col-span-1">
                                    <CardBody className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-secondary/10 rounded-lg">
                                            <TrendingUp className="w-6 h-6 text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Příjem tento měsíc</p>
                                            <p className="text-2xl font-bold">{(dashboard?.totalMonthlyIncome ?? 0).toLocaleString("cs-CZ")} Kč</p>
                                        </div>
                                    </CardBody>
                                </Card>
                            </>
                        )}
                    </div>

                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Rychlé akce</h2>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                            <div className="flex flex-wrap gap-3">
                                <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={() => navigate("/performed-tasks?openCreate=true")}>
                                    Zaznamenat péči
                                </Button>
                                {isCaregiver && (
                                    <>
                                        <Button color="default" variant="bordered" startContent={<Users className="w-4 h-4" />} onPress={() => navigate(`/clients?caregivers=${encodeURIComponent(user.fullName)}`)}>
                                            Moji klienti
                                        </Button>
                                    </>
                                )}
                                {isCoordinator && (
                                    <>
                                        <Button color="secondary" startContent={<Activity className="w-4 h-4" />} onPress={() => navigate("/performed-tasks")}>
                                            Záznamy péče
                                        </Button>
                                        <Button color="default" variant="bordered" startContent={<Users className="w-4 h-4" />} onPress={() => navigate("/clients")}>
                                            Klienti
                                        </Button>
                                    </>
                                )}
                                {isAdmin && (
                                    <>
                                        <Button color="secondary" startContent={<Activity className="w-4 h-4" />} onPress={() => navigate("/performed-tasks")}>
                                            Záznamy péče
                                        </Button>
                                        <Button color="default" variant="bordered" startContent={<Users className="w-4 h-4" />} onPress={() => navigate("/clients")}>
                                            Klienti
                                        </Button>
                                        <Button color="default" variant="bordered" startContent={<Briefcase className="w-4 h-4" />} onPress={() => navigate("/employees")}>
                                            Zaměstnanci
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Grafy */}
                    {(historyChartData || deptChartData) && (
                        <div className={deptChartData ? "grid lg:grid-cols-2 gap-6" : ""}>
                            {historyChartData && (
                                <Card>
                                    <CardHeader>
                                        <h2 className="text-xl font-semibold">
                                            {isCaregiver ? `Provedené úkony za posledních ${isDesktop ? "12" : "6"} měsíců` : `Příjmy za posledních ${isDesktop ? "12" : "6"} měsíců`}
                                        </h2>
                                    </CardHeader>
                                    <Divider />
                                    <CardBody>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <LineChart
                                                data={historyChartData}
                                                margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                    stroke="rgba(128,128,128,0.2)"
                                                />
                                                <XAxis
                                                    dataKey="month"
                                                    tick={{ fontSize: 12, fill: "currentColor" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 12, fill: "currentColor" }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width="auto"
                                                    tickFormatter={(v) => isCaregiver ? `${v}` : `${v.toLocaleString("cs-CZ")} Kč`}
                                                />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: "8px", border: "none", padding: "8px 12px 0 12px", backgroundColor: "hsl(var(--heroui-background) / 0.5)" }}
                                                    formatter={(v) => [isCaregiver ? `${v}` : `${v.toLocaleString("cs-CZ")} Kč`]}
                                                    cursor={false}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="hsl(var(--heroui-primary))"
                                                    strokeWidth={2}
                                                    dot={{ r: 3 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardBody>
                                </Card>
                            )}
                            {deptChartData && (
                                <Card>
                                    <CardHeader>
                                        <h2 className="text-xl font-semibold">Výkony podle středisek</h2>
                                    </CardHeader>
                                    <Divider />
                                    <CardBody>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={deptChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                                                <XAxis dataKey="dept" tick={{ fontSize: 12, fill: "currentColor" }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 12, fill: "currentColor" }} axisLine={false} tickLine={false} width={40} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
                                                    formatter={(v) => [v, "Výkony"]}
                                                    cursor={false}
                                                />
                                                <Bar dataKey="value" fill="hsl(var(--heroui-secondary))" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardBody>
                                </Card>
                            )}
                        </div>
                    )}

                    <div className={`grid gap-6 ${(isCaregiver || isCoordinator || isAdmin) ? "lg:grid-cols-2" : ""}`}>
                        <Card>
                            <CardHeader className="flex items-center gap-2">
                                <ClipboardPenLine className="size-7" />
                                <h2>Nedávné záznamy</h2>
                            </CardHeader>
                            <Divider />
                            <CardBody>
                                {!dashboard?.recentPerformedTasks?.length ? (
                                    <p className="text-default-400 text-center py-4">Zatím žádné záznamy</p>
                                ) : (
                                    <div className="space-y-3">
                                        {dashboard.recentPerformedTasks.map((task) => (
                                            <div key={task.id} className="flex items-center justify-between p-3 bg-default-100 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{task.clientName}</p>
                                                    <p className="text-sm text-default-500">{task.taskName} - {task.unitCount} {unitTypeTranslations[task.unitType]}</p>
                                                </div>
                                                <p className="text-sm text-default-400">
                                                    {task.date && new Date(task.date).toDateString() === new Date().toDateString()
                                                        ? `Dnes ${formatTime(task.date)}`
                                                        : formatDate(task.date)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>

                        {(isCaregiver || isCoordinator || isAdmin) && (
                            <Card>
                                <CardHeader className="flex items-center gap-2">
                                    <CalendarClock className="size-7" />
                                    <h2>Aktualizace individuálních plánů</h2>
                                </CardHeader>
                                <Divider />
                                <CardBody>
                                    {!dashboard?.clientIPUpdates?.length ? (
                                        <p className="text-default-400 text-center py-4 flex items-center justify-center gap-2">Žádné blížící se aktualizace <Smile className="inline-block" /></p>
                                    ) : (
                                        <div className="space-y-3">
                                            {dashboard.clientIPUpdates.map((item) => {
                                                const overdue = new Date(item.plannedUpdateDate) < new Date(new Date().toDateString());
                                                return (
                                                    <div key={item.clientId} className={`flex items-center justify-between p-3 rounded-lg ${overdue ? "bg-danger/10" : "bg-default-100"}`}>
                                                        <p className="font-medium">{item.clientName}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-sm ${overdue ? "text-danger font-medium" : "text-default-400"}`}>
                                                                {formatDate(item.plannedUpdateDate)}
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                variant="light"
                                                                onPress={() => navigate(`/clients/${item.clientId}/individual-plan`)}
                                                                isIconOnly
                                                                startContent={<ArrowRight className="size-4" />}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function Home() {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spinner size="lg" variant="gradient" label="Načítání..." />
            </div>
        );
    }
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === ROLES.CLIENT) return <Navigate to="/monthly-report" replace />;
    return <DashboardContent />;
}

export default Home;