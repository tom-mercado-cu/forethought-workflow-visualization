import { SearchWorkflow } from "@/components/search-workflow";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { getIntents } from "./api";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ query: string | undefined }>;
}) {
  const { query = "" } = await searchParams;
  const intents = await getIntents();
  const filteredIntents = intents.filter((intent) =>
    intent.intent_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <SearchWorkflow />
      </div>

      {intents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-slate-600 text-center">No intents found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredIntents.map((intent) => (
            <Link
              key={intent.intent_workflow_id}
              href={`/workflows/${intent.intent_workflow_id}`}
              className="block"
            >
              <Card className="h-full transition-all hover:shadow-md hover:border-slate-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="line-clamp-2">
                    {intent.intent_name}
                  </CardTitle>
                  <CardDescription>
                    Workflow ID: {intent.intent_workflow_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {intent.channels.map((channel) => (
                      <Badge key={channel} variant="secondary">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
