import React from 'react';
import { KPICard } from '../common/KPICard';
import {
  Inbox,
  AlertOctagon,
  AlertTriangle,
  Clock,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { CivicIssue } from '../../types';

interface IssueSummaryCardsProps {
  issues: CivicIssue[];
  activeFilter?: string;
  onFilterSelect?: (priorityOrStatus: string) => void;
}

export const IssueSummaryCards: React.FC<IssueSummaryCardsProps> = ({
  issues,
  onFilterSelect,
}) => {
  const total = issues.length;
  const critical = issues.filter(i => i.priority_level === 'CRITICAL').length;
  const high = issues.filter(i => i.priority_level === 'HIGH').length;
  const pending = issues.filter(i => i.status === 'PRIORITIZED' || i.status === 'REPORTED').length;
  const inProgress = issues.filter(i => i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED').length;
  const resolved = issues.filter(i => i.status === 'RESOLVED').length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <KPICard
        title="Total Issues"
        value={total < 10 ? `0${total}` : total}
        subValue="Reported across wards"
        icon={Inbox}
        iconColor="text-slate-700"
        iconBg="bg-slate-100"
        onClick={onFilterSelect ? () => onFilterSelect('ALL') : undefined}
      />

      <KPICard
        title="Critical"
        value={critical < 10 ? `0${critical}` : critical}
        subValue="Immediate risk"
        badge="85-100"
        badgeType="danger"
        icon={AlertOctagon}
        iconColor="text-red-700"
        iconBg="bg-red-100"
        onClick={onFilterSelect ? () => onFilterSelect('CRITICAL') : undefined}
      />

      <KPICard
        title="High"
        value={high < 10 ? `0${high}` : high}
        subValue="Urgent attention"
        badge="70-84"
        badgeType="warning"
        icon={AlertTriangle}
        iconColor="text-orange-700"
        iconBg="bg-orange-100"
        onClick={onFilterSelect ? () => onFilterSelect('HIGH') : undefined}
      />

      <KPICard
        title="Pending"
        value={pending < 10 ? `0${pending}` : pending}
        subValue="Awaiting action"
        badge="CIE Ready"
        badgeType="info"
        icon={Clock}
        iconColor="text-sky-700"
        iconBg="bg-sky-100"
        onClick={onFilterSelect ? () => onFilterSelect('PRIORITIZED') : undefined}
      />

      <KPICard
        title="In Progress"
        value={inProgress < 10 ? `0${inProgress}` : inProgress}
        subValue="Field team active"
        badge="Deployed"
        badgeType="neutral"
        icon={Truck}
        iconColor="text-purple-700"
        iconBg="bg-purple-100"
        onClick={onFilterSelect ? () => onFilterSelect('IN_PROGRESS') : undefined}
      />

      <KPICard
        title="Resolved"
        value={resolved < 10 ? `0${resolved}` : resolved}
        subValue="Verified completed"
        badge="Verified"
        badgeType="success"
        icon={CheckCircle2}
        iconColor="text-emerald-700"
        iconBg="bg-emerald-100"
        onClick={onFilterSelect ? () => onFilterSelect('RESOLVED') : undefined}
      />
    </div>
  );
};
