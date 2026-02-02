import { useEffect, useState, useRef } from 'react';
import { Layout } from '../../components/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { seedDummyMessages } from '../../utils/dummyMessages';
import { Send, Paperclip, Plus, Search, MessageCircle, User } from 'lucide-react';

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  created_by: string;
  created_at: string;
  participants?: any[];
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  attachment_url?: string;
  attachment_type?: string;
  sent_at: string;
  sender?: any;
}

interface Mentor {
  id: string;
  full_name: string;
  bio?: string;
  avatar_url?: string;
  specializations?: string[];
}

export function MessagesPage() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMentorList, setShowMentorList] = useState(false);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const initializeMessages = async () => {
      if (user) {
        await seedDummyMessages(supabase, user.id);
        loadConversations();
      }
    };
    initializeMessages();
    const interval = setInterval(loadConversations, 3000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      const interval = setInterval(() => loadMessages(selectedConversation.id), 2000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data: conversations, error } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          conversation_participants (
            user_id,
            profiles:user_id (id, full_name, avatar_url)
          )
        `)
        .or(`created_by.eq.${user.id},conversation_participants.user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations(conversations || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles:sender_id (id, full_name, avatar_url, role)
        `)
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadMentors = async () => {
    try {
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select(`
          id,
          specializations,
          bio,
          profiles:id (id, full_name, avatar_url)
        `);

      if (error) throw error;

      const formattedMentors = data?.map((m: any) => ({
        id: m.id,
        full_name: m.profiles?.full_name || '',
        bio: m.bio,
        avatar_url: m.profiles?.avatar_url,
        specializations: m.specializations,
      })) || [];

      setMentors(formattedMentors);
    } catch (error) {
      console.error('Error loading mentors:', error);
    }
  };

  const startConversation = async (mentorId: string) => {
    if (!user) return;

    try {
      const { data: existingConv } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('created_by', user.id)
        .or(`created_by.eq.${mentorId}`);

      let conversationId: string;

      if (existingConv && existingConv.length > 0) {
        conversationId = existingConv[0].id;
      } else {
        const { data: newConv, error } = await supabase
          .from('chat_conversations')
          .insert({
            type: 'direct',
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        conversationId = newConv.id;

        await supabase.from('conversation_participants').insert([
          { conversation_id: conversationId, user_id: user.id },
          { conversation_id: conversationId, user_id: mentorId },
        ]);
      }

      await loadConversations();
      setShowMentorList(false);

      const conv = conversations.find(c => c.id === conversationId);
      if (conv) setSelectedConversation(conv);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedConversation || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase.from('chat_messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        message_text: newMessage,
        is_synced: true,
      });

      if (error) throw error;

      setNewMessage('');
      await loadMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    const participant = conversation.participants?.[0];
    return participant?.profiles?.full_name || 'Unknown User';
  };

  const filteredConversations = conversations.filter(conv => {
    const name = conv.name || getOtherParticipant(conv);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
      <div className="flex h-screen max-h-[calc(100vh-60px)]">
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {profile?.role === 'student' && (
              <button
                onClick={() => {
                  setShowMentorList(true);
                  loadMentors();
                }}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                <span>Message Mentor</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-gray-600">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition ${
                    selectedConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {conv.name || getOtherParticipant(conv)}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {selectedConversation ? (
          <div className="flex-1 flex flex-col bg-gray-50">
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation.name || getOtherParticipant(selectedConversation)}
                </h3>
                <p className="text-sm text-gray-500">Direct Message</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Start the conversation</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender_id === user?.id
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{msg.message_text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-3">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Select a conversation to start messaging</p>
            </div>
          </div>
        )}

        {showMentorList && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-96 flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Select a Mentor</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {mentors.length === 0 ? (
                  <p className="text-center text-gray-600">No mentors available</p>
                ) : (
                  mentors.map((mentor) => (
                    <button
                      key={mentor.id}
                      onClick={() => startConversation(mentor.id)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition"
                    >
                      <p className="font-medium text-gray-900">{mentor.full_name}</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{mentor.bio || 'No bio'}</p>
                      {mentor.specializations && mentor.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {mentor.specializations.slice(0, 2).map((spec: string) => (
                            <span key={spec} className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowMentorList(false)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
