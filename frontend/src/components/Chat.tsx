import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/client';
import { useParams, useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export const Chat = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const { data: messages, isLoading, error } = useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await api.get(`/conversations/${conversationId}/messages`);
      return response.data;
    },
    enabled: !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/conversations/${conversationId}/messages`, {
        content,
        role: 'user',
      });
      return response.data;
    },
    onSuccess: () => {
      setMessage('');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  if (!conversationId) {
    navigate('/conversations');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">Error loading messages</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-shrink-0 bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
            <button
              onClick={() => navigate('/conversations')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Conversations
            </button>
          </div>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-4 h-full">
            <div className="space-y-4 h-[600px] overflow-y-auto p-4">
              {messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-md rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="mt-4">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};