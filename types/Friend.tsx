export default interface Friend {
  userId: string;
  displayName: string;
  spotify_access_token: string;
  spotify_refresh_token: string;
  currentlyPlaying?: {
    item?: {
      name: string;
      album: { name: string; images: { url: string, width: number, height: number }[] };
      artists: { name: string }[];
    };
  };
}
