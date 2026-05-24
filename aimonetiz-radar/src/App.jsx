import React, { useState } from 'react';
import {
  Search, TrendingUp, Eye, ThumbsUp, MessageCircle,
  Calendar, Flame, ExternalLink, Loader2, AlertCircle, Zap
} from 'lucide-react';

// Списки фильтров — должны совпадать с api/search.js
const NICHES = [
  'AI / AI Tools', 'Money / Finance', 'Beauty', 'Fitness',
  'Tech / Gadgets', 'Cooking', 'Lifestyle', 'Education',
  'Gaming', 'Travel', 'Fashion', 'Motivation',
];

const COUNTRIES = [
  'Worldwide', 'USA', 'UK', 'Germany', 'Russia',
  'Spain', 'France', 'Brazil', 'Mexico', 'India', 'Japan',
];

const PERIODS = ['24 hours', '7 days', '30 days'];

function formatNumber(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function getScoreColor(score) {
  if (score >= 80) return 'text-lime-400 border-lime-400/50 bg-lime-400/10';
  if (score >= 60) return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10';
  if (score >= 40) return 'text-orange-400 border-orange-400/50 bg-orange-400/10';
  return 'text-zinc-400 border-zinc-400/50 bg-zinc-400/10';
}

export default function App() {
  const [niche, setNiche]     = useState('AI / AI Tools');
  const [country, setCountry] = useState('Worldwide');
  const [period, setPeriod]   = useState('7 days');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setResults([]);

    try {
      const response = await fetch('/api/search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ niche, country, period }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Ошибка ${response.status}. Попробуй ещё раз.`);
        return;
      }

      if (!data.results || data.results.length === 0) {
        setError('Пусто. Попробуй сменить нишу, страну или период.');
      } else {
        setResults(data.results);
      }
    } catch (err) {
      console.error(err);
      setError(`Ошибка сети: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ---------- HEADER ---------- */}
      <header className="border-b border-zinc-900 bg-gradient-to-b from-zinc-950 to-black">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-lime-400 to-emerald-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-black" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight">aimonetiz</span>
                <span className="text-xs text-zinc-500 font-mono">/ radar</span>
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                Залетающие Shorts в реальном времени
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            LIVE · YouTube Data API
          </div>
        </div>
      </header>

      {/* ---------- FILTERS ---------- */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">
                Ниша
              </label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm hover:border-zinc-700 focus:border-lime-400 focus:outline-none transition-colors"
              >
                {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">
                Страна
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm hover:border-zinc-700 focus:border-lime-400 focus:outline-none transition-colors"
              >
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 font-medium uppercase tracking-wider">
                Период
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm hover:border-zinc-700 focus:border-lime-400 focus:outline-none transition-colors"
              >
                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-bold py-2.5 rounded-lg hover:from-lime-300 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ищу...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" strokeWidth={2.5} />
                    Найти залётыши
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* ---------- STATUS ---------- */}
        {hasSearched && !loading && results.length > 0 && (
          <div className="flex items-center gap-2 mt-4 text-xs text-zinc-500">
            <TrendingUp className="w-3.5 h-3.5 text-lime-400" />
            <span>Найдено {results.length} залетающих Shorts</span>
            <span className="text-zinc-700">·</span>
            <span className="font-mono">{niche} / {country} / {period}</span>
          </div>
        )}

        {/* ---------- ERROR ---------- */}
        {error && (
          <div className="mt-6 bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-300">{error}</div>
          </div>
        )}

        {/* ---------- LOADING SKELETON ---------- */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[9/16] bg-zinc-900" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-zinc-900 rounded w-3/4" />
                  <div className="h-3 bg-zinc-900 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------- RESULTS GRID ---------- */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {results.map((video, idx) => (
              <a
                key={video.id || idx}
                href={video.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[9/16] bg-zinc-900 overflow-hidden">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <Eye className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-mono font-bold">
                    #{idx + 1}
                  </div>
                  {video.viral_score !== undefined && (
                    <div className={`absolute top-3 right-3 backdrop-blur-sm border rounded-md px-2 py-1 text-xs font-bold flex items-center gap-1 ${getScoreColor(video.viral_score)}`}>
                      <Flame className="w-3 h-3" />
                      {video.viral_score}
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-mono flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatNumber(video.views)}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-lime-400 transition-colors">
                    {video.title}
                  </h3>
                  <div className="text-xs text-zinc-500">@{video.channel}</div>

                  <div className="flex items-center gap-3 pt-2 text-xs text-zinc-400 font-mono">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      {formatNumber(video.likes)}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      {formatNumber(video.comments)}
                    </div>
                    {video.published_days_ago !== undefined && (
                      <div className="flex items-center gap-1 ml-auto text-zinc-600">
                        <Calendar className="w-3 h-3" />
                        {video.published_days_ago === 0 ? 'сегодня' : `${video.published_days_ago}д назад`}
                      </div>
                    )}
                  </div>

                  {video.niche_tags && video.niche_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2">
                      {video.niche_tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="text-[10px] bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* ---------- EMPTY STATE ---------- */}
        {!loading && !hasSearched && (
          <div className="mt-12 text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-900 mb-4">
              <TrendingUp className="w-7 h-7 text-zinc-700" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Найди залетающие Shorts</h2>
            <p className="text-sm text-zinc-500 max-w-md mx-auto">
              Выбери нишу и страну — увидишь самые виральные короткие видео на YouTube за выбранный период.
              Используй для инсайтов под свой контент.
            </p>
          </div>
        )}

        {/* ---------- FOOTER ---------- */}
        <footer className="mt-16 pt-8 border-t border-zinc-900 pb-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <div>
            <span className="font-mono">aimonetiz / radar</span> · находи тренды быстрее конкурентов
          </div>
          <div className="font-mono">data: YouTube Data API v3</div>
        </footer>

      </main>
    </div>
  );
}
