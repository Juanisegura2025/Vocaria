import { useState } from 'react';
import { Card, Input, List, Avatar, Tag, Select, Button, Space } from 'antd';
import { Search, MessageSquare, Home, Filter, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../../api/client';

const { Search: SearchInput } = Input;
const { Option } = Select;

const TranscriptsPage = () => {
  const [searchText, setSearchText] = useState('');
  const [tourFilter, setTourFilter] = useState<string>('all');
  
  // Fetch transcripts data
  const { data: transcripts = [], isLoading } = useQuery({
    queryKey: ['transcripts'],
    queryFn: () => fetchApi('/api/conversations?include=messages'),
  });

  // Get unique tours for filter
  const tours: string[] = Array.from(
    new Set(transcripts.map((t: any) => t.tour?.name).filter(Boolean))
  ) as string[];

  const filteredTranscripts = transcripts.filter((transcript: any) => {
    const matchesSearch = 
      transcript.user_name?.toLowerCase().includes(searchText.toLowerCase()) ||
      transcript.messages?.some((m: any) => 
        m.content.toLowerCase().includes(searchText.toLowerCase())
      );
    
    const matchesTour = 
      tourFilter === 'all' || 
      transcript.tour?.name === tourFilter;
    
    return matchesSearch && matchesTour;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Transcripciones</h1>
        <Space>
          <Button icon={<Download size={16} />}>
            Exportar
          </Button>
        </Space>
      </div>

      <Card>
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <SearchInput
                placeholder="Buscar en conversaciones..."
                prefix={<Search size={16} className="text-gray-400" />}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                className="w-full"
              />
            </div>
            <div className="w-full md:w-64">
              <Select
                placeholder="Filtrar por tour"
                className="w-full"
                value={tourFilter}
                onChange={setTourFilter}
                suffixIcon={<Filter size={16} />}
              >
                <Option value="all">Todos los tours</Option>
                {tours.map((tour: string) => (
                  <Option key={tour} value={tour}>
                    {tour}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <List
          itemLayout="vertical"
          dataSource={filteredTranscripts}
          loading={isLoading}
          renderItem={(transcript: any) => (
            <List.Item
              key={transcript.id}
              className="p-4 hover:bg-gray-50 rounded-lg transition-colors"
              extra={
                <div className="text-sm text-gray-500">
                  {formatDate(transcript.updated_at || transcript.created_at)}
                </div>
              }
            >
              <List.Item.Meta
                avatar={
                  <Avatar className="bg-blue-100 text-blue-600">
                    {getUserInitials(transcript.user_name || 'U')}
                  </Avatar>
                }
                title={
                  <div className="flex items-center">
                    <span className="font-medium">
                      {transcript.user_name || 'Usuario Anónimo'}
                    </span>
                    {transcript.tour?.name && (
                      <Tag
                        color="blue"
                        icon={<Home size={12} className="mr-1" />}
                        className="ml-2"
                      >
                        {transcript.tour.name}
                      </Tag>
                    )}
                  </div>
                }
                description={
                  <div className="mt-1">
                    <div className="text-sm text-gray-500 flex items-center">
                      <MessageSquare size={14} className="mr-1" />
                      {transcript.messages?.length || 0} mensajes
                    </div>
                  </div>
                }
              />
              
              {transcript.messages?.length > 0 && (
                <div className="mt-3 pl-2 border-l-2 border-blue-200">
                  <div className="text-sm text-gray-700 line-clamp-2">
                    {transcript.messages[transcript.messages.length - 1].content}
                  </div>
                  <div className="mt-2">
                    <Button
                      type="link"
                      size="small"
                      className="p-0 text-xs text-blue-500"
                    >
                      Ver conversación completa
                    </Button>
                  </div>
                </div>
              )}
            </List.Item>
          )}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} conversaciones`,
          }}
        />
      </Card>
    </div>
  );
};

export default TranscriptsPage;
