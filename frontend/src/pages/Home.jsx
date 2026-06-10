import React, { useState, useEffect, useMemo } from "react";
import {Card, Button, Spinner, Separator} from "@heroui/react"
import {
    Plus, Clock, Users, Activity, CloudAlert, TrendingUp, Briefcase, CalendarClock,
    ClipboardPenLine, Smile, ArrowRight, Construction
} from 'lucide-react'
import {useAuth} from "../contexts/AuthContext.tsx";
import {useNavigate, Navigate} from "react-router-dom";
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
        <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex justify-between items-end">
                <div>
                    <h1>Nástěnka</h1>
                    <p className="text-muted mt-1">
                        Vítejte zpět, {user?.fullName || user?.username}
                    </p>
                </div>
                <div className="flex gap-1 items-center">
                    <p className="text-lg font-semibold">{formatDate(today(getLocalTimeZone()).toString())}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col justify-center items-center py-32 gap-2">
                    <Spinner size="lg" />
                    <p className="text-sm text-foreground/60">Načítání nástěnky...</p>
                </div>
            ) : isSuperadmin ? (
                <div className="flex flex-col justify-center items-center text-center cursor-default flex-1">
                    <p className="text-warning text-2xl font-bold flex items-center justify-center gap-4"><Construction className="size-8" /> Zatím tady nic není <Construction className="size-8" /></p>
                </div>
            ) : (
                <>
                    {/* Statistiky */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-4">
                        {isCaregiver && (
                            <>
                                <Card>
                                    <Card.Content className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-accent/10 rounded-lg">
                                            <Activity className="w-6 h-6 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted">Výkony tento měsíc</p>
                                            <p className="text-2xl font-bold">{dashboard?.tasksPerformedCount ?? 0}</p>
                                        </div>
                                    </Card.Content>
                                </Card>
                                <Card>
                                    <Card.Content className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-success/10 rounded-lg">
                                            <Users className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted">Moji klienti</p>
                                            <p className="text-2xl font-bold">{dashboard?.myClientsCount ?? 0}</p>
                                        </div>
                                    </Card.Content>
                                </Card>
                                <Card className="col-span-2 lg:col-span-1">
                                    <Card.Content className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-secondary/10 rounded-lg">
                                            <Clock className="w-6 h-6 text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted">Hodin tento měsíc</p>
                                            <p className="text-2xl font-bold">
                                                {Math.floor((dashboard?.totalMonthMinutes ?? 0) / 60)}h {(dashboard?.totalMonthMinutes ?? 0) % 60}m
                                            </p>
                                        </div>
                                    </Card.Content>
                                </Card>
                            </>
                        )}
                        {isCoordinator && (
                            <>
                                <Card>
                                    <Card.Content className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-accent/10 rounded-lg">
                                            <Activity className="w-6 h-6 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted">Výkony tento měsíc</p>
                                            <p className="text-2xl font-bold">{dashboard?.tasksPerformedCount ?? 0}</p>
                                        </div>
                                    </Card.Content>
                                </Card>
                                <Card>
                                    <Card.Content className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-success/10 rounded-lg">
                                            <Users className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted">Klienti ve středisku</p>
                                            <p className="text-2xl font-bold">{dashboard?.clientCount ?? 0}</p>
                                        </div>
                                    </Card.Content>
                                </Card>
                                <Card className="col-span-2 lg:col-span-1">
                                    <Card.Content className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-secondary/10 rounded-lg">
                                            <TrendingUp className="w-6 h-6 text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted">Příjem tento měsíc</p>
                                            <p className="text-2xl font-bold">{(dashboard?.totalMonthlyIncome ?? 0).toLocaleString("cs-CZ")} Kč</p>
                                        </div>
                                    </Card.Content>
                                </Card>
                            </>
                        )}
                        {isAdmin && (
                            <>
                                <Card>
                                    <Card.Content className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-success/10 rounded-lg">
                                            <Users className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted">Aktivní klienti</p>
                                            <p className="text-2xl font-bold">{dashboard?.clientCount ?? 0}</p>
                                        </div>
                                    </Card.Content>
                                </Card>
                                <Card>
                                    <Card.Content className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-accent/10 rounded-lg">
                                            <Briefcase className="w-6 h-6 text-accent" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted">Zaměstnanci</p>
                                            <p className="text-2xl font-bold">{dashboard?.employeeCount ?? 0}</p>
                                        </div>
                                    </Card.Content>
                                </Card>
                                <Card className="col-span-2 lg:col-span-1">
                                    <Card.Content className="flex flex-row items-center gap-4">
                                        <div className="p-3 bg-secondary/10 rounded-lg">
                                            <TrendingUp className="w-6 h-6 text-secondary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted">Příjem tento měsíc</p>
                                            <p className="text-2xl font-bold">{(dashboard?.totalMonthlyIncome ?? 0).toLocaleString("cs-CZ")} Kč</p>
                                        </div>
                                    </Card.Content>
                                </Card>
                            </>
                        )}
                    </div>

                    <Card>
                        <Card.Header>
                            <h2 className="text-xl font-semibold">Rychlé akce</h2>
                        </Card.Header>
                        <Separator />
                        <Card.Content>
                            <div className="flex flex-wrap gap-3">
                                <Button variant="primary" onPress={() => navigate("/performed-tasks?openCreate=true")}><Plus className="w-4 h-4" /> Zaznamenat péči</Button>
                                {isCaregiver && (
                                    <>
                                        <Button variant="outline" onPress={() => navigate(`/clients?caregivers=${encodeURIComponent(user.fullName)}`)}><Users className="w-4 h-4" /> Moji klienti</Button>
                                    </>
                                )}
                                {isCoordinator && (
                                    <>
                                        <Button variant="secondary" onPress={() => navigate("/performed-tasks")}><Activity className="w-4 h-4" /> Záznamy péče</Button>
                                        <Button variant="outline" onPress={() => navigate("/clients")}><Users className="w-4 h-4" /> Klienti</Button>
                                    </>
                                )}
                                {isAdmin && (
                                    <>
                                        <Button variant="secondary" onPress={() => navigate("/performed-tasks")}><Activity className="w-4 h-4" /> Záznamy péče</Button>
                                        <Button variant="outline" onPress={() => navigate("/clients")}><Users className="w-4 h-4" /> Klienti</Button>
                                        <Button variant="outline" onPress={() => navigate("/employees")}><Briefcase className="w-4 h-4" /> Zaměstnanci</Button>
                                    </>
                                )}
                            </div>
                        </Card.Content>
                    </Card>

                    {/* Grafy */}
                    {(historyChartData || deptChartData) && (
                        <div className={deptChartData ? "grid lg:grid-cols-2 gap-6" : ""}>
                            {historyChartData && (
                                <Card>
                                    <Card.Header>
                                        <h2 className="text-xl font-semibold">
                                            {isCaregiver ? "Provedené úkony za posledních 6 měsíců" : "Příjmy za posledních 6 měsíců"}
                                        </h2>
                                    </Card.Header>
                                    <Separator />
                                    <Card.Content>
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
                                    </Card.Content>
                                </Card>
                            )}
                            {deptChartData && (
                                <Card>
                                    <Card.Header>
                                        <h2 className="text-xl font-semibold">Výkony podle středisek</h2>
                                    </Card.Header>
                                    <Separator />
                                    <Card.Content>
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
                                    </Card.Content>
                                </Card>
                            )}
                        </div>
                    )}

                    <div className={`grid gap-6 ${(isCaregiver || isCoordinator || isAdmin) ? "lg:grid-cols-2" : ""}`}>
                        <Card>
                            <Card.Header className="flex items-center gap-2">
                                <ClipboardPenLine className="size-7" />
                                <h2>Nedávné záznamy</h2>
                            </Card.Header>
                            <Separator />
                            <Card.Content>
                                {!dashboard?.recentPerformedTasks?.length ? (
                                    <p className="text-muted text-center py-4">Zatím žádné záznamy</p>
                                ) : (
                                    <div className="space-y-3">
                                        {dashboard.recentPerformedTasks.map((task) => (
                                            <div key={task.id} className="flex items-center justify-between p-3 bg-default rounded-lg">
                                                <div>
                                                    <p className="font-medium">{task.clientName}</p>
                                                    <p className="text-sm text-muted">{task.taskName} - {task.unitCount} {unitTypeTranslations[task.unitType]}</p>
                                                </div>
                                                <p className="text-sm text-muted">
                                                    {task.date && new Date(task.date).toDateString() === new Date().toDateString()
                                                        ? `Dnes ${formatTime(task.date)}`
                                                        : formatDate(task.date)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card.Content>
                        </Card>

                        {(isCaregiver || isCoordinator || isAdmin) && (
                            <Card>
                                <Card.Header className="flex items-center gap-2">
                                    <CalendarClock className="size-7" />
                                    <h2>Aktualizace individuálních plánů</h2>
                                </Card.Header>
                                <Separator />
                                <Card.Content>
                                    {!dashboard?.clientIPUpdates?.length ? (
                                        <p className="text-muted text-center py-4 flex items-center justify-center gap-2">Žádné blížící se aktualizace <Smile className="inline-block" /></p>
                                    ) : (
                                        <div className="space-y-3">
                                            {dashboard.clientIPUpdates.map((item) => {
                                                const overdue = new Date(item.plannedUpdateDate) < new Date(new Date().toDateString());
                                                return (
                                                    <div key={item.clientId} className={`flex items-center justify-between p-3 rounded-lg ${overdue ? "bg-danger/10" : "bg-default"}`}>
                                                        <p className="font-medium">{item.clientName}</p>
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-sm ${overdue ? "text-danger font-medium" : "text-muted"}`}>
                                                                {formatDate(item.plannedUpdateDate)}
                                                            </p>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
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
                                </Card.Content>
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
    if (!user) return <Navigate to="/login" replace />;
    if (user.role === ROLES.CLIENT) return <Navigate to="/monthly-report" replace />;
    return <DashboardContent />;
}

export default Home;