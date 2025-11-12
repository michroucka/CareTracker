import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import {BrowserRouter} from "react-router-dom";
import {HeroUIProvider, ToastProvider} from "@heroui/react";
import Layout from "./layout";
import App from "./App";
import "../styles/index.css";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <HeroUIProvider>
                <Layout>
                    <App />
                </Layout>
                <div className="fixed z-[100]">
                    <ToastProvider placement="top-center" toastOffset={70}/>
                </div>
            </HeroUIProvider>
        </BrowserRouter>
    </StrictMode>
);
