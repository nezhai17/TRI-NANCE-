import { Metadata } from 'next';
import ModelDashboardClient from '@/components/ml/ModelDashboardClient';

export const metadata: Metadata = {
  title: 'ML Operations & Multi-Algorithm Benchmarking | Tri-nance',
  description:
    'Real-time machine learning training, multi-algorithm benchmarking, model registry, and live inference evaluation without data leakage.',
};

export default function MLPage() {
  return (
    <div className="p-4 md:p-8">
      <ModelDashboardClient />
    </div>
  );
}
