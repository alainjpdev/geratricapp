export interface Contact {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  source: string;
  notes: string;
  location: string;
  createdAt?: string;
  lastContact?: string;
} 