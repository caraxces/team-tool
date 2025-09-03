import React, { useState, useEffect, Fragment, useCallback, useRef } from 'react';
import { UserGroupIcon, PlusIcon, MagnifyingGlassIcon, FunnelIcon, EnvelopeIcon, ChatBubbleLeftRightIcon, ChevronDownIcon, XMarkIcon, PaperAirplaneIcon, PaperClipIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getMyTeams, getTeamMembers } from '@/services/team.service';
import { getAllProjectsForMentions } from '@/services/project.service';
import { getAllTasksForMentions } from '@/services/task.service';
import { findOrCreateConversation, getMessages, sendMessage } from '@/services/chat.service';
import { Team } from '@/types/team.type';
import { User } from '@/types/user.type';
import { Message } from '@/types/chat.type';
import { CreateTeamModal } from './CreateTeamModal';
import { InviteMemberModal } from './InviteMemberModal';
import { Menu, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import chatMentionStyles from './ChatMentionStyles';
import { useAuth } from '@/context/AuthContext';
import { getUnreadMessageCounts, markMessagesFromSenderAsRead } from '@/services/notification.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';


const MemberCard = ({ member, onStartChat, unreadCount }: { member: User, onStartChat: (member: User) => void, unreadCount: number }) => {
    const avatarFullUrl = member.avatarUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${member.avatarUrl}` : `https://i.pravatar.cc/150?u=${member.id}`;
    return (
        <motion.div 
            layoutId={`member-card-${member.id}`}
            className="bg-dark-blue/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-white text-center flex flex-col items-center transform hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-neon-blue/20"
        >
            <motion.div layoutId={`member-avatar-${member.id}`} className="relative mb-4">
                <img src={avatarFullUrl} alt={member.fullName} className="w-24 h-24 rounded-full border-4 border-neon-blue/50 object-cover" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-6 w-6 rounded-full bg-red-600 ring-2 ring-white text-xs flex items-center justify-center font-bold">
                        {unreadCount}
                    </span>
                )}
            </motion.div>
            <motion.h3 layoutId={`member-name-${member.id}`} className="text-xl font-bold">{member.fullName}</motion.h3>
            <motion.p layoutId={`member-email-${member.id}`} className="text-neon-blue/80 mb-4 truncate w-full">{member.email}</motion.p>
            <motion.div layoutId={`member-actions-${member.id}`} className="flex-grow"></motion.div> {/* Pushes buttons to the bottom */}
            <div className="mt-auto flex space-x-4 pt-4">
                <motion.button layoutId={`member-email-btn-${member.id}`} className="bg-neon-blue/20 text-neon-blue p-3 rounded-full hover:bg-neon-blue hover:text-dark-blue transition-colors">
                    <EnvelopeIcon className="h-5 w-5" />
                </motion.button>
                <motion.button 
                    layoutId={`member-chat-btn-${member.id}`}
                    onClick={() => onStartChat(member)}
                    className="bg-white/10 text-white p-3 rounded-full hover:bg-white/20 transition-colors">
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                </motion.button>
            </div>
        </motion.div>
    );
};

