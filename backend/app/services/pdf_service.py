import io
from datetime import datetime
from decimal import Decimal
from typing import List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from app.models.bill import Bill
from app.models.verification import VerificationResult


class PDFReportService:
    """
    ReportLab PDF generator creating professional, factual, evidence-based
    medical bill verification reports for Indian patients.
    """

    def generate_bill_report(
        self,
        bill: Bill,
        results: List[VerificationResult],
        report_id: str,
    ) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()

        # Custom typography styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a"),
        )
        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#475569"),
        )
        h2_style = ParagraphStyle(
            "Heading2",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=12,
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#334155"),
        )
        badge_style = ParagraphStyle(
            "Badge",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.white,
            alignment=1,
        )
        legal_style = ParagraphStyle(
            "Legal",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#64748b"),
        )

        elements = []

        # 1. Header Banner
        is_demo = bill.is_demo or any(r.is_demo for r in results)
        if is_demo:
            demo_banner_data = [
                [
                    Paragraph(
                        "<b>DEMONSTRATION REPORT - SYNTHETIC DATA</b><br/>"
                        "This report was generated in demo mode for evaluation purposes. Benchmarks marked as synthetic do not represent legal findings.",
                        badge_style,
                    )
                ]
            ]
            demo_table = Table(demo_banner_data, colWidths=[522])
            demo_table.setStyle(
                TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0284c7")),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ])
            )
            elements.append(demo_table)
            elements.append(Spacer(1, 10))

        # Title Block
        elements.append(Paragraph("Bill Saathi AI - Medical Bill Verification Report", title_style))
        elements.append(
            Paragraph(
                f"Report Reference: <b>{report_id}</b> | Generated on: <b>{datetime.now().strftime('%d %b %Y, %H:%M IST')}</b>",
                subtitle_style,
            )
        )
        elements.append(Spacer(1, 12))

        # 2. Bill & Hospital Metadata Table
        hospital_name = bill.hospital.name if bill.hospital else "Unspecified Hospital"
        hospital_location = f"{bill.hospital.location}, {bill.hospital.state}" if bill.hospital else "India"
        bill_date_str = bill.bill_date.strftime("%d %b %Y") if bill.bill_date else "Not Stated"

        meta_data = [
            [
                Paragraph("<b>Hospital / Provider:</b>", body_style),
                Paragraph(hospital_name, body_style),
                Paragraph("<b>Bill Date:</b>", body_style),
                Paragraph(bill_date_str, body_style),
            ],
            [
                Paragraph("<b>Location / State:</b>", body_style),
                Paragraph(hospital_location, body_style),
                Paragraph("<b>Total Stated Amount:</b>", body_style),
                Paragraph(f"<b>₹{bill.total_amount:,.2f}</b>", body_style),
            ],
            [
                Paragraph("<b>Original Document:</b>", body_style),
                Paragraph(bill.original_filename, body_style),
                Paragraph("<b>Bill & Audit Version:</b>", body_style),
                Paragraph(f"Bill v{getattr(bill, 'version', 1)} · Audit v{getattr(bill, 'audit_version', 1)}", body_style),
            ],
        ]

        if bill.subtotal or bill.tax_amount or bill.discount_amount:
            subtotal_str = f"₹{bill.subtotal:,.2f}" if bill.subtotal else f"₹{bill.total_amount:,.2f}"
            tax_disc_str = f"Tax: ₹{bill.tax_amount or 0:,.2f} | Disc: ₹{bill.discount_amount or 0:,.2f}"
            meta_data.append([
                Paragraph("<b>Itemized Subtotal:</b>", body_style),
                Paragraph(subtotal_str, body_style),
                Paragraph("<b>Taxes & Discounts:</b>", body_style),
                Paragraph(tax_disc_str, body_style),
            ])

        meta_table = Table(meta_data, colWidths=[120, 160, 110, 132])
        meta_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ])
        )
        elements.append(meta_table)
        elements.append(Spacer(1, 12))

        # 3. Executive Audit Summary
        elements.append(Paragraph("Executive Audit Summary", h2_style))

        total_discrepancy = sum(
            (r.difference_amount for r in results if r.status == "verified_discrepancy" and r.difference_amount),
            Decimal("0.00"),
        )
        review_items_count = sum(1 for r in results if r.status == "needs_review")
        normal_count = sum(1 for r in results if r.status == "no_discrepancy_detected")

        summary_cards_data = [
            [
                Paragraph("<b>Total Billed</b>", subtitle_style),
                Paragraph("<b>Verified Discrepancies</b>", subtitle_style),
                Paragraph("<b>Items Needing Review</b>", subtitle_style),
                Paragraph("<b>Rates Within Norms</b>", subtitle_style),
            ],
            [
                Paragraph(f"<b>₹{bill.total_amount:,.2f}</b>", title_style),
                Paragraph(f"<font color='#dc2626'><b>₹{total_discrepancy:,.2f}</b></font>", title_style),
                Paragraph(f"<font color='#d97706'><b>{review_items_count}</b></font>", title_style),
                Paragraph(f"<font color='#16a34a'><b>{normal_count}</b></font>", title_style),
            ],
        ]
        summary_table = Table(summary_cards_data, colWidths=[130, 130, 130, 132])
        summary_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ffffff")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ])
        )
        elements.append(summary_table)
        elements.append(Spacer(1, 12))

        # 4. Itemized Verification Findings Table
        elements.append(Paragraph("Itemized Findings & Benchmark Evidence", h2_style))

        table_header = [
            Paragraph("<b>Item / Description</b>", body_style),
            Paragraph("<b>Billed Amount</b>", body_style),
            Paragraph("<b>Benchmark / Limit</b>", body_style),
            Paragraph("<b>Variance</b>", body_style),
            Paragraph("<b>Status & Evidence</b>", body_style),
        ]
        finding_rows = [table_header]

        for r in results:
            item_desc = r.bill_item.description if r.bill_item else "Grand Total Audit"
            billed_str = f"₹{r.billed_amount:,.2f}"
            bench_str = f"₹{r.benchmark_amount:,.2f}" if r.benchmark_amount is not None else "N/A"
            diff_str = f"+₹{r.difference_amount:,.2f}" if r.difference_amount and r.difference_amount > 0 else "₹0.00"

            # Color status
            if r.status == "verified_discrepancy":
                status_html = f"<font color='#dc2626'><b>[DISCREPANCY]</b></font><br/>{r.reason}"
            elif r.status == "needs_review":
                status_html = f"<font color='#d97706'><b>[REVIEW]</b></font><br/>{r.reason}"
            elif r.status == "insufficient_evidence":
                status_html = f"<font color='#64748b'><b>[UNVERIFIED]</b></font><br/>{r.reason}"
            else:
                status_html = f"<font color='#16a34a'><b>[VERIFIED]</b></font><br/>{r.reason}"

            finding_rows.append([
                Paragraph(item_desc, body_style),
                Paragraph(billed_str, body_style),
                Paragraph(bench_str, body_style),
                Paragraph(diff_str, body_style),
                Paragraph(status_html, body_style),
            ])

        findings_table = Table(finding_rows, colWidths=[110, 65, 75, 60, 212])
        findings_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ("LINEBELOW", (0, 0), (-1, 0), 1.5, colors.HexColor("#94a3b8")),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ])
        )
        elements.append(findings_table)
        elements.append(Spacer(1, 14))

        # 5. Recommended Next Steps for Patient
        elements.append(Paragraph("Recommended Patient Action Plan", h2_style))
        steps = [
            "1. <b>Request Itemized Breakup:</b> If your bill lists lumped charges, request a daily room & pharmacy breakup from the hospital billing desk.",
            "2. <b>Verify Inclusions with Insurance TPA:</b> Submit this report to your TPA or insurer if statutory caps (such as NPPA stent/drug caps) were breached.",
            "3. <b>Check Duplicate Entries:</b> Clarify highlighted duplicate items with the nursing station or doctor's order log before settling balance.",
            "4. <b>Consumer Rights Redressal:</b> Under the Consumer Protection Act, patients are legally entitled to accurate, non-overcharged billing records.",
        ]
        for step in steps:
            elements.append(Paragraph(step, body_style))
            elements.append(Spacer(1, 2))

        elements.append(Spacer(1, 14))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=8))

        # 6. Legal & Regulatory Disclaimer
        elements.append(
            Paragraph(
                "<b>Notice & Regulatory Limitations:</b> Bill Saathi AI is an automated factual verification and consumer awareness tool. "
                "It performs deterministic mathematical verification and matches billed entries against documented public price caps, published tariffs, and benchmark references. "
                "This report does not constitute a judicial ruling, formal medical opinion, or an allegation of criminality. "
                "Prices labeled as synthetic or demonstration are for test validation only and carry no real-world legal effect.",
                legal_style,
            )
        )

        doc.build(elements)
        return buffer.getvalue()
