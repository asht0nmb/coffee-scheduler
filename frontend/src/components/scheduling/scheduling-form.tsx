// 'use client';

// import { useState } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// export function SchedulingForm() {
//   const [selectedContacts] = useState<string[]>([]);
//   const [slotsPerContact, setSlotsPerContact] = useState(3);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     // Scheduling logic will go here
//     console.log('Scheduling with:', { selectedContacts, slotsPerContact });
//   };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Schedule Coffee Chats</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Select Contacts
//             </label>
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
//               <p className="text-gray-500">Contact selection component will go here</p>
//             </div>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Slots per Contact: {slotsPerContact}
//             </label>
//             <input
//               type="range"
//               min="1"
//               max="5"
//               value={slotsPerContact}
//               onChange={(e) => setSlotsPerContact(Number(e.target.value))}
//               className="w-full"
//             />
//             <div className="flex justify-between text-xs text-gray-500 mt-1">
//               <span>1</span>
//               <span>5</span>
//             </div>
//           </div>

//           <Button type="submit" className="w-full">
//             Generate Schedule
//           </Button>
//         </form>
//       </CardContent>
//     </Card>
//   );
// }