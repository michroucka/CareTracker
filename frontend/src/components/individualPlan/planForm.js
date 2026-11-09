import {
    IconBath, IconFirstAidKit, IconHandStop, IconHeart, IconHome, IconInfoCircle, IconMessages, IconRoute,
    IconScale, IconShirt, IconStar, IconThumbDown, IconThumbUp, IconToolsKitchen2, IconWalk,
} from "@tabler/icons-react";
import { daysFromToday, pluralize } from "@/components/dashboard/dashboardFormat";
import { todayIsoDate, toIsoDate } from "@/lib/dates";

export const PLAN_SECTIONS = [
    {
        title: "Osobní profil",
        description: "Kdo klient je, co má rád a co je pro něj důležité. Psáno jeho slovy.",
        fields: [
            { name: "likes", label: "Co mám rád/a, co mě baví, co je pro mě důležité", icon: IconThumbUp },
            { name: "dislikes", label: "Co nemám rád/a, co mi vadí", icon: IconThumbDown },
            { name: "strengths", label: "Co na mě mají lidé rádi, mé silné stránky", icon: IconStar },
            { name: "aspirations", label: "Moje touhy, přání, sny", icon: IconHeart },
            { name: "lifePath", label: "Životní cesta", icon: IconRoute },
            { name: "additionalInfo", label: "Další důležité informace", icon: IconInfoCircle },
        ],
    },
    {
        title: "Popis podpory",
        description: "S čím klient potřebuje pomoct a jak.",
        fields: [
            { name: "hygiene", label: "Osobní hygiena", icon: IconBath },
            { name: "selfCare", label: "Péče o vlastní osobu", icon: IconShirt },
            { name: "mobility", label: "Samostatný pohyb", icon: IconWalk },
            { name: "diet", label: "Stravování", icon: IconToolsKitchen2 },
            { name: "homeCare", label: "Péče o domácnost nebo pokoj", icon: IconHome },
            { name: "socialContact", label: "Kontakt s lidmi", icon: IconMessages },
            { name: "activities", label: "Aktivity a činnosti", icon: IconHandStop },
            { name: "health", label: "Zdraví a bezpečí", icon: IconFirstAidKit },
            { name: "exercisingRights", label: "Uplatňování práv", icon: IconScale },
        ],
    },
];

const FIELD_NAMES = PLAN_SECTIONS.flatMap((section) => section.fields.map((field) => field.name));

export const PLAN_REVIEW_MONTHS = 6;

function monthsFromToday(months) {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return toIsoDate(date);
}

/** Every save creates a new version processed today, so the dates always start fresh. */
export function toFormValues(content) {
    const values = Object.fromEntries(FIELD_NAMES.map((name) => [name, content?.[name] ?? ""]));
    return { ...values, processedDate: todayIsoDate(), plannedUpdateDate: monthsFromToday(PLAN_REVIEW_MONTHS) };
}

export function validatePlan(values) {
    const errors = {};
    if (!values.plannedUpdateDate) errors.plannedUpdateDate = "Prosím zadejte datum plánované aktualizace";
    else if (values.plannedUpdateDate <= values.processedDate) errors.plannedUpdateDate = "Aktualizace musí být až po datu zpracování";
    return errors;
}

export function toRequest(values) {
    const texts = Object.fromEntries(FIELD_NAMES.map((name) => [name, values[name].trim() || null]));
    return { ...texts, processedDate: values.processedDate, plannedUpdateDate: values.plannedUpdateDate };
}

/** Badge for the planned plan review: overdue, today, within a week, or later. */
export function planStatus(plannedUpdateDate) {
    const days = daysFromToday(plannedUpdateDate);
    if (days < 0) return { variant: "danger", label: `Po termínu ${-days} ${pluralize(days, ["den", "dny", "dní"])}` };
    if (days === 0) return { variant: "pending", label: "Dnes" };
    if (days <= 7) return { variant: "pending", label: `Za ${days} ${pluralize(days, ["den", "dny", "dní"])}` };
    return { variant: "outline", label: `Za ${days} dní` };
}
