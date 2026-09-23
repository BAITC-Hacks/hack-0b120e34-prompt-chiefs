import type { Locale, Theme, TranslationKey } from '../lib/i18n';
import { localeOptions } from '../lib/i18n';

type Copy = (key: TranslationKey) => string;

export function Preferences({ locale, theme, onLocaleChange, onThemeChange, t }: {
  locale: Locale;
  theme: Theme;
  onLocaleChange: (value: Locale) => void;
  onThemeChange: (value: Theme) => void;
  t: Copy;
}) {
  return <details className="preferences"><summary>{t('settings')}</summary><div className="preferences__grid">
    <label><span>{t('language')}</span><select value={locale} onChange={(event) => onLocaleChange(event.target.value as Locale)}>{localeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    <fieldset><legend>{t('theme')}</legend><button type="button" className={theme === 'light' ? 'is-selected' : ''} onClick={() => onThemeChange('light')}>{t('light')}</button><button type="button" className={theme === 'dark' ? 'is-selected' : ''} onClick={() => onThemeChange('dark')}>{t('dark')}</button></fieldset>
  </div></details>;
}
