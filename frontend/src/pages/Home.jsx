import logo from "../assets/ct_icon.png"
import {Divider} from "@heroui/react"

function Home() {
    return (
        <div className="flex flex-col justify-center items-center text-center sm:w-1/2 mx-auto my-12 ">
            <img src={logo} alt="Logo" className="w-64 -mb-6" />
            <h1 className="text-4xl text-foreground font-bold text-center mb-6">CareTracker</h1>
            <Divider className="w-1/2"/>
            <p className="text-xl text-primary font-medium text-center mt-6 mb-4">"Pomáháme pečovat s přehledem a jistotou"</p>
            <div className="grid md:grid-cols-3 gap-6 mt-10 text-start">
                <div className="p-4 border rounded-lg shadow-sm">
                    <h3 className="font-semibold text-lg mb-2">Evidence klientů</h3>
                    <p>Umožňuje vést přehled o klientech, jejich potřebách a historii poskytované péče — vše bezpečně a přehledně na jednom místě.</p>
                </div>
                <div className="p-4 border rounded-lg shadow-sm">
                    <h3 className="font-semibold text-lg mb-2">Záznam poskytnuté péče</h3>
                    <p>Pečovatelé snadno zapisují provedené úkony a čas strávený u klientů, bez nutnosti papírových výkazů.</p>
                </div>
                <div className="p-4 border rounded-lg shadow-sm ">
                    <h3 className="font-semibold text-lg mb-2">Přehledy a reporty</h3>
                    <p>Koordinátoři a vedoucí mají k dispozici měsíční souhrny a vyúčtování, které lze exportovat do PDF nebo CSV.</p>
                </div>
            </div>

        </div>
    );
}

export default Home;
