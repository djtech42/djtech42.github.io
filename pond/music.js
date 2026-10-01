// Lily Leap music: one song per level theme, plus the title and the heron fight.
// Everything is synthesized by the sequencer in game.js; nothing here is audio.
//
// A song loops over its chords, one entry per bar. A bar can hold two chords ('Dm7 G7')
// and they split it evenly. Chords: C, Cm, C7, Cmaj7, Cm7, Csus4, Csus2, Cdim, C6, Cadd9.
//
//   bpm    beats per minute       steps  steps per bar      beat   steps per beat
//   swing  0..1, delays every other step a little           echo   { time, feedback, mix }
//   volume relative loudness (default 1)
//
//   bpmPerHit  (heron fight) how much faster it gets each time the heron is hit
//
// Parts (each names an instrument from INSTRUMENTS in game.js, and an optional volume):
//   notes    a melody over the whole loop. One token per step: a note (C5, F#4, Bb3),
//            '-' to hold the previous note, '.' for silence. '|' is ignored (bar lines).
//   bass     one bar, repeated: R root, 3 third, 5 fifth, 7 seventh, 8 octave, L fifth below
//   arp      one bar, repeated: 1, 2, 3... climb through the chord's notes
//   stab     one bar, repeated: x plays the whole chord
//   pad      the chord held for as long as it lasts
//   drums    { kick, snare, hat, wood, shaker, tom }: one bar each, x hit, o soft hit
//
// A pattern may also be a list of bars, used in turn (e.g. three plain bars and a fill).
// `loops: [1, 0]` plays a part on every other pass through the song. In the heron fight,
// `from: n` holds a part back until the fight's intensity reaches n: 0 while you read the
// signpost, 1 once the fight starts, then one more for each hit the heron has taken.

