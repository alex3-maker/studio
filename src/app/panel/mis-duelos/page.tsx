
'use client';

import DuelList from "@/components/panel/duel-list";
import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Flame, Vote } from "lucide-react";
import { useMemo } from "react";

export default function MisDuelosPage() {
    const { user, duels } = useAppContext();
    
    // Filter duels created by the current user
    const userDuels = useMemo(() => duels.filter(duel => duel.creator.id === user.id), [duels, user.id]);
    
    // The stats should reflect the actual count of created duels from the filtered list
    const stats = [
        { label: "Llaves Ganadas", value: user.keys, icon: Key, color: "text-yellow-500" },
        { label: "Duelos Creados", value: userDuels.length, icon: Flame, color: "text-red-500" },
        { label: "Votos Emitidos", value: user.votesCast, icon: Vote, color: "text-blue-500" },
    ];

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
                {stats.map(stat => (
                    <Card key={stat.label}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <DuelList duels={userDuels} />
        </div>
    );
}
