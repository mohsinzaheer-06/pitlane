import {useEffect, useState} from 'react';
import {Calendar, ExternalLink, RefreshCw, Trophy} from 'lucide-react';
import {useApp} from '../context/AppContext';

export function RacingCentrePage() {
  const {user, showToast} = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'standings' | 'calendar' | 'results' | 'news'>('standings');
  const [countdown, setCountdown] = useState('');

  const loadOverview = () => {
    setLoading(true);
    fetch('/api/racing/overview')
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const nextRace = data?.racing?.nextRace;
  useEffect(() => {
    if (!nextRace?.sessions?.race) {
      setCountdown('');
      return;
    }
    const update = () => {
      const target = Date.parse(nextRace.sessions.race);
      const diff = target - Date.now();
      if (Number.isNaN(diff) || diff <= 0) {
        setCountdown('Session Underway / Completed');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${d}D ${String(h).padStart(2, '0')}H ${String(m).padStart(2, '0')}M`);
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [nextRace]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/racing/sync', {method: 'POST'});
      const resData = await res.json();
      if (res.ok) {
        setData((prev: any) => ({...prev, racing: resData.racing}));
        showToast(`Synced F1 feed (${resData.racing.syncStatus})`);
      } else {
        showToast(resData.error || 'Sync failed');
      }
    } finally {
      setSyncing(false);
    }
  };

  const racing = data?.racing;
  const articles = data?.articles || [];

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-10">
      {/* Header & Data Freshness Banner */}
      <div className="pb-6 border-b border-[#27272A] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="font-mono-tabular text-xs uppercase tracking-widest text-[#EF2929]">
            PITLANE Racing Centre · Independent Motorsport Hub
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-white uppercase mt-1">
            Formula 1 Season Telemetry
          </h1>
          <p className="text-xs font-mono-tabular text-[#71717A] mt-2">
            Source: {racing?.provider || 'Jolpica F1 Data Feed'} · Status:{' '}
            <span className="text-white">{racing?.syncStatus || 'LOADING'}</span>
            {racing?.lastSyncedAt && ` · Last Updated: ${new Date(racing.lastSyncedAt).toLocaleString()}`}
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncing}
            className="h-11 px-5 bg-[#181A1D] border border-[#27272A] hover:border-[#EF2929] text-white font-mono-tabular text-xs uppercase flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing Feed...' : 'Sync F1 Feed'}</span>
          </button>
        )}
      </div>

      {racing?.errorMessage && (
        <div className="mt-6 bg-[#181A1D] border border-[#EF2929] p-4 text-xs font-mono-tabular text-[#C6C6C7]">
          {racing.errorMessage}
        </div>
      )}

      {/* Next Grand Prix & Reigning Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        <div className="lg:col-span-6 bg-[#181A1D] border border-[#27272A] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono-tabular text-[#71717A]">
              <span>UPCOMING GRAND PRIX</span>
              {nextRace && (
                <span className="text-[#EF2929] font-semibold">
                  ROUND {nextRace.round} · {nextRace.status}
                </span>
              )}
            </div>
            {nextRace ? (
              <>
                <h2 className="font-display text-3xl text-white uppercase mt-2">
                  {nextRace.raceName}
                </h2>
                <p className="text-sm text-[#C6C6C7] mt-1">
                  {nextRace.circuitName} — {nextRace.locality}, {nextRace.country}
                </p>
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#27272A] text-xs font-mono-tabular">
                  <div>
                    <span className="text-[#71717A] block">Date</span>
                    <span className="text-white">{nextRace.date}</span>
                  </div>
                  <div>
                    <span className="text-[#71717A] block">Lights Out (UTC)</span>
                    <span className="text-white">{nextRace.time}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#71717A] block">Countdown</span>
                    <span className="text-[#EF2929] font-semibold">{countdown || 'Scheduled'}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-[#71717A] mt-4">
                No upcoming race schedule currently cached.
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#181A1D] border border-[#27272A] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono-tabular text-[#71717A]">
              <span>DRIVERS LEADER</span>
              <Trophy className="w-4 h-4 text-[#EF2929]" />
            </div>
            {racing?.reigningDriverChampion ? (
              <>
                <p className="font-display text-3xl text-white uppercase mt-3">
                  {racing.reigningDriverChampion.driverName}
                </p>
                <p className="text-xs text-[#C6C6C7] mt-1">
                  {racing.reigningDriverChampion.constructorName} ·{' '}
                  {racing.reigningDriverChampion.nationality}
                </p>
              </>
            ) : (
              <p className="text-xs text-[#71717A] mt-3">Awaiting standings feed</p>
            )}
          </div>
          {racing?.reigningDriverChampion && (
            <p className="font-mono-tabular text-sm font-semibold text-[#EF2929] mt-4">
              {racing.reigningDriverChampion.points} PTS · {racing.reigningDriverChampion.wins} WINS
            </p>
          )}
        </div>

        <div className="lg:col-span-3 bg-[#181A1D] border border-[#27272A] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono-tabular text-[#71717A]">
              <span>CONSTRUCTORS LEADER</span>
              <Calendar className="w-4 h-4 text-[#EF2929]" />
            </div>
            {racing?.reigningConstructorChampion ? (
              <>
                <p className="font-display text-3xl text-white uppercase mt-3">
                  {racing.reigningConstructorChampion.constructorName}
                </p>
                <p className="text-xs text-[#C6C6C7] mt-1">
                  {racing.reigningConstructorChampion.nationality}
                </p>
              </>
            ) : (
              <p className="text-xs text-[#71717A] mt-3">Awaiting constructor feed</p>
            )}
          </div>
          {racing?.reigningConstructorChampion && (
            <p className="font-mono-tabular text-sm font-semibold text-[#EF2929] mt-4">
              {racing.reigningConstructorChampion.points} PTS ·{' '}
              {racing.reigningConstructorChampion.wins} WINS
            </p>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-10 flex flex-wrap gap-1 bg-[#090A0B] p-1 border border-[#27272A] w-fit">
        {[
          {id: 'standings' as const, label: 'Championship Standings'},
          {id: 'calendar' as const, label: 'Race Calendar'},
          {id: 'results' as const, label: 'Latest Race & Qualifying'},
          {id: 'news' as const, label: `Editorial & News (${articles.length})`},
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-xs font-mono-tabular uppercase transition-colors ${
              activeTab === t.id ? 'bg-[#EF2929] text-white font-semibold' : 'text-[#C6C6C7] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 h-72 bg-[#181A1D] border border-[#27272A] animate-pulse" />
      ) : (
        <div className="mt-6">
          {activeTab === 'standings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-[#181A1D] border border-[#27272A] overflow-x-auto">
                <div className="px-5 py-4 border-b border-[#27272A]">
                  <h3 className="font-display text-2xl text-white uppercase">
                    Drivers&apos; Championship ({racing?.season})
                  </h3>
                </div>
                {racing?.driverStandings?.length > 0 ? (
                  <table className="w-full text-left font-mono-tabular text-xs">
                    <thead className="border-b border-[#27272A] text-[#71717A]">
                      <tr>
                        <th className="py-3 px-4">Pos</th>
                        <th className="py-3 px-4">Driver</th>
                        <th className="py-3 px-4">Team</th>
                        <th className="py-3 px-4 text-right">Wins</th>
                        <th className="py-3 px-4 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A]">
                      {racing.driverStandings.map((d: any) => (
                        <tr key={d.driverName} className="hover:bg-[#111315]">
                          <td className="py-3 px-4 text-[#EF2929] font-semibold">P{d.position}</td>
                          <td className="py-3 px-4 text-white font-sans font-medium">{d.driverName}</td>
                          <td className="py-3 px-4 text-[#C6C6C7]">{d.constructorName}</td>
                          <td className="py-3 px-4 text-right text-[#C6C6C7]">{d.wins}</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{d.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-6 text-xs text-[#71717A]">No live standings data cached yet.</p>
                )}
              </div>

              <div className="lg:col-span-5 bg-[#181A1D] border border-[#27272A] overflow-x-auto">
                <div className="px-5 py-4 border-b border-[#27272A]">
                  <h3 className="font-display text-2xl text-white uppercase">
                    Constructors&apos; Championship
                  </h3>
                </div>
                {racing?.constructorStandings?.length > 0 ? (
                  <table className="w-full text-left font-mono-tabular text-xs">
                    <thead className="border-b border-[#27272A] text-[#71717A]">
                      <tr>
                        <th className="py-3 px-4">Pos</th>
                        <th className="py-3 px-4">Constructor</th>
                        <th className="py-3 px-4 text-right">Wins</th>
                        <th className="py-3 px-4 text-right">Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A]">
                      {racing.constructorStandings.map((c: any) => (
                        <tr key={c.constructorName} className="hover:bg-[#111315]">
                          <td className="py-3 px-4 text-[#EF2929] font-semibold">P{c.position}</td>
                          <td className="py-3 px-4 text-white font-sans font-medium">{c.constructorName}</td>
                          <td className="py-3 px-4 text-right text-[#C6C6C7]">{c.wins}</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{c.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-6 text-xs text-[#71717A]">No constructor standings cached yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="bg-[#181A1D] border border-[#27272A] overflow-x-auto">
              <table className="w-full text-left font-mono-tabular text-xs">
                <thead className="border-b border-[#27272A] text-[#71717A]">
                  <tr>
                    <th className="py-3 px-4">Round</th>
                    <th className="py-3 px-4">Grand Prix</th>
                    <th className="py-3 px-4">Circuit</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]">
                  {(racing?.calendar || []).map((r: any) => (
                    <tr key={r.round} className="hover:bg-[#111315]">
                      <td className="py-3 px-4 text-[#71717A]">R{String(r.round).padStart(2, '0')}</td>
                      <td className="py-3 px-4 text-white font-sans font-medium">{r.raceName}</td>
                      <td className="py-3 px-4 text-[#C6C6C7]">
                        {r.circuitName} ({r.country})
                      </td>
                      <td className="py-3 px-4 text-[#C6C6C7]">{r.date}</td>
                      <td
                        className={`py-3 px-4 font-semibold ${
                          r.status === 'LIVE'
                            ? 'text-[#EF2929]'
                            : r.status === 'UPCOMING'
                              ? 'text-white'
                              : 'text-[#71717A]'
                        }`}
                      >
                        {r.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-[#181A1D] border border-[#27272A] overflow-x-auto">
                <div className="px-5 py-4 border-b border-[#27272A]">
                  <h3 className="font-display text-2xl text-white uppercase">
                    {racing?.latestResult
                      ? `Round ${racing.latestResult.round}: ${racing.latestResult.raceName}`
                      : 'Latest Grand Prix Classification'}
                  </h3>
                </div>
                {racing?.latestResult?.podium?.length > 0 ? (
                  <table className="w-full text-left font-mono-tabular text-xs">
                    <thead className="border-b border-[#27272A] text-[#71717A]">
                      <tr>
                        <th className="py-3 px-4">Pos</th>
                        <th className="py-3 px-4">Driver</th>
                        <th className="py-3 px-4">Constructor</th>
                        <th className="py-3 px-4">Time / Gap</th>
                        <th className="py-3 px-4 text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272A]">
                      {racing.latestResult.podium.map((row: any) => (
                        <tr key={row.position} className="hover:bg-[#111315]">
                          <td className="py-3 px-4 text-[#EF2929] font-semibold">P{row.position}</td>
                          <td className="py-3 px-4 text-white font-sans font-medium">{row.driverName}</td>
                          <td className="py-3 px-4 text-[#C6C6C7]">{row.constructorName}</td>
                          <td className="py-3 px-4 text-[#C6C6C7]">{row.timeOrStatus}</td>
                          <td className="py-3 px-4 text-right text-white">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-6 text-xs text-[#71717A]">No recent race classification cached.</p>
                )}
              </div>

              <div className="lg:col-span-4 bg-[#181A1D] border border-[#27272A] p-5">
                <h3 className="font-display text-2xl text-white uppercase border-b border-[#27272A] pb-3">
                  Qualifying Top 3
                </h3>
                <div className="mt-4 space-y-3">
                  {(racing?.latestResult?.qualifyingTop3 || []).map((q: any) => (
                    <div key={q.position} className="border-b border-[#27272A] pb-3 flex justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white">
                          P{q.position} · {q.driverName}
                        </p>
                        <p className="text-[#71717A]">{q.constructorName}</p>
                      </div>
                      <span className="font-mono-tabular text-[#EF2929]">{q.q3}</span>
                    </div>
                  ))}
                  {(!racing?.latestResult?.qualifyingTop3 ||
                    racing.latestResult.qualifyingTop3.length === 0) && (
                    <p className="text-xs text-[#71717A]">Qualifying times unavailable.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.map((art: any) => (
                <article
                  key={art.id}
                  className="bg-[#181A1D] border border-[#27272A] flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[16/9] bg-[#090A0B] border-b border-[#27272A] overflow-hidden">
                      <img
                        src={art.image_url}
                        alt={art.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <p className="font-mono-tabular text-[11px] uppercase text-[#EF2929]">
                        {art.category} · {art.source_name}
                      </p>
                      <h3 className="text-lg font-semibold text-white mt-2">{art.title}</h3>
                      <p className="text-xs text-[#C6C6C7] mt-2 leading-relaxed">{art.content}</p>
                    </div>
                  </div>
                  {art.source_url && (
                    <div className="px-5 pb-5">
                      <a
                        href={art.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono-tabular text-xs uppercase text-white hover:text-[#EF2929]"
                      >
                        <span>Original Source</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
