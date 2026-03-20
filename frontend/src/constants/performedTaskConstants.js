export const columns = [
    {name: "KLIENT", key: "client"},
    {name: "ÚKON", key: "task"},
    {name: "POČET", key: "unitCount"},
    {name: "DATUM", key: "date", sortable: true},
    {name: "CENA", key: "price"},
    {name: "AKCE", key: "actions"},
];

export const unitTypeTranslations = {
    "HOUR": "min",
    "OCCURRENCE": "úkon",
    "KM": "km",
    "KG": "kg",
}

export const calculatePrice = (task, unitCount) => {
    if (task?.unitType === "HOUR") {
        return Math.round(unitCount * task?.unitPrice / 60);
    }

    return task ? Math.round(unitCount * task?.unitPrice) : 0;
}