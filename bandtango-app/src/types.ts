export type Song = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  audioUrl?: string;
  albumArtUrl?: string;
};

export type Playlist = {
  id: string;
  name: string;
  description: string;
  songs: Song[];
};

export type MainStackParamList = {
  Home: { playlistId?: string; playlistName?: string } | undefined;
  Playlists: undefined;
  DiscoveryLevel: undefined;
  AudioAgent: undefined;
  Explore: undefined;
  PlaylistDetail: { playlistId: string };
  CreatePlaylist: undefined;
  Settings: undefined;
};

export type GettingStartedStackParamList = {
  GettingStarted: undefined;
  Login: undefined;
};

export type RootStackParamList = MainStackParamList & GettingStartedStackParamList;

// Extend React Navigation options to include custom properties
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
