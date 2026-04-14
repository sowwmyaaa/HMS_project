export default function PageHeader({ title }) {
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
    </header>
  );
}
