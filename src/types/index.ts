export type UserRole = 'host' | 'participant';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  organization?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export type SessionStatus = 'waiting' | 'active' | 'ended';

export interface Session {
  id: string;
  host_id: string;
  name: string;
  code: string;
  status: SessionStatus;
  max_participants: number;
  grid_layout: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  stream_active: boolean;
  profiles?: Profile;
}

export interface Message {
  id: string;
  session_id: string;
  from_user_id: string;
  to_user_id?: string;
  content: string;
  created_at: string;
}

export type HelpRequestStatus = 'pending' | 'resolved';

export interface HelpRequest {
  id: string;
  session_id: string;
  user_id: string;
  note?: string;
  status: HelpRequestStatus;
  requested_at: string;
  resolved_at?: string;
  profiles?: Profile;
}
