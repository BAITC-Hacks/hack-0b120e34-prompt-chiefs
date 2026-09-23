import { AI_PROMPT, buildAiRequest, isAiConfigured, type AiDiagnostics, type AiResponse } from '../lib/ai';
import type { Locale, TranslationKey } from '../lib/i18n';
import type { TaskCard } from '../types/domain';

type Copy = (key: TranslationKey) => string;

const reasonKeys: Record<AiDiagnostics['reason'], TranslationKey> = {
  'not-configured': 'aiReasonNotConfigured', 'not-called': 'aiReasonNotCalled', success: 'aiReasonSuccess',
  http: 'aiReasonHttp', 'invalid-response': 'aiReasonInvalid', timeout: 'aiReasonTimeout', network: 'aiReasonNetwork',
};

// Shows the jury the exact prompt, request and reply contract behind AI Task Doctor.
export function AiContract({ task, locale, reply, diagnostics, t }: {
  task: TaskCard;
  locale: Locale;
  reply: AiResponse | null;
  diagnostics: AiDiagnostics;
  t: Copy;
}) {
  return <details className="ai-contract"><summary>{t('aiHowTitle')}</summary>
    <p><b>{t('aiMode')}:</b> {isAiConfigured() ? t('aiModeLive') : t('aiModeOffline')} · {t(reasonKeys[diagnostics.reason])}</p>
    <h4>{t('aiPrompt')}</h4><pre>{AI_PROMPT}</pre>
    <h4>{t('aiInput')}</h4><pre>{JSON.stringify(buildAiRequest(task, locale), null, 2)}</pre>
    <h4>{t('aiOutput')}</h4>{reply ? <pre>{JSON.stringify(reply, null, 2)}</pre> : <p>{t('aiOutputEmpty')}</p>}
    <p className="filter-note">{t('aiValidation')}</p>
  </details>;
}
