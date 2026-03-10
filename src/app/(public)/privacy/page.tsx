import { getT } from '@/lib/i18n/server';

export const metadata = {
  title: 'Privacy Policy — KindScreen'
};

export default async function PrivacyPage() {
  const t = await getT();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-warm-800 mb-2">
        {t.footer.privacy}
      </h1>
      <p className="text-xs text-warm-400 mb-10">{t.privacy.lastUpdated}</p>

      <div className="space-y-8 text-sm text-warm-600 leading-relaxed">
        <p>{t.privacy.intro}</p>

        <section>
          <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">
            {t.privacy.dataWeCollectTitle}
          </h2>
          <p className="font-semibold mb-1">{t.privacy.ifYouSignUp}</p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>{t.privacy.reviewerEmail}</li>
            <li>{t.privacy.reviewerUsername}</li>
            <li>{t.privacy.reviewerHistory}</li>
          </ul>
          <p className="font-semibold mb-1">{t.privacy.ifAnonymous}</p>
          <p>{t.privacy.noPersonalData}</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">
            {t.privacy.cookiesTitle}
          </h2>
          <p className="mb-3">
            {t.privacy.cookiesIntroBefore}
            <strong>{t.privacy.cookiesStrictlyNecessary}</strong>
            {t.privacy.cookiesIntroAfter}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-cream-200 rounded-xl overflow-hidden">
              <thead className="bg-cream-100">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-warm-700">
                    {t.privacy.tableCookie}
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-warm-700">
                    {t.privacy.tablePurpose}
                  </th>
                  <th className="text-left px-3 py-2 font-semibold text-warm-700">
                    {t.privacy.tableExpiry}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                <tr>
                  <td className="px-3 py-2 font-mono">locale</td>
                  <td className="px-3 py-2">{t.privacy.localePurpose}</td>
                  <td className="px-3 py-2">{t.privacy.localeExpiry}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-mono">sb-*</td>
                  <td className="px-3 py-2">{t.privacy.sbPurpose}</td>
                  <td className="px-3 py-2">{t.privacy.sbExpiry}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">
            {t.privacy.howWeUseTitle}
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>{t.privacy.useAccount}</li>
            <li>{t.privacy.useAuth}</li>
            <li>{t.privacy.useActivity}</li>
            <li>{t.privacy.usePasswordReset}</li>
          </ul>
          <p className="mt-3">{t.privacy.weDoNotSell}</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">
            {t.privacy.dataStorageTitle}
          </h2>
          <p>{t.privacy.dataStorageBody}</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">
            {t.privacy.yourRightsTitle}
          </h2>
          <p className="mb-2">{t.privacy.yourRightsIntro}</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>{t.privacy.rightAccessLabel}</strong>{' '}
              {t.privacy.rightAccessRest}
            </li>
            <li>
              <strong>{t.privacy.rightDeleteLabel}</strong>{' '}
              {t.privacy.rightDeleteRest}
            </li>
            <li>
              <strong>{t.privacy.rightCorrectLabel}</strong>{' '}
              {t.privacy.rightCorrectRest}
            </li>
          </ul>
          <p className="mt-3">
            {t.privacy.exerciseRightsBefore}
            <a
              href={`mailto:${t.privacy.privacyEmail}`}
              className="text-peach hover:underline font-medium"
            >
              {t.privacy.privacyEmail}
            </a>
            {t.privacy.exerciseRightsAfter}
          </p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">
            {t.privacy.dataRetentionTitle}
          </h2>
          <p>{t.privacy.dataRetentionBody}</p>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">
            {t.privacy.contactTitle}
          </h2>
          <p>
            {t.privacy.contactBodyBefore}
            <a
              href={`mailto:${t.privacy.privacyEmail}`}
              className="text-peach hover:underline font-medium"
            >
              {t.privacy.privacyEmail}
            </a>
            {t.privacy.contactBodyAfter}
          </p>
        </section>
      </div>
    </div>
  );
}
