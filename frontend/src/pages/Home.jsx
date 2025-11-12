import logo from "../assets/ct_icon.png"
import {Divider, Card, CardHeader, CardBody} from "@heroui/react"
import {UserIcon, PencilSquareIcon, DocumentTextIcon} from '@heroicons/react/24/solid'

function Home() {
    return (
        <div className="flex flex-col justify-center items-center text-center cursor-pointer">
            <img src={logo} alt="Logo" className="w-64 -mb-6" />
            <h1 className="text-center mb-6">CareTracker</h1>
            <Divider className="w-1/2"/>
            <p className="text-xl text-primary font-medium text-center mt-6 mb-4">"Pomáháme pečovat s přehledem a jistotou"</p>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-10 text-start">
                <Card className="">
                    <CardHeader className="flex items-center gap-2">
                        <UserIcon className="w-5 h-5" />
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
                        <PencilSquareIcon className="w-5 h-5" />
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
                        <DocumentTextIcon className="w-5 h-5" />
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

export default Home;
