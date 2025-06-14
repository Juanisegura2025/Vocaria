// Update frontend/src/features/transcripts/TranscriptsPage.tsx

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Typography, 
  Row, 
  Col,
  Select,
  DatePicker,
  Empty,
  Spin,
  Alert,
  Badge
} from 'antd';
import { 
  MessageSquare, 
  Clock, 
  User, 
  MapPin, 
  Search,
  Eye,
  Download,
  Mail,
  Filter,
  Calendar
} from 'lucide-react';
import apiClient from '../../api/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { toursService } from '../../services/toursService';

dayjs.extend(relativeTime);

const { Search: SearchInput } = Input;
const { Text } = Typography;
const { RangePicker } = DatePicker;

interface ConversationMessage {
  id: number;
  content: string;
  is_user: boolean;
  message_type: 'text' | 'voice' | 'system';
  timestamp: string;
  room_context?: {
    name: string;
    area?: number;
  };
  audio_duration?: number;
  confidence_score?: number;
}

interface ConversationTranscript {
  conversation_id: number;
  tour_name: string;
  tour_id: number;
  visitor_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  message_count: number;
  lead_captured: boolean;
  visitor_email?: string;
  room_context?: {
    name: string;
    area?: number;
  };
  messages: ConversationMessage[];
}

interface TranscriptsResponse {
  transcripts: ConversationTranscript[];
  total_count: number;
}

const TranscriptsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [transcripts, setTranscripts] = useState<ConversationTranscript[]>([]);
  const [filteredTranscripts, setFilteredTranscripts] = useState<ConversationTranscript[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedTourId, setSelectedTourId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [tours, setTours] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<ConversationTranscript | null>(null);

  const loadTranscripts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedTourId) params.append('tour_id', selectedTourId.toString());
      if (dateRange) {
        params.append('start_date', dateRange[0].toISOString());
        params.append('end_date', dateRange[1].toISOString());
      }
      
      const response = await apiClient.get(`/api/transcripts?${params.toString()}`);
      const data: TranscriptsResponse = response.data;
      
      setTranscripts(data.transcripts);
      setFilteredTranscripts(data.transcripts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading transcripts');
      console.error('Error loading transcripts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTours = async () => {
    try {
      const toursData = await toursService.getTours();
      setTours(toursData);
    } catch (err) {
      console.error('Error loading tours:', err);
    }
  };

  useEffect(() => {
    loadTours();
    loadTranscripts();
  }, [selectedTourId, dateRange]);

  useEffect(() => {
    // Filter transcripts based on search text
    if (!searchText) {
      setFilteredTranscripts(transcripts);
    } else {
      const filtered = transcripts.filter(transcript => 
        transcript.tour_name.toLowerCase().includes(searchText.toLowerCase()) ||
        transcript.visitor_email?.toLowerCase().includes(searchText.toLowerCase()) ||
        transcript.visitor_id.toLowerCase().includes(searchText.toLowerCase()) ||
        transcript.messages.some(msg => 
          msg.content.toLowerCase().includes(searchText.toLowerCase())
        )
      );
      setFilteredTranscripts(filtered);
    }
  }, [searchText, transcripts]);

  const handleViewTranscript = (transcript: ConversationTranscript) => {
    setSelectedTranscript(transcript);
    setViewModalVisible(true);
  };

  const handleExportTranscript = (transcript: ConversationTranscript) => {
    const exportData = {
      conversation_id: transcript.conversation_id,
      tour_name: transcript.tour_name,
      visitor_id: transcript.visitor_id,
      started_at: transcript.started_at,
      ended_at: transcript.ended_at,
      duration_seconds: transcript.duration_seconds,
      lead_captured: transcript.lead_captured,
      visitor_email: transcript.visitor_email,
      messages: transcript.messages.map(msg => ({
        timestamp: msg.timestamp,
        speaker: msg.is_user ? 'Visitor' : 'Agent',
        type: msg.message_type,
        content: msg.content,
        room: msg.room_context?.name
      }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript-${transcript.conversation_id}-${dayjs().format('YYYY-MM-DD')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const columns = [
    {
      title: 'Conversation',
      key: 'conversation',
      render: (transcript: ConversationTranscript) => (
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-lg mr-3">
            <MessageSquare className="text-blue-600" size={16} />
          </div>
          <div>
            <div className="font-medium">{transcript.tour_name}</div>
            <div className="text-xs text-gray-500">
              ID: {transcript.conversation_id} • {transcript.visitor_id}
            </div>
            {transcript.room_context && (
              <div className="flex items-center mt-1 text-xs">
                <MapPin size={12} className="mr-1 text-gray-400" />
                <span className="text-gray-500">
                  {transcript.room_context.name}
                  {transcript.room_context.area && ` (${transcript.room_context.area} m²)`}
                </span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Visitor',
      key: 'visitor',
      render: (transcript: ConversationTranscript) => (
        <div>
          {transcript.lead_captured ? (
            <div>
              <Badge status="success" />
              <span className="font-medium text-green-600">Lead Captured</span>
              {transcript.visitor_email && (
                <div className="text-xs text-gray-500 mt-1">
                  <Mail size={12} className="inline mr-1" />
                  {transcript.visitor_email}
                </div>
              )}
            </div>
          ) : (
            <div>
              <Badge status="default" />
              <span className="text-gray-500">Anonymous</span>
              <div className="text-xs text-gray-400 mt-1">
                <User size={12} className="inline mr-1" />
                {transcript.visitor_id}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (transcript: ConversationTranscript) => (
        <div className="text-center">
          <div className="flex items-center justify-center">
            <Clock size={14} className="mr-1 text-gray-400" />
            <span className="font-medium">
              {formatDuration(transcript.duration_seconds)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {transcript.message_count} messages
          </div>
        </div>
      ),
    },
    {
      title: 'Started',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (date: string) => (
        <div>
          <div className="font-medium">
            {dayjs(date).format('MMM DD, YYYY')}
          </div>
          <div className="text-xs text-gray-500">
            {dayjs(date).format('HH:mm')} • {dayjs(date).fromNow()}
          </div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (transcript: ConversationTranscript) => (
        <div>
          <Tag color={transcript.ended_at ? 'green' : 'blue'}>
            {transcript.ended_at ? 'Completed' : 'Active'}
          </Tag>
          {transcript.lead_captured && (
            <Tag color="gold" className="mt-1">
              Lead
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (transcript: ConversationTranscript) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<Eye size={16} />} 
            title="View transcript"
            onClick={() => handleViewTranscript(transcript)}
            className="text-blue-500"
          />
          <Button 
            type="text" 
            icon={<Download size={16} />} 
            title="Export transcript"
            onClick={() => handleExportTranscript(transcript)}
            className="text-green-500"
          />
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Transcripts</h1>
        <Button 
          icon={<Download size={16} />}
          onClick={() => {
            // Export all transcripts
            const exportData = {
              exported_at: new Date().toISOString(),
              total_conversations: filteredTranscripts.length,
              conversations: filteredTranscripts
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `vocaria-transcripts-${dayjs().format('YYYY-MM-DD')}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export
        </Button>
      </div>

      <Card>
        <div className="mb-6">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={8}>
              <SearchInput
                placeholder="Search conversations..."
                prefix={<Search size={16} className="text-gray-400" />}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} md={6}>
              <Select
                placeholder="All tours"
                style={{ width: '100%' }}
                allowClear
                onChange={setSelectedTourId}
                suffixIcon={<Filter size={16} />}
              >
                {tours.map(tour => (
                  <Select.Option key={tour.id} value={tour.id}>
                    {tour.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <RangePicker
                style={{ width: '100%' }}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                format="YYYY-MM-DD"
                suffixIcon={<Calendar size={16} />}
              />
            </Col>
            <Col xs={24} md={4} className="text-right">
              <Button onClick={loadTranscripts}>
                Refresh
              </Button>
            </Col>
          </Row>
        </div>

        {error ? (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            className="mb-4"
            action={
              <Button size="small" onClick={loadTranscripts}>
                Retry
              </Button>
            }
          />
        ) : filteredTranscripts.length === 0 ? (
          <Empty
            description="No conversations found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <p className="text-gray-500 text-sm">
              Visitor conversations will appear here when they interact with your tours.
            </p>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredTranscripts}
            rowKey="conversation_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} conversations`,
            }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      {/* Transcript Detail Modal */}
      <Modal
        title={
          <div className="flex items-center">
            <MessageSquare className="mr-2" size={20} />
            Transcript: {selectedTranscript?.tour_name}
          </div>
        }
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedTranscript(null);
        }}
        width={800}
        footer={[
          <Button key="export" onClick={() => selectedTranscript && handleExportTranscript(selectedTranscript)}>
            Export
          </Button>,
          <Button key="close" type="primary" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
      >
        {selectedTranscript && (
          <div className="space-y-4">
            {/* Conversation Metadata */}
            <Card size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Visitor ID:</Text>
                  <br />
                  <Text code>{selectedTranscript.visitor_id}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Duration:</Text>
                  <br />
                  <Text>{formatDuration(selectedTranscript.duration_seconds)}</Text>
                </Col>
                <Col span={12} className="mt-2">
                  <Text strong>Started:</Text>
                  <br />
                  <Text>{dayjs(selectedTranscript.started_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
                </Col>
                <Col span={12} className="mt-2">
                  <Text strong>Messages:</Text>
                  <br />
                  <Text>{selectedTranscript.message_count}</Text>
                </Col>
              </Row>
              
              {selectedTranscript.lead_captured && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <Text strong className="text-green-800">Lead Captured!</Text>
                  {selectedTranscript.visitor_email && (
                    <div className="mt-1">
                      <Text className="text-green-700">
                        Email: {selectedTranscript.visitor_email}
                      </Text>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Messages */}
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-3">
                {selectedTranscript.messages.map((message, _index) => (
                  <div key={message.id} className={`flex ${message.is_user ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.is_user 
                        ? 'bg-blue-500 text-white' 
                        : message.message_type === 'system'
                        ? 'bg-gray-100 text-gray-600 italic'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      <div className="text-sm">{message.content}</div>
                      <div className="flex items-center justify-between mt-1 text-xs opacity-75">
                        <span>
                          {message.is_user ? 'Visitor' : 'Agent'}
                          {message.message_type === 'voice' && ' 🎤'}
                        </span>
                        <span>
                          {dayjs(message.timestamp).format('HH:mm:ss')}
                        </span>
                      </div>
                      {message.room_context && (
                        <div className="text-xs opacity-75 mt-1">
                          📍 {message.room_context.name}
                          {message.room_context.area && ` (${message.room_context.area} m²)`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TranscriptsPage;