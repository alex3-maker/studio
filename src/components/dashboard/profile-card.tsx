import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Key, Swords, Vote } from "lucide-react";
import type { User } from "@/lib/types";

interface ProfileCardProps {
  user: User;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const stats = [
    { label: "Keys Earned", value: user.keys, icon: Key, color: "text-yellow-500" },
    { label: "Duels Created", value: user.duelsCreated, icon: Flame, color: "text-red-500" },
    { label: "Votes Cast", value: user.votesCast, icon: Vote, color: "text-blue-500" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col items-center text-center">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl font-headline">{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center">
                <stat.icon className={`h-5 w-5 mr-3 ${stat.color}`} />
                <span className="font-medium">{stat.label}</span>
              </div>
              <span className="font-bold text-lg">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
