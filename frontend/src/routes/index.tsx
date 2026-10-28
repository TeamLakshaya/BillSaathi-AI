import React from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LandingPage } from '../pages/LandingPage';
import { OverviewPage } from '../pages/OverviewPage';
import { CasesPage } from '../pages/CasesPage';
import { CaseDetailPage } from '../pages/CaseDetailPage';
import { CaseWizardPage } from '../pages/CaseWizardPage';
import { UploadPage } from '../pages/UploadPage';
import { DocumentReviewPage } from '../pages/DocumentReviewPage';
import { AuditPage } from '../pages/AuditPage';
import { PriceVerificationPage } from '../pages/PriceVerificationPage';
import { EvidencePage } from '../pages/EvidencePage';
import { DraftsPage } from '../pages/DraftsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { HelpPage } from '../pages/HelpPage';
import { SettingsPage } from '../pages/SettingsPage';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { path: 'overview', element: <OverviewPage /> },
      { path: 'cases', element: <CasesPage /> },
      { path: 'detail', element: <CaseDetailPage /> },
      { path: 'detail/:id', element: <CaseDetailPage /> },
      { path: 'new', element: <CaseWizardPage /> },
      { path: 'upload', element: <UploadPage /> },
      { path: 'review', element: <DocumentReviewPage /> },
      { path: 'audit', element: <AuditPage /> },
      { path: 'price', element: <PriceVerificationPage /> },
      { path: 'evidence', element: <EvidencePage /> },
      { path: 'complaint', element: <DraftsPage type="complaint" /> },
      { path: 'affidavit', element: <DraftsPage type="affidavit" /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'help', element: <HelpPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
];