window.SONGS = {
  // The title theme. Its opening, a hop up a fifth then a skip back down, is the frog's
  // motif, and it comes back in Lily Meadow and (in minor) against the heron.
  title: {
    bpm: 112, steps: 8, beat: 2, swing: 0.12,
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'F', 'C', 'Dm7', 'G', 'F', 'C', 'Dm7 G7', 'C'],
    parts: {
      lead: { inst: 'lead', notes: `
        C5 . G5 - - . E5 D5 | C5 - A4 - - . . .  | A4 . F5 - - . E5 D5 | D5 - - - B4 . . .
        C5 . G5 - - . A5 G5 | E5 - C5 - - . D5 E5 | F5 . E5 . D5 . C5 . | D5 - - - - - . .
        A5 - G5 - F5 - E5 - | G5 - - - E5 - C5 -  | F5 - E5 - D5 - C5 - | B4 - - - G4 - . .
        A4 . C5 . F5 - - E5 | E5 - G5 - - . E5 -  | D5 - F5 - B4 - D5 - | C5 - - - - - . .` },
      bass: { inst: 'bass', bass: 'R . 5 . 8 . 5 .' },
      pad: { inst: 'pad', pad: true, vol: 0.8 },
      drums: { drums: { kick: 'x . . . x . . .', snare: '. . o . . . o .', hat: '. x . x . x . x' } },
    },
  },

  // Lily Meadow and the tutorial: bright and hoppy, a marimba-ish pluck.
  meadow: {
    bpm: 128, steps: 8, beat: 2, swing: 0.15,
    chords: ['F', 'C', 'Dm', 'Bb C', 'F', 'C', 'Bb', 'C', 'Bb', 'F', 'Gm7', 'C', 'Dm', 'Bb', 'Gm7 C', 'F'],
    parts: {
      lead: { inst: 'pluck', notes: `
        C5 . F5 . A5 . F5 .  | G5 . E5 . C5 - . .  | D5 . F5 . A5 . D6 . | Bb5 - A5 . G5 - E5 .
        F5 . C5 . F5 . A5 .  | G5 - - . E5 . G5 .  | F5 . D5 . Bb4 . D5 . | E5 - - - C5 . . .
        D5 - F5 - Bb5 - A5 G5 | A5 - - - F5 . . .  | G5 . Bb5 . A5 . G5 . | E5 . G5 . C6 - - .
        A5 . F5 . D5 . F5 .  | D5 . Bb4 . D5 . F5 . | G5 - F5 - E5 - G5 - | F5 - - . C5 . . .` },
      bells: { inst: 'bell', vol: 0.35, loops: [0, 1], notes: `
        . . . . . . . .  | . . . . . . . .  | . . . . . . . . | . . . . . . . .
        . . . . . . . .  | . . . . . . . .  | . . . . . . . . | . . . . . . . .
        F5 - - - - - - - | C5 - - - - - - -  | Bb4 - - - - - - - | C5 - - - - - - -
        F5 - - - - - - - | D5 - - - - - - -  | Bb4 - - - C5 - - - | A4 - - - - - - -` },
      bass: { inst: 'bass', bass: 'R . R . 5 . R .' },
      pad: { inst: 'pad', pad: true, vol: 0.6 },
      drums: { drums: {
        kick: 'x . . . x . . .',
        snare: ['. . o . . . o .', '. . o . . . o .', '. . o . . . o .', '. . o . . o o o'],
        hat: '. x . x . x . x',
      } },
    },
  },

  // Mushroom Grove: an autumn jig in 6/8, woodblock and a reedy lead.
  autumn: {
    volume: 0.85, bpm: 92, steps: 6, beat: 3,
    chords: ['Dm', 'C', 'Dm', 'Am', 'Dm', 'C', 'Bb', 'A', 'F', 'C', 'Dm', 'Am', 'Bb', 'C', 'Dm A', 'Dm'],
    parts: {
      lead: { inst: 'reed', notes: `
        D5 - E5 F5 - D5 | E5 - C5 G4 - . | D5 - E5 F5 - A5 | E5 - - - - .
        F5 - G5 A5 - F5 | G5 - E5 C5 - E5 | D5 - C5 Bb4 - D5 | C#5 - - A4 - .
        A5 - G5 F5 - A5 | G5 - E5 C5 - E5 | F5 - E5 D5 - F5 | E5 - - C5 - .
        D5 - F5 Bb5 - F5 | E5 - G5 C6 - G5 | F5 - D5 E5 - C#5 | D5 - - - - .` },
      bass: { inst: 'bass', bass: 'R . 5 8 . 5' },
      stab: { inst: 'pluck', stab: '. . . x . .', vol: 0.45 },
      drums: { drums: {
        kick: 'x . . x . .',
        wood: ['x . o x . o', 'x . o x . o', 'x . o x . o', 'x o o x o o'],
        shaker: '. o o . o o',
      } },
    },
  },

  // Murky Marsh: a slow, swung swamp blues. The bass does most of the talking.
  marsh: {
    volume: 0.85, bpm: 86, steps: 8, beat: 2, swing: 0.4,
    chords: ['Am7', 'Am7', 'Am7', 'Am7', 'Dm7', 'Dm7', 'Am7', 'Am7', 'E7', 'Dm7', 'Am7', 'E7'],
    parts: {
      lead: { inst: 'harmonica', notes: `
        E5 - - D5 C5 - A4 - | . . . . . . G4 A4 | C5 - A4 - D5 C5 A4 - | . . . . . . . .
        F5 - - E5 D5 - C5 - | A4 - . . . . C5 D5 | E5 - - G5 E5 - C5 - | A4 - - - . . . .
        B4 - - D5 B4 - G#4 - | A4 - - C5 D5 - F5 - | E5 - C5 - A4 - - - | . . . . B4 - G#4 -` },
      bass: { inst: 'bass', bass: 'R - . R 5 - 7 .', vol: 1.15 },
      drums: { drums: { kick: 'x . . x . . . .', snare: '. . o . . . o .', shaker: 'o o o o o o o o' } },
    },
  },

  // Lily Lagoon: deep water. Slow, lush seventh chords and a glassy arpeggio with echo.
  // (The underwater muffle applies to the music too, so diving rounds it off.)
  lagoon: {
    volume: 0.6, bpm: 76, steps: 8, beat: 2, echo: { time: 0.59, feedback: 0.35, mix: 0.35 },
    chords: ['Ebmaj7', 'Gm7', 'Abmaj7', 'Bbsus4 Bb', 'Ebmaj7', 'Cm7', 'Abmaj7', 'Bb'],
    parts: {
      lead: { inst: 'bell', loops: [0, 1, 1], notes: `
        G5 - - - - - Bb5 - | F5 - - - D5 - - - | C5 - - - Eb5 - G5 - | F5 - - - D5 - - -
        Bb5 - - - G5 - - - | G5 - - - Eb5 - Bb4 - | C5 - - - - - Eb5 - | D5 - - - - - - -` },
      arp: { inst: 'glass', arp: '1 2 3 4 5 4 3 2', vol: 0.8 },
      bass: { inst: 'softbass', bass: 'R - - - - - 5 -' },
      pad: { inst: 'pad', pad: true },
    },
  },

  // Frozen Pond: a music-box waltz in E minor, for sliding about on the ice.
  winter: {
    volume: 0.9, bpm: 138, steps: 6, beat: 2, echo: { time: 0.43, feedback: 0.25, mix: 0.25 },
    chords: ['Em', 'Em', 'Am', 'Am', 'D', 'D', 'G', 'B7', 'Em', 'Em', 'C', 'C', 'Am', 'B7', 'Em', 'Em'],
    parts: {
      lead: { inst: 'musicbox', notes: `
        B4 - - - E5 - | G5 - - - F#5 - | E5 - - - A5 - | C6 - - - B5 -
        A5 - - - F#5 - | D5 - - - A4 - | B4 - - - D5 G5 | F#5 - - - D#5 -
        E5 - - - G5 - | B5 - - - G5 - | E5 - - - G5 - | C6 - - - B5 -
        A5 - - - E5 - | F#5 - D#5 - B4 - | E5 - - - - - | . . . . . .` },
      bass: { inst: 'softbass', bass: 'R - . . . .' },
      stab: { inst: 'pluck', stab: '. . x . x .', vol: 0.4 },
      drums: { drums: { hat: '. . o . o .' } },
    },
  },

  // Firefly Hollow: a hushed lullaby. Sparse, so the crickets and the owl still come through.
  night: {
    volume: 0.55, bpm: 66, steps: 8, beat: 2, echo: { time: 0.68, feedback: 0.4, mix: 0.4 },
    chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E'],
    parts: {
      lead: { inst: 'flute', loops: [1, 0], notes: `
        E5 - - - - - D5 C5 | C5 - - - A4 - - - | G4 - - - C5 - E5 - | D5 - - - - - - -
        E5 - - - - - G5 E5 | F5 - - - E5 - C5 - | D5 - - - F5 - A4 - | G#4 - - - B4 - - -` },
      arp: { inst: 'glass', arp: ['1 . . 3 . 5 . .', '. . 2 . . . 4 .'], vol: 0.6 },
      bass: { inst: 'softbass', bass: 'R - - - - - - -', vol: 0.8 },
      pad: { inst: 'pad', pad: true, vol: 0.7 },
    },
  },

  // Thorny Thicket: driving and adventurous, with toms.
  thicket: {
    volume: 0.8, bpm: 138, steps: 8, beat: 2,
    chords: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Gm', 'A', 'Bb', 'C', 'Dm', 'Dm', 'Gm', 'Bb', 'A', 'A'],
    parts: {
      lead: { inst: 'brass', notes: `
        D5 - - A4 D5 - F5 - | E5 - D5 - A4 - - - | D5 - - Bb4 D5 - F5 - | G5 - - - E5 - C5 -
        D5 - - A4 D5 - F5 - | A5 - G5 - F5 - E5 - | D5 - - - Bb4 - G4 - | A4 - - - C#5 - E5 -
        F5 - - - - - D5 - | E5 - - - G5 - - - | F5 - - E5 D5 - A4 - | . . . . D5 E5 F5 G5
        Bb5 - - - G5 - D5 - | F5 - - - D5 - Bb4 - | E5 - - - C#5 - A4 - | C#5 - E5 - A5 - - -` },
      arp: { inst: 'pluck', arp: '1 2 3 2 1 2 3 2', vol: 0.4 },
      bass: { inst: 'bass', bass: 'R R 8 R R R 5 R' },
      drums: { drums: {
        kick: 'x . . x x . . .',
        snare: ['. . x . . . x .', '. . x . . . x .', '. . x . . . x .', '. . x . . . . .'],
        tom: ['. . . . . . . .', '. . . . . . . .', '. . . . . . . .', '. . . . . x x x'],
        hat: 'x o x o x o x o',
      } },
    },
  },

  // Heron's Roost: the frog's motif in C minor. It starts as a low pulse while you read the
  // signpost, then layers come in and the tempo climbs with every hit the heron takes.
  dusk: {
    volume: 0.8, bpm: 140, bpmPerHit: 7, steps: 8, beat: 2,
    chords: ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Fm', 'G'],
    parts: {
      bass: { inst: 'bass', bass: 'R 8 R 8 R 8 R 8', vol: 1.1 },
      pad: { inst: 'pad', pad: true, vol: 0.8 },
      kick: { from: 1, drums: { kick: 'x . . . x . . .' } },
      lead: { inst: 'brass', from: 1, notes: `
        C5 . G5 - - . Eb5 D5 | C5 - - - G4 - - - | C5 . Ab5 - - . G5 F5 | D5 - - - F5 - - -
        C5 . G5 - - . C6 Bb5 | G5 - Eb5 - C5 - - - | F5 - Ab5 - C6 - Ab5 - | G5 - - - B4 - D5 -` },
      snare: { from: 2, drums: { snare: ['. . x . . . x .', '. . x . . . x .', '. . x . . . x .', '. . x . . x x x'], hat: 'x x x x x x x x' } },
      arp: { inst: 'pluck', from: 3, arp: '1 2 3 4 3 2 1 2', vol: 0.5 },
    },
  },
};
