import CreateDuelForm from "@/components/create-duel-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateDuelPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Create a New Duel</CardTitle>
            <CardDescription>
              Fill out the form below to launch your duel. Your content will be automatically checked for safety.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateDuelForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
