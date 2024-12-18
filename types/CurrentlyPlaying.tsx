export default interface CurrentlyPlaying {
  item?: {
    name: string;
    artists: { name: string }[];
    album: { name: string; images: { url: string, width: number, height: number }[] };
  };
  is_playing: boolean;
  progress_ms: number;
}
