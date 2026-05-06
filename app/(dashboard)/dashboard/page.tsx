export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Tableau de bord
        </h2>
        <p className="text-muted-foreground">
          Bienvenue sur votre tableau de bord Vigens.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">Projets actifs</h3>
          <p className="mt-2 text-3xl font-bold text-primary">0</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">Tâches en cours</h3>
          <p className="mt-2 text-3xl font-bold text-primary">0</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground">Tâches complétées</h3>
          <p className="mt-2 text-3xl font-bold text-primary">0</p>
        </div>
      </div>
    </div>
  );
}
