import ProfileCard from "@/components/dashboard/profile-card";
import DuelList from "@/components/dashboard/duel-list";
import { mockUser, mockDuels } from "@/lib/data";

export default function DashboardPage() {
    const userDuels = mockDuels; // In a real app, filter for the logged-in user

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold font-headline mb-8">Your Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <ProfileCard user={mockUser} />
                </div>
                <div className="lg:col-span-2">
                    <DuelList duels={userDuels} />
                </div>
            </div>
        </div>
    );
}
