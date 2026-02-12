import { useEffect, useState, useRef } from 'react';
import { Layout } from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Search, MoreVertical, Paperclip, Calendar, Clock, Video, MessageSquare, Check } from 'lucide-react';
import io from 'socket.io-client';
import api from '../../lib/api';

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  last_message: string;
  last_message_time: string;
  other_user_name: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  message_text: string;
  sent_at: string;
  attachment_url: string | null;
  message_type?: 'text' | 'session_booking';
  metadata?: any;
}

export function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Socket.io
    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    // Remove /api if present for socket connection usually
    const baseUrl = socketUrl.replace(/\/api\/?$/, '');

    socketRef.current = io(baseUrl, {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to chat server');
    });

    socketRef.current.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('message_updated', (updated: { id: string, metadata: any }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === updated.id ? { ...msg, metadata: { ...msg.metadata, ...updated.metadata } } : msg
      ));
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const convId = params.get('conversationId');
    loadConversations(convId);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      // Join conversation room
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', selectedConversation);
      }
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async (convIdFromQuery?: string | null) => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data);

      if (convIdFromQuery) {
        setSelectedConversation(convIdFromQuery);
      } else if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0].id);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      // If messages fail to load, we still want to show the empty chat UI if it exists
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { data } = await api.post('/chat/messages', {
        conversationId: selectedConversation,
        messageText: newMessage.trim()
      });

      const newMsgObj: Message = {
        id: data.id,
        sender_id: user?.id!,
        sender_name: 'Me',
        message_text: newMessage.trim(),
        sent_at: new Date().toISOString(),
        attachment_url: null
      };

      setMessages(prev => [...prev, newMsgObj]);
      setNewMessage('');

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleConfirmSession = async (sessionId: string) => {
    try {
      await api.put(`/mentor-sessions/confirm/${sessionId}`);
      loadMessages(selectedConversation!);
    } catch (error) {
      console.error('Error confirming session:', error);
      alert('Failed to confirm session');
    }
  };

  const handleRescheduleSession = async (sessionId: string) => {
    const newDate = prompt('Enter new date and time (YYYY-MM-DD HH:MM):');
    if (!newDate) return;

    try {
      await api.put(`/mentor-sessions/reschedule/${sessionId}`, {
        newScheduledAt: new Date(newDate).toISOString()
      });
      loadMessages(selectedConversation!);
    } catch (error) {
      console.error('Error rescheduling session:', error);
      alert('Failed to reschedule session');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" style={{ height: 'calc(100vh - 12rem)' }}>
          <div className="flex h-full">
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No conversations yet
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredConversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full p-4 text-left hover:bg-gray-50 transition ${selectedConversation === conv.id ? 'bg-blue-50' : ''
                          }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {conv.other_user_name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {conv.last_message_time ? new Date(conv.last_message_time).toLocaleDateString() : ''}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedConv ? (
                <>
                  <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-full"></div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedConv.other_user_name}</h3>
                        <p className="text-sm text-green-600">Online</p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-md ${message.sender_id === user?.id ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${message.sender_id === user?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                              } ${message.message_type === 'session_booking' ? 'border-2 border-blue-200 bg-white !text-gray-900 shadow-sm' : ''}`}
                          >
                            {message.message_type === 'session_booking' ? (
                              <div className="py-2">
                                <div className="flex items-center space-x-2 text-blue-600 mb-3">
                                  <Calendar className="w-5 h-5" />
                                  <span className="font-bold">Session Booking Request</span>
                                </div>
                                <div className="space-y-2 mb-4">
                                  <div className="flex items-center text-sm text-gray-700">
                                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>
                                      {message.metadata?.scheduledAt ? new Date(message.metadata.scheduledAt).toLocaleString() : 'N/A'}
                                      {message.metadata?.duration ? ` (${message.metadata.duration} mins)` : ''}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-700">
                                    {message.metadata?.sessionType === 'video' ? (
                                      <Video className="w-4 h-4 mr-2 text-gray-400" />
                                    ) : (
                                      <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                                    )}
                                    <span className="capitalize">{message.metadata?.sessionType} Session</span>
                                  </div>
                                  {message.metadata?.notes && (
                                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded italic">
                                      "{message.metadata.notes}"
                                    </div>
                                  )}
                                </div>

                                {user?.role === 'mentor' && user.id === message.metadata?.mentorId && !message.metadata?.status && (
                                  <div className="flex space-x-2 pt-2 border-t border-gray-100">
                                    <button
                                      onClick={() => handleConfirmSession(message.metadata.sessionId)}
                                      className="flex-1 flex items-center justify-center space-x-1 bg-green-600 text-white py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                                    >
                                      <Check className="w-4 h-4" />
                                      <span>Confirm</span>
                                    </button>
                                    <button
                                      onClick={() => handleRescheduleSession(message.metadata.sessionId)}
                                      className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 text-gray-700 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                                    >
                                      <Clock className="w-4 h-4" />
                                      <span>Reschedule</span>
                                    </button>
                                  </div>
                                )}

                                {message.metadata?.status === 'confirmed' && (
                                  <div className="flex items-center justify-center space-x-1 text-green-600 py-1 bg-green-50 rounded italic text-sm">
                                    <Check className="w-4 h-4" />
                                    <span>Session Confirmed</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm">{message.message_text}</p>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {message.sent_at ? new Date(message.sent_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={sendMessage} className="flex items-center space-x-3">
                      <button
                        type="button"
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Paperclip className="w-5 h-5 text-gray-600" />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
