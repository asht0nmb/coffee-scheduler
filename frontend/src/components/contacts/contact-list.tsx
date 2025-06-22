'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Contact } from '@/lib/types';

interface ContactListProps {
  contacts: Contact[];
}

export function ContactList({ contacts }: ContactListProps) {
  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
        >
          <path
            d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding your first contact for coffee chats.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {contacts.map((contact) => (
        <Card key={contact._id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{contact.name}</h3>
                <p className="text-sm text-gray-500">{contact.email}</p>
                <p className="text-sm text-gray-500">{contact.timezone}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                  {contact.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'slots_generated':
      return 'bg-blue-100 text-blue-800';
    case 'email_sent':
      return 'bg-purple-100 text-purple-800';
    case 'scheduled':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}