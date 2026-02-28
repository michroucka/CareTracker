import logo from "../assets/ct_icon.svg"
import {Divider, Card, CardHeader, CardBody, Button} from "@heroui/react"
import {User, Edit, FileText, Plus, Clock, Users, Activity} from 'lucide-react'
import {useAuth} from "../contexts/AuthContext.tsx";
import {useNavigate} from "react-router-dom";
import {getLocalTimeZone, today} from "@internationalized/date";
import {formatDate} from "../utils/formatters.js";

function LandingPageContent() {
    return (
        <div className="flex flex-col justify-center items-center text-center cursor-default">
            <img
                src={logo}
                alt="CareTracker Logo"
                className="size-64 select-none"
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

    // TODO: Načíst data z API
    const stats = {
        totalPerformedTasks: 0,
        totalClients: 0,
        totalHours: 0
    };

    const recentTasks = [
        // TODO: Načíst nedávné záznamy z API
        // Příklad struktury:
        // { id: 1, clientName: "Jan Novák", taskName: "Osobní hygiena", date: "2024-01-15T10:30:00" }
    ];

    const myClients = [
        // TODO: Načíst moje klienty z API
        // Příklad struktury:
        // { id: 1, firstName: "Jan", lastName: "Novák", active: true }
    ];

    return (
        <div className="space-y-6">
            {/* Uvítání */}
            <div className="flex justify-between items-end">
                <div>
                    <h1>Nástěnka</h1>
                    <p className="text-default-500 mt-1">
                        Vítejte zpět, {user?.username}
                    </p>
                </div>
                <div className="flex gap-1 items-center">
                    <p className="text-lg font-semibold">{formatDate(today(getLocalTimeZone()).toString())}</p>
                </div>
            </div>

            {/* Statistiky */}
            <div className="grid md:grid-cols-3 gap-4">
                <Card>
                    <CardBody className="flex flex-row items-center gap-4 p-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <Activity className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Výkony tento měsíc</p>
                            <p className="text-2xl font-bold">{stats.totalPerformedTasks}</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="flex flex-row items-center gap-4 p-4">
                        <div className="p-3 bg-success/10 rounded-lg">
                            <Users className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Moji klienti</p>
                            <p className="text-2xl font-bold">{stats.totalClients}</p>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody className="flex flex-row items-center gap-4 p-4">
                        <div className="p-3 bg-warning/10 rounded-lg">
                            <Clock className="w-6 h-6 text-warning" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Hodin tento měsíc</p>
                            <p className="text-2xl font-bold">{stats.totalHours}h</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Rychlé akce */}
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold">Rychlé akce</h2>
                </CardHeader>
                <Divider />
                <CardBody>
                    <div className="flex flex-wrap gap-3">
                        <Button
                            color="primary"
                            startContent={<Plus className="w-4 h-4" />}
                            onPress={() => navigate("/performed-tasks")}
                        >
                            Zaznamenat péči
                        </Button>
                        <Button
                            color="default"
                            variant="bordered"
                            startContent={<Users className="w-4 h-4" />}
                            onPress={() => navigate("/clients")}
                        >
                            Moji klienti
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Grid pro nedávné záznamy a moje klienty */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Nedávné záznamy */}
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Nedávné záznamy</h2>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        {recentTasks.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                Zatím žádné záznamy
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {recentTasks.map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div>
                                            <p className="font-medium">{task.clientName}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {task.taskName}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {/* TODO: Formátovat datum */}
                                            {task.date}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Moji klienti */}
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Moji klienti</h2>
                        <Button
                            size="sm"
                            variant="light"
                            onPress={() => navigate("/clients")}
                        >
                            Zobrazit vše
                        </Button>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        {myClients.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                                Zatím žádní klienti
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {myClients.map((client) => (
                                    <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">
                                                    {client.firstName} {client.lastName}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {client.active ? "Aktivní" : "Neaktivní"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}

function Home() {
    const { user } = useAuth();
    return user ? <DashboardContent /> : <LandingPageContent />;
};

export default Home;
