export const dummyMessageTexts = {
  student: [
    "Hi! I have a question about the latest lesson. Could we discuss the concept?",
    "That was really helpful, thank you!",
    "I'm still struggling with this topic. Could you explain it differently?",
    "The homework assignment was quite challenging. Any tips?",
    "I finally understood it! Thanks for your patience.",
    "Can we schedule a session next week?",
    "I'm making great progress with your guidance.",
    "What resources do you recommend for this topic?",
    "I appreciate all your help so far!",
    "Ready for the next module!",
    "Quick question - is this approach correct?",
    "The video tutorial was excellent!",
    "How long do you think it'll take me to master this?",
    "Can you review my work?",
    "I'd like to discuss my learning goals.",
  ],
  mentor: [
    "Great question! Let me break it down for you.",
    "You're making excellent progress!",
    "Here's a helpful resource that might assist you.",
    "That's the right approach. Keep going!",
    "Let's schedule a session to dive deeper.",
    "I'm impressed with your dedication!",
    "Try this alternative method - it might help.",
    "Your understanding is improving significantly.",
    "Don't hesitate to ask if you need clarification.",
    "This is a common challenge - here's how I approach it.",
    "You've got the right idea. Let's refine it.",
    "I recommend practicing with these exercises.",
    "Your questions show you're really engaged!",
    "Let's meet at 3 PM tomorrow if that works.",
    "You're on the right track. Keep up the hard work!",
  ]
};

export const generateDummyMessages = () => {
  const messages = [];
  const topics = [
    "Web Development",
    "Advanced JavaScript",
    "React Fundamentals",
    "Database Design",
    "API Development"
  ];

  for (let i = 0; i < 40; i++) {
    const isStudent = i % 2 === 0;
    const textArray = isStudent ? dummyMessageTexts.student : dummyMessageTexts.mentor;
    const randomText = textArray[Math.floor(Math.random() * textArray.length)];

    messages.push({
      message_text: randomText,
      sent_at: new Date(Date.now() - (40 - i) * 60000).toISOString(),
      sender_role: isStudent ? 'student' : 'mentor'
    });
  }

  return messages;
};

export const seedDummyMessages = async (supabase: any, userId: string) => {
  try {
    const { data: existingConversations } = await supabase
      .from('chat_conversations')
      .select('id')
      .or(`created_by.eq.${userId},conversation_participants.user_id.eq.${userId}`)
      .limit(1);

    if (!existingConversations || existingConversations.length === 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, role')
        .neq('id', userId)
        .limit(1);

      if (profiles && profiles.length > 0) {
        const otherUser = profiles[0];

        const { data: newConv, error: convError } = await supabase
          .from('chat_conversations')
          .insert({
            type: 'direct',
            created_by: userId,
          })
          .select()
          .single();

        if (!convError && newConv) {
          await supabase.from('conversation_participants').insert([
            { conversation_id: newConv.id, user_id: userId },
            { conversation_id: newConv.id, user_id: otherUser.id },
          ]);

          const dummyMessages = generateDummyMessages();
          for (const msg of dummyMessages) {
            await supabase.from('chat_messages').insert({
              conversation_id: newConv.id,
              sender_id: msg.sender_role === 'student' ? userId : otherUser.id,
              message_text: msg.message_text,
              is_synced: true,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error seeding dummy messages:', error);
  }
};
