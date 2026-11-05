// @ts-nocheck
// Recovered from the Oct 22 compiled build. Cleanup in progress.
import { Platform, Pressable as O, ScrollView as L, StyleSheet as n, Text as S1, View as I1 } from 'react-native';
import t from 'react';






import * as a from 'expo-linear-gradient';
import * as c from '@expo/vector-icons';
import * as f from 'react-native-safe-area-context';
import * as u from './theme';
import * as h from './sports';

export const Onboarding = function({ step, teams, initial, onSignIn, onDone, onCancel }) {
    if (step === 'welcome') {
        return <XComponent teams={teams} onSignIn={onSignIn}/>;
    }
    return <BComponent teams={teams} initial={initial} onDone={onDone} onCancel={onCancel}/>;
};
const y = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
function XComponent({ teams, onSignIn }) {
    const l = f.useSafeAreaInsets();
    const u = teams.length ? teams.map((e)=>e.color) : [
        '#1E4FD8',
        '#C8102E',
        '#0F2439'
    ];
    return <I1 style={{
        flex: 1,
        backgroundColor: '#07090D'
    }}><a.LinearGradient colors={[
        `${u[0]}CC`,
        '#07090D'
    ]} locations={[
        0,
        0.62
    ]} style={n.absoluteFill}/><I1 style={[
        j.welcome,
        {
            paddingTop: l.top + 36,
            paddingBottom: l.bottom + 24
        }
    ]}><I1 style={j.stripes}>{u.slice(0, 3).map((e)=><I1 key={e} style={[
            j.stripe,
            {
                backgroundColor: e
            }
        ]}/>)}</I1><I1 style={{
        flex: 1,
        justifyContent: 'center'
    }}><S1 style={j.brand}>Diehard</S1><S1 style={j.pitch}>Every story, show, highlight and player post on your team. All in one feed.</S1><I1 style={j.facts}>{[
        'News from every outlet',
        'Podcasts and radio shows',
        'Highlights and pressers',
        'Posts from every player'
    ].map((e)=><I1 key={e} style={j.fact}><c.Ionicons name="checkmark" size={15} color="#fff"/><S1 style={j.factText}>{e}</S1></I1>)}</I1></I1><I1 style={{
        gap: 10
    }}>{y ? <><O onPress={()=>onSignIn('google')} style={({ pressed })=>[
            j.btn,
            {
                backgroundColor: '#fff'
            },
            pressed && j.pressed
        ]}><c.Ionicons name="logo-google" size={17} color="#000"/><S1 style={[
        j.btnText,
        {
            color: '#000'
        }
    ]}>Continue with Google</S1></O><O onPress={()=>onSignIn('apple')} style={({ pressed })=>[
            j.btn,
            {
                backgroundColor: '#1A1D24'
            },
            pressed && j.pressed
        ]}><c.Ionicons name="logo-apple" size={19} color="#fff"/><S1 style={[
        j.btnText,
        {
            color: '#fff'
        }
    ]}>Continue with Apple</S1></O></> : <><O onPress={()=>onSignIn('apple')} style={({ pressed })=>[
            j.btn,
            {
                backgroundColor: '#fff'
            },
            pressed && j.pressed
        ]}><c.Ionicons name="logo-apple" size={19} color="#000"/><S1 style={[
        j.btnText,
        {
            color: '#000'
        }
    ]}>Continue with Apple</S1></O><O onPress={()=>onSignIn('google')} style={({ pressed })=>[
            j.btn,
            {
                backgroundColor: '#1A1D24'
            },
            pressed && j.pressed
        ]}><c.Ionicons name="logo-google" size={17} color="#fff"/><S1 style={[
        j.btnText,
        {
            color: '#fff'
        }
    ]}>Continue with Google</S1></O></>}<O onPress={()=>onSignIn('email')} style={({ pressed })=>[
            j.btn,
            j.ghost,
            pressed && j.pressed
        ]}><c.Ionicons name="mail-outline" size={18} color="#fff"/><S1 style={[
        j.btnText,
        {
            color: '#fff'
        }
    ]}>Continue with email</S1></O><S1 style={j.legal}>Unofficial fan app. Not affiliated with any team, school or league. Every story links to the outlet that made it.</S1></I1></I1></I1>;
}
function BComponent({ teams, initial, onDone, onCancel }) {
    const b = u.usePalette();
    const C = f.useSafeAreaInsets();
    const k = teams.filter((t, o)=>teams.findIndex((e)=>h.schoolKey(e) === h.schoolKey(t)) === o);
    const S = (t)=>{
        const o = (e)=>h.SPORTS.findIndex((t)=>t.id === h.sportOf(e.id));
        return teams.filter((e)=>h.schoolKey(e) === h.schoolKey(t)).sort((e, t)=>o(e) - o(t));
    };
    const [w, setW] = t.useState(initial.map((e)=>e.id));
    const z = (e)=>S(e).some((e)=>w.includes(e.id));
    const I = (e)=>{
        const t = S(e).map((e)=>e.id);
        setW((e)=>{
            if (t.some((t)=>e.includes(t))) {
                return e.filter((e)=>!t.includes(e));
            }
            return [
                ...e,
                ...t
            ];
        });
    };
    const F = teams.filter((e)=>w.includes(e.id));
    const length = k.filter(z).length;
    return <I1 style={{
        flex: 1,
        backgroundColor: b.bg
    }}><L contentContainerStyle={{
        paddingTop: C.top + 28,
        paddingHorizontal: 20,
        paddingBottom: 140,
        gap: 10
    }}><I1 style={{
        flexDirection: 'row',
        alignItems: 'center'
    }}><S1 style={[
        j.kicker,
        {
            color: b.muted,
            flex: 1
        }
    ]}>{onCancel ? 'YOUR TEAMS' : 'STEP 2 OF 2'}</S1>{onCancel ? <O onPress={onCancel} hitSlop={12} accessibilityLabel="Close" style={[
        j.close,
        {
            backgroundColor: b.surface2
        }
    ]}><c.Ionicons name="close" size={18} color={b.fg}/></O> : null}</I1><S1 style={[
        j.h1,
        {
            color: b.fg
        }
    ]}>Who are you a diehard for?</S1><S1 style={[
        j.sub,
        {
            color: b.muted
        }
    ]}>Pick your teams, then the sports you follow for each. Only these show up at the top of your feed.</S1><I1 style={{
        gap: 10,
        marginTop: 14
    }}>{k.map((e)=>{
        const t = z(e);
        const l = S(e);
        const backgroundColor = u.headFor(e.color);
        return <I1 key={h.schoolKey(e)} style={[
            j.team,
            {
                backgroundColor: b.surface,
                borderColor: t ? backgroundColor : b.line,
                borderWidth: t ? 2 : n.hairlineWidth
            }
        ]}><O onPress={()=>I(e)} accessibilityRole="checkbox" accessibilityState={{
            checked: t
        }} accessibilityLabel={h.schoolName(e.name)} style={({ pressed })=>[
                j.teamRow,
                pressed && j.pressed
            ]}><I1 style={[
            j.mark,
            {
                backgroundColor
            }
        ]}><S1 style={j.markText}>{e.short.slice(0, 4)}</S1></I1><I1 style={{
            flex: 1,
            minWidth: 0
        }}><S1 style={[
            j.teamName,
            {
                color: b.fg
            }
        ]}>{h.schoolName(e.name)}</S1><S1 style={[
            j.teamMeta,
            {
                color: b.muted
            }
        ]} numberOfLines={1}>{e.conference}</S1></I1><I1 style={[
            j.check,
            {
                backgroundColor: t ? backgroundColor : 'transparent',
                borderColor: t ? backgroundColor : b.line
            }
        ]}>{t && <c.Ionicons name="checkmark" size={16} color="#fff"/>}</I1></O>{t && l.length > 1 ? <I1 style={j.sports}>{l.map((t)=>{
            const l = h.SPORTS.find((e)=>e.id === h.sportOf(t.id));
            const n = w.includes(t.id);
            return <O key={t.id} onPress={()=>{
                e = t.id;
                return setW((t)=>{
                    if (t.includes(e)) {
                        return t.filter((t)=>t !== e);
                    }
                    return [
                        ...t,
                        e
                    ];
                });
                var e;
            }} accessibilityRole="switch" accessibilityState={{
                checked: n
            }} accessibilityLabel={`${h.schoolName(e.name)} ${l?.label ?? ''}`} style={[
                j.sport,
                {
                    backgroundColor: n ? backgroundColor : 'transparent',
                    borderColor: n ? backgroundColor : b.line
                }
            ]}><c.Ionicons name={l?.icon} size={15} color={n ? '#fff' : b.muted}/><S1 style={[
                j.sportText,
                {
                    color: n ? '#fff' : b.muted
                }
            ]}>{l?.label}</S1></O>;
        })}</I1> : null}</I1>;
    })}</I1><S1 style={[
        j.sub,
        {
            color: b.muted,
            marginTop: 12,
            fontSize: 13
        }
    ]}>More teams and sports are on the way. Change your picks anytime from your profile.</S1></L><I1 style={[
        j.bar,
        {
            backgroundColor: b.bg,
            borderTopColor: b.line,
            paddingBottom: C.bottom + 14
        }
    ]}><O disabled={!F.length} onPress={()=>onDone(F)} style={({ pressed })=>[
            j.btn,
            {
                backgroundColor: F.length ? u.BRAND.volt : b.fg,
                opacity: F.length ? pressed ? 0.85 : 1 : 0.35
            }
        ]}><S1 style={[
        j.btnText,
        {
            color: F.length ? u.BRAND.voltInk : b.bg
        }
    ]}>{F.length ? `Build my feed \xb7 ${length} team${length > 1 ? 's' : ''}` : 'Pick at least one team'}</S1></O></I1></I1>;
}
const j = n.create({
    welcome: {
        flex: 1,
        paddingHorizontal: 24
    },
    stripes: {
        flexDirection: 'row',
        gap: 6
    },
    stripe: {
        width: 28,
        height: 6,
        borderRadius: 3
    },
    brand: {
        color: '#fff',
        fontFamily: u.fonts.display,
        fontSize: 64,
        letterSpacing: -2.5,
        lineHeight: 64
    },
    pitch: {
        color: 'rgba(255,255,255,0.86)',
        fontFamily: u.fonts.bodyMedium,
        fontSize: 19,
        lineHeight: 26,
        marginTop: 14,
        maxWidth: 340
    },
    facts: {
        marginTop: 26,
        gap: 10
    },
    fact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    factText: {
        color: 'rgba(255,255,255,0.9)',
        fontFamily: u.fonts.body,
        fontSize: 15
    },
    btn: {
        height: 54,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
    },
    ghost: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)'
    },
    btnText: {
        fontFamily: u.fonts.bodySemi,
        fontSize: 16
    },
    pressed: {
        opacity: 0.85,
        transform: [
            {
                scale: 0.99
            }
        ]
    },
    legal: {
        color: 'rgba(255,255,255,0.5)',
        fontFamily: u.fonts.body,
        fontSize: 11.5,
        lineHeight: 16,
        textAlign: 'center',
        marginTop: 8
    },
    kicker: {
        fontFamily: u.fonts.mono,
        fontSize: 11,
        letterSpacing: 1
    },
    h1: {
        fontFamily: u.fonts.display,
        fontSize: 32,
        lineHeight: 34,
        letterSpacing: -1
    },
    sub: {
        fontFamily: u.fonts.body,
        fontSize: 15,
        lineHeight: 21
    },
    team: {
        padding: 14,
        borderRadius: 18,
        gap: 12
    },
    close: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center'
    },
    teamRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14
    },
    sports: {
        flexDirection: 'row',
        gap: 8,
        paddingLeft: 60
    },
    sport: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 34,
        paddingHorizontal: 14,
        borderRadius: 17,
        borderWidth: 1.5
    },
    sportText: {
        fontFamily: u.fonts.bodySemi,
        fontSize: 14
    },
    mark: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center'
    },
    markText: {
        color: '#fff',
        fontFamily: u.fonts.display,
        fontSize: 11
    },
    teamName: {
        fontFamily: u.fonts.bodySemi,
        fontSize: 16.5
    },
    teamMeta: {
        fontFamily: u.fonts.body,
        fontSize: 13,
        marginTop: 2
    },
    check: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center'
    },
    bar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingTop: 12,
        borderTopWidth: n.hairlineWidth
    }
});
