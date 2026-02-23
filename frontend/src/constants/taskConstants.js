export const columns = [
    {name: "NÁZEV", key: "name", sortable: true},
    {name: "CENA", key: "unitPrice"},
    {name: "JEDNOTKA", key: "unitType"},
    {name: "DVOJITÉ SETKÁNÍ", key: "doubleMeeting"},
    {name: "AKCE", key: "actions"},
];

export const unitTypeTranslations = {
    "HOUR": "hod",
    "OCCURRENCE": "úkon",
    "KM": "km",
    "KG": "kg",
}

export const unitTypeLabels = {
    "HOUR": "Hodina",
    "OCCURRENCE": "Úkon",
    "KM": "Km",
    "KG": "Kg",
}

export const unitTypeOptions = [
    {name: "Hodina", key: "HOUR"},
    {name: "Úkon", key: "OCCURRENCE"},
    {name: "Km", key: "KM"},
    {name: "Kg", key: "KG"}
]