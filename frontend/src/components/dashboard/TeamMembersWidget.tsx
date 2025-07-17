import React from 'react';
import { User } from '@/types/user.type';
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';

const TeamMembersWidget = ({ members, onInvite }: { members: User[], onInvite: () => void }) => {
  return (
    <div className="bg-dark-blue/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-white h-full flex flex-col">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <UserGroupIcon className="h-6 w-6 mr-3 text-neon-blue" />
        Team Members
      </h3>
      <div className="flex-grow space-y-4 overflow-y-auto custom-scrollbar -mr-3 pr-3">
        {members.slice(0, 7).map(member => {
          const avatarUrl = member.avatarUrl ? `http://localhost:3001${member.avatarUrl}` : `https://i.pravatar.cc/40?u=${member.id}`;
          return (
            <div key={member.id} className="flex items-center">
              <img
                src={avatarUrl}
                alt={member.fullName}
                className="w-10 h-10 rounded-full mr-4 object-cover"
              />
              <div>
                <p className="font-semibold">{member.fullName}</p>
                <p className="text-sm text-gray-400">{member.email}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-white/10">
        <button
          onClick={onInvite}
          className="w-full btn-secondary flex items-center justify-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Invite New Member
        </button>
      </div>
    </div>
  );
};

export default TeamMembersWidget; 