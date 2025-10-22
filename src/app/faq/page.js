import Layout from "@/components/Layout";

export const metadata = {
  title: "FAQ",
  description: "Read our FAQ to learn about us.",
  openGraph: {
    title: "FAQ - OpEn",
    description: "Read our FAQ to learn about us.",
    type: "website",
  },
};

export default function Home() {
  return (
    <Layout>
      <main className="main">
        <section id="why-us" className="section why-us">
          <div className="page-title mb-5" data-aos="fade-up" data-aos-delay={100}>
            <div className="heading">
              <div className="container">
                <div className="row d-flex justify-content-center text-center">
                  <div className="col-lg-8">
                    <h1>Frequently Asked Questions (FAQs)</h1>
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
                      <section id="faq" className="py-5">
                        <div className="container mx-auto" style={{ maxWidth: "800px" }}>
                          {/* Page Title */}

                          {/* ===== GENERAL QUESTIONS ===== */}
                          <h5 className="text-center mb-4"><b>General Questions</b></h5>
                          <div className="accordion mb-5" id="accordionGeneral">
                            {/* Q1 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingG1">
                                <button
                                  className="accordion-button"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseG1"
                                  aria-expanded="true"
                                  aria-controls="collapseG1"
                                >
                                  <b> What is OpEn?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseG1"
                                className="accordion-collapse collapse show"
                                aria-labelledby="headingG1"
                                data-bs-parent="#accordionGeneral"
                              >
                                <div className="accordion-body">
                                  OpEn (Opulent Openpreneurs) is a digital platform designed to support
                                  ambitious entrepreneurs by combining AI-powered business tools, strategic
                                  education, and a collaborative global network. It’s your all-in-one system
                                  to start, grow, and scale your business with confidence.
                                </div>
                              </div>
                            </div>
                            {/* Q2 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingG2">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseG2"
                                  aria-expanded="false"
                                  aria-controls="collapseG2"
                                >
                                  <b>Who is OpEn for?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseG2"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingG2"
                                data-bs-parent="#accordionGeneral"
                              >
                                <div className="accordion-body">
                                  Whether you're exploring an idea or actively running a business, OpEn
                                  is built to support entrepreneurs at all stages of the journey — from
                                  ideation to expansion.
                                </div>
                              </div>
                            </div>
                            {/* Q3 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingG3">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseG3"
                                  aria-expanded="false"
                                  aria-controls="collapseG3"
                                >
                                  <b>Is OpEn a business school or a consultancy?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseG3"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingG3"
                                data-bs-parent="#accordionGeneral"
                              >
                                <div className="accordion-body">
                                  It’s not a traditional school or agency. OpEn combines practical learning,
                                  AI-assisted guidance, and community-based support in one unified digital
                                  platform — all designed for affordability and speed.
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* End .accordion for General Questions */}

                          {/* ===== USING LIFT AI ===== */}
                          <h5 className="text-center mb-4"><b>Using Lift AI</b></h5>
                          <div className="accordion mb-5" id="accordionLiftAI">
                            {/* Q1 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingL1">
                                <button
                                  className="accordion-button"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseL1"
                                  aria-expanded="true"
                                  aria-controls="collapseL1"
                                >
                                  <b> What is Lift AI, and how does it work?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseL1"
                                className="accordion-collapse collapse show"
                                aria-labelledby="headingL1"
                                data-bs-parent="#accordionLiftAI"
                              >
                                <div className="accordion-body">
                                  Lift AI is your intelligent business assistant. It uses guided prompts
                                  and probing questions to understand your goals and generate business
                                  content — such as marketing plans, strategies, or operations guides —
                                  tailored to your specific needs.
                                </div>
                              </div>
                            </div>
                            {/* Q2 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingL2">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseL2"
                                  aria-expanded="false"
                                  aria-controls="collapseL2"
                                >
                                  <b> Can Basic users access Lift AI?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseL2"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingL2"
                                data-bs-parent="#accordionLiftAI"
                              >
                                <div className="accordion-body">
                                  Yes. Basic users can access Lift AI by using tokens, which can be purchased
                                  or awarded based on platform activity. Premium users receive tokens with their
                                  plan and enjoy lower per-use costs.
                                </div>
                              </div>
                            </div>
                            {/* Q3 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingL3">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseL3"
                                  aria-expanded="false"
                                  aria-controls="collapseL3"
                                >
                                  <b> Do I need to know how to use AI or prompt it?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseL3"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingL3"
                                data-bs-parent="#accordionLiftAI"
                              >
                                <div className="accordion-body">
                                  Not at all. Lift AI guides you through the process using step-by-step
                                  questions, so you don’t need technical or AI expertise.
                                </div>
                              </div>
                            </div>
                            {/* Q4 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingL4">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseL4"
                                  aria-expanded="false"
                                  aria-controls="collapseL4"
                                >
                                  <b>Can I download documents created by Lift AI?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseL4"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingL4"
                                data-bs-parent="#accordionLiftAI"
                              >
                                <div className="accordion-body">
                                  Yes. Once your business document is ready, Lift AI allows you to download
                                  it in PDF or Word format.
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* End .accordion for Using Lift AI */}

                          {/* ===== AI TOKENS & CREDITS ===== */}
                          <h5 className="text-center mb-4"><b>AI Tokens &amp; Credits</b></h5>
                          <div className="accordion mb-5" id="accordionTokens">
                            {/* Q1 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingT1">
                                <button
                                  className="accordion-button"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseT1"
                                  aria-expanded="true"
                                  aria-controls="collapseT1"
                                >
                                  <b> What are AI tokens, and how do they work?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseT1"
                                className="accordion-collapse collapse show"
                                aria-labelledby="headingT1"
                                data-bs-parent="#accordionTokens"
                              >
                                <div className="accordion-body">
                                  AI tokens are credits used to interact with Lift AI. Each request
                                  consumes tokens based on the complexity of your request.
                                </div>
                              </div>
                            </div>
                            {/* Q2 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingT2">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseT2"
                                  aria-expanded="false"
                                  aria-controls="collapseT2"
                                >
                                  <b> How do I buy or earn more tokens?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseT2"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingT2"
                                data-bs-parent="#accordionTokens"
                              >
                                <div className="accordion-body">
                                  Tokens can be purchased directly through your dashboard. Occasionally,
                                  you may receive bonus tokens for completing actions or engaging with
                                  community features.
                                </div>
                              </div>
                            </div>
                            {/* Q3 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingT3">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseT3"
                                  aria-expanded="false"
                                  aria-controls="collapseT3"
                                >
                                  <b> Do tokens expire?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseT3"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingT3"
                                data-bs-parent="#accordionTokens"
                              >
                                <div className="accordion-body">
                                  Purchased tokens do not expire. Bonus or promotional tokens may have
                                  expiration windows, which will be stated when issued.
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* End .accordion for AI Tokens & Credits */}

                          {/* ===== LEARNING & COURSES ===== */}
                          <h5 className="text-center mb-4"><b>Learning &amp; Courses</b></h5>
                          <div className="accordion mb-5" id="accordionCourses">
                            {/* Q1 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingC1">
                                <button
                                  className="accordion-button"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseC1"
                                  aria-expanded="true"
                                  aria-controls="collapseC1"
                                >
                                  <b>What kind of training does OpEn offer?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseC1"
                                className="accordion-collapse collapse show"
                                aria-labelledby="headingC1"
                                data-bs-parent="#accordionCourses"
                              >
                                <div className="accordion-body">
                                  OpEn offers expert-designed, self-paced modules covering key areas
                                  like business validation, financial modeling, marketing, mindset, and more.
                                </div>
                              </div>
                            </div>
                            {/* Q2 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingC2">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseC2"
                                  aria-expanded="false"
                                  aria-controls="collapseC2"
                                >
                                  <b>Who can access the courses?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseC2"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingC2"
                                data-bs-parent="#accordionCourses"
                              >
                                <div className="accordion-body">
                                  Only Premium users can access courses. Basic users cannot access training
                                  modules but can upgrade at any time.
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* End .accordion for Learning & Courses */}

                          {/* ===== BUSINESS TOOLS DIRECTORY ===== */}
                          <h5 className="text-center mb-4"><b>Business Tools Directory</b></h5>
                          <div className="accordion mb-5" id="accordionTools">
                            {/* Q1 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingB1">
                                <button
                                  className="accordion-button"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseB1"
                                  aria-expanded="true"
                                  aria-controls="collapseB1"
                                >
                                  <b> What is the Startup Growth Toolkit?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseB1"
                                className="accordion-collapse collapse show"
                                aria-labelledby="headingB1"
                                data-bs-parent="#accordionTools"
                              >
                                <div className="accordion-body">
                                  It's a curated library of affordable, efficient tools for areas like
                                  marketing, finance, HR, and operations. All tools are categorized by
                                  business function and vetted for entrepreneurs on a lean budget.
                                </div>
                              </div>
                            </div>
                            {/* Q2 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingB2">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseB2"
                                  aria-expanded="false"
                                  aria-controls="collapseB2"
                                >
                                  <b>Can Basic users access the tools directory?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseB2"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingB2"
                                data-bs-parent="#accordionTools"
                              >
                                <div className="accordion-body">
                                  Yes. Both Basic and Premium users can browse and use the business
                                  tools directory.
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* End .accordion for Business Tools Directory */}

                          {/* ===== COMMUNITY & NETWORKING ===== */}
                          <h5 className="text-center mb-4"><b>Community &amp; Networking</b></h5>
                          <div className="accordion mb-5" id="accordionCommunity">
                            {/* Q1 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingN1">
                                <button
                                  className="accordion-button"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseN1"
                                  aria-expanded="true"
                                  aria-controls="collapseN1"
                                >
                                  <b>What are Tribes?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseN1"
                                className="accordion-collapse collapse show"
                                aria-labelledby="headingN1"
                                data-bs-parent="#accordionCommunity"
                              >
                                <div className="accordion-body">
                                  Tribes are business-stage-specific communities. You’ll join entrepreneurs
                                  navigating similar challenges, giving you access to group insights, idea
                                  sharing, and strategic conversations.
                                </div>
                              </div>
                            </div>
                            {/* Q2 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingN2">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseN2"
                                  aria-expanded="false"
                                  aria-controls="collapseN2"
                                >
                                  <b>How does MyTribers work?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseN2"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingN2"
                                data-bs-parent="#accordionCommunity"
                              >
                                <div className="accordion-body">
                                  MyTribers is your private business network within OpEn. You can search,
                                  connect, and chat with other entrepreneurs based on goals, industry, or expertise.
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* End .accordion for Community & Networking */}

                          {/* ===== PRICING & ACCESS ===== */}
                          <h5 className="text-center mb-4"><b>Pricing &amp; Access</b></h5>
                          <div className="accordion mb-5" id="accordionPricing">
                            {/* Q1 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingP1">
                                <button
                                  className="accordion-button"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseP1"
                                  aria-expanded="true"
                                  aria-controls="collapseP1"
                                >
                                  <b>Is OpEn free to use?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseP1"
                                className="accordion-collapse collapse show"
                                aria-labelledby="headingP1"
                                data-bs-parent="#accordionPricing"
                              >
                                <div className="accordion-body">
                                  Yes. You can sign up as a Basic user for free and access Lift AI (with tokens),
                                  business tools, and networking features. Courses and Premium Lift AI access require
                                  a Premium subscription.
                                </div>
                              </div>
                            </div>
                            {/* Q2 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingP2">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseP2"
                                  aria-expanded="false"
                                  aria-controls="collapseP2"
                                >
                                  <b>What’s included in the Premium plan?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseP2"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingP2"
                                data-bs-parent="#accordionPricing"
                              >
                                <div className="accordion-body">
                                  <b>Premium users get:</b>
                                  <ul className="mt-2 mb-0">
                                    <li>Access to Lift AI (with guided prompting)</li>
                                    <li>Unlimited use of curated business tools</li>
                                    <li>Full access to all training modules</li>
                                    <li>Discounted AI token pricing</li>
                                    <li>Community and networking features</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                            {/* Q3 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingP3">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseP3"
                                  aria-expanded="false"
                                  aria-controls="collapseP3"
                                >
                                  <b>Can I cancel or switch plans later?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseP3"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingP3"
                                data-bs-parent="#accordionPricing"
                              >
                                <div className="accordion-body">
                                  Yes. You can cancel or change your subscription anytime from your account dashboard.
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* End .accordion for Pricing & Access */}

                          {/* ===== TECHNICAL & SUPPORT ===== */}
                          <h5 className="text-center mb-4"><b>Technical &amp; Support</b></h5>
                          <div className="accordion mb-5" id="accordionSupport">
                            {/* Q1 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingS1">
                                <button
                                  className="accordion-button"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseS1"
                                  aria-expanded="true"
                                  aria-controls="collapseS1"
                                >
                                  <b>What devices can I use OpEn on?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseS1"
                                className="accordion-collapse collapse show"
                                aria-labelledby="headingS1"
                                data-bs-parent="#accordionSupport"
                              >
                                <div className="accordion-body">
                                  OpEn is available on both web and our dedicated mobile app. You can access
                                  the full platform experience from your desktop, tablet, or smartphone through the app.
                                </div>
                              </div>
                            </div>
                            {/* Q2 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingS2">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseS2"
                                  aria-expanded="false"
                                  aria-controls="collapseS2"
                                >
                                  <b>How do I contact support?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseS2"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingS2"
                                data-bs-parent="#accordionSupport"
                              >
                                <div className="accordion-body">
                                  Simply use the OpEn Support Hub inside the platform to submit a ticket.
                                  Our team will respond as quickly as possible.
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* End .accordion for Technical & Support */}

                          {/* ===== MOBILE APP-SPECIFIC QUESTIONS ===== */}
                          <h5 className="text-center mb-4"><b>Mobile App-Specific Questions</b></h5>
                          <div className="accordion mb-5" id="accordionMobile">
                            {/* Q1 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingM1">
                                <button
                                  className="accordion-button"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseM1"
                                  aria-expanded="true"
                                  aria-controls="collapseM1"
                                >
                                  <b>Where can I download the OpEn mobile app?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseM1"
                                className="accordion-collapse collapse show"
                                aria-labelledby="headingM1"
                                data-bs-parent="#accordionMobile"
                              >
                                <div className="accordion-body">
                                  The OpEn mobile app is available on both the Apple App Store and Google Play Store.
                                </div>
                              </div>
                            </div>
                            {/* Q2 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingM2">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseM2"
                                  aria-expanded="false"
                                  aria-controls="collapseM2"
                                >
                                  <b>Does the mobile app have all the same features as the website?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseM2"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingM2"
                                data-bs-parent="#accordionMobile"
                              >
                                <div className="accordion-body">
                                  Yes, the mobile app includes Lift AI, Tribes, tools, networking, and access to your user dashboard.
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* End .accordion for Mobile App */}

                          {/* ===== INTERNATIONAL USE ===== */}
                          <h5 className="text-center mb-4"><b>International Use</b></h5>
                          <div className="accordion mb-5" id="accordionIntl">
                            {/* Q1 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingI1">
                                <button
                                  className="accordion-button"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseI1"
                                  aria-expanded="true"
                                  aria-controls="collapseI1"
                                >
                                  <b>Is OpEn available globally?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseI1"
                                className="accordion-collapse collapse show"
                                aria-labelledby="headingI1"
                                data-bs-parent="#accordionIntl"
                              >
                                <div className="accordion-body">
                                  Yes. OpEn is accessible from any country, and supports global entrepreneurs operating in any market.
                                </div>
                              </div>
                            </div>
                            {/* Q2 */}
                            <div className="accordion-item mb-3">
                              <h2 className="accordion-header" id="headingI2">
                                <button
                                  className="accordion-button collapsed"
                                  type="button"
                                  data-bs-toggle="collapse"
                                  data-bs-target="#collapseI2"
                                  aria-expanded="false"
                                  aria-controls="collapseI2"
                                >
                                  <b> Can I connect with entrepreneurs from other countries?</b>
                                </button>
                              </h2>
                              <div
                                id="collapseI2"
                                className="accordion-collapse collapse"
                                aria-labelledby="headingI2"
                                data-bs-parent="#accordionIntl"
                              >
                                <div className="accordion-body">
                                  Yes. The MyTribers and Tribes communities are open to all users regardless of geography.
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* End .accordion for International Use */}

                        </div>
                      </section>
                    </div>
                  </div>
                  {/* End Icon Box */}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
