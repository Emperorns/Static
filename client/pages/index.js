import { useEffect, useState } from 'react';

export default function Home() {
  const [videos, setVideos] = useState([]);
  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(setVideos);
  }, []);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, padding: 16 }}>
      {videos.map(v => (
        <a
          key={v.fileId}
          href={`https://t.me/${process.env.BOT_USERNAME}?start=${v.fileId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={v.thumbnailUrl} alt="thumb" style={{ width: '100%', borderRadius: 8 }} />
        </a>
      ))}
    </div>
  );
}
