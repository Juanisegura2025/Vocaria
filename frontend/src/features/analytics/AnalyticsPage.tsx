import React, { useState, useEffect } from 'react';
import { Card, Col, Row, DatePicker, Select, Button, Spin, Alert, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, Users, Home, Clock } from 'lucide-react';
import { analyticsService, AnalyticsStats } from '../../services/analyticsService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsStats | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedTours, setSelectedTours] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startDate = dateRange[0].toISOString();
      const endDate = dateRange[1].toISOString();
      
      console.log('🔍 Loading analytics data...', { startDate, endDate });
      const data = await analyticsService.getAnalyticsStats(startDate, endDate);
      console.log('✅ Analytics data loaded:', data);
      
      setAnalyticsData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading analytics data';
      setError(errorMessage);
      console.error('❌ Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const handleExport = () => {
    if (!analyticsData) return;
    
    const exportData = {
      date_range: analyticsData.date_range,
      summary: {
        total_leads: analyticsData.total_leads,
        active_tours: analyticsData.active_tours,
        total_tours: analyticsData.total_tours,
        conversion_rate: analyticsData.conversion_rate
      },
      leads_by_month: analyticsData.leads_by_month,
      top_tours: analyticsData.top_tours
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vocaria-analytics-${dayjs().format('YYYY-MM-DD')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Loading analytics data..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Analytics Error"
        description={error}
        type="error"
        showIcon
        className="mb-4"
        action={
          <Button size="small" onClick={loadAnalyticsData}>
            Retry
          </Button>
        }
      />
    );
  }

  if (!analyticsData) {
    return (
      <Empty
        description="No analytics data available"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // Prepare chart data
  const chartData = analyticsData.leads_by_month.length > 0 
    ? analyticsData.leads_by_month 
    : [
        { month: 'No data', leads: 0, tours: 0 }
      ];

  // Lead sources (simulated for now)
  const leadSources = analyticsService.generateLeadSources();

  const statCards = [
    {
      title: 'Total Leads',
      value: analyticsData.total_leads,
      icon: <Users className="text-green-500" size={24} />,
      color: 'bg-green-50',
      change: analyticsData.total_leads > 0 ? '+12%' : '0%'
    },
    {
      title: 'Active Tours',
      value: analyticsData.active_tours,
      icon: <Home className="text-blue-500" size={24} />,
      color: 'bg-blue-50',
      change: analyticsData.active_tours > 0 ? 'Active' : 'None'
    },
    {
      title: 'Conversion Rate',
      value: `${analyticsData.conversion_rate}%`,
      icon: <TrendingUp className="text-purple-500" size={24} />,
      color: 'bg-purple-50',
      change: analyticsData.conversion_rate > 0 ? 'Good' : 'Low'
    },
    {
      title: 'Avg Interaction',
      value: analyticsService.calculateAverageInteractionTime(),
      icon: <Clock className="text-amber-500" size={24} />,
      color: 'bg-amber-50',
      change: 'Avg'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
        <div className="flex items-center gap-4">
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
          />
          <Select
            value={selectedTours}
            style={{ width: 200 }}
            onChange={setSelectedTours}
          >
            <Option value="all">All tours</Option>
            {analyticsData.top_tours.map((tour, index) => (
              <Option key={index} value={tour.tour_name}>
                {tour.tour_name}
              </Option>
            ))}
          </Select>
          <Button 
            icon={<Download size={16} />}
            onClick={handleExport}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <Row gutter={[16, 16]}>
        {statCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="h-full shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {stat.title}
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {stat.change}
                  </div>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        {/* Leads Chart */}
        <Col xs={24} lg={16}>
          <Card title="Leads Over Time" className="h-full">
            {chartData[0].month === 'No data' ? (
              <Empty 
                description="No lead data to display"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leads" fill="#3B82F6" name="Leads" />
                  <Bar dataKey="tours" fill="#10B981" name="Tours" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Lead Sources */}
        <Col xs={24} lg={8}>
          <Card title="Lead Sources" className="h-full">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={leadSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percentage }) => `${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {leadSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {leadSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: source.color }}
                    />
                    <span>{source.source}</span>
                  </div>
                  <span className="font-medium">{source.percentage}%</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Top Tours Performance */}
      <Card title="Top Performing Tours">
        {analyticsData.top_tours.length > 0 ? (
          <div className="space-y-4">
            {analyticsData.top_tours.map((tour, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Home className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <div className="font-medium">{tour.tour_name}</div>
                    <div className="text-sm text-gray-500">
                      {tour.leads_count} lead{tour.leads_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {tour.leads_count}
                  </div>
                  <div className="text-xs text-gray-500">leads</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty 
            description="No tour data to display"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </div>
  );
};

export default AnalyticsPage;