import { notFound } from "next/navigation";
import Link from "next/link";
import { getPerson } from "@/server/actions/aura/queries";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await getPerson(id);
  if (!person) notFound();

  const facts = (person.facts ?? []) as string[];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/aura/people"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← People
        </Link>
        <div className="flex items-center gap-4 mt-2">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold">
            {person.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{person.name}</h1>
            <p className="text-sm text-muted-foreground">
              Mentioned {person.mentionCount ?? 0} times
              {person.firstMentioned &&
                ` · First seen ${person.firstMentioned.toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </div>

      {facts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Known Facts</h2>
          <ul className="space-y-2">
            {facts.map((fact: string, i: number) => (
              <li key={i} className="flex gap-2 p-3 rounded-lg border">
                <span className="text-muted-foreground">•</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {person.knowledge && person.knowledge.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Knowledge Entries</h2>
          <div className="space-y-2">
            {person.knowledge.map((k) => (
              <div key={k.id} className="p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  {k.category && (
                    <span className="text-xs font-medium uppercase px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {k.category}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {k.createdAt?.toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{k.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
