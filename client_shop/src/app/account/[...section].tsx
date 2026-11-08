// Accept Clerk's profile and security subpaths without remounting its panel.
export default function AccountSection() { return null; }

export function generateStaticParams() {
  return [{ section: ['profile'] }, { section: ['security'] }];
}
