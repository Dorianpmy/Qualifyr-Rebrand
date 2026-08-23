'use client';

import { useMemo, useState } from 'react';

import { composeMessage, type Campaign } from '@/lib/agent/outreach-message';
import styles from '@/app/app/app.module.css';

/**
 * Réglages d'Hermès.
 *
 * **L'aperçu n'est pas une commodité, c'est la pièce maîtresse de cet écran.**
 * Le professionnel s'apprête à laisser partir des centaines de messages signés
 * de son nom, sans les relire un par un. La seule chose qui rende cette
 * décision raisonnable, c'est de lui montrer exactement ce que recevra une
 * entreprise — variables remplacées, mentions légales comprises — avant qu'il
 * n'active quoi que ce soit.
 *
 * Il est calculé par `composeMessage`, la fonction même qu'utilise le moteur
 * d'envoi. Un aperçu approximatif, reconstruit ici avec un autre code, finirait
 * par diverger du message réel — et c'est précisément sur ce genre d'écart que
 * se fondent les mauvaises surprises.
 *
 * **Le bloc de mentions est affiché mais non modifiable.** Le montrer répond à
 * une question qu'il se poserait sinon (« mon nom apparaît-il ? », « comment
 * font-ils pour se désinscrire ? ») ; le verrouiller évite qu'il ne le
 * supprime, ce qui rendrait l'envoi illicite.
 */

type Props = {
  readonly initial: {
    readonly senderName: string;
    readonly replyToEmail: string;
    readonly subject: string;
    readonly body: string;
    readonly dailyQuota: number;
    readonly activityDescription: string | null;
    readonly paused: boolean;
  } | null;
  /** Adresse du compte, proposée par défaut comme adresse de réponse. */
  readonly accountEmail: string;
  /** Nombre d'entreprises recensées, encore jamais contactées. */
  readonly availableProspects: number;
};

const DEFAULT_BODY = `Bonjour,

Je nettoie les véhicules professionnels sur site, à {{ville}} et alentour.

Si l’entretien de vos véhicules vous prend du temps, je peux passer voir ce qu’il est possible de faire, sans engagement.

Bonne journée,`;

