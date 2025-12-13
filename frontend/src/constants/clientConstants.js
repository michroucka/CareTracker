import {SelectItem} from "@heroui/react";
import React from "react";

export const columns = [
    {name: "JMÉNO", key: "name", sortable: true},
    {name: "POHLAVÍ", key: "gender"},
    {name: "ADRESA", key: "address"},
    {name: "ODDĚLENÍ", key: "department"},
    {name: "PEČOVATEL", key: "caregiver"},
    {name: "AKCE", key: "actions"},
];

export const genderOptions = [
    {name: "Muž", key: "MALE"},
    {name: "Žena", key: "FEMALE"},
];

export const genderTranslations = {
    "MALE": "Muž",
    "FEMALE": "Žena",
};

export const activeOptions = [
    {name: "Aktivní", key: "true"},
    {name: "Neaktivní", key: "false"},
];

export const benefitsOptions = [
    {name: "Žádný", key: "NONE"},
    {name: "I. stupeň", key: "ONE"},
    {name: "II. stupeň", key: "TWO"},
    {name: "III. stupeň", key: "THREE"},
    {name: "IV. stupeň", key: "FOUR"}
];

export const terminationReasonOptions = [
    {name: "Exitus", key: "EXITUS"},
    {name: "Pobytová služba", key: "RESIDENTIAL_SERVICE"},
    {name: "Výpověď smlouvy", key: "CONTRACT_TERMINATION"},
    {name: "Dohoda o ukončení", key: "MUTUAL_AGREEMENT"},
    {name: "Jiné", key: "OTHER"}
];
