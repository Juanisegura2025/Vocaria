import { Button, Card, Table, Tag, Space, Input, Row, Col, Avatar } from 'antd';
import { Plus, Search, Mail, Phone, Home, Calendar, Filter, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toursService } from '../../services/toursService';
import type { Lead, Tour } from '../../services/toursService';

const { Search: SearchInput } = Input;

interface LeadWithTour extends Lead {
  status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'unqualified';
  tourName?: string;
}

const LeadsPage = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadWithTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true);
        // First, get all tours
        const tours = await toursService.getTours();
        
        // Create a map of tour ID to tour name
        const tourMap = new Map<number, string>();
        tours.forEach((tour: Tour) => {
          tourMap.set(tour.id, tour.name);
        });
        
        // Then get leads for each tour and combine them
        const allLeads: LeadWithTour[] = [];
        
        for (const tour of tours) {
          try {
            const tourLeads = await toursService.getTourLeads(tour.id);
            const leadsWithTourName = tourLeads.map(lead => ({
              ...lead,
              tourName: tour.name, // Add the actual tour name
              status: 'new' as const // Default status
            }));
            allLeads.push(...leadsWithTourName);
          } catch (e) {
            console.warn(`Could not load leads for tour ${tour.id}`, e);
          }
        }
        
        setLeads(allLeads);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading leads');
        console.error('Error loading leads:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadLeads();
  }, []);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const getRandomAvatarColor = (email: string) => {
    if (!email || typeof email !== 'string') {
      return '#1890ff'; // default color
    }
    const colors = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#13c2c2', '#722ed1'];
    const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const columns = [
    {
      title: 'Lead',
      dataIndex: 'email',
      key: 'name',
      render: (email: string, record: LeadWithTour) => (
        <div className="flex items-center">
          <Avatar 
            style={{ backgroundColor: getRandomAvatarColor(email) }}
            className="mr-3"
          >
            {email ? email.charAt(0).toUpperCase() : '?'}
          </Avatar>
          <div>
            <div className="font-medium">{record.name || 'Unnamed Lead'}</div>
            <div className="text-xs text-gray-500">{email || 'No email'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (record: LeadWithTour) => (
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <Mail size={14} className="mr-1 text-gray-500" />
            <a href={`mailto:${record.email}`} className="hover:text-blue-500">
              {record.email}
            </a>
          </div>
          {record.phone && (
            <div className="flex items-center text-sm">
              <Phone size={14} className="mr-1 text-gray-500" />
              <a href={`tel:${record.phone}`} className="hover:text-blue-500">
                {record.phone}
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Tour',
      key: 'tour',
      render: (record: LeadWithTour) => (
        <div className="flex items-center text-sm">
          <Home size={14} className="mr-1 text-gray-500" />
          <span className="font-medium">
            {record.tourName || 'Unidentified Tour'}
          </span>
        </div>
      ),
    },
    {
      title: 'Context',
      key: 'context',
      render: (record: LeadWithTour) => (
        <div className="text-sm text-gray-600">
          {record.room_context?.roomName && (
            <div>📍 {record.room_context.roomName}</div>
          )}
          {record.room_context?.area_m2 && (
            <div>📐 {record.room_context.area_m2} m²</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          new: { color: 'blue', text: 'New' },
          contacted: { color: 'geekblue', text: 'Contacted' },
          qualified: { color: 'green', text: 'Qualified' },
          unqualified: { color: 'red', text: 'Unqualified' },
        };
        const statusInfo = statusMap[status] || { color: 'default', text: 'New' };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
      filters: [
        { text: 'New', value: 'new' },
        { text: 'Contacted', value: 'contacted' },
        { text: 'Qualified', value: 'qualified' },
        { text: 'Unqualified', value: 'unqualified' },
      ],
      filteredValue: statusFilter ? [statusFilter] : null,
      onFilter: (value: any, record: any) => record.status === value,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'date',
      render: (date: string) => (
        <div className="flex items-center text-sm">
          <Calendar size={14} className="mr-1 text-gray-500" />
          {formatDate(date)}
        </div>
      ),
      sorter: (a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: LeadWithTour) => (
        <Space size="middle">
          <Button 
            type="link" 
            size="small"
            className="text-blue-500 p-0"
            onClick={() => console.log('View lead details:', record.id)}
          >
            View Details
          </Button>
          <Button 
            type="text" 
            size="small" 
            icon={<Mail size={16} />} 
            title="Send Email"
            onClick={() => window.open(`mailto:${record.email}`, '_blank')}
          />
        </Space>
      ),
    },
  ];

  // Safe string includes helper
  const safeStringIncludes = (str: any, search: string): boolean => {
    return str && typeof str === 'string' && str.toLowerCase().includes(search.toLowerCase());
  };

  // Safe filter function
  const safeFilter = (items: LeadWithTour[], searchValue: string, statusFilterValue: string | null) => {
    if (!Array.isArray(items)) return [];
    
    return items.filter(lead => {
      if (!lead) return false;
      
      const searchLower = (searchValue || '').toLowerCase();
      const matchesSearch = 
        safeStringIncludes(lead.name, searchLower) ||
        safeStringIncludes(lead.email, searchLower) ||
        safeStringIncludes(lead.phone, searchLower) ||
        safeStringIncludes(lead.tourName, searchLower);
        
      const matchesStatus = statusFilterValue ? lead.status === statusFilterValue : true;
      
      return matchesSearch && matchesStatus;
    });
  };

  const filteredLeads = safeFilter(leads, searchText || '', statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Lead Management</h1>
        <Space>
          <Button 
            icon={<Download size={16} />}
            className="flex items-center"
            onClick={() => console.log('Export functionality pending')}
          >
            Export
          </Button>
          <Button 
            type="primary" 
            icon={<Plus size={16} />}
            className="flex items-center"
            onClick={() => console.log('Add lead functionality pending')}
          >
            Add Lead
          </Button>
        </Space>
      </div>

      <Card>
        <div className="mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12} lg={8}>
              <SearchInput
                placeholder="Search leads..."
                prefix={<Search size={16} className="text-gray-400" />}
                onChange={handleSearch}
                allowClear
                className="w-full"
              />
            </Col>
            <Col xs={24} md={12} lg={16} className="text-right">
              <Space>
                <Button 
                  icon={<Filter size={16} />}
                  onClick={() => console.log('Advanced filters pending')}
                >
                  Filters
                </Button>
                <Button onClick={() => setStatusFilter(null)}>
                  Clear Filters
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {error ? (
          <div className="p-4 text-red-600">
            Error loading leads: {error}
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredLeads}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} leads`,
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default LeadsPage;