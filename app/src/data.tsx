// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
export const timeAgo = function(t) {
    const o = Math.max(1, Math.round((Date.now() - t) / 60000));
    if (o < 60) {
        return `${o}m`;
    }
    const a = Math.round(o / 60);
    if (a < 24) {
        return `${a}h`;
    }
    return `${Math.round(a / 24)}d`;
};
export const initials = function(t) {
    return t.replace(/[^A-Za-z0-9 ]/g, ' ').split(' ').filter(Boolean).map((t)=>t[0]).join('').slice(0, 2).toUpperCase();
};
export const sourceColor = function(o) {
    if (/youtube/i.test(o)) {
        return '#D62020';
    }
    let a = 0;
    for (const t of o){
        a = 31 * a + t.charCodeAt(0) >>> 0;
    }
    return t[a % t.length];
};
export const countdown = function(t, o, a = "kickoff") {
    if (o === 'in') {
        return [
            'LIVE',
            'now'
        ];
    }
    if (!t) {
        return [
            '—',
            'schedule TBA'
        ];
    }
    const r = t - Date.now();
    if (r <= 0) {
        return [
            'LIVE',
            'now'
        ];
    }
    const n = Math.floor(r / 86400000);
    const s = Math.floor(r % 86400000 / 3600000);
    const i = Math.floor(r % 3600000 / 60000);
    return [
        n > 0 ? `${n}d ${s}h` : `${s}h ${String(i).padStart(2, '0')}m`,
        `to ${a}`
    ];
};
export const waveFor = function(t, length = 40) {
    let a = 0;
    for (const o of t){
        a = 31 * a + o.charCodeAt(0) | 0;
    }
    const n = r(a);
    return Array.from({
        length
    }, ()=>n());
};
const t = [
    '#1B1B1B',
    '#0F5BB5',
    '#7A1F1F',
    '#2E5E3E',
    '#6E3CD6',
    '#B4561B',
    '#3A4A63',
    '#0E7C86',
    '#8A2B6B'
];
function o(t, o, a = 0) {
    const r = new Date;
    const n = ((6 - r.getDay() + 7) % 7 || 7) + a;
    r.setDate(r.getDate() + n);
    r.setHours(t, o, 0, 0);
    return r.getTime();
}
const a = [
    {
        id: 'byu',
        short: 'BYU',
        name: 'BYU Football',
        city: 'Provo',
        color: '#0062B8',
        record: '6-0',
        conference: 'Big 12',
        standing: '1st in Big 12',
        mode: 'tuned',
        opponent: 'Conference opponent',
        kickoff: o(13, 30),
        roster: [
            [
                'Jake Rowan',
                'QB',
                12
            ],
            [
                'Malik Fonoti',
                'RB',
                24
            ],
            [
                'Tai Maka',
                'WR',
                1
            ],
            [
                'Cole Brandt',
                'LB',
                44
            ],
            [
                'Isaiah Vea',
                'DE',
                91
            ],
            [
                'Sam Holt',
                'K',
                38
            ]
        ],
        pods: [
            'Cougar Sports with Ben Criddle',
            'Locked On Cougars',
            'Y\'s Guys'
        ]
    },
    {
        id: 'utah',
        short: 'UTAH',
        name: 'Utah Football',
        city: 'Salt Lake City',
        color: '#CC0000',
        record: '5-1',
        conference: 'Big 12',
        standing: '3rd in Big 12',
        mode: 'tuned',
        opponent: 'Conference opponent',
        kickoff: o(20, 0),
        roster: [
            [
                'Devin Kaufusi',
                'QB',
                7
            ],
            [
                'Marcus Hill',
                'RB',
                22
            ],
            [
                'Trey Nakoa',
                'WR',
                5
            ],
            [
                'Logan Petty',
                'LB',
                33
            ],
            [
                'Ezra Moa',
                'DT',
                95
            ],
            [
                'Nick Lowe',
                'S',
                2
            ]
        ],
        pods: [
            'Locked On Utes',
            'Crimson Corner',
            'Utah Man Podcast'
        ]
    },
    {
        id: 'usu',
        short: 'USU',
        name: 'Utah State Football',
        city: 'Logan',
        color: '#0F2439',
        record: '3-3',
        conference: 'Pac-12',
        standing: 'Pac-12',
        mode: 'tuned',
        opponent: 'Pac-12 opponent',
        kickoff: o(17, 0),
        roster: [
            [
                'Brody Lund',
                'QB',
                9
            ],
            [
                'Kobe Reese',
                'RB',
                20
            ],
            [
                'Dane Fifita',
                'WR',
                4
            ],
            [
                'Tyler Ash',
                'LB',
                31
            ],
            [
                'Mason Kofe',
                'DE',
                90
            ]
        ],
        pods: [
            'The Aggship Podcast',
            'The Scotsman',
            'Aggies All the Way'
        ]
    }
];
function r(t) {
    let o = t;
    return ()=>{
        o = Math.imul(o ^ o >>> 15, 2246822507) + 1831565813 | 0;
        return (o >>> 0) / 4294967296;
    };
}
function n(t) {
    const o = t.roster.map((t)=>t[0]);
    const items = [
        {
            kind: 'news',
            source: 'Deseret News',
            title: `${o[0]} sharpens timing with receivers ahead of the weekend`,
            summary: 'Coaches say the passing game took a step this week, with more quick throws on early downs.',
            url: 'https://www.deseret.com/sports',
            at: 22,
            players: [
                o[0],
                o[2]
            ]
        },
        {
            kind: 'video',
            source: 'KSL Sports',
            title: `Every touch from ${o[1]} last Saturday`,
            url: 'https://www.youtube.com',
            duration: '6:41',
            at: 48,
            players: [
                o[1]
            ]
        },
        {
            kind: 'pod',
            source: t.pods[0],
            show: t.pods[0],
            title: 'Is the defense for real? Breaking down the last three weeks',
            url: 'https://podcasts.apple.com',
            duration: '52 min',
            at: 95,
            players: [
                o[3],
                o[4]
            ]
        },
        {
            kind: 'news',
            source: 'KSL.com',
            title: `Injury report: ${o[4] ?? o[2]} expected to practice Wednesday`,
            summary: 'Listed as day-to-day. The staff expects a full go by the weekend.',
            url: 'https://kslsports.com',
            at: 130,
            players: [
                o[4] ?? o[2]
            ]
        },
        {
            kind: 'social',
            source: `${o[0]} on Instagram`,
            title: 'Locked in for Saturday. Appreciate everyone who showed up this week.',
            url: 'https://instagram.com',
            at: 160,
            players: [
                o[0]
            ]
        },
        {
            kind: 'radio',
            source: 'KSL NewsRadio',
            show: 'Coach\'s Show',
            title: 'Head coach Q&A: game plan, depth chart and travel',
            url: 'https://kslnewsradio.com',
            duration: '18 min',
            at: 190,
            players: []
        },
        {
            kind: 'news',
            source: 'Salt Lake Tribune',
            title: `Analysis: why ${t.city} crowds are louder than ever this season`,
            summary: 'Attendance and noise numbers are up, and players say it shows up on third down.',
            url: 'https://www.sltrib.com/sports',
            at: 260,
            players: []
        },
        {
            kind: 'video',
            source: `${t.short} Athletics`,
            title: `Postgame presser: ${o[3]} on the late stop`,
            url: 'https://www.youtube.com',
            duration: '11:05',
            at: 330,
            players: [
                o[3]
            ]
        },
        {
            kind: 'news',
            source: t.id === 'usu' ? 'Herald Journal' : 'Daily Herald',
            title: `Recruiting: ${t.short} lands a commitment from an in-state prospect`,
            summary: `A three-star prospect picked ${t.short} over two other offers.`,
            url: 'https://www.hjnews.com/sports',
            at: 410,
            players: []
        },
        {
            kind: 'pod',
            source: t.pods[1] ?? t.pods[0],
            show: t.pods[1] ?? t.pods[0],
            title: `${o[0]} mailbag: your questions on the offense`,
            url: 'https://podcasts.apple.com',
            duration: '38 min',
            at: 540,
            players: [
                o[0]
            ]
        },
        {
            kind: 'news',
            source: 'On3',
            title: 'Five things we learned this week',
            summary: `Depth at receiver, a kicker battle, and why ${o[1]} could see more snaps.`,
            url: 'https://www.on3.com',
            at: 700,
            players: [
                o[1]
            ]
        },
        {
            kind: 'pod',
            source: t.pods[2] ?? t.pods[0],
            show: t.pods[2] ?? t.pods[0],
            title: 'Film room: the three plays that decided last week',
            url: 'https://podcasts.apple.com',
            duration: '44 min',
            at: 1500,
            players: [
                o[0],
                o[1]
            ]
        }
    ].map((o, a)=>({
            ...o,
            id: `${t.id}-s${a}`,
            team: t.id,
            at: Date.now() - 60000 * o.at
        }));
    return {
        team: {
            id: t.id,
            short: t.short,
            name: t.name,
            city: t.city,
            color: t.color,
            record: t.record,
            standing: t.standing,
            conference: t.conference,
            mode: t.mode,
            next: {
                opponent: t.opponent,
                date: t.kickoff,
                home: true
            }
        },
        brief: [
            `${o[0]} and the passing game are the story of the week after a strong practice stretch.`,
            `${o[4] ?? o[2]} is day-to-day but expected to play this weekend.`,
            `${items.filter((t)=>t.kind === 'pod').length} new podcast episodes and ${items.filter((t)=>t.kind === 'video').length} highlight videos since yesterday.`
        ],
        players: t.roster.map(([t, pos, num])=>{
            return {
                name: t,
                pos,
                num,
                mentions: (s = t, items.filter((t)=>t.players.includes(s)).length),
                socials: t === o[0] ? [
                    {
                        platform: 'Instagram',
                        url: 'https://instagram.com'
                    },
                    {
                        platform: 'X',
                        url: 'https://x.com'
                    }
                ] : []
            };
            var s;
        }).sort((t, o)=>o.mentions - t.mentions),
        items,
        sources: new Set(items.map((t)=>t.source)).size,
        updatedAt: Date.now()
    };
}
function s(id, short, name, city, color, i, pods) {
    return {
        id,
        short,
        name,
        city,
        color,
        conference: i,
        standing: i,
        record: '4-2',
        mode: 'auto',
        opponent: 'League opponent',
        kickoff: o(14, 0),
        roster: [
            [
                'Alex Carter',
                'QB',
                8
            ],
            [
                'Jordan Miles',
                'RB',
                21
            ],
            [
                'Chris Tate',
                'WR',
                3
            ],
            [
                'Devon Reed',
                'LB',
                52
            ],
            [
                'Sam Ortiz',
                'DE',
                97
            ]
        ],
        pods
    };
}
const i = {
    'College Football': [
        s('boise', 'BSU', 'Boise State Football', 'Boise', '#0033A0', 'Mountain West', [
            'Bronco Nation Pod'
        ]),
        s('wash', 'UW', 'Washington Football', 'Seattle', '#4B2E83', 'Big Ten', [
            'Husky Hour'
        ])
    ],
    NBA: [
        s('lakers', 'LAL', 'Los Angeles Lakers', 'Los Angeles', '#552583', 'Pacific Division', [
            'Lakers Daily'
        ])
    ],
    'Premier League': [
        s('ars', 'ARS', 'Arsenal', 'London', '#C8102E', 'Premier League', [
            'Arsenal Talk'
        ]),
        s('liv', 'LIV', 'Liverpool', 'Liverpool', '#C8102E', 'Premier League', [
            'Anfield Wrap Up'
        ])
    ]
};
const l = [
    ...a,
    ...Object.values(i).flat()
];
export const SAMPLE = Object.fromEntries(l.map((t)=>[
        t.id,
        n(t)
    ]));
export const SAMPLE_TEAM_LIST = a.map((t)=>SAMPLE[t.id].team);
export const SAMPLE_LEAGUES = [
    {
        id: 'college-football',
        name: 'College Football',
        teams: [
            SAMPLE.byu.team,
            SAMPLE.utah.team,
            SAMPLE.usu.team,
            ...i['College Football'].map((t)=>SAMPLE[t.id].team)
        ]
    },
    {
        id: 'nba',
        name: 'NBA',
        teams: i.NBA.map((t)=>SAMPLE[t.id].team)
    },
    {
        id: 'premier-league',
        name: 'Premier League',
        teams: i['Premier League'].map((t)=>SAMPLE[t.id].team)
    }
];
export const MORE_TEAMS = [
    {
        name: 'Weber State Football',
        color: '#5B2A86'
    },
    {
        name: 'Real Salt Lake',
        color: '#B3123A'
    },
    {
        name: 'Utah Mammoth',
        color: '#2A6E8C'
    },
    {
        name: 'BYU Basketball',
        color: '#0062B8'
    },
    {
        name: 'Utah Basketball',
        color: '#CC0000'
    },
    {
        name: 'Utah State Basketball',
        color: '#0F2439'
    },
    {
        name: 'Southern Utah',
        color: '#A6192E'
    },
    {
        name: 'Utah Valley',
        color: '#2F6B3A'
    }
];
