// ============================================================
// aimonetiz / radar — backend (Vercel Serverless Function)
//
// Делает 2 запроса к YouTube Data API v3:
//   1. search.list   → находит ID самых просматриваемых Shorts по нише
//   2. videos.list   → получает статистику и длительность
//
// Затем фильтрует Shorts (≤60 сек) и считает viral_score.
//
// YouTube API ключ хранится в переменных окружения Vercel
// (process.env.YOUTUBE_API_KEY) — никогда не светится во фронте.
// ============================================================

// Маппинг ниш → поисковые запросы для YouTube
// (синхронизировать с src/App.jsx)
const NICHE_QUERIES = {
  'AI / AI Tools':     '"AI tools"|"ChatGPT"|"midjourney"|"AI tutorial"',
  'Money / Finance':   '"make money online"|"side hustle"|"passive income"|"финансы"',
  'Beauty':            '"makeup tutorial"|"skincare"|"beauty hack"',
  'Fitness':           '"workout"|"gym tips"|"fitness motivation"',
  'Tech / Gadgets':    '"tech review"|"gadgets"|"iphone tips"|"apple"',
  'Cooking':           '"recipe"|"cooking hack"|"easy meal"',
  'Lifestyle':         '"morning routine"|"aesthetic"|"daily vlog"',
  'Education':         '"learn"|"tutorial"|"how to"',
  'Gaming':            '"gaming tips"|"gameplay"|"gaming hack"',
  'Travel':            '"travel tips"|"travel vlog"|"hidden gem"',
  'Fashion':           '"fashion tips"|"outfit ideas"|"styling"',
  'Motivation':        '"motivation"|"mindset"|"success tips"',
};

// Маппинг "красивого" названия страны в код ISO 3166-1
const COUNTRY_CODES = {
  'Worldwide': null,
  'USA':       'US',
  'UK':        'GB',
  'Germany':   'DE',
  'Russia':    'RU',
  'Spain':     'ES',
  'France':    'FR',
  'Brazil':    'BR',
  'Mexico':    'MX',
  'India':     'IN',
  'Japan':     'JP',
};

// Период → ISO datetime для фильтра publishedAfter
function getPublishedAfter(period) {
  const now = Date.now();
  const ms = {
    '24 hours': 24 * 60 * 60 * 1000,
    '7 days':   7  * 24 * 60 * 60 * 1000,
    '30 days':  30 * 24 * 60 * 60 * 1000,
  }[period] || 7 * 24 * 60 * 60 * 1000;
  return new Date(now - ms).toISOString();
}

// Парсит ISO 8601 duration ("PT1M30S") в секунды
function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = parseInt(m[1] || 0);
  const min = parseInt(m[2] || 0);
  const s = parseInt(m[3] || 0);
  return h * 3600 + min * 60 + s;
}

// Считает viral_score (0-100)
// Формула: учитывает скорость набора просмотров + вовлечённость
function calcViralScore(views, likes, comments, publishedAt) {
  const hoursSince = Math.max(
    1,
    (Date.now() - new Date(publishedAt).getTime()) / 3_600_000
  );
  const viewVelocity = views / hoursSince;          // просмотров в час
  const engagement   = (likes + comments) / Math.max(views, 1);
  const rawScore     = viewVelocity * (1 + engagement * 20);

  // Нормализация: log10 + scaling — большие числа сжимаем
  const normalized = Math.log10(rawScore + 1) * 14;
  return Math.min(100, Math.max(0, Math.round(normalized)));
}

// Дней с момента публикации
function daysSince(publishedAt) {
  return Math.floor(
    (Date.now() - new Date(publishedAt).getTime()) / 86_400_000
  );
}

// =========== MAIN HANDLER ===========
export default async function handler(req, res) {
  // CORS — разрешаем с любого origin (сайт сам себе шлёт, но на всякий)
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const API_KEY = process.env.YOUTUBE_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({
      error: 'YOUTUBE_API_KEY не задан в Vercel. Зайди в Project Settings → Environment Variables.'
    });
  }

  // Парсим тело
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { niche, country, period } = body;

  const query       = NICHE_QUERIES[niche] || niche || 'viral';
  const regionCode  = COUNTRY_CODES[country];
  const publishedAfter = getPublishedAfter(period);

  try {
    // -------- STEP 1: search.list — найти ID Shorts --------
    const searchParams = new URLSearchParams({
      part:           'snippet',
      type:           'video',
      videoDuration:  'short',          // API: до 4 мин (отфильтруем 60 сек ниже)
      order:          'viewCount',
      q:              query,
      publishedAfter,
      maxResults:     '50',
      key:            API_KEY,
    });
    if (regionCode) searchParams.set('regionCode', regionCode);

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?${searchParams}`;
    const searchRes = await fetch(searchUrl);

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error('YouTube search error:', errText);
      return res.status(searchRes.status).json({
        error: `YouTube API ошибка (search): ${searchRes.status}. Проверь ключ и квоту.`
      });
    }

    const searchData = await searchRes.json();
    const videoIds = (searchData.items || [])
      .map(item => item.id?.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) {
      return res.status(200).json({ results: [] });
    }

    // -------- STEP 2: videos.list — получить статы и длительность --------
    const videosParams = new URLSearchParams({
      part: 'snippet,statistics,contentDetails',
      id:   videoIds.join(','),
      key:  API_KEY,
    });
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?${videosParams}`;
    const videosRes = await fetch(videosUrl);

    if (!videosRes.ok) {
      const errText = await videosRes.text();
      console.error('YouTube videos error:', errText);
      return res.status(videosRes.status).json({
        error: `YouTube API ошибка (videos): ${videosRes.status}`
      });
    }

    const videosData = await videosRes.json();

    // -------- STEP 3: фильтр Shorts (≤ 60 сек) + расчёт виральности --------
    const results = (videosData.items || [])
      .map(v => {
        const durationSec = parseDuration(v.contentDetails?.duration || 'PT0S');
        const views    = parseInt(v.statistics?.viewCount    || 0);
        const likes    = parseInt(v.statistics?.likeCount    || 0);
        const comments = parseInt(v.statistics?.commentCount || 0);

        return {
          id:                  v.id,
          title:               v.snippet?.title || '',
          channel:             v.snippet?.channelTitle || '',
          views,
          likes,
          comments,
          thumbnail_url:       v.snippet?.thumbnails?.maxres?.url
                             || v.snippet?.thumbnails?.high?.url
                             || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
          video_url:           `https://www.youtube.com/shorts/${v.id}`,
          published_days_ago:  daysSince(v.snippet?.publishedAt),
          viral_score:         calcViralScore(views, likes, comments, v.snippet?.publishedAt),
          duration_sec:        durationSec,
          niche_tags:          (v.snippet?.tags || []).slice(0, 3),
        };
      })
      // ставим жёсткий фильтр Shorts — 70 сек чтобы захватить и 60-сек ролики с округлением
      .filter(v => v.duration_sec > 0 && v.duration_sec <= 70)
      // сортируем по виральности
      .sort((a, b) => b.viral_score - a.viral_score)
      // топ 12
      .slice(0, 12);

    return res.status(200).json({ results });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: `Серверная ошибка: ${err.message}` });
  }
}
