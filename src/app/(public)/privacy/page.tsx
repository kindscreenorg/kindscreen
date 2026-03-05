import { getLocale } from '@/lib/i18n/server'

export const metadata = {
  title: 'Privacy Policy — KindScreen',
}

export default async function PrivacyPage() {
  const locale = await getLocale()
  const isEn = locale !== 'pt'

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-warm-800 mb-2">
        {isEn ? 'Privacy Policy' : 'Política de Privacidade'}
      </h1>
      <p className="text-xs text-warm-400 mb-10">
        {isEn ? 'Last updated: March 2026' : 'Última atualização: março de 2026'}
      </p>

      <div className="space-y-8 text-sm text-warm-600 leading-relaxed">

        {isEn ? (
          <>
            <p>
              KindScreen (&quot;we&quot;, &quot;us&quot;) is a community-curated catalog of safe YouTube videos for children.
              We respect your privacy and collect only what is necessary to operate the service.
            </p>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">1. Data we collect</h2>
              <p className="font-semibold mb-1">If you sign up as a reviewer:</p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>Your email address (used to verify your account and send password reset emails)</li>
                <li>A username you choose (displayed on your profile)</li>
                <li>Your review history (the votes and feedback you submit on videos)</li>
              </ul>
              <p className="font-semibold mb-1">If you are an anonymous visitor:</p>
              <p>We do not collect any personal data. We do not use analytics or tracking pixels.</p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">2. Cookies</h2>
              <p className="mb-3">
                We use only <strong>strictly necessary cookies</strong> — cookies required for the site to function.
                We do not use advertising, analytics, or third-party cookies.
                Because these cookies are strictly necessary, we do not require your consent to place them.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-cream-200 rounded-xl overflow-hidden">
                  <thead className="bg-cream-100">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-warm-700">Cookie</th>
                      <th className="text-left px-3 py-2 font-semibold text-warm-700">Purpose</th>
                      <th className="text-left px-3 py-2 font-semibold text-warm-700">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    <tr>
                      <td className="px-3 py-2 font-mono">locale</td>
                      <td className="px-3 py-2">Stores your language preference (English or Portuguese)</td>
                      <td className="px-3 py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono">sb-*</td>
                      <td className="px-3 py-2">Supabase authentication session tokens — keeps you logged in as a reviewer</td>
                      <td className="px-3 py-2">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">3. How we use your data</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>To create and manage your reviewer account</li>
                <li>To authenticate you when you log in</li>
                <li>To record and display your review activity</li>
                <li>To send you a password reset email if requested</li>
              </ul>
              <p className="mt-3">
                We do not sell your data, share it with advertisers, or use it for any purpose other than operating KindScreen.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">4. Data storage</h2>
              <p>
                Your data is stored in Supabase (supabase.com), a managed database and authentication platform.
                Data is stored in the EU (Frankfurt, Germany).
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">5. Your rights</h2>
              <p className="mb-2">Under the GDPR and LGPD, you have the right to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Access</strong> the personal data we hold about you</li>
                <li><strong>Delete</strong> your account and all associated data</li>
                <li><strong>Correct</strong> inaccurate data</li>
              </ul>
              <p className="mt-3">
                To exercise these rights, email us at{' '}
                <a href="mailto:privacy@kindscreen.dev" className="text-peach hover:underline font-medium">
                  privacy@kindscreen.dev
                </a>.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">6. Data retention</h2>
              <p>
                Reviewer accounts and associated reviews are retained for as long as the account is active.
                If you delete your account, your email and username are permanently deleted.
                Reviews you submitted may be anonymised and retained to maintain the integrity of the catalog.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">7. Contact</h2>
              <p>
                Questions about this policy? Email us at{' '}
                <a href="mailto:privacy@kindscreen.dev" className="text-peach hover:underline font-medium">
                  privacy@kindscreen.dev
                </a>.
              </p>
            </section>
          </>
        ) : (
          <>
            <p>
              O KindScreen (&quot;nós&quot;) é um catálogo curado pela comunidade de vídeos do YouTube seguros para crianças.
              Respeitamos sua privacidade e coletamos apenas o necessário para operar o serviço.
            </p>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">1. Dados que coletamos</h2>
              <p className="font-semibold mb-1">Se você se cadastrar como revisor(a):</p>
              <ul className="list-disc list-inside space-y-1 mb-3">
                <li>Seu endereço de e-mail (usado para verificar sua conta e enviar e-mails de redefinição de senha)</li>
                <li>Um nome de usuário que você escolhe (exibido no seu perfil)</li>
                <li>Seu histórico de avaliações (os votos e feedback que você envia sobre vídeos)</li>
              </ul>
              <p className="font-semibold mb-1">Se você for um visitante anônimo:</p>
              <p>Não coletamos nenhum dado pessoal. Não usamos análises ou pixels de rastreamento.</p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">2. Cookies</h2>
              <p className="mb-3">
                Usamos apenas <strong>cookies estritamente necessários</strong> — essenciais para o funcionamento do site.
                Não usamos cookies de publicidade, análise ou de terceiros.
                Como esses cookies são estritamente necessários, não precisamos do seu consentimento para colocá-los.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-cream-200 rounded-xl overflow-hidden">
                  <thead className="bg-cream-100">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-warm-700">Cookie</th>
                      <th className="text-left px-3 py-2 font-semibold text-warm-700">Finalidade</th>
                      <th className="text-left px-3 py-2 font-semibold text-warm-700">Validade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    <tr>
                      <td className="px-3 py-2 font-mono">locale</td>
                      <td className="px-3 py-2">Armazena sua preferência de idioma (inglês ou português)</td>
                      <td className="px-3 py-2">1 ano</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 font-mono">sb-*</td>
                      <td className="px-3 py-2">Tokens de sessão de autenticação Supabase — mantém você conectado(a) como revisor(a)</td>
                      <td className="px-3 py-2">Sessão</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">3. Como usamos seus dados</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Para criar e gerenciar sua conta de revisor(a)</li>
                <li>Para autenticá-lo(a) quando você faz login</li>
                <li>Para registrar e exibir sua atividade de avaliação</li>
                <li>Para enviar um e-mail de redefinição de senha, se solicitado</li>
              </ul>
              <p className="mt-3">
                Não vendemos seus dados, não os compartilhamos com anunciantes nem os usamos para qualquer finalidade além de operar o KindScreen.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">4. Armazenamento de dados</h2>
              <p>
                Seus dados são armazenados no Supabase (supabase.com), uma plataforma gerenciada de banco de dados e autenticação.
                Os dados são armazenados na UE (Frankfurt, Alemanha).
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">5. Seus direitos</h2>
              <p className="mb-2">Sob o LGPD e o GDPR, você tem o direito de:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Acessar</strong> os dados pessoais que mantemos sobre você</li>
                <li><strong>Excluir</strong> sua conta e todos os dados associados</li>
                <li><strong>Corrigir</strong> dados imprecisos</li>
              </ul>
              <p className="mt-3">
                Para exercer esses direitos, envie um e-mail para{' '}
                <a href="mailto:privacy@kindscreen.dev" className="text-peach hover:underline font-medium">
                  privacy@kindscreen.dev
                </a>.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">6. Retenção de dados</h2>
              <p>
                Contas de revisores e avaliações associadas são retidas enquanto a conta estiver ativa.
                Se você excluir sua conta, seu e-mail e nome de usuário serão permanentemente excluídos.
                As avaliações que você enviou poderão ser anonimizadas e retidas para manter a integridade do catálogo.
              </p>
            </section>

            <section>
              <h2 className="font-heading font-semibold text-warm-800 text-base mb-2">7. Contato</h2>
              <p>
                Dúvidas sobre esta política? Envie um e-mail para{' '}
                <a href="mailto:privacy@kindscreen.dev" className="text-peach hover:underline font-medium">
                  privacy@kindscreen.dev
                </a>.
              </p>
            </section>
          </>
        )}

      </div>
    </div>
  )
}
