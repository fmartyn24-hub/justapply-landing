import Head from 'next/head'
import Link from 'next/link'

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service - justapply.eu</title>
        <meta name="description" content="Terms of Service for justapply.eu" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <div className="bg-white text-dark min-h-screen">
        {/* Navigation */}
        <nav className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Link href="/">
              <img src="/logo-light.svg" alt="justapply" className="h-10" />
            </Link>
            <button
              onClick={() => window.close()}
              className="text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              Close
            </button>
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

          <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing and using justapply.eu (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
              <p>
                Permission is granted to temporarily download one copy of the materials (information or software) on justapply.eu for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile or reverse engineer any software contained on justapply.eu</li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
                <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Disclaimer</h2>
              <p>
                The materials on justapply.eu are provided on an 'as is' basis. justapply.eu makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Limitations</h2>
              <p>
                In no event shall justapply.eu or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on justapply.eu, even if justapply.eu or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Accuracy of Materials</h2>
              <p>
                The materials appearing on justapply.eu could include technical, typographical, or photographic errors. justapply.eu does not warrant that any of the materials on justapply.eu are accurate, complete, or current. justapply.eu may make changes to the materials contained on justapply.eu at any time without notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Links</h2>
              <p>
                justapply.eu has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by justapply.eu of the site. Use of any such linked website is at the user's own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Modifications</h2>
              <p>
                justapply.eu may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of the European Union, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. User Accounts</h2>
              <p>
                If you create an account on justapply.eu, you are responsible for maintaining the confidentiality of your account information and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Content</h2>
              <p>
                You retain all rights to any content you submit, post or display on or through the Service. By submitting content to justapply.eu, you grant justapply.eu a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such content in any media or medium and for any purposes.
              </p>
            </section>

            <section className="pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Last updated: May 2026
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  )
}
