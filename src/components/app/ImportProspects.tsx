'use client';

import { useState } from 'react';

import styles from '@/app/app/app.module.css';

/**
 * Import d'une liste de prospects — Hermès (migration 022).
 *
 * **Pourquoi ce module existe.** Le recensement automatique ne couvre que la
 * France, et seulement deux segments sur quatre par OpenStreetMap : ni VTC,
 * ni flottes. Un professionnel qui connaît déjà les entreprises de sa région
 * doit pouvoir les apporter lui-même — voir `lib/agent/import-prospects.ts`.
 *
 * **L'attestation est affichée en toutes lettres, jamais résumée.** Une case
 * cochée sans texte ne vaut rien ; le professionnel doit voir exactement ce
 * qu'il certifie, comme le pied de page du message est montré (et non
 * modifiable) dans `HermesSettings`. Le texte vient du serveur à l'écriture
 * (`IMPORT_ATTESTATION_TEXT`) — ce composant ne fait que l'afficher et
 * recueillir l'acceptation, jamais l'envoyer lui-même.
 */

export type ImportedProspect = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly contactedAt: string | null;
  readonly optedOutAt: string | null;
  readonly createdAt: string;
};

type RejectedLine = { readonly line: number; readonly raw: string; readonly reason: string };

type Props = {
  readonly initialProspects: readonly ImportedProspect[];
  readonly attestationText: string;
  readonly maxImportSize: number;
};

export function ImportProspects({ initialProspects, attestationText, maxImportSize }: Props) {
  const [prospects, setProspects] = useState(initialProspects);
  const [text, setText] = useState('');
  const [attestationAccepted, setAttestationAccepted] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [lastReport, setLastReport] = useState<{
    readonly imported: number;
    readonly rejected: readonly RejectedLine[];
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = async () => {
    const response = await fetch('/api/app/hermes/import');
    if (!response.ok) return;
    const payload = (await response.json()) as { prospects: readonly ImportedProspect[] };
    setProspects(payload.prospects);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');
    setLastReport(null);

    const response = await fetch('/api/app/hermes/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, attestationAccepted }),
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(
        payload && typeof payload === 'object' && 'message' in payload
          ? String((payload as { message: unknown }).message)
          : 'Import impossible. Réessayez.',
      );
      setStatus('error');
      return;
    }

    const result = payload as { imported: number; rejected: readonly RejectedLine[] };
    setLastReport({ imported: result.imported, rejected: result.rejected });
    setText('');
    setAttestationAccepted(false);
    setStatus('idle');
    await refresh();
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    const response = await fetch('/api/app/hermes/import', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (response.ok) setProspects((current) => current.filter((p) => p.id !== id));
    setDeletingId(null);
  };

  const removeAll = async () => {
    const response = await fetch('/api/app/hermes/import', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    if (response.ok) setProspects([]);
  };

  return (
    <div className={styles.hermesSection}>
      <h2 className={styles.kpiLabel} style={{ marginBottom: '0.5rem' }}>
        Importer votre propre liste
      </h2>
      <p>
        Pour les entreprises que le recensement automatique n’atteint pas — hors de France, ou
        sans équivalent sur OpenStreetMap (transporteurs, flottes).
      </p>

      <form onSubmit={submit} className={styles.hermesForm}>
        <label>
          <span>Une entreprise par ligne : nom, e-mail</span>
          <textarea
            required
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Transports Bernard, contact@transports-bernard.fr\nGarage Petit, garage.petit@orange.fr'}
          />
          <small>{maxImportSize} lignes au maximum par import.</small>
        </label>

        <div className={styles.hermesPreview}>
          <p className={styles.kpiLabel}>Ce que vous certifiez en important cette liste</p>
          <pre className={styles.hermesPreviewBody}>{attestationText}</pre>
        </div>

        <label className={styles.hermesConsent}>
          <input
            type="checkbox"
            required
            checked={attestationAccepted}
            onChange={(e) => setAttestationAccepted(e.target.checked)}
          />
          <span>Je certifie les trois points ci-dessus pour cette liste.</span>
        </label>

        {message ? <p className={styles.hermesError}>{message}</p> : null}

        <button type="submit" className="cta-solid" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Import…' : 'Importer'}
        </button>
      </form>

      {lastReport ? (
        <div className={styles.hermesPreview}>
          <p className={styles.hermesSuccess}>
            {lastReport.imported} adresse{lastReport.imported > 1 ? 's' : ''} importée
            {lastReport.imported > 1 ? 's' : ''}.
          </p>
          {lastReport.rejected.length > 0 ? (
            <>
              <p className={styles.kpiLabel}>
                {lastReport.rejected.length} ligne{lastReport.rejected.length > 1 ? 's' : ''} écartée
                {lastReport.rejected.length > 1 ? 's' : ''}
              </p>
              <ul>
                {lastReport.rejected.map((r, i) => (
                  <li key={i} className={styles.clientMeta}>
                    Ligne {r.line || '?'} — {r.raw} : {r.reason}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      <div className={styles.panel}>
        <div className={styles.topbar}>
          <p className={styles.kpiLabel}>
            {prospects.length} prospect{prospects.length > 1 ? 's' : ''} importé
            {prospects.length > 1 ? 's' : ''}
          </p>
          {prospects.length > 0 ? (
            <button type="button" className="app-tab" onClick={removeAll}>
              Tout supprimer
            </button>
          ) : null}
        </div>

        {prospects.length === 0 ? (
          <div className={styles.empty}>
            <strong>Rien à afficher</strong>
            <p className={styles.emptyHint}>Aucune adresse importée pour l’instant.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Entreprise</th>
                <th>E-mail</th>
                <th>État</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {prospects.map((prospect) => (
                <tr key={prospect.id} className={styles.row}>
                  <td>
                    <span className={styles.clientName}>{prospect.name}</span>
                  </td>
                  <td>{prospect.email}</td>
                  <td>
                    {prospect.optedOutAt
                      ? 'Désinscrit'
                      : prospect.contactedAt
                        ? 'Contacté'
                        : 'En attente'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.rowLink}
                      disabled={deletingId === prospect.id}
                      onClick={() => remove(prospect.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
