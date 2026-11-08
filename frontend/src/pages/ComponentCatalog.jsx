import React from "react";
import { toast } from "@/components/ui/sonner";
import { IconDots, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { TableExample } from "@/components/catalog/TableExample";
import { TaskDetailSheetExample } from "@/components/catalog/TaskDetailSheetExample";
import { FormField } from "@/components/FormField";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import MonthYearPicker from "@/components/MonthYearPicker";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const EMPTY_FORM = { name: "", email: "", unit: "", note: "" };

const UNIT_OPTIONS = [
    { value: "HOUR", label: "Hodina" },
    { value: "OCCURRENCE", label: "Úkon" },
    { value: "KG", label: "Kilogram" },
    { value: "KM", label: "Kilometr" },
];

function validate(form) {
    const errors = {};
    if (!form.name.trim()) errors.name = "Vyplňte jméno.";
    if (!form.email.includes("@")) errors.email = "Zadejte platný e-mail.";
    if (!form.unit) errors.unit = "Vyberte jednotku.";
    return errors;
}

function Section({ title, description, children }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-display text-xl">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
}

function DemoForm() {
    const [form, setForm] = React.useState(EMPTY_FORM);
    const [errors, setErrors] = React.useState({});
    const [submitCount, setSubmitCount] = React.useState(0);

    const updateField = (field, value) => {
        setForm((previous) => ({ ...previous, [field]: value }));
        if (errors[field]) setErrors((previous) => ({ ...previous, [field]: undefined }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const nextErrors = validate(form);
        setErrors(nextErrors);
        setSubmitCount((count) => count + 1);
        if (Object.keys(nextErrors).length === 0) {
            toast.success("Uloženo", { description: `${form.name} – ${form.email}` });
        }
    };

    const handleReset = () => {
        setForm(EMPTY_FORM);
        setErrors({});
    };

    return (
        <form noValidate onSubmit={handleSubmit} onReset={handleReset} className="grid max-w-md gap-4">
            <FormField id="catalog-name" label="Jméno" required error={errors.name} shakeSignal={submitCount}>
                {(controlProps) => (
                    <Input {...controlProps} autoComplete="name" value={form.name} onChange={(e) => updateField("name", e.target.value)} />
                )}
            </FormField>

            <FormField
                id="catalog-email"
                label="E-mail"
                required
                hint="Pošleme na něj aktivační odkaz."
                error={errors.email}
                shakeSignal={submitCount}
            >
                {(controlProps) => (
                    <Input {...controlProps} type="email" autoComplete="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                )}
            </FormField>

            <FormField id="catalog-unit" label="Jednotka" required error={errors.unit} shakeSignal={submitCount}>
                {(controlProps) => (
                    <Select value={form.unit} onValueChange={(value) => updateField("unit", value)}>
                        <SelectTrigger {...controlProps} className="w-full">
                            <SelectValue placeholder="Vyberte jednotku" />
                        </SelectTrigger>
                        <SelectContent>
                            {UNIT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </FormField>

            <FormField id="catalog-note" label="Poznámka">
                {(controlProps) => (
                    <Textarea {...controlProps} value={form.note} onChange={(e) => updateField("note", e.target.value)} />
                )}
            </FormField>

            <div className="flex items-center gap-2">
                <Checkbox id="catalog-remember" />
                <Label htmlFor="catalog-remember">Zapamatovat si mě</Label>
            </div>

            <div className="flex gap-2 pt-2">
                <Button type="submit">Uložit</Button>
                <Button type="reset" variant="outline">Vymazat</Button>
            </div>
        </form>
    );
}

export default function ComponentCatalog() {
    const [catalogMonth, setCatalogMonth] = React.useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

    return (
        <div className="mx-auto grid w-full max-w-5xl gap-6 py-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1>Katalog komponent</h1>
                    <p className="text-muted-foreground">Nové shadcn komponenty v brandu. Jen pro vývoj, v produkčním buildu stránka neexistuje.</p>
                </div>
                <ThemeSwitcher />
            </div>

            <Section title="Formulář" description="FormField: label nad polem, chyba plynule vyjede, po odeslání s chybou pole zatřese.">
                <DemoForm />
            </Section>

            <Section title="Výběr měsíce" description="Šipkami o měsíc vedle, klikem na název popover s měsíci roku.">
                <MonthYearPicker value={catalogMonth} onChange={setCatalogMonth} className="w-fit" />
            </Section>

            <Section title="Tlačítka">
                <div className="grid gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button><IconPlus /> Zapsat úkon</Button>
                        <Button variant="secondary">Sekundární</Button>
                        <Button variant="outline">Obrys</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="link">Odkaz</Button>
                        <Button variant="destructive"><IconTrash /> Smazat</Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm">Malé</Button>
                        <Button>Výchozí</Button>
                        <Button size="lg">Velké</Button>
                        <Button size="icon" variant="outline" aria-label="Upravit"><IconPencil /></Button>
                        <Button disabled>Neaktivní</Button>
                    </div>
                </div>
            </Section>

            <Section title="Štítky" description="Stavy záznamů jako měkké pilulky. Plný destructive jen výjimečně, kde má štítek opravdu křičet.">
                <div className="grid gap-4">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="success">Schváleno</Badge>
                        <Badge variant="pending">Čeká</Badge>
                        <Badge variant="warning">Plán k aktualizaci</Badge>
                        <Badge variant="danger">Ukončený</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge>Výchozí</Badge>
                        <Badge variant="secondary">Sekundární</Badge>
                        <Badge variant="outline">Obrys</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                    </div>
                </div>
            </Section>

            <Section title="Překryvy" description="Dialog pro krátké akce, sheet pro detail záznamu, potvrzovací dialog pro nevratné akce.">
                <div className="flex flex-wrap gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">Dialog</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Nové středisko</DialogTitle>
                                <DialogDescription>Krátký formulář v dialogu.</DialogDescription>
                            </DialogHeader>
                            <Input placeholder="Název střediska" />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Zrušit</Button>
                                </DialogClose>
                                <Button>Vytvořit</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <TaskDetailSheetExample />

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline">Potvrzovací dialog</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Smazat úkon?</AlertDialogTitle>
                                <AlertDialogDescription>Záznam se odstraní z měsíčního výkazu. Akci nelze vrátit.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Zrušit</AlertDialogCancel>
                                <AlertDialogAction variant="destructive">Smazat</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" aria-label="Další akce"><IconDots /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Úkon</DropdownMenuLabel>
                            <DropdownMenuItem><IconPencil /> Upravit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive"><IconTrash /> Smazat</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost">Tooltip</Button>
                        </TooltipTrigger>
                        <TooltipContent>Krátká nápověda</TooltipContent>
                    </Tooltip>
                </div>
            </Section>

            <Section title="Toasty">
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => toast.success("Úkon uložen")}>Úspěch</Button>
                    <Button variant="outline" onClick={() => toast.error("Nepodařilo se uložit", { description: "Zkuste to prosím znovu." })}>Chyba</Button>
                    <Button variant="outline" onClick={() => toast.warning("Plán čeká na aktualizaci")}>Varování</Button>
                    <Button variant="outline" onClick={() => toast.info("Nová verze plánu je k dispozici")}>Info</Button>
                    <Button variant="outline" onClick={() => toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), { loading: "Generuji výkaz…", success: "Výkaz vygenerován" })}>Načítání</Button>
                    <Button variant="outline" onClick={() => toast("Výkaz za říjen je připravený", { description: "Najdete ho v sekci Měsíční výkazy." })}>Výchozí</Button>
                </div>
            </Section>

            <Section title="Tabulka a skeleton" description="Klik na řádek ho vybere (levandule + švestkový proužek). Tlačítkem vpravo nahoře přepneš skeleton při načítání.">
                <TableExample />
            </Section>
        </div>
    );
}
