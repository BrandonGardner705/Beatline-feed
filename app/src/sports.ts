// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
export const withSiblings = function(t, l) {
    const n = new Set(t.map(schoolKey));
    const b = [
        ...t
    ];
    for (const t of l){
        if (n.has(schoolKey(t)) && !b.some((l)=>l.id === t.id)) {
            b.push(t);
        }
    }
    return b;
};
export const SPORTS = [
    {
        id: 'football',
        label: 'Football',
        icon: 'american-football',
        leagues: [
            'college-football',
            'nfl'
        ]
    },
    {
        id: 'basketball',
        label: 'Basketball',
        icon: 'basketball',
        leagues: [
            'mens-college-basketball',
            'nba'
        ]
    }
];
export const leagueOf = (t)=>t.replace(/-\d+$/, '');
export const sportOf = (n)=>SPORTS.find((t)=>t.leagues.includes(leagueOf(n)))?.id ?? 'other';
export const schoolKey = (t)=>`${t.short}|${t.id.match(/(\d+)$/)?.[1] ?? t.id}`;
export const schoolName = (t)=>t.replace(/\s+(Football|Basketball|Men's Basketball|Women's Basketball)$/i, '');