const ExpandedChatView = ({ 
    member, 
    onClose,
    messages,
    onSendMessage,
    currentUser
}: { 
    member: User, 
    onClose: () => void,
    messages: Message[],
    onSendMessage: (content: string) => Promise<void>,
    currentUser: User | null
}) => {
    const [newMessage, setNewMessage] = useState('');
    const [projects, setProjects] = useState<SuggestionDataItem[]>([]);
    const [tasks, setTasks] = useState<SuggestionDataItem[]>([]);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const fetchMentionData = async () => {
            try {
                const [projectsData, tasksData] = await Promise.all([
                    getAllProjectsForMentions(),
                    getAllTasksForMentions()
                ]);
                setProjects(projectsData);
                setTasks(tasksData);
            } catch (error) {
                toast.error("Failed to fetch data for mentions.");
            }
        };
        fetchMentionData();
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || isSending) return;

        setIsSending(true);
        try {
            await onSendMessage(newMessage);
            setNewMessage('');
        } catch (error) {
             toast.error("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };
    
    const memberAvatarFullUrl = member.avatarUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${member.avatarUrl}` : `https://i.pravatar.cc/150?u=${member.id}`;

    return (
         <motion.div 
            layoutId={`member-card-${member.id}`}
            className="bg-dark-blue/70 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col w-full h-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center">
                    <motion.div layoutId={`member-avatar-${member.id}`}>
                        <img src={memberAvatarFullUrl} alt={member.fullName} className="w-12 h-12 rounded-full mr-4 border-2 border-neon-blue object-cover" />
                    </motion.div>
                    <div>
                        <motion.h3 layoutId={`member-name-${member.id}`} className="text-xl font-bold">{member.fullName}</motion.h3>
                        <motion.p layoutId={`member-email-${member.id}`} className="text-xs text-green-400">Online</motion.p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 hidden md:block">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            {/* Message List */}
            <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                    {messages.map((msg) => {
                        const senderAvatarFullUrl = msg.sender.avatarUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${msg.sender.avatarUrl}` : `https://i.pravatar.cc/150?u=${msg.sender.id}`;
                        return (
                            <div key={msg.uuid} className={`flex items-end gap-3 ${msg.sender.id !== member.id ? 'flex-row-reverse' : ''}`}>
                            <img src={senderAvatarFullUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                            <div className={`px-4 py-2 rounded-2xl max-w-lg break-words ${msg.sender.id !== member.id ? 'bg-neon-pink text-dark-blue rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}>
                                <p dangerouslySetInnerHTML={{ __html: msg.content.replace(/(\r\n|\n|\r)/gm, "<br />").replace(/@\[Task:([^\]]+)\]\(([^)]+)\)/g, '<span class="text-neon-blue font-bold">@$2</span>').replace(/#\[Project:([^\]]+)\]\(([^)]+)\)/g, '<span class="text-cyan-400 font-bold">#$2</span>') }} />
                            </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            {/* Message Input */}
             <div className="p-4 border-t border-white/10 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <button type="button" className="p-2 rounded-full hover:bg-white/10">
                        <PaperClipIcon className="h-6 w-6 text-gray-400" />
                    </button>
                    <div className="flex-grow">
                        <MentionsInput
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Message ${member.fullName}...`}
                            style={chatMentionStyles as any}
                            a11ySuggestionsListLabel={"Suggested mentions"}
                            className="mentions-input"
                        >
                            <Mention
                                trigger="@"
                                data={tasks}
                                markup="@[Task:__id__](__display__)"
                                displayTransform={(_id, display) => `@${display}`}
                                style={{ backgroundColor: '#ff69b4' }}
                            />
                            <Mention
                                trigger="#"
                                data={projects}
                                markup="#[Project:__id__](__display__)"
                                displayTransform={(_id, display) => `#${display}`}
                                style={{ backgroundColor: '#00ffff' }}
                            />
                        </MentionsInput>
                    </div>
                    <button type="submit" className="p-3 rounded-full bg-neon-pink text-dark-blue hover:bg-pink-500 disabled:opacity-50" disabled={!newMessage.trim() || isSending}>
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </motion.div>
    )
}


const TeamManagementView = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isCreateTeamModalOpen, setCreateTeamModalOpen] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeChatMember, setActiveChatMember] = useState<User | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const authContext = useAuth();
  const currentUser = authContext.state.user;
  const queryClient = useQueryClient();

  const { data: unreadCounts } = useQuery({
    queryKey: ['unreadMessageCounts'],
    queryFn: getUnreadMessageCounts,
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: !!currentUser,
  });

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setIsLoading(true);
        const fetchedTeams = await getMyTeams();
        setTeams(fetchedTeams);
        if (fetchedTeams.length > 0) {
          setSelectedTeam(fetchedTeams[0]);
        }
      } catch (error) {
        toast.error('Failed to fetch teams.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  useEffect(() => {
    if (!selectedTeam) {
        setMembers([]);
        return;
    };

    const fetchMembers = async () => {
        try {
            setIsMembersLoading(true);
            const fetchedMembers = await getTeamMembers(selectedTeam.id);
            setMembers(fetchedMembers);
        } catch (error) {
            toast.error(`Failed to fetch members for ${selectedTeam.name}.`);
            setMembers([]);
        } finally {
            setIsMembersLoading(false);
        }
    };

    fetchMembers();
  }, [selectedTeam, refreshKey]);

  useEffect(() => {
    if (!activeConversationId) return;

    const fetchMessages = async () => {
        try {
            const fetchedMessages = await getMessages(activeConversationId);
            setMessages(fetchedMessages);
        } catch (error) {
            toast.error("Failed to load messages.");
        } finally {
            setIsChatLoading(false);
        }
    };
    fetchMessages();
  }, [activeConversationId]);

  const handleTeamCreated = (newTeam: Team) => {
    setTeams([...teams, newTeam]);
    setSelectedTeam(newTeam);
  };

  const handleMemberInvited = () => {
    // Refetch members for the current team
    if (selectedTeam) {
        // This re-triggers the useEffect for fetching members
        setRefreshKey(prevKey => prevKey + 1);
    }
  };

  const handleStartChat = useCallback(async (member: User) => {
    if (!member || member.id === activeChatMember?.id) return;
    
    setActiveChatMember(member);
    setIsChatLoading(true);
    setMessages([]); // Clear previous messages
    try {
      const convId = await findOrCreateConversation(member.id);
      setActiveConversationId(convId);
      // Mark messages as read and refetch counts
      await markMessagesFromSenderAsRead(member.id);
      queryClient.invalidateQueries({ queryKey: ['unreadMessageCounts'] });

    } catch (error) {
      toast.error(`Could not start chat with ${member.fullName}.`);
      setActiveChatMember(null);
      setIsChatLoading(false);
    }
  }, [activeChatMember]);

  const handleCloseChat = () => {
    setActiveChatMember(null);
    setActiveConversationId(null);
    setMessages([]);
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversationId) {
        toast.error("No active conversation.");
        return;
    }

    try {
        const newMessage = await sendMessage(activeConversationId, content);
        setMessages(prevMessages => [...prevMessages, newMessage]);
    } catch (error) {
        toast.error("Failed to send message. Please try again.");
        // Optionally, remove optimistic update
        throw error; // re-throw to notify caller
    }
  };

  const isMyMessage = (msg: Message) => {
    return msg.sender.id === currentUser?.id;
  };


  return (
    <>
      <div className="bg-dark-blue/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-white h-[calc(100vh-100px)] flex flex-col">
        {/* Header - Conditionally hidden on mobile when chat is active */}
        <div className={`flex-shrink-0 ${activeChatMember ? 'hidden md:flex' : 'flex'} justify-between items-center mb-6`}>
          <div className="flex items-center gap-4">
              <UserGroupIcon className="h-8 w-8 text-neon-blue" />
              <Menu as="div" className="relative inline-block text-left">
                <div>
                  <Menu.Button className="inline-flex w-full justify-center items-center gap-x-2 rounded-md bg-transparent px-3 py-2 text-2xl font-bold text-white hover:bg-white/5">
                    {selectedTeam ? selectedTeam.name : 'Select a Team'}
                    <ChevronDownIcon className="-mr-1 h-6 w-6 text-gray-400" aria-hidden="true" />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left divide-y divide-gray-700 rounded-md bg-dark-blue shadow-lg ring-1 ring-white/20 focus:outline-none">
                    <div className="px-1 py-1">
                      {teams.map((team) => (
                        <Menu.Item key={team.id}>
                          {({ active }) => (
                            <button
                              onClick={() => setSelectedTeam(team)}
                              className={`${
                                active ? 'bg-neon-blue text-dark-blue' : 'text-white'
                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                            >
                              {team.name}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
          </div>
          <button 
            onClick={() => setCreateTeamModalOpen(true)}
            className="flex items-center bg-neon-blue text-dark-blue font-bold py-2 px-4 rounded-lg shadow-neon-blue hover:scale-105 transition-transform duration-300"
          >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Team
          </button>
        </div>

        {/* Toolbar - Conditionally hidden on mobile when chat is active */}
        <div className={`flex-shrink-0 ${activeChatMember ? 'hidden md:flex' : 'flex'} flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 bg-white/5 p-3 rounded-lg gap-4`}>
          <div className="relative w-full sm:max-w-xs">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2"/>
              <input type="text" placeholder="Search members..." className="w-full bg-transparent border border-white/20 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-neon-blue" />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <button className="flex items-center justify-center bg-white/10 py-2 px-4 rounded-lg hover:bg-white/20 transition-colors">
                  <FunnelIcon className="h-5 w-5 mr-2"/>
                  Filter
              </button>
               <button 
                onClick={() => setInviteModalOpen(true)}
                disabled={!selectedTeam}
                className="flex items-center justify-center bg-white/10 py-2 px-4 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <PlusIcon className="h-5 w-5 mr-2" />
                Invite Member
            </button>
          </div>
        </div>  
        
        {/* Member Grid / Chat View Container */}
        <div className="flex-grow overflow-y-auto pr-2 relative">
            {/* Member Grid - Shown when NO chat is active */}
            <motion.div layout className={`${activeChatMember ? 'hidden' : 'grid'} grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`}>
                <AnimatePresence>
                    {isLoading && <p className="col-span-full text-center text-gray-400">Loading teams...</p>}
                    {!isLoading && isMembersLoading && <p className="col-span-full text-center text-gray-400">Loading members...</p>}
                    {!isLoading && !isMembersLoading && members.length === 0 && (
                        <div className="col-span-full text-center text-gray-400 pt-10">
                            <p>No members in this team yet.</p>
                            <p className="text-sm">Click "Invite Member" to add someone.</p>
                        </div>
                    )}
                    {members.map(member => <MemberCard key={member.id} member={member} onStartChat={handleStartChat} unreadCount={unreadCounts?.[member.id] || 0} />)}
                </AnimatePresence>
            </motion.div>
            
            {/* Chat View - Shown when a chat IS active */}
            <AnimatePresence>
                {activeChatMember && (
                    <motion.div 
                        key="chat-view"
                        className="absolute inset-0 flex flex-col md:flex-row gap-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Sidebar: Mobile back button + Desktop member list */}
                        <div className="flex-shrink-0 md:w-1/4 flex flex-col gap-3 md:overflow-y-auto custom-scrollbar">
                             <button onClick={handleCloseChat} className="flex md:hidden items-center bg-white/10 p-2 rounded-lg mb-2">
                                <ChevronLeftIcon className="h-5 w-5 mr-2"/>
                                All Members
                            </button>
                            {members.filter(m => m.id !== activeChatMember.id).map(member => {
                                const sidebarAvatarUrl = member.avatarUrl ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${member.avatarUrl}` : `https://i.pravatar.cc/150?u=${member.id}`;
                                const unreadCount = unreadCounts?.[member.id] || 0;
                                return (
                                <div 
                                    key={member.id} 
                                    onClick={() => handleStartChat(member)}
                                    className="hidden md:flex bg-dark-blue/50 p-3 rounded-xl items-center gap-3 cursor-pointer hover:bg-white/10 relative"
                                >
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-600 ring-1 ring-dark-blue"></span>
                                    )}
                                    <img src={sidebarAvatarUrl} alt={member.fullName} className="w-10 h-10 rounded-full object-cover"/>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold truncate text-sm">{member.fullName}</h3>
                                        <p className="text-xs text-gray-400 truncate">{member.email}</p>
                                    </div>
                                </div>
                            )})}
                        </div>
                        {/* Expanded Chat takes remaining space */}
                        <div className="flex-grow h-full">
                            { isChatLoading ? (
                                <div className="flex justify-center items-center h-full">
                                    <p className="text-gray-400 animate-pulse">Loading conversation...</p>
                                </div>
                            ) : (
                                <ExpandedChatView 
                                    member={activeChatMember} 
                                    onClose={handleCloseChat} 
                                    messages={messages}
                                    onSendMessage={handleSendMessage}
                                    currentUser={currentUser}
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setCreateTeamModalOpen(false)}
        onTeamCreated={handleTeamCreated}
      />
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        team={selectedTeam}
        onMemberInvited={handleMemberInvited}
      />
    </>
  );
};

export default TeamManagementView; 