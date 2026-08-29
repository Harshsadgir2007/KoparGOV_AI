import { CivicIssue, CivicPriorityLevel, CivicStatus } from '../types';
import { issueService } from './issueService';
import { MOCK_ISSUES } from '../mock';

export interface MapFilters {
  search?: string;
  ward?: string;
  category?: string;
  priority?: string;
  status?: string;
}

export interface MapSummaryStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export const mapService = {
  /**
   * Conceptually fetches geocoded civic issues for the GIS Map.
   * Filters on frontend mock data.
   */
  async getMapIssues(filters?: MapFilters): Promise<CivicIssue[]> {
    let issues = await issueService.getIssues();

    if (filters) {
      if (filters.ward && filters.ward !== 'ALL') {
        issues = issues.filter(
          i => i.ward.includes(filters.ward!) || i.ward_number.toString() === filters.ward
        );
      }
      if (filters.category && filters.category !== 'ALL') {
        issues = issues.filter(i => i.category.toLowerCase().includes(filters.category!.toLowerCase()));
      }
      if (filters.priority && filters.priority !== 'ALL') {
        issues = issues.filter(i => i.priority_level === filters.priority);
      }
      if (filters.status && filters.status !== 'ALL') {
        issues = issues.filter(i => i.status === filters.status);
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase();
        issues = issues.filter(
          i =>
            i.id.toLowerCase().includes(q) ||
            i.title.toLowerCase().includes(q) ||
            i.category.toLowerCase().includes(q) ||
            i.ward.toLowerCase().includes(q) ||
            i.address.toLowerCase().includes(q)
        );
      }
    }

    return issues;
  },

  calculateMapStats(issues: CivicIssue[]): MapSummaryStats {
    const critical = issues.filter(i => i.priority_level === 'CRITICAL').length;
    const high = issues.filter(i => i.priority_level === 'HIGH').length;
    const medium = issues.filter(i => i.priority_level === 'MEDIUM').length;
    const low = issues.filter(i => i.priority_level === 'LOW').length;

    return {
      critical,
      high,
      medium,
      low,
      total: issues.length,
    };
  },
};
