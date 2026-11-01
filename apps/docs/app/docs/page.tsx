import { getTranslator } from '../i18n';
import { LocalizedDoc } from '../LocalizedDoc';
import { getRequestLocale } from '../locale-server';

export async function generateMetadata() {
  return {
    title: getTranslator(await getRequestLocale())('Rig Documentation'),
  };
}

export default function IntroductionPage() {
  return <LocalizedDoc name='introduction' />;
}