export function HermesSettings({ initial, accountEmail, availableProspects }: Props) {
  const [senderName, setSenderName] = useState(initial?.senderName ?? '');
  const [replyToEmail, setReplyToEmail] = useState(initial?.replyToEmail ?? accountEmail);
  const [subject, setSubject] = useState(initial?.subject ?? 'Entretien de vos véhicules');
  const [body, setBody] = useState(initial?.body ?? DEFAULT_BODY);
  const [dailyQuota, setDailyQuota] = useState(initial?.dailyQuota ?? 15);
  const [activityDescription, setActivityDescription] = useState(initial?.activityDescription ?? '');
  const [acceptsTerms, setAcceptsTerms] = useState(initial !== null);
  const [paused, setPaused] = useState(initial?.paused ?? false);

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  /* L'aperçu utilise un exemple fixe plutôt qu'un vrai prospect : montrer une
     entreprise réelle donnerait à croire que c'est elle qui sera contactée en
     premier, ce qui n'est pas garanti. */
  const preview = useMemo(() => {
    const campaign: Campaign = {
      id: 'preview',
      ownerId: 'preview',
      senderName: senderName || 'Votre nom',
      replyToEmail,
      subject,
      body,
      dailyQuota,
      pausedAt: null,
      suspendedAt: null,
    };

    return composeMessage(
      campaign,
      {
        prospectId: 'preview',
        email: 'contact@exemple.fr',
        businessName: 'Garage Martin',
        city: 'Avignon',
        unsubscribeToken: 'exemple',
      },
      'https://qualifyragence.com/desinscription/exemple',
    );
  }, [senderName, replyToEmail, subject, body, dailyQuota]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('saving');
    setMessage('');

    const response = await fetch('/api/app/hermes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderName,
        replyToEmail,
        subject,
        body,
        dailyQuota,
        activityDescription,
        acceptsTerms,
      }),
    });

    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      setMessage(
        payload && typeof payload === 'object' && 'message' in payload
          ? String((payload as { message: unknown }).message)
          : 'Enregistrement impossible. Réessayez.',
      );
      setStatus('error');
      return;
    }

    setStatus('saved');
  };

  const togglePause = async () => {
    const next = !paused;
    const response = await fetch('/api/app/hermes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paused: next }),
    });
    if (response.ok) setPaused(next);
  };

  return (
    <div className={styles.hermesSection}>
      {/* L'état vient en premier : c'est la question qu'on se pose en ouvrant
          la page — est-ce que ça tourne, et sur combien d'entreprises. */}
      <div className={styles.hermesKpis}>
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>État</p>
          <p className={styles.kpiValue}>
            {initial === null ? 'Non configuré' : paused ? 'En pause' : 'Actif'}
          </p>
        </div>
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>Entreprises à contacter</p>
          <p className={styles.kpiValue}>{availableProspects}</p>
        </div>
        <div className={styles.kpi}>
          <p className={styles.kpiLabel}>Rythme</p>
          <p className={styles.kpiValue}>{dailyQuota} / jour</p>
        </div>
      </div>

      {initial !== null ? (
        <button type="button" className="app-tab cta-solid" onClick={togglePause}>
          {paused ? 'Relancer Hermès' : 'Mettre en pause'}
        </button>
      ) : null}

      <form onSubmit={save} className={styles.hermesForm}>
        <label>
          <span>Nom affiché comme expéditeur</span>
          <input
            required
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Marc Dupuis — Lavage Auto Avignon"
            maxLength={120}
          />
          <small>
            C’est ce nom que verra l’entreprise. Le vôtre ou celui de votre société, jamais
            « Qualifyr ».
          </small>
        </label>

        <label>
          <span>Adresse de réponse</span>
          <input
            required
            type="email"
            value={replyToEmail}
            onChange={(e) => setReplyToEmail(e.target.value)}
            maxLength={160}
          />
          <small>Les réponses arrivent directement chez vous, pas chez nous.</small>
        </label>

        <label>
          <span>Objet</span>
          <input
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={150}
          />
        </label>

        <label>
          <span>Message</span>
          <textarea
            required
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={4000}
          />
          <small>
            Écrivez <code>{'{{entreprise}}'}</code> pour insérer le nom de l’entreprise, et{' '}
            <code>{'{{ville}}'}</code> pour la ville. Un message court et concret obtient plus de
            réponses qu’une présentation complète.
          </small>
        </label>

        <label>
          <span>Votre activité en une phrase (facultatif)</span>
          <input
            value={activityDescription}
            onChange={(e) => setActivityDescription(e.target.value)}
            placeholder="Lavage de flottes de véhicules utilitaires"
            maxLength={500}
          />
          <small>
            Sert à classer les entreprises recensées par pertinence pour votre activité, à l’aide
            d’un modèle de langage. Sans cette phrase, elles restent dans leur ordre de recensement.
          </small>
        </label>

        <label>
          <span>Messages par jour : {dailyQuota}</span>
          <input
            type="range"
            min={1}
            max={40}
            value={dailyQuota}
            onChange={(e) => setDailyQuota(Number(e.target.value))}
          />
          <small>
            Au-delà de quarante, les messageries considèrent l’expéditeur comme un émetteur de
            masse et classent tout en indésirable. Commencer bas et monter progressivement donne
            de meilleurs résultats.
          </small>
        </label>

        {/* L'aperçu, juste avant l'acceptation : c'est le dernier écran avant
            que le professionnel ne s'engage, et il doit y voir le message
            complet, mentions comprises. */}
        <div className={styles.hermesPreview}>
          <p className={styles.kpiLabel}>Ce que recevra l’entreprise</p>
          <p className={styles.hermesPreviewSubject}>{preview.subject}</p>
          <pre className={styles.hermesPreviewBody}>{preview.text}</pre>
          <small>
            Les trois dernières lignes sont ajoutées automatiquement et ne peuvent pas être
            retirées : elles indiquent d’où vient l’adresse et permettent à l’entreprise de ne
            plus être contactée. Sans elles, l’envoi ne serait pas autorisé.
          </small>
        </div>

        <label className={styles.hermesConsent}>
          <input
            type="checkbox"
            required
            checked={acceptsTerms}
            onChange={(e) => setAcceptsTerms(e.target.checked)}
          />
          <span>
            Je suis l’expéditeur de ces messages et j’en assume le contenu. Qualifyr les envoie
            pour mon compte, à ma demande.
          </span>
        </label>

        {message ? <p className={styles.hermesError}>{message}</p> : null}
        {status === 'saved' ? (
          <p className={styles.hermesSuccess}>
            Enregistré. Hermès commence aux prochains envois.
          </p>
        ) : null}

        <button type="submit" className="cta-solid" disabled={status === 'saving'}>
          {status === 'saving' ? 'Enregistrement…' : 'Enregistrer et activer'}
        </button>
      </form>
    </div>
  );
}
