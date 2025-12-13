export const columns = [
    {name: "KLIENT", key: "client"},
    {name: "ÚKON", key: "task"},
    {name: "POČET", key: "unitCount"},
    {name: "DATUM", key: "date", sortable: true},
    {name: "AKCE", key: "actions"},
];

export const unitTypeTranslations = {
    "HOUR": "Min",
    "OCCURRENCE": "Úkon",
    "KM": "Km",
    "KG": "Kg",
}

export const calculatePrice = (performedTask) => {
    if (performedTask.task.unitType === "HOUR") {
        // Pro časové úkony: minuty → hodiny → cena
        return (performedTask.unitCount / 60) * performedTask.task.unitPrice;
    }
    // Pro ostatní: přímý výpočet
    return performedTask.unitCount * performedTask.task.unitPrice;
}