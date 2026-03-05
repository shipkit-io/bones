import Link from "next/link";
import { getPeople } from "@/server/actions/aura/queries";

export default async function PeoplePage() {
  const people = await getPeople();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">People</h1>
        <p className="text-muted-foreground">
          {people.length} people mentioned in conversations
        </p>
      </div>

      {people.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No people extracted yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {people.map((person) => {
            const facts = (person.facts ?? []) as string[];
            return (
              <Link
                key={person.id}
                href={`/aura/people/${person.id}`}
                className="p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg font-medium">
                    {person.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{person.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{person.mentionCount}x mentioned</span>
                      {person.speakerName && (
                        <span>• Voice: {person.speakerName}</span>
                      )}
                    </div>
                  </div>
                </div>
                {facts.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {facts.slice(0, 3).map((fact: string, i: number) => (
                      <li
                        key={i}
                        className="text-sm text-muted-foreground truncate"
                      >
                        • {fact}
                      </li>
                    ))}
                    {facts.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        +{facts.length - 3} more
                      </li>
                    )}
                  </ul>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
