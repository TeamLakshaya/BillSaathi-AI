import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/common/Icon';

export const LandingPage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleAnalyzeClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/upload');
  };

  const handleDashboardClick = () => {
    setIsMobileMenuOpen(false);
    navigate('/overview');
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page" id="top">
      {/* --------------------------------------------------------------------
          1. Responsive Navbar
          -------------------------------------------------------------------- */}
      <header className="landing-nav-header">
        <div className="landing-container">
          <div className="landing-nav-inner">
            <Link to="/" className="landing-brand" aria-label="Bill Saathi AI Home">
              <img
                src="assets/logo-transparent.png"
                alt="Bill Saathi AI - Aapka Bill, Aapka Adhikaar"
                className="landing-brand-logo"
              />
            </Link>

            <nav className="landing-nav-links" aria-label="Landing Navigation">
              <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')} className="landing-nav-link">
                How It Works
              </a>
              <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="landing-nav-link">
                Features
              </a>
              <a href="#sample-report" onClick={(e) => handleSmoothScroll(e, 'sample-report')} className="landing-nav-link">
                Sample Report
              </a>
              <a href="#privacy" onClick={(e) => handleSmoothScroll(e, 'privacy')} className="landing-nav-link">
                Privacy
              </a>
              <a href="#faq" onClick={(e) => handleSmoothScroll(e, 'faq')} className="landing-nav-link">
                FAQ
              </a>
            </nav>

            <div className="landing-nav-actions">
              <button
                type="button"
                onClick={handleDashboardClick}
                className="btn-nav-ghost"
                title="Enter bill analysis workspace"
              >
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                onClick={handleAnalyzeClick}
                className="btn-cta-primary"
                title="Upload and analyze your medical bill"
              >
                <span>Analyze My Bill</span>
                <Icon name="arrow" style={{ width: 16, height: 16 }} />
              </button>

              <button
                type="button"
                className="landing-mobile-toggle"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <Icon name={isMobileMenuOpen ? 'close' : 'menu'} style={{ width: 24, height: 24 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <div className={`landing-mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="landing-nav-links">
            <a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')} className="landing-nav-link">
              How It Works
            </a>
            <a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="landing-nav-link">
              Features
            </a>
            <a href="#sample-report" onClick={(e) => handleSmoothScroll(e, 'sample-report')} className="landing-nav-link">
              Sample Report
            </a>
            <a href="#privacy" onClick={(e) => handleSmoothScroll(e, 'privacy')} className="landing-nav-link">
              Privacy & Security
            </a>
            <a href="#faq" onClick={(e) => handleSmoothScroll(e, 'faq')} className="landing-nav-link">
              FAQ
            </a>
          </div>
          <div className="landing-nav-actions">
            <button type="button" onClick={handleDashboardClick} className="btn-nav-ghost" style={{ width: '100%', justifyContent: 'center' }}>
              Open Dashboard
            </button>
            <button type="button" onClick={handleAnalyzeClick} className="btn-cta-primary" style={{ width: '100%', justifyContent: 'center' }}>
              <span>Analyze My Bill</span>
              <Icon name="arrow" style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------
          2. Hero Section
          -------------------------------------------------------------------- */}
      <section className="landing-hero" aria-labelledby="hero-heading">
        <div className="landing-container">
          <div className="hero-pill">
            <span className="hero-pill-dot" />
            <span>AI-Assisted Indian Medical Bill Verification</span>
          </div>

          <h1 id="hero-heading" className="hero-headline">
            Understand Your Hospital Bill. <br />Know What to Question.
          </h1>

          <p className="hero-subhead">
            Turn complex hospital bills into clear, itemized insights. Check calculations,
            identify potential duplicate charges, compare available pricing evidence, and generate
            a report to help you ask informed questions.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              onClick={handleAnalyzeClick}
              className="btn-cta-primary btn-hero-lg"
              id="hero-analyze-cta"
            >
              <span>Analyze My Bill</span>
              <Icon name="arrow" style={{ width: 18, height: 18 }} />
            </button>
            <a
              href="#how-it-works"
              onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
              className="btn-hero-secondary"
            >
              <span>See How It Works</span>
              <Icon name="chevron" style={{ width: 16, height: 16 }} />
            </a>
          </div>

          <div className="hero-trust-points">
            <div className="trust-point-item">
              <Icon name="check" style={{ width: 16, height: 16 }} />
              <span>100% Deterministic Financial Arithmetic</span>
            </div>
            <div className="trust-point-item">
              <Icon name="check" style={{ width: 16, height: 16 }} />
              <span>No Account or Sign-up Required</span>
            </div>
            <div className="trust-point-item">
              <Icon name="check" style={{ width: 16, height: 16 }} />
              <span>Cross-checks NPPA Statutory Drug & Device Caps</span>
            </div>
          </div>

          {/* Illustrative Hero Preview Mockup Card */}
          <div className="hero-mockup-wrapper">
            <div className="hero-preview-card">
              <div className="preview-header-bar">
                <div className="preview-header-info">
                  <Icon name="shield" style={{ width: 18, height: 18, color: 'var(--blue)' }} />
                  <strong>Apollo Hospital (Demo Facility)</strong>
                  <span style={{ color: 'var(--text-subtle)' }}>• Bill Date: 16 Mar 2024</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="preview-badge-demo">Demo Data Preview</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>Total Billed: ₹65,000.00</span>
                </div>
              </div>

              <div className="preview-table-container">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Billed Item Description</th>
                      <th>Qty & Rate</th>
                      <th>Billed Amount</th>
                      <th>Verified Benchmark Reference</th>
                      <th>Verification Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="item-main-desc">Coronary Drug Eluting Stent (DES)</div>
                        <div className="item-sub-meta">Code: STENT-DES-01 • Category: Procedures</div>
                      </td>
                      <td>1.00 unit @ ₹65,000</td>
                      <td><strong>₹65,000.00</strong></td>
                      <td>
                        <div>₹30,080.00</div>
                        <div className="item-sub-meta">NPPA Order S.O. 1335(E)</div>
                      </td>
                      <td>
                        <span className="status-badge-discrepancy">
                          <Icon name="warning" style={{ width: 12, height: 12 }} />
                          Verified Discrepancy (+₹34,920)
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="item-main-desc">Hospital Admission & Registration Fee</div>
                        <div className="item-sub-meta">Billed 2x on same admission record</div>
                      </td>
                      <td>2.00 charge @ ₹1,000</td>
                      <td><strong>₹2,000.00</strong></td>
                      <td>
                        <div>₹1,000.00 max</div>
                        <div className="item-sub-meta">Standard One-Time Admission</div>
                      </td>
                      <td>
                        <span className="status-badge-review">
                          <Icon name="info" style={{ width: 12, height: 12 }} />
                          Needs Review (Duplicate Charge)
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="item-main-desc">Complete Blood Count (CBC Test)</div>
                        <div className="item-sub-meta">Code: DIAG-CBC-01 • Category: Diagnostics</div>
                      </td>
                      <td>1.00 test @ ₹180</td>
                      <td><strong>₹180.00</strong></td>
                      <td>
                        <div>₹180.00</div>
                        <div className="item-sub-meta">CGHS Delhi Diagnostic Reference</div>
                      </td>
                      <td>
                        <span className="status-badge-verified">
                          <Icon name="check" style={{ width: 12, height: 12 }} />
                          No Discrepancy Detected
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="preview-footer-summary">
                <div>
                  <strong>Audit Status:</strong> 1 Statutory Cap Breach Detected • 1 Charge Requires Review • Deterministic math verified
                </div>
                <button
                  type="button"
                  onClick={handleAnalyzeClick}
                  className="btn-cta-primary"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                >
                  <span>Analyze Your Own Bill</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          3. Trust Strip
          -------------------------------------------------------------------- */}
      <section className="landing-trust-strip" aria-label="Key Verification Capabilities">
        <div className="landing-container">
          <div className="trust-strip-grid">
            <div className="trust-strip-item">
              <div className="icon-box">
                <Icon name="audit" style={{ width: 20, height: 20 }} />
              </div>
              <h3>Arithmetic Checks</h3>
              <p>Re-computes every line item (quantity × rate) and flags grand total summation mismatches.</p>
            </div>

            <div className="trust-strip-item">
              <div className="icon-box">
                <Icon name="warning" style={{ width: 20, height: 20 }} />
              </div>
              <h3>Duplicate-Charge Review</h3>
              <p>Identifies repeated entries, distinguishing one-time admission fees from distinct administrations.</p>
            </div>

            <div className="trust-strip-item">
              <div className="icon-box">
                <Icon name="price" style={{ width: 20, height: 20 }} />
              </div>
              <h3>Pricing Reference Evidence</h3>
              <p>Cross-references official NPPA statutory price caps and verified hospital tariffs when documented.</p>
            </div>

            <div className="trust-strip-item">
              <div className="icon-box">
                <Icon name="download" style={{ width: 20, height: 20 }} />
              </div>
              <h3>Downloadable Reports</h3>
              <p>Generates an itemized evidence PDF summary to guide productive conversations with your hospital.</p>
            </div>
          </div>

          <p className="trust-disclaimer-note">
            *Bill Saathi AI provides automated informational analysis based on stored reference data. We make no claims of official government endorsement or guaranteed monetary recovery.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          4. The Problem Section
          -------------------------------------------------------------------- */}
      <section className="landing-problem" aria-labelledby="problem-heading">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-tag">Why Bills are Confusing</span>
            <h2 id="problem-heading" className="section-title">
              Hospital Invoices Shouldn't Require a Medical or Legal Degree to Decipher
            </h2>
            <p className="section-desc">
              During hospitalizations and discharge, patients and families are handed multi-page itemized
              receipts filled with abbreviations, grouped charges, and ambiguous line items.
            </p>
          </div>

          <div className="problem-cards-grid">
            <div className="problem-card">
              <div className="problem-icon-wrapper">
                <Icon name="file" style={{ width: 22, height: 22 }} />
              </div>
              <div className="problem-card-body">
                <h3>Lumped Medical Jargon</h3>
                <p>
                  Charges often list technical clinical abbreviations or lump multiple pharmacy items and
                  consumables together without transparent unit pricing, making verification nearly impossible.
                </p>
              </div>
            </div>

            <div className="problem-card">
              <div className="problem-icon-wrapper">
                <Icon name="warning" style={{ width: 22, height: 22 }} />
              </div>
              <div className="problem-card-body">
                <h3>Undetected Arithmetic Errors</h3>
                <p>
                  Between emergency admissions, ICU transitions, and pharmacy dispensations, manual calculations
                  or system rounding can inadvertently result in line totals not matching the final billed sum.
                </p>
              </div>
            </div>

            <div className="problem-card">
              <div className="problem-icon-wrapper">
                <Icon name="clock" style={{ width: 22, height: 22 }} />
              </div>
              <div className="problem-card-body">
                <h3>Unintentional Repeated Charges</h3>
                <p>
                  One-time services (such as hospital admission fees, clinical intake documentation, or
                  discharge summaries) sometimes appear across multiple department slips on the same visit.
                </p>
              </div>
            </div>

            <div className="problem-card">
              <div className="problem-icon-wrapper">
                <Icon name="shield" style={{ width: 22, height: 22 }} />
              </div>
              <div className="problem-card-body">
                <h3>Opaque Reference Tariffs</h3>
                <p>
                  While the Indian Government and the NPPA enforce strict legal price caps on essential stents
                  and life-saving medications, patients rarely know where to look up these statutory ceilings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          5. Three-Step How It Works Section
          -------------------------------------------------------------------- */}
      <section className="landing-steps" id="how-it-works" aria-labelledby="steps-heading">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-tag">Simple 3-Step Process</span>
            <h2 id="steps-heading" className="section-title">How Bill Saathi AI Analyzes Your Invoice</h2>
            <p className="section-desc">
              Deterministic, patient-controlled analysis from document upload to evidence-backed summary.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num-badge">1</div>
              <h3>Upload Your Document</h3>
              <p>
                Upload your hospital invoice, pharmacy bill, or discharge summary as a PDF, JPEG, or PNG.
                The system securely validates the file structure and extracts digital or scanned text.
              </p>
              <div className="step-meta-note">Supports PDFs, Photos & Scans</div>
            </div>

            <div className="step-card">
              <div className="step-num-badge">2</div>
              <h3>Review Extracted Items</h3>
              <p>
                Our backend structures every clinical item, quantity, unit rate, and stated total into clean data.
                You can review, confirm, or manually correct any blurred or flagged numbers before verification.
              </p>
              <div className="step-meta-note">You Retain Full Editorial Control</div>
            </div>

            <div className="step-card">
              <div className="step-num-badge">3</div>
              <h3>Check Evidence & Download Report</h3>
              <p>
                The deterministic engine runs mathematical checks, evaluates date-effective price benchmarks,
                and generates a factual, downloadable PDF dossier with specific questions for your billing desk.
              </p>
              <div className="step-meta-note">Downloadable Evidence PDF Dossier</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <button type="button" onClick={handleAnalyzeClick} className="btn-cta-primary btn-hero-lg">
              <span>Start Analyzing a Bill Now</span>
              <Icon name="arrow" style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          6. Key Features Grid
          -------------------------------------------------------------------- */}
      <section className="landing-features" id="features" aria-labelledby="features-heading">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-tag">Powerful Verification Tools</span>
            <h2 id="features-heading" className="section-title">Built for Accuracy, Factual Evidence & Transparency</h2>
            <p className="section-desc">
              Every computation is performed with deterministic Decimal arithmetic on the backend—not approximate LLM generation.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-item-card">
              <div className="feature-icon-box">
                <Icon name="file" style={{ width: 22, height: 22 }} />
              </div>
              <h3>Itemized Clinical Extraction</h3>
              <p>
                Parses unstructured billing invoices into standardized item descriptions, unit rates, quantities,
                and clinical categories (Pharmacy, Diagnostics, Room & Nursing, Procedures).
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-box">
                <Icon name="audit" style={{ width: 22, height: 22 }} />
              </div>
              <h3>Dual-Layer Arithmetic Verification</h3>
              <p>
                Validates individual line multiplication (`quantity × unit_price = line_total`) and flags
                differences between individual item totals and the aggregate grand total.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-box">
                <Icon name="warning" style={{ width: 22, height: 22 }} />
              </div>
              <h3>Clinically-Aware Duplicate Checks</h3>
              <p>
                Distinguishes legitimate multiple administrations from duplicate one-time admission fees,
                preventing false accusations while highlighting items that warrant nursing chart verification.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-box">
                <Icon name="price" style={{ width: 22, height: 22 }} />
              </div>
              <h3>Statutory Price Ceiling Matching</h3>
              <p>
                Cross-references active NPPA drug and medical device price orders (such as coronary DES stents
                and DPCO essential medicines) with strict effective-date validation.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-box">
                <Icon name="shield" style={{ width: 22, height: 22 }} />
              </div>
              <h3>Four Standardized Audit Statuses</h3>
              <p>
                Classifies findings strictly as `verified_discrepancy`, `needs_review`, `insufficient_evidence`,
                or `no_discrepancy_detected`—ensuring high prices alone are never labeled illegal overcharging.
              </p>
            </div>

            <div className="feature-item-card">
              <div className="feature-icon-box">
                <Icon name="download" style={{ width: 22, height: 22 }} />
              </div>
              <h3>Downloadable PDF Dossier</h3>
              <p>
                Generates a clean ReportLab PDF audit dossier equipped with calculation evidence, cited
                sources, statutory references, and recommended steps for hospital billing redressal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          7. Sample Report Preview
          -------------------------------------------------------------------- */}
      <section className="landing-sample-report" id="sample-report" aria-labelledby="sample-report-heading">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-tag">Evidence-Based Output</span>
            <h2 id="sample-report-heading" className="section-title">See What a Verification Report Looks Like</h2>
            <p className="section-desc">
              Every finding includes exact arithmetic, cited regulatory sources, and clear explanations.
            </p>
          </div>

          <div className="sample-report-card">
            <div className="sample-report-header">
              <div>
                <h3>Bill Saathi AI Medical Bill Audit Report</h3>
                <p>Case Reference: #BS-2024-DEMO • Patient: Demo Session • Hospital: Apollo Health City (Demo)</p>
              </div>
              <span className="sample-report-badge">Demo Data • Synthetic Illustration</span>
            </div>

            <div className="sample-metrics-strip">
              <div className="sample-metric-box">
                <div className="sample-metric-label">Total Amount Billed</div>
                <div className="sample-metric-val">₹98,500.00</div>
              </div>
              <div className="sample-metric-box">
                <div className="sample-metric-label">Verified Discrepancies</div>
                <div className="sample-metric-val red">₹34,920.00</div>
              </div>
              <div className="sample-metric-box">
                <div className="sample-metric-label">Items Needing Review</div>
                <div className="sample-metric-val amber">2 Items</div>
              </div>
              <div className="sample-metric-box">
                <div className="sample-metric-label">Rates Within Reference</div>
                <div className="sample-metric-val" style={{ color: 'var(--emerald)' }}>2 Items</div>
              </div>
            </div>

            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Billed Line Item</th>
                    <th>Billed Amount</th>
                    <th>Reference / Limit</th>
                    <th>Variance</th>
                    <th>Audit Finding & Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="item-main-desc">Coronary Drug Eluting Stent (DES)</div>
                      <div className="item-sub-meta">Code: STENT-DES-01 • Category: Procedures</div>
                    </td>
                    <td>₹65,000.00</td>
                    <td>₹30,080.00</td>
                    <td><strong style={{ color: 'var(--red)' }}>+₹34,920.00</strong></td>
                    <td>
                      <div className="status-badge-discrepancy" style={{ marginBottom: 4 }}>
                        Verified Discrepancy
                      </div>
                      <div className="item-sub-meta">
                        Billed rate exceeds official statutory cap of ₹30,080 under NPPA Order S.O. 1335(E).
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="item-main-desc">Laparoscopic Cholecystectomy Procedure</div>
                      <div className="item-sub-meta">Category: Procedures</div>
                    </td>
                    <td>₹85,000.00</td>
                    <td>₹55,000.00</td>
                    <td><strong style={{ color: 'var(--amber)' }}>+₹30,000.00</strong></td>
                    <td>
                      <div className="status-badge-review" style={{ marginBottom: 4 }}>
                        Needs Review
                      </div>
                      <div className="item-sub-meta">
                        Billed rate is 54.5% above regional market median reference. Institutional tier review recommended.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="item-main-desc">Hospital Admission & Administrative Fee</div>
                      <div className="item-sub-meta">Repeated entry on Day 1 & Day 3</div>
                    </td>
                    <td>₹2,000.00</td>
                    <td>₹1,000.00</td>
                    <td><strong style={{ color: 'var(--amber)' }}>+₹1,000.00</strong></td>
                    <td>
                      <div className="status-badge-review" style={{ marginBottom: 4 }}>
                        Potential Duplicate
                      </div>
                      <div className="item-sub-meta">
                        One-time admission charge billed twice. Check with billing desk if this represents a single stay.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="item-main-desc">Custom Stereotactic Body Radiotherapy Plan</div>
                      <div className="item-sub-meta">Category: Oncology / Specialized</div>
                    </td>
                    <td>₹12,500.00</td>
                    <td>N/A</td>
                    <td>—</td>
                    <td>
                      <div className="status-badge-insufficient" style={{ marginBottom: 4 }}>
                        Insufficient Evidence
                      </div>
                      <div className="item-sub-meta">
                        No published statutory cap or verified regional tariff available for this specialized protocol.
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="item-main-desc">ICU Bed Charges (per day)</div>
                      <div className="item-sub-meta">Code: ROOM-ICU-01 • Category: Room & Nursing</div>
                    </td>
                    <td>₹8,500.00</td>
                    <td>₹8,500.00</td>
                    <td>₹0.00</td>
                    <td>
                      <div className="status-badge-verified" style={{ marginBottom: 4 }}>
                        Within Reference
                      </div>
                      <div className="item-sub-meta">
                        Billed rate matches published institutional tariff schedule.
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="preview-footer-summary" style={{ background: '#f8fafc', padding: 18 }}>
              <div style={{ maxWidth: 800 }}>
                <strong>Important Notice:</strong> Values displayed above illustrate synthetic test data. Bill Saathi AI reports provide factual calculations and reference matches to assist your personal inquiries, not judicial declarations.
              </div>
              <button type="button" onClick={handleAnalyzeClick} className="btn-cta-primary">
                <span>Upload & Verify Your Bill</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          8. Privacy & Responsible-Use Architecture
          -------------------------------------------------------------------- */}
      <section className="landing-privacy" id="privacy" aria-labelledby="privacy-heading">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-tag">Privacy & Security</span>
            <h2 id="privacy-heading" className="section-title">Designed with Local Privacy and Transparent Retention</h2>
            <p className="section-desc">
              We describe our exact technical architecture truthfully, without fabricating claims.
            </p>
          </div>

          <div className="privacy-grid">
            <div className="privacy-card">
              <div className="privacy-icon">
                <Icon name="shield" style={{ width: 20, height: 20 }} />
              </div>
              <h3>Local Document Persistence</h3>
              <p>
                Uploaded bills and generated PDF dossiers reside strictly within your configured local storage
                directory (`uploads/` and `reports/`). Files are never sold or shared with data brokers.
              </p>
            </div>

            <div className="privacy-card">
              <div className="privacy-icon">
                <Icon name="lock" style={{ width: 20, height: 20 }} />
              </div>
              <h3>No Account Barrier for Demo Audits</h3>
              <p>
                You can run sample evaluations and bill checks directly in demo mode without creating an account,
                submitting passwords, or handing over personal contact details.
              </p>
            </div>

            <div className="privacy-card">
              <div className="privacy-icon">
                <Icon name="eye" style={{ width: 20, height: 20 }} />
              </div>
              <h3>Automated PII Log Redaction</h3>
              <p>
                The backend logging layer automatically sanitizes Indian Aadhaar card numbers, phone numbers,
                and patient names, preventing personal identifiers from leaking into server log files.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          9. FAQ Section
          -------------------------------------------------------------------- */}
      <section className="landing-faq" id="faq" aria-labelledby="faq-heading">
        <div className="landing-container">
          <div className="section-head">
            <span className="section-tag">Frequently Asked Questions</span>
            <h2 id="faq-heading" className="section-title">Common Questions About Bill Verification</h2>
            <p className="section-desc">
              Clear facts on how medical pricing and consumer rights work in India.
            </p>
          </div>

          <div className="faq-list">
            <div className="faq-item">
              <h3 className="faq-question">Does a flagged discrepancy mean the hospital acted fraudulently?</h3>
              <p className="faq-answer">
                No. A discrepancy simply identifies an arithmetic calculation error, an item that exceeds a known statutory
                price ceiling, or a repeated charge that requires clarification. Hospitals often make unintentional clerical
                or data-entry errors. Always share the report with the hospital's billing desk to review item by item.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">Are all private hospital prices capped by the Indian government?</h3>
              <p className="faq-answer">
                No. Only specific notified items—such as coronary drug-eluting stents, orthopaedic knee implants, and scheduled
                essential drugs under the Drug Price Control Order (DPCO)—have nationwide statutory price ceilings set by the NPPA.
                Other hospital room, nursing, and surgical charges are set according to institutional tariffs or insurance agreements.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">How does Bill Saathi AI help me as a patient or family member?</h3>
              <p className="faq-answer">
                It gives you clear, itemized transparency. Instead of staring at an overwhelming invoice total, you receive a
                structured breakdown showing exactly which charges match published standards, which items have calculation errors,
                and which entries require formal clarification before payment.
              </p>
            </div>

            <div className="faq-item">
              <h3 className="faq-question">Can I submit this report to my insurance TPA?</h3>
              <p className="faq-answer">
                Yes. The generated PDF report contains itemized lines, quantity verification, and references to statutory NPPA caps,
                making it a valuable supporting document when clarifying deductions or co-payments with your insurer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          10. Final Call to Action & Footer
          -------------------------------------------------------------------- */}
      <section className="landing-final-cta" aria-labelledby="final-cta-heading">
        <div className="landing-container">
          <div className="final-cta-card">
            <h2 id="final-cta-heading">Make Your Hospital Bill Easier to Understand</h2>
            <p>
              Check your charges with deterministic calculations and public pricing benchmarks in seconds.
              Empower yourself with factual evidence before settling your hospital bill.
            </p>

            <div className="final-cta-actions">
              <button
                type="button"
                onClick={handleAnalyzeClick}
                className="btn-cta-primary btn-cta-large"
                id="footer-analyze-cta"
              >
                <span>Analyze My Bill</span>
                <Icon name="arrow" style={{ width: 18, height: 18 }} />
              </button>
              <button
                type="button"
                onClick={handleDashboardClick}
                className="btn-cta-secondary-dark"
              >
                <span>Open Case Workspace</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-top">
            <div className="footer-brand-col">
              <img
                src="assets/logo-transparent.png"
                alt="Bill Saathi AI"
                style={{ height: 42, width: 'auto', objectFit: 'contain' }}
              />
              <p>
                <strong>Bill Saathi AI</strong> is a patient-first medical bill intelligence tool helping Indian
                citizens review hospital invoices, verify financial arithmetic, and question billing discrepancies factually.
              </p>
            </div>

            <div className="footer-links-col">
              <h4>Navigation</h4>
              <ul>
                <li><a href="#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')}>How It Works</a></li>
                <li><a href="#features" onClick={(e) => handleSmoothScroll(e, 'features')}>Key Features</a></li>
                <li><a href="#sample-report" onClick={(e) => handleSmoothScroll(e, 'sample-report')}>Sample Report</a></li>
                <li><a href="#privacy" onClick={(e) => handleSmoothScroll(e, 'privacy')}>Privacy & Security</a></li>
                <li><a href="#faq" onClick={(e) => handleSmoothScroll(e, 'faq')}>FAQ</a></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4>Application</h4>
              <ul>
                <li><Link to="/upload">Upload Bill</Link></li>
                <li><Link to="/overview">Case Workspace</Link></li>
                <li><Link to="/cases">All Cases</Link></li>
                <li><Link to="/reports">Audit Reports</Link></li>
                <li><Link to="/help">Help & Redressal</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-disclaimer-box">
            <strong>Regulatory & Informational Disclaimer:</strong> Bill Saathi AI provides AI-assisted informational
            analysis, not an official audit, legal determination, or medical advice. A flagged charge is not proof of
            wrongdoing. Verify findings with the hospital, insurer, or relevant regulatory authority. We make no claims
            of guaranteed financial recovery.
          </div>

          <div className="footer-bottom">
            <div>© 2026 Bill Saathi AI. Patient-First Healthcare Bill Intelligence.</div>
            <div>Aapka Bill, Aapka Adhikaar.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};
