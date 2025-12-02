import { useEffect, useState, useRef } from 'react';
import { Layout } from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Search, MoreVertical, Paperclip } from 'lucide-react';

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
}

export function ChatPage() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      subscribeToMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const { data: participantsData } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations:chat_conversations (
            id,
            type,
            name
          )
        `)
        .eq('user_id', profile?.id);

      if (participantsData && participantsData.length > 0) {
        const conversationIds = participantsData.map(p => (p.conversations as any).id);

        const { data: messagesData } = await supabase
          .from('chat_messages')
          .select('conversation_id, message_text, sent_at, sender_id')
          .in('conversation_id', conversationIds)
          .order('sent_at', { ascending: false });

        const lastMessages = new Map();
        messagesData?.forEach(msg => {
          if (!lastMessages.has(msg.conversation_id)) {
            lastMessages.set(msg.conversation_id, msg);
          }
        });

        const { data: otherParticipants } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            user_id,
            profiles (
              full_name
            )
          `)
          .in('conversation_id', conversationIds)
          .neq('user_id', profile?.id);

        const otherUsers = new Map();
        otherParticipants?.forEach(p => {
          otherUsers.set(p.conversation_id, (p.profiles as any)?.full_name || 'Unknown');
        });

        const conversationsWithData = participantsData.map(p => {
          const conv = p.conversations as any;
          const lastMsg = lastMessages.get(conv.id);
          return {
            id: conv.id,
            type: conv.type,
            name: conv.name,
            last_message: lastMsg?.message_text || 'No messages yet',
            last_message_time: lastMsg?.sent_at || conv.created_at,
            other_user_name: otherUsers.get(conv.id) || 'Unknown',
            unread_count: 0
          };
        });

        setConversations(conversationsWithData);

        if (conversationsWithData.length > 0 && !selectedConversation) {
          setSelectedConversation(conversationsWithData[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select(`
          id,
          sender_id,
          message_text,
          sent_at,
          attachment_url,
          profiles:sender_id (
            full_name
          )
        `)
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (data) {
        const formattedMessages = data.map(m => ({
          id: m.id,
          sender_id: m.sender_id,
          sender_name: (m.profiles as any)?.full_name || 'Unknown',
          message_text: m.message_text,
          sent_at: m.sent_at,
          attachment_url: m.attachment_url
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = (conversationId: string) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          (async () => {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', payload.new.sender_id)
              .maybeSingle();

            const newMsg: Message = {
              id: payload.new.id,
              sender_id: payload.new.sender_id,
              sender_name: senderData?.full_name || 'Unknown',
              message_text: payload.new.message_text,
              sent_at: payload.new.sent_at,
              attachment_url: payload.new.attachment_url
            };

            setMessages(prev => [...prev, newMsg]);
          })();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: selectedConversation,
          sender_id: profile?.id!,
          message_text: newMessage.trim()
        });

      if (!error) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
                        className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                          selectedConversation === conv.id ? 'bg-blue-50' : ''
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
                                {new Date(conv.last_message_time).toLocaleDateString()}
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
                        className={`flex ${message.sender_id === profile?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-md ${message.sender_id === profile?.id ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              message.sender_id === profile?.id
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message_text}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {new Date(message.sent_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
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
