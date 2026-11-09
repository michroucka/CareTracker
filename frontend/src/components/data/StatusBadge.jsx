import { Badge } from "@/components/ui/badge";

export function StatusBadge({ active }) {
    return <Badge variant={active ? "success" : "outline"}>{active ? "Aktivní" : "Neaktivní"}</Badge>;
}
