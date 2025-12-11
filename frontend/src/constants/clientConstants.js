export const columns = [
    {name: "JMÉNO", uid: "name", sortable: true},
    {name: "POHLAVÍ", uid: "gender"},
    {name: "ADRESA", uid: "address"},
    {name: "ODDĚLENÍ", uid: "department"},
    {name: "PEČOVATEL", uid: "caregiver"},
    {name: "AKCE", uid: "actions"},
];

export const genderOptions = [
    {name: "Muž", uid: "MALE"},
    {name: "Žena", uid: "FEMALE"},
];

export const genderTranslations = {
    "MALE": "Muž",
    "FEMALE": "Žena",
};

export const activeOptions = [
    {name: "Aktivní", uid: "true"},
    {name: "Neaktivní", uid: "false"},
]
