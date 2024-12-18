export default interface Friend {
  userId: string;
  displayName: string;
  spotify_access_token: string;
  spotify_refresh_token: string;
  currentlyPlaying?: {
    item?: {
      name: string;
      artists: { name: string }[];
    };
  };
}
