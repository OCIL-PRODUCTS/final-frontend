import Head from "next/head";
import Layout from "@/components/Layout";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "Read our Privacy Policy to learn how we protect your data.",
  openGraph: {
    title: "Privacy Policy - OpEn",
    description: "Read our Privacy Policy to learn how we protect your personal information.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Home() {
  return (
    <Layout>
      <main className="main">
        <section id="privacy-policy" className="section privacy-policy">
          <div className="page-title mb-5" data-aos="fade-up" data-aos-delay={100}>
            <div className="heading">
              <div className="container">
                <div className="row d-flex justify-content-center text-center">
                  <div className="col-lg-8">
                    <h1>Privacy & Policy</h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="container">
            <div className="row gy-12">
              <div className="col-lg-12">
                <div className="row gy-12" data-aos="fade-up" data-aos-delay={200}>
                  <div className="col-xl-12" data-aos="fade-up" data-aos-delay={400}>
                    <div className="flex-column">

                      <div id="introduction">
                        <h2>1. Introduction</h2>
                        <p>
                          OpEn Platform (“OpEn,” “we,” “us,” or “our”) respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, disclose, and safeguard your information when you use our web platform or mobile app. By using OpEn, you agree to the collection and use of information in accordance with this policy.
                        </p>
                      </div>

                      <div id="information-collected">
                        <h2>2. Information We Collect</h2>
                        <p>When you use the OpEn platform (web or mobile), we may collect the following types of information:</p>
                        <ul>
                          <li>
                            <strong>Account & Profile Information</strong>: Name, email address, username, business information (e.g., industry, country of operation, markets covered), subscription type (Basic or Premium), and plan details.
                          </li>
                          <li>
                            <strong>Activity & Usage Data</strong>: Features used (e.g., Lift AI, Tribes, Tools, Learning Modules), interaction history with AI tools and documents generated, navigation and engagement data (e.g., pages viewed, buttons clicked, session durations).
                          </li>
                          <li>
                            <strong>Chat & Messaging Data</strong>: Content of messages you send via our chat features (including one-to-one, group, or community chat), timestamps, metadata (e.g., sender/receiver identifiers), and any files you upload through chat. We retain this data to provide chat functionality, moderate content in compliance with community guidelines, and improve our services. Chat content is not shared with third parties except as required by law.
                          </li>
                          <li>
                            <strong>Transaction Information</strong>: Token purchases and usage history, payment confirmations, and plan upgrades.
                          </li>
                          <li>
                            <strong>Device & Technical Information</strong>: Device type, operating system, browser, IP address, and mobile app usage logs (if using the OpEn app).
                          </li>
                          <li>
                            <strong>Communication Data</strong>: Messages submitted via support forms, feedback tools, email correspondence, and participation in Tribes, MyTribers, or community discussions.
                          </li>
                          <li>
                            <strong>Third-Party Integrations</strong>: Information collected via tools integrated into OpEn, such as payment processors (e.g., Stripe) or AI APIs (e.g., OpenAI). We may combine the above data with information from other sources to provide a more personalized and secure experience.
                          </li>
                        </ul>
                      </div>

                      <div id="use-of-info">
                        <h2>3. How We Use Your Information</h2>
                        <p>We use the information we collect to operate, maintain, and improve the OpEn platform. Specifically, your data may be used for the following purposes:</p>
                        <ul>
                          <li>
                            <strong>To Provide Core Services</strong>: Facilitate access to Lift AI, Tribes, MyTribers, Business Tools Directory, chat features, and other platform functionalities; process token usage and subscription payments.
                          </li>
                          <li>
                            <strong>To Personalize Your Experience</strong>: Tailor AI prompts and outputs based on your inputs and business profile; recommend tools, resources, and connections based on your activity.
                          </li>
                          <li>
                            <strong>To Improve Our Platform</strong>: Analyze usage patterns (including chat logs, anonymized) to enhance Lift AI responses, chat features, feature design, and user flow; identify bugs and improve performance.
                          </li>
                          <li>
                            <strong>To Communicate With You</strong>: Send platform-related updates, support responses, notifications (e.g., token balance, new features), and marketing emails only with your consent.
                          </li>
                          <li>
                            <strong>To Enforce Terms and Ensure Security</strong>: Monitor platform activity, including chat interactions, for fraud prevention, abuse, harassment, or community guideline violations; protect the integrity and availability of OpEn services.
                          </li>
                          <li>
                            <strong>To Comply With Legal Obligations</strong>: Retain transaction records, chat logs (where required), and fulfill compliance requirements under applicable laws.
                          </li>
                        </ul>
                      </div>

                      <div id="legal-basis">
                        <h2>4. Legal Basis for Processing (EU/UK/Canada Users)</h2>
                        <p>If you are located in the European Union (EU), United Kingdom (UK), or Canada, we are required to explain the legal grounds on which we rely to process your personal data. These include:</p>
                        <ul>
                          <li>
                            <strong>Contractual Necessity</strong>: We process your data as required to provide services you’ve requested—such as access to Lift AI, Tribes, chat, subscription management, and token transactions.
                          </li>
                          <li>
                            <strong>Legitimate Interests</strong>: We process certain data (e.g., usage analytics, chat logs in anonymized form) to improve the platform, enhance AI functionality, prevent misuse, and optimize your experience—always balancing our interests with your privacy rights.
                          </li>
                          <li>
                            <strong>Consent</strong>: For optional features (e.g., marketing emails or public profiles), we rely on your consent, which you may withdraw at any time from your settings.
                          </li>
                          <li>
                            <strong>Legal Obligations</strong>: We retain and process some information (e.g., transaction data, chat logs when required by law) as required by applicable financial, tax, or security regulations.
                          </li>
                        </ul>
                        <p><strong>Additional Notices by Jurisdiction:</strong></p>
                        <p><strong>California Residents (CCPA/CPRA)</strong>: You have the right to request details about what personal data we collect and to request deletion of your personal information. We do not sell your personal data. You may designate an authorized agent to act on your behalf for CCPA requests. To exercise these rights, contact: <a href="mailto:info@openpreneurs.business">info@openpreneurs.business</a> or use the Support Hub.</p>
                        <p><strong>Nigerian Residents (NDPR)</strong>: We adhere to the principles of data minimization, purpose limitation, and user consent as mandated under the NDPR. You may request access, correction, or deletion of your data at any time. Any transfer of your data outside Nigeria is done only to platforms with adequate data protection frameworks.</p>
                      </div>

                      <div id="sharing">
                        <h2>5. Sharing &amp; Disclosure of Information</h2>
                        <p>We do not sell your personal data. However, we may share your information with trusted third parties under the following circumstances:</p>
                        <ol>
                          <li>
                            <strong>Service Providers</strong>: We use third-party vendors to help operate our platform—including for cloud hosting, analytics, payment processing (Stripe), technical support, and communication. These providers are contractually obligated to protect your data and may only use it to deliver services on our behalf.
                          </li>
                          <li>
                            <strong>AI Infrastructure Providers</strong>: When you use Lift AI or any AI-powered feature, your prompts and session context are processed through external APIs (such as OpenAI). These partners receive only the necessary data to fulfill your AI requests and are subject to strict data handling agreements.
                          </li>
                          <li>
                            <strong>Community Interactions</strong>: If you engage in community features such as Tribes, MyTribers, or chat groups, certain profile details (like your name, role, and business focus) and the content you post may be visible to other users. You control what information you share publicly.
                          </li>
                          <li>
                            <strong>Chat Content</strong>: Chat messages (one-to-one or group) are private by default. We do not share chat content with any third party except to comply with legal obligations or to investigate fraud or abuse. Moderators may access chat logs only when necessary to enforce community guidelines.
                          </li>
                          <li>
                            <strong>Legal Compliance &amp; Safety</strong>: We may disclose your information where required to comply with legal obligations, enforce our Terms of Use, protect user safety, or investigate fraud or abuse.
                          </li>
                          <li>
                            <strong>Business Transfers</strong>: In the event of a merger, acquisition, or sale of all or part of our assets, your information (including account details, chat logs, and transaction history) may be transferred to the new entity. If this occurs, we will notify you before any material changes are made to your data rights.
                          </li>
                        </ol>
                      </div>

                      <div id="data-security">
                        <h2>6. Data Security</h2>
                        <p>We implement administrative, technical, and physical safeguards to protect your data. We use encryption in transit (TLS) and at rest to protect sensitive information, which includes payment data. Access to personal data is restricted—only authorized personnel may view it when necessary for support, moderation, or maintenance, and such access is logged and audited. We conduct periodic security assessments and employee training to ensure robust protection.</p>
                      </div>

                      <div id="data-retention">
                        <h2>7. Data Retention</h2>
                        <p>We retain your personal data, including account information, chat logs, and transaction records, for as long as your account is active or as needed for legitimate business purposes, legal obligations, dispute resolution, or to enforce our agreements. You can request deletion at any time by contacting support; however, we may retain certain information to comply with legal requirements or to prevent fraud.</p>
                      </div>

                      <div id="international-transfers">
                        <h2>8. International Transfers</h2>
                        <p>Your data may be processed in countries outside your country of residence (including the United States), depending on where our servers and third-party providers are located. We ensure adequate safeguards, such as Standard Contractual Clauses (SCCs) or similar mechanisms, are in place to protect your data when transferred internationally.</p>
                      </div>

                      <div id="cookies-tracking">
                        <h2>9. Cookies &amp; Tracking Technologies</h2>
                        <p>OpEn uses cookies and similar tracking technologies to enhance your user experience, analyze platform usage, and deliver personalized content.</p>
                        <p><strong>a. What Are Cookies?</strong></p>
                        <p>Cookies are small text files stored on your device when you access a website or mobile app. They help us recognize you across sessions and remember your preferences.</p>
                        <p><strong>b. Types of Cookies We Use</strong></p>
                        <ul>
                          <li><strong>Essential Cookies</strong> – Necessary for platform functionality (e.g., login sessions, navigation).</li>
                          <li><strong>Performance Cookies</strong> – Help us understand how users interact with the platform so we can improve usability.</li>
                          <li><strong>Functional Cookies</strong> – Store preferences like language or user interface settings.</li>
                          <li><strong>Analytics &amp; AI Tracking Cookies</strong> – Track Lift AI usage, chat flows, and prompt interactions to improve AI performance and personalize responses.</li>
                        </ul>
                        <p><strong>c. Third-Party Cookies</strong></p>
                        <p>We may allow trusted third-party tools (e.g., Google Analytics, payment processors) to set cookies on our platform. These cookies are governed by their respective privacy policies.</p>
                        <p><strong>d. Your Cookie Controls</strong></p>
                        <p>You can manage or disable cookies in your browser settings. Please note that some features of the platform, including chat and AI-based personalization, may not function properly without essential cookies. On mobile, you can control tracking permissions through your device settings.</p>
                      </div>

                      <div id="childrens-privacy">
                        <h2>10. Children’s Privacy</h2>
                        <p>OpEn is intended for adult entrepreneurs and is not designed for or directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we discover that a child under 18 has provided us with personal information, we will take immediate steps to delete that information from our systems. If you are a parent or guardian and believe your child has submitted data to OpEn, please contact us at <a href="mailto:info@openpreneurs.business">info@openpreneurs.business</a> so we can take appropriate action.</p>
                      </div>

                      <div id="your-rights">
                        <h2>11. Your Rights</h2>
                        <p>Depending on your jurisdiction, you have certain rights over your personal data. We are committed to upholding these rights and enabling you to control your information at any time.</p>
                        <p><strong>a. Access and Portability</strong></p>
                        <p>You can request access to the personal data we hold about you, including the right to receive a copy in a structured, commonly used, and machine-readable format.</p>
                        <p><strong>b. Rectification</strong></p>
                        <p>You may request correction of any inaccurate or incomplete personal data we hold about you.</p>
                        <p><strong>c. Deletion (Right to be Forgotten)</strong></p>
                        <p>You can request that we delete your personal data, subject to legal or legitimate business grounds for retention (e.g., fraud prevention, financial reporting).</p>
                        <p><strong>d. Restriction of Processing</strong></p>
                        <p>You have the right to request that we limit the use of your data under certain conditions (e.g., pending an accuracy dispute).</p>
                        <p><strong>e. Objection to Processing</strong></p>
                        <p>In some cases, you can object to our processing of your personal data (e.g., for direct marketing or profiling).</p>
                        <p><strong>f. Withdrawal of Consent</strong></p>
                        <p>Where processing is based on your consent (e.g., newsletters or public profiles), you may withdraw consent at any time without affecting the lawfulness of prior processing.</p>
                        <p><strong>g. Complaints</strong></p>
                        <p>You may file a complaint with your local data protection authority if you believe your privacy rights have been violated.</p>
                        <p><strong>How to Exercise Your Rights:</strong></p>
                        <ul>
                          <li>Log into your account and update your profile or settings.</li>
                          <li>Contact us at <a href="mailto:info@openpreneurs.business">info@openpreneurs.business</a>.</li>
                        </ul>
                        <p>We will respond to all requests in accordance with applicable data protection laws, typically within 30 days.</p>
                      </div>

                      <div id="updates-to-policy">
                        <h2>12. Updates to This Policy</h2>
                        <p>We may update this Privacy Policy from time to time to reflect changes in our services, technology, legal requirements, or business practices. When we make material changes, we will:</p>
                        <ul>
                          <li>Notify you via email (if you’ve opted in),</li>
                          <li>Display a prominent notice on your dashboard or app, and</li>
                          <li>Update the “Last Updated” date at the top of the policy.</li>
                        </ul>
                        <p>We encourage you to review this policy periodically to stay informed about how we protect your data and your rights.</p>
                      </div>

                      <div id="contact-us">
                        <h2>13. Contact Information</h2>
                        <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, you may contact us at:<br />
                          📧 <a href="mailto:info@openpreneurs.business">info@openpreneurs.business</a><br />
                          Address: Opulence Capital, 123 Entrepreneur Way, Business City, Country
                        </p>
                      </div>

                    </div>
                  </div>
                  {/* End Privacy Content */}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
