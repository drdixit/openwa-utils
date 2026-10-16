export interface OpenWAGroup {
  id: string;
  name: string;
  linkedParentJID: string | null;
}

export interface OpenWAParticipant {
  id: string;
  number: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface OpenWAGroupDetail {
  id: string;
  name: string;
  owner?: string;
  createdAt?: number;
  participants: OpenWAParticipant[];
}
