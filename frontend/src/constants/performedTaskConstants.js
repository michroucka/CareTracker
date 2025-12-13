export const columns = [
    {name: "DATUM", key: "date", sortable: true},
    {name: "ÚKON", key: "task"},
    {name: "KLIENT", key: "client"},
    {name: "POČET", key: "unitCount"},
    {name: "AKCE", key: "actions"},
];

export const unitTypeTranslations = {
    "HOUR": "Hodina",
    "OCCURRENCE": "Úkon",
    "KM": "Km",
    "KG": "Kg",
}