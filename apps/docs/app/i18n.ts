export type Locale = 'en' | 'ko';

export const localeCookie = 'rig-docs-language';

export function resolveLocale(
  preference?: string,
  acceptLanguage = '',
): Locale {
  if (preference === 'en' || preference === 'ko') return preference;

  const languages = acceptLanguage
    .split(',')
    .map(entry => {
      const [tag, ...parameters] = entry.trim().toLowerCase().split(';');
      const quality = parameters.find(parameter =>
        parameter.trim().startsWith('q='),
      );
      return {
        language: tag.split('-')[0],
        quality: quality ? Number(quality.trim().slice(2)) : 1,
      };
    })
    .filter(entry => entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const { language } of languages) {
    if (language === 'ko' || language === 'en') return language;
  }
  return 'en';
}

const korean: Record<string, string> = {
  'Your agent skills,': '에이전트 스킬을',
  'one quiet workspace.': '한곳에서 간편하게.',
  'Bring scattered skills together. Manage and share them in one place.':
    '여기저기 흩어진 스킬을 한곳에서 관리하고, 공유하세요.',
  'Download for macOS': 'macOS용 다운로드',
  'Download Rig for macOS': 'macOS용 Rig 다운로드',
  'Supported coding agents': '지원하는 코딩 에이전트',
  'One view across the agents you actually use':
    '사용하는 에이전트의 스킬을 한눈에',
  'Find your skills.': '필요한 스킬을 찾고,',
  'Stay focused.': '가볍게 관리하세요.',
  'Folder navigation': '폴더 탐색',
  'Global and project skills, organized by folder.':
    '전역·프로젝트 스킬을 폴더별로 탐색하세요.',
  'Skill sharing': '스킬 공유',
  'Share skills with your teammates in a few clicks.':
    '스킬을 동료들에게 손쉽게 공유하세요',
  'Remove and hide skills': '스킬 제거 및 숨기기',
  'Delete skills you no longer need, or hide them from your view.':
    '원하는 스킬을 삭제하거나 Rig 화면에서 숨길 수 있습니다.',
  'Version history': '버전 기록',
  'Compare snapshots and restore a saved version.':
    '스냅샷을 비교하고 저장된 버전을 복원하세요.',
  'Revisit saved versions.': '이전 버전으로 돌아가세요.',
  'Compare existing Rig snapshots and restore the version you trust. Rig saves recovery snapshots around each restore.':
    '저장된 스냅샷을 비교하고 복원하세요. 복원 전후의 버전도 보관됩니다.',
  'History includes previous Rig snapshots and new restores. External file edits are not recorded automatically.':
    'Rig의 스냅샷과 복원 기록을 확인하세요. 외부에서 편집한 내용은 자동 기록되지 않습니다.',
  'Rig versions': 'Rig 버전',
  'Local only': '로컬 보관',
  'Before restore': '복원 전',
  'Restored previous version': '이전 버전 복원',
  'Saved version': '저장된 버전',
  'Today, 14:32': '오늘 14:32',
  'Today, 14:31': '오늘 14:31',
  'Oct 28, 09:18': '10월 28일 09:18',
  'Before restore → Current': '복원 전 → 현재',
  'Stacked diff · lines wrap to fit this window':
    '변경 사항 비교 · 창 너비에 맞춰 줄바꿈',
  Restore: '복원',
  'Share your skill': '내 스킬을 공유하세요',
  'Share your skills with teammates using an install command or a prompt.':
    '설치 명령어나 프롬프트로 동료들에게 스킬을 공유하세요.',
  'Know what Rig changes.': '자주 묻는 질문',
  'Can I trust Rig?': '믿을 수 있나요?',
  'Yes. We do not operate any servers. All data is managed locally.':
    '네. 저희는 서버가 없습니다. 모든 데이터는 로컬에서 관리합니다.',
  'Does hiding a skill disable it for my agent?':
    '스킬을 숨기면 에이전트에서도 사용할 수 없나요?',
  'No. Hide from Rig only changes this app’s view. The skill stays in place and remains available to your agents.':
    '아니요. Rig 화면에서만 숨겨집니다. 스킬 파일과 에이전트에서의 사용에는 영향을 주지 않습니다.',
  'What does version history include?': '버전 기록에는 어떤 내용이 남나요?',
  'Rig keeps previous snapshots and records recovery versions for restores performed inside Rig. External edits are not recorded automatically.':
    '기존 스냅샷과 Rig에서 복원할 때 만든 복구용 버전이 보관됩니다. 외부 편집은 자동 기록되지 않습니다.',
  'Make room for the skills you need.': '필요한 스킬만, 간편하게.',
  'All your data is securely managed locally.':
    '모든 데이터는 안전하게 로컬에서 관리합니다.',
  'Explore skill folders': '스킬 폴더 알아보기',
  'Rig — Your skills, organized by folder': 'Rig — 스킬을 폴더별로 간편하게',
  'Browse, copy, hide, and share SKILL.md files in a compact local desktop library.':
    '로컬 데스크톱 라이브러리에서 SKILL.md 파일을 탐색하고, 복사하고, 숨기고, 공유하세요.',
  'Your skills, organized by folder.': '스킬을 폴더별로 간편하게.',
  'Browse global and project skills, copy instructions, and keep your library focused.':
    '전역·프로젝트 스킬을 탐색하고 지침을 복사하며 필요한 스킬만 관리하세요.',
  Home: '홈',
  Docs: '문서',
  Download: '다운로드',
  Releases: '릴리스',
  Introduction: '소개',
  Guides: '가이드',
  'Skill Roots': '스킬 폴더',
  'Rig Documentation': 'Rig 문서',
  'Rig is a local-first workspace for agent SKILL.md files.':
    '에이전트 SKILL.md 파일을 내 Mac에서 관리하는 로컬 워크스페이스.',
  'Edit this page': '이 페이지 편집',
  'Question? Give us feedback': '의견 보내기',
  'On This Page': '이 페이지의 내용',
  'Scroll to top': '맨 위로',
  'Toggle theme': '테마 전환',
  'Preview projects': '미리보기 프로젝트',
  'All skills': '모든 스킬',
  'Add project': '프로젝트 추가',
  'Search preview skills': '미리보기 스킬 검색',
  'Search skills…': '스킬 검색…',
  'Hidden skills': '숨긴 스킬',
  Global: '전역',
  'No skills match your search.': '검색 결과가 없습니다.',
  Skills: '스킬',
  'Copy preview instructions': '미리보기 지침 복사',
  Share: '공유',
  'Preview skill content': '미리보기 스킬 내용',
  Instructions: '지침',
  Source: '원본',
  History: '기록',
  Details: '상세 정보',
  Location: '위치',
  'No Rig versions yet': '아직 저장된 Rig 버전이 없습니다',
  'Saved versions and recovery snapshots appear here when available.':
    '저장된 버전과 복구용 스냅샷이 여기에 표시됩니다.',
  'Instructions copied': '지침을 복사했습니다',
  'Could not copy. Select the text in Source to copy it.':
    '복사하지 못했습니다. 원본 탭에서 텍스트를 선택해 복사하세요.',
  'Interactive preview of Rig’s folder library. Search skills, switch projects, and explore instructions, source, and history.':
    'Rig 폴더 라이브러리 미리보기. 스킬 검색, 프로젝트 전환, 지침·원본·기록을 확인할 수 있습니다.',
};

export function getTranslator(locale: Locale) {
  return (message: string) =>
    locale === 'ko' ? (korean[message] ?? message) : message;
}
