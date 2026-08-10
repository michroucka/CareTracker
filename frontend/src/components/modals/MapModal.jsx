import {Button, Modal, ModalBody, ModalContent, ModalHeader} from "@heroui/react";
import {Home, Map as MapIcon, Plane} from "lucide-react";
import {useEffect, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

class LogoControl {
    onAdd() {
        this._container = document.createElement("div");
        this._container.className = "maplibregl-ctrl";
        this._container.innerHTML =
            '<a href="http://mapy.com/" target="_blank"><img width="100px" src="https://api.mapy.com/img/api/logo.svg"></a>';
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
    }
}

function createHouseMarkerElement() {
    const el = document.createElement("div");
    el.className = "flex size-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-md";
    createRoot(el).render(<Home className="size-4" strokeWidth={2.5} />);
    return el;
}

export function MapModal({ isOpen, onClose, latitude, longitude }) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const [mapView, setMapView] = useState("basic");

    useEffect(() => {
        if (!isOpen || !mapContainerRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            center: [longitude, latitude],
            zoom: 15,
            style: {
                version: 8,
                sources: {
                    "basic-tiles": {
                        type: "raster",
                        url: `https://api.mapy.com/v1/maptiles/basic/tiles.json?apikey=${import.meta.env.VITE_MAPY_API_KEY}`,
                        tileSize: 256,
                    },
                    "aerial-tiles": {
                        type: "raster",
                        url: `https://api.mapy.com/v1/maptiles/aerial/tiles.json?apikey=${import.meta.env.VITE_MAPY_API_KEY}`,
                        tileSize: 256,
                    },
                },
                layers: [
                    { id: "basic-layer", type: "raster", source: "basic-tiles" },
                    { id: "aerial-layer", type: "raster", source: "aerial-tiles", layout: { visibility: "none" } },
                ],
            },
        });

        map.addControl(new LogoControl(), "bottom-left");
        new maplibregl.Marker({ element: createHouseMarkerElement() })
            .setLngLat([longitude, latitude])
            .addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [isOpen, latitude, longitude]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const applyVisibility = () => {
            map.setLayoutProperty("basic-layer", "visibility", mapView === "basic" ? "visible" : "none");
            map.setLayoutProperty("aerial-layer", "visibility", mapView === "aerial" ? "visible" : "none");
        };

        if (map.isStyleLoaded()) {
            applyVisibility();
        } else {
            map.once("load", applyVisibility);
        }
    }, [mapView]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="outside">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">Adresa na mapě</ModalHeader>
                <ModalBody className="pb-6">
                    <div className="relative">
                        <div ref={mapContainerRef} className="h-96 w-full rounded-lg" />
                        <Button
                            isIconOnly
                            size="sm"
                            color="primary"
                            className="absolute top-2 right-2 z-10"
                            onPress={() => setMapView((prev) => (prev === "basic" ? "aerial" : "basic"))}
                        >
                            {mapView === "basic" ? <Plane className="size-4" /> : <MapIcon className="size-4" />}
                        </Button>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}