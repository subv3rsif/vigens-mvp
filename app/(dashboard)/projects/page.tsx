export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Projets
        </h2>
        <p className="text-muted-foreground">
          Gérez tous vos projets en un seul endroit.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucun projet pour le moment.</p>
      </div>
    </div>
  );
}
