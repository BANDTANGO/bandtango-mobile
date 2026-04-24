export type Song = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  audioUrl?: string;
  albumArtUrl?: string;
  /** All additional fields returned by the search API, preserved verbatim for server sync. */
  meta?: Record<string, unknown>;
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
  url?: string;
  songs: Song[];
};

export type MainStackParamList = {
  Home: { playlistId?: string; playlistName?: string } | undefined;
  Playlists: undefined;
  DiscoveryLevel: undefined;
  AudioAgent: undefined;
  Explore: undefined;
  HLSListening: undefined;
  PlaylistDetail: { playlistId: string };
  CreatePlaylist: undefined;
  AddPlaylist: undefined;
  Feedback: undefined;
  Settings: undefined;
};

/** Public routes — accessible without authentication. */
export type AuthStackParamList = {
  Login: undefined;
  GettingStarted: undefined;
  AboutYou: undefined;
  AudioAgentPersonality: undefined;
  CreateAccount: undefined;
};

/** @deprecated Use MainStackParamList + AuthStackParamList separately. */
export type GettingStartedStackParamList = {
  GettingStarted: undefined;
  Login: undefined;
};

export type RootStackParamList = MainStackParamList & AuthStackParamList;

// Extend React Navigation options to include custom properties
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
