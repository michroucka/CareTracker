import React from 'react';
import { IconDots } from '@tabler/icons-react';
import { TableEmptyRow } from '@/components/data/EmptyState';
import { RecordSheet } from '@/components/data/RecordSheet';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const PEOPLE = ['Marie Nová', 'Karel Starý', 'Eva Malá'];

/**
 * A list page in miniature, built like the real ones: rows open a detail, the last cell holds the "⋯" menu
 * and stops the click from reaching the row. Buttons around the table let tests Tab in and out of it.
 */
export function PeopleTable({ people = PEOPLE, onOpen = () => {} }) {
    return (
        <>
            <button type="button">Před tabulkou</button>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Jméno</TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {people.length === 0 ? (
                        <TableEmptyRow columnCount={2} title="Žádní klienti" description="Zkuste jiný filtr." />
                    ) : people.map((name) => (
                        <TableRow key={name} aria-label={name} onClick={() => onOpen(name)}>
                            <TableCell>{name}</TableCell>
                            <TableCell onClick={(event) => event.stopPropagation()}>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="icon-row" variant="ghost" aria-label={`Akce pro ${name}`}><IconDots /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => onOpen(name)}>Otevřít detail</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <button type="button">Za tabulkou</button>
        </>
    );
}

/** PeopleTable whose rows open a RecordSheet, the way list pages keep the open detail in state. */
export function PeopleWithDetail({ people = PEOPLE }) {
    const [openName, setOpenName] = React.useState(null);

    return (
        <>
            <PeopleTable people={people} onOpen={setOpenName} />
            <RecordSheet
                open={openName != null}
                onOpenChange={(open) => !open && setOpenName(null)}
                badge="Klient"
                title={openName}
                onEdit={() => {}}
            >
                <p>Detail klienta</p>
            </RecordSheet>
        </>
    );
}
