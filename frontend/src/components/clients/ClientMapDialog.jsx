import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { IconHome, IconMap, IconPlaneTilt } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useValueChange } from "@/hooks/useValueChange";

const tilesUrl = (layer) => `https://api.mapy.com/v1/maptiles/${layer}/tiles.json?apikey=${import.meta.env.VITE_MAPY_API_KEY}`;

class LogoControl {
    onAdd() {
        this._container = document.createElement("div");
        this._container.className = "maplibregl-ctrl";
        this._container.innerHTML = '<a href="http://mapy.com/" target="_blank"><img width="100px" src="https://api.mapy.com/img/api/logo.svg"></a>';
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
    }
}

function createHouseMarkerElement() {
    const element = document.createElement("div");
    element.className = "flex size-8 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-md";
    createRoot(element).render(<IconHome className="size-4" stroke={2.5} />);
    return element;
}

/** Client's home on a Mapy.com map, switchable between the basic and aerial layer. */
export function ClientMapDialog({ open, onOpenChange, latitude, longitude, address }) {
    const [container, setContainer] = useState(null);
    const mapRef = useRef(null);
    const [mapView, setMapView] = useState("basic");
    // every opening starts on the basic map
    useValueChange(open, (isOpen) => {
        if (isOpen) setMapView("basic");
    });

    // the dialog mounts its content after opening, so the map waits for the container callback ref
    useEffect(() => {
        if (!open || !container) return undefined;

        const map = new maplibregl.Map({
            container,
            center: [longitude, latitude],
            zoom: 15,
            style: {
                version: 8,
                sources: {
                    "basic-tiles": { type: "raster", url: tilesUrl("basic"), tileSize: 256 },
                    "aerial-tiles": { type: "raster", url: tilesUrl("aerial"), tileSize: 256 },
                },
                layers: [
                    { id: "basic-layer", type: "raster", source: "basic-tiles" },
                    { id: "aerial-layer", type: "raster", source: "aerial-tiles", layout: { visibility: "none" } },
                ],
            },
        });
        map.addControl(new LogoControl(), "bottom-left");
        new maplibregl.Marker({ element: createHouseMarkerElement() }).setLngLat([longitude, latitude]).addTo(map);
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [open, container, latitude, longitude]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const applyVisibility = () => {
            map.setLayoutProperty("basic-layer", "visibility", mapView === "basic" ? "visible" : "none");
            map.setLayoutProperty("aerial-layer", "visibility", mapView === "aerial" ? "visible" : "none");
        };
        if (map.isStyleLoaded()) applyVisibility();
        else map.once("load", applyVisibility);
    }, [mapView]);

    const isAerial = mapView === "aerial";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Adresa na mapě</DialogTitle>
                    <DialogDescription>{address}</DialogDescription>
                </DialogHeader>
                <div className="relative">
                    <div ref={setContainer} className="h-96 w-full overflow-hidden rounded-lg" />
                    <Button
                        size="icon-sm"
                        variant="outline"
                        className="absolute top-2 right-2 z-10 bg-card shadow-md dark:bg-card dark:hover:bg-accent"
                        aria-label={isAerial ? "Základní mapa" : "Letecká mapa"}
                        onClick={() => setMapView(isAerial ? "basic" : "aerial")}
                    >
                        {isAerial ? <IconMap /> : <IconPlaneTilt />}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
