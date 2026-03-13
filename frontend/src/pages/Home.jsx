import React, { useState, useEffect, useMemo } from "react";
import logo from "../assets/ct_icon.svg"
import {Divider, Card, CardHeader, CardBody, Button, Spinner} from "@heroui/react"
import {
    User, Edit, FileText, Plus, Clock, Users, Activity, CloudAlert, TrendingUp, Briefcase, CalendarClock,
    ClipboardPenLine, Smile, ArrowRight
} from 'lucide-react'
import {useAuth} from "../contexts/AuthContext.tsx";
import {useNavigate} from "react-router-dom";
import {getLocalTimeZone, today} from "@internationalized/date";
import {formatDate, formatTime} from "../utils/formatters.js";
import {getJSON} from "../api/api.js";
import {showErrorToast} from "../utils/errorHandler.jsx";
import {BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid} from "recharts";
import {ROLES} from "../constants/roles.js";
import {MONTHS} from "../constants/globalConstants.js";
import {unitTypeTranslations} from "../constants/performedTaskConstants.js";

function getLast6MonthLabels() {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        return MONTHS[d.getMonth()];
    });
}

const MONTH_LABELS = getLast6MonthLabels();

function LandingPageContent() {
    return (
        <div className="flex flex-col justify-center items-center text-center cursor-default">
            <img
                src={logo}
                alt="CareTracker Logo"
                className="size-48 select-none"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
            />
            <h1 className="text-center mb-6">CareTracker</h1>
            <Divider className="w-1/2"/>
            <p className="text-xl text-primary font-medium text-center mt-6 mb-4">"Pomáháme pečovat s přehledem a jistotou"</p>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-10 text-start">
                <Card className="">
                    <CardHeader className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">Evidence klientů</h3>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <p>
                            Umožňuje vést přehled o klientech, jejich potřebách a historii
                            poskytované péče — vše bezpečně a přehledně na jednom místě.
                        </p>
                    </CardBody>
                </Card>
                <Card className="">
                    <CardHeader className="flex items-center gap-2">
                        <Edit className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">Záznam poskytnuté péče</h3>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <p>
                            Pečovatelé snadno zapisují provedené úkony a čas strávený u klientů,
                            bez nutnosti papírových výkazů.
                        </p>
                    </CardBody>
                </Card>
                <Card className="">
                    <CardHeader className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">Přehledy a reporty</h3>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <p>
                            Koordinátoři a vedoucí mají k dispozici měsíční souhrny a vyúčtování,
                            které lze exportovat do PDF nebo CSV.
                        </p>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

function DashboardContent() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const role = user?.role;

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(false);

    const historyChartData = useMemo(() => {
        const history = role === ROLES.CAREGIVER
            ? dashboard?.tasksPerformedCountHistory
            : dashboard?.monthlyIncomeHistory;
        if (!history?.length) return null;
        return history.map((value, i) => ({ month: MONTH_LABELS[i], value }));
    }, [dashboard, role]);

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

    const isCaregiver = role === ROLES.CAREGIVER;
    const isCoordinator = role === ROLES.COORDINATOR;
    const isAdmin = role === ROLES.ADMIN;
    const isSuperadmin = role === ROLES.SUPERADMIN;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1>Nástěnka</h1>
                    <p className="text-default-500 mt-1">
                        Vítejte zpět, {user?.fullName || user?.username}
                    </p>
                </div>
                <div className="flex gap-1 items-center">
                    <p className="text-lg font-semibold">{formatDate(today(getLocalTimeZone()).toString())}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-32">
                    <Spinner size="lg" label="Načítání nástěnky..." />
                </div>
            ) : isSuperadmin ? (
                <Card>
                    <CardBody className="py-10 text-center text-default-400">
                        Nástěnka pro superadministrátora zatím není k dispozici.
                    </CardBody>
                </Card>
            ) : (
                <>
                    {/* Statistiky */}
                    <div className="grid lg:grid-cols-3 gap-4">
                        {isCaregiver && (
                            <>
                                <Card>
                                    <CardBody className="flex flex-row items-center gap-4 p-4">
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
                                    <CardBody className="flex flex-row items-center gap-4 p-4">
                                        <div className="p-3 bg-success/10 rounded-lg">
                                            <Users className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Moji klienti</p>
                                            <p className="text-2xl font-bold">{dashboard?.myClientsCount ?? 0}</p>
                                        </div>
                                    </CardBody>
                                </Card>
                                <Card>
                                    <CardBody className="flex flex-row items-center gap-4 p-4">
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
                                    <CardBody className="flex flex-row items-center gap-4 p-4">
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
                                    <CardBody className="flex flex-row items-center gap-4 p-4">
                                        <div className="p-3 bg-success/10 rounded-lg">
                                            <Users className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Klienti ve středisku</p>
                                            <p className="text-2xl font-bold">{dashboard?.clientCount ?? 0}</p>
                                        </div>
                                    </CardBody>
                                </Card>
                                <Card>
                                    <CardBody className="flex flex-row items-center gap-4 p-4">
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
                                    <CardBody className="flex flex-row items-center gap-4 p-4">
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
                                    <CardBody className="flex flex-row items-center gap-4 p-4">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Briefcase className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-default-500">Zaměstnanci</p>
                                            <p className="text-2xl font-bold">{dashboard?.employeeCount ?? 0}</p>
                                        </div>
                                    </CardBody>
                                </Card>
                                <Card>
                                    <CardBody className="flex flex-row items-center gap-4 p-4">
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

                    {/* Rychlé akce */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Rychlé akce</h2>
                        </CardHeader>
                        <Divider />
                        <CardBody>
                            <div className="flex flex-wrap gap-3">
                                {isCaregiver && (
                                    <>
                                        <Button color="primary" startContent={<Plus className="w-4 h-4" />} onPress={() => navigate("/performed-tasks?openCreate=true")}>
                                            Zaznamenat péči
                                        </Button>
                                        <Button color="default" variant="bordered" startContent={<Users className="w-4 h-4" />} onPress={() => navigate(`/clients?caregivers=${encodeURIComponent(user.fullName)}`)}>
                                            Moji klienti
                                        </Button>
                                    </>
                                )}
                                {isCoordinator && (
                                    <>
                                        <Button color="primary" startContent={<Activity className="w-4 h-4" />} onPress={() => navigate("/performed-tasks")}>
                                            Záznamy péče
                                        </Button>
                                        <Button color="default" variant="bordered" startContent={<Users className="w-4 h-4" />} onPress={() => navigate("/clients")}>
                                            Klienti
                                        </Button>
                                    </>
                                )}
                                {isAdmin && (
                                    <>
                                        <Button color="primary" startContent={<Activity className="w-4 h-4" />} onPress={() => navigate("/performed-tasks")}>
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
                                            {isCaregiver ? "Provedené úkony za posledních 6 měsíců" : "Příjmy za posledních 6 měsíců"}
                                        </h2>
                                    </CardHeader>
                                    <Divider />
                                    <CardBody>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={historyChartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "currentColor" }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 12, fill: "currentColor" }} axisLine={false} tickLine={false} width={40} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: "8px", border: "none", padding: "8px 12px 0 12px", backgroundColor: "hsl(var(--heroui-background) / 0.5)" }}
                                                    formatter={(v) => [isCaregiver ? `${v}` : `${v.toLocaleString("cs-CZ")} Kč`]}
                                                    cursor={false}
                                                />
                                                <Bar dataKey="value" fill="hsl(var(--heroui-primary))" radius={[4, 4, 0, 0]} />
                                            </BarChart>
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

                    {/* Spodní sekce */}
                    <div className={`grid gap-6 ${(isCaregiver || isCoordinator) ? "lg:grid-cols-2" : ""}`}>
                        {/* Nedávné záznamy */}
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

                        {/* Aktualizace individuálních plánů (CAREGIVER + COORDINATOR) */}
                        {(isCaregiver || isCoordinator) && (
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
    const { user } = useAuth();
    return user ? <DashboardContent /> : <LandingPageContent />;
}

export default Home;