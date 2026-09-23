import type { FontScale, Locale, MotionPreference, Theme, TranslationKey } from '../lib/i18n';
import { localeOptions } from '../lib/i18n';

type Copy = (key: TranslationKey) => string;

export function Preferences({ locale, theme, fontScale, motion, onLocaleChange, onThemeChange, onFontScaleChange, onMotionChange, t }: {
  locale: Locale;
  theme: Theme;
  fontScale: FontScale;
  motion: MotionPreference;
  onLocaleChange: (value: Locale) => void;
  onThemeChange: (value: Theme) => void;
  onFontScaleChange: (value: FontScale) => void;
  onMotionChange: (value: MotionPreference) => void;
  t: Copy;
}) {
  return <details className="preferences"><summary>{t('settings')}</summary><div className="preferences__grid">
    <label><span>{t('language')}</span><select value={locale} onChange={(event) => onLocaleChange(event.target.value as Locale)}>{localeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
    <fieldset><legend>{t('theme')}</legend><button type="button" className={theme === 'light' ? 'is-selected' : ''} onClick={() => onThemeChange('light')}>{t('light')}</button><button type="button" className={theme === 'dark' ? 'is-selected' : ''} onClick={() => onThemeChange('dark')}>{t('dark')}</button></fieldset>
    <fieldset><legend>{t('textSize')}</legend><button type="button" className={fontScale === 'normal' ? 'is-selected' : ''} onClick={() => onFontScaleChange('normal')}>{t('normal')}</button><button type="button" className={fontScale === 'large' ? 'is-selected' : ''} onClick={() => onFontScaleChange('large')}>{t('large')}</button></fieldset>
    <fieldset><legend>{t('motion')}</legend><button type="button" className={motion === 'full' ? 'is-selected' : ''} onClick={() => onMotionChange('full')}>{t('full')}</button><button type="button" className={motion === 'reduced' ? 'is-selected' : ''} onClick={() => onMotionChange('reduced')}>{t('reduced')}</button></fieldset>
  </div></details>;
}
