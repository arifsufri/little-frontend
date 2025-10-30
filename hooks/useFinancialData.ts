'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../src/utils/axios';

interface FinancialSummary {
  totalCustomers: number;
  totalEarnings: number;
  commissionRate: number;
  totalServices: number;
}

interface ServiceBreakdown {
  name: string;
  count: number;
  totalRevenue: number;
  barberShare: number;
}

interface EarningsHistory {
  date: string;
  customers: number;
  totalEarnings: number;
}

interface StaffFinancialData {
  summary: FinancialSummary;
  serviceBreakdown: ServiceBreakdown[];
  earningsHistory: EarningsHistory[];
  recentAppointments: any[];
}

export function useFinancialData() {
  const [financialData, setFinancialData] = useState<StaffFinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchFinancialData = useCallback(async (dateRange?: { startDate: string; endDate: string }) => {
    try {
      setLoading(true);
      const params = dateRange ? 
        `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}` : 
        `?startDate=${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]}&endDate=${new Date().toISOString().split('T')[0]}`;
      
      const response = await apiGet(`/financial/staff-report${params}`) as any;
      if (response.success) {
        setFinancialData(response.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshFinancialData = useCallback(() => {
    fetchFinancialData();
  }, [fetchFinancialData]);

  // Auto-refresh every 30 seconds if data exists
  useEffect(() => {
    if (financialData) {
      const interval = setInterval(() => {
        fetchFinancialData();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [financialData, fetchFinancialData]);

  return {
    financialData,
    loading,
    lastUpdated,
    fetchFinancialData,
    refreshFinancialData
  };
}



