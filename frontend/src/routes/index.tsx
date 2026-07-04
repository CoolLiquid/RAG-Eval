import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { KBListPage } from '@/pages/knowledge-bases/KBListPage';
import { KBWizardPage } from '@/pages/knowledge-bases/KBWizardPage';
import { QuestionBankPage } from '@/pages/question-banks/QuestionBankPage';
import { EvaluationListPage } from '@/pages/evaluations/EvaluationListPage';
import { CreateEvaluationPage } from '@/pages/evaluations/CreateEvaluationPage';
import { EvaluationRunningPage } from '@/pages/evaluations/EvaluationRunningPage';
import { EvaluationReportPage } from '@/pages/evaluations/EvaluationReportPage';
import { EvaluationComparePage } from '@/pages/evaluations/EvaluationComparePage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/knowledge-bases" element={<KBListPage />} />
          <Route path="/knowledge-bases/new" element={<KBWizardPage />} />
          <Route path="/question-banks" element={<QuestionBankPage />} />
          <Route path="/evaluations" element={<EvaluationListPage />} />
          <Route path="/evaluations/new" element={<CreateEvaluationPage />} />
          <Route path="/evaluations/compare" element={<EvaluationComparePage />} />
          <Route path="/evaluations/:id/running" element={<EvaluationRunningPage />} />
          <Route path="/evaluations/:id/report" element={<EvaluationReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
