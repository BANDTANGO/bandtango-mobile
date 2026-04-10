import { Playlist } from '../types';

export const seedPlaylists: Playlist[] = [
  {
    id: '1',
    name: 'Warmup Set',
    description: 'Easy grooves to open rehearsal.',
    songs: [
      {
        id: 's1',
        title: 'City Lights',
        artist: 'The Echoes',
        duration: '3:42',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        id: 's2',
        title: 'Midnight Drive',
        artist: 'Blue Tides',
        duration: '4:09',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
    ],
  },
  {
    id: '2',
    name: 'Gig Night',
    description: 'High-energy tracks for live performance.',
    songs: [
      {
        id: 's3',
        title: 'Crowd Control',
        artist: 'Static Avenue',
        duration: '3:28',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
      {
        id: 's4',
        title: 'Final Encore',
        artist: 'Neon Anthem',
        duration: '4:31',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      },
      {
        id: 's5',
        title: 'After Hours',
        artist: 'Velvet Noise',
        duration: '3:57',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
      },
    ],
  },
];
