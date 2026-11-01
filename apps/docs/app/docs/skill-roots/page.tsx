import { getTranslator } from '../../i18n';
import { LocalizedDoc } from '../../LocalizedDoc';
import { getRequestLocale } from '../../locale-server';

export async function generateMetadata() {
  return { title: getTranslator(await getRequestLocale())('Skill Roots') };
}

export default function SkillRootsPage() {
  return <LocalizedDoc name='skill-roots' />;
}
