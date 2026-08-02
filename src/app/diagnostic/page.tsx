import type { Metadata } from 'next';

import { DiagnosticForm } from '@/components/form/DiagnosticForm';
import { buildMetadata } from '@/lib/metadata';

import styles from './page.module.css';

export const metadata: Metadata = buildMetadata('/diagnostic');

type DiagnosticPageProps = {
  searchParams: Promise<{ activity?: string | string[] }>;
};

export default async function DiagnosticPage({ searchParams }: DiagnosticPageProps) {
  const params = await searchParams;
  const requestedActivity = Array.isArray(params.activity) ? params.activity[0] : params.activity;
  const initialActivity = requestedActivity === 'nettoyage-automobile'
    ? 'nettoyage-detailing'
    : requestedActivity === 'conciergerie'
      ? 'conciergerie'
      : undefined;

  return (
    <div className={styles.page}>
      <DiagnosticForm initialActivity={initialActivity} />
    </div>
  );
}
