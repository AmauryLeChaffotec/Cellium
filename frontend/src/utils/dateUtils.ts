/**
 * Formats an ISO 8601 timestamp to French locale
 * Example: "12 février 2026 à 14:30"
 */
export function formatTimestamp(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);

  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateFormatter.format(date)} à ${timeFormatter.format(date)}`;
}
