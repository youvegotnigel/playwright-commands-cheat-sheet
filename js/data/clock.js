/** @type {import('./index.js').Category} */
export default {cat:'Clock & Time', cls:'clock', color:'#38bdf8', items:[
{name:'clock.install()',
 level:'intermediate',
 desc:'Installs Playwright fake timers for Date, setTimeout, setInterval, and requestAnimationFrame, giving the test manual control over the flow of time.',
 tip:'Call before page.goto() so the page loads against the fake clock. Initialise with a time so date-dependent UI renders predictably, then advance time with runFor() or fastForward().',
 docs:'https://playwright.dev/docs/api/class-clock#clock-install',
 code:`// Initialise the clock before loading the page
await page.clock.install({ time: new Date('2025-01-01T08:00:00') });
await page.goto('/dashboard');

await expect(page.getByTestId('greeting')).toHaveText('Good morning');`},

{name:'clock.setFixedTime()',
 level:'intermediate',
 desc:'Pins Date.now() and new Date() to a fixed value. Time never advances and timers do not fire. The simplest option when you only need a stable "now".',
 tip:'Use this when the page just reads the current date (e.g. a "today" label) and you do not need timers to run. Lighter than install() + manual advancing.',
 docs:'https://playwright.dev/docs/api/class-clock#clock-set-fixed-time',
 code:`// Freeze the date so a "today" label is deterministic
await page.clock.setFixedTime(new Date('2025-01-01T12:00:00'));
await page.goto('/calendar');

await expect(page.locator('.date-display')).toHaveText('January 1, 2025');`},

{name:'clock.setSystemTime()',
 level:'advanced',
 desc:'Sets the current system time but, unlike setFixedTime(), lets timers keep running. Combine with install() to simulate the clock starting at a specific moment.',
 tip:'Use when the page schedules timers (polling, countdowns) and you need them to fire while still controlling the starting wall-clock time.',
 docs:'https://playwright.dev/docs/api/class-clock#clock-set-system-time',
 code:`await page.clock.install();
await page.clock.setSystemTime(new Date('2025-06-01T10:00:00'));
await page.goto('/session-timer');

// Timers continue to run from this starting point
await page.clock.runFor(60000); // 1 minute later`},

{name:'clock.runFor()',
 level:'intermediate',
 desc:'Advances the fake clock by a duration, firing every timer scheduled within that window. Accepts milliseconds or a "mm:ss" string.',
 tip:'Use to trigger setTimeout/setInterval callbacks instantly instead of waiting in real time. Great for testing countdowns, debounces, and auto-refresh logic.',
 docs:'https://playwright.dev/docs/api/class-clock#clock-run-for',
 code:`await page.clock.install({ time: new Date('2025-06-01') });
await page.goto('/session-timer');

// Advance timers by 5 seconds instantly
await page.clock.runFor(5000);
await expect(page.locator('#countdown')).toHaveText('4:55');`},

{name:'clock.fastForward()',
 level:'intermediate',
 desc:'Jumps the clock ahead by a duration. Timers due in that window fire, but intermediate ticks are skipped. Use to leap over long idle periods quickly.',
 tip:'Prefer fastForward() over runFor() when you want to skip ahead (e.g. a 30-minute session expiry) without firing every intermediate interval one by one.',
 docs:'https://playwright.dev/docs/api/class-clock#clock-fast-forward',
 code:`await page.clock.install();
await page.goto('/account');

// Jump ahead 30 minutes to trigger a session-expiry banner
await page.clock.fastForward('30:00');
await expect(page.getByText('Your session has expired')).toBeVisible();`},

{name:'clock.pauseAt()',
 level:'advanced',
 desc:'Fast-forwards to a specific time, firing timers along the way, then pauses the clock there so it no longer advances on its own.',
 tip:'Use to simulate a user reopening a laptop at a precise time: run the timers up to that moment, then freeze the state for assertions.',
 docs:'https://playwright.dev/docs/api/class-clock#clock-pause-at',
 code:`await page.clock.install({ time: new Date('2025-02-02T08:00:00') });
await page.goto('/clock-app');

// Run up to 10:00 then hold time there
await page.clock.pauseAt(new Date('2025-02-02T10:00:00'));
await expect(page.getByTestId('current-time')).toHaveText('10:00:00 AM');`},

{name:'clock.resume()',
 level:'advanced',
 desc:'Resumes the natural flow of time after a pauseAt(). Date.now() starts advancing again with real wall-clock time and pending timers continue.',
 tip:'Pair with pauseAt(): pause to assert a frozen state, then resume() to let the app continue ticking as it would in production.',
 docs:'https://playwright.dev/docs/api/class-clock#clock-resume',
 code:`await page.clock.pauseAt(new Date('2025-02-02T10:00:00'));
await expect(page.getByTestId('current-time')).toHaveText('10:00:00 AM');

// Let the clock tick again
await page.clock.resume();`},

{name:'Clock + timezoneId',
 level:'advanced',
 desc:'Combines the clock with timezone emulation. The clock pins WHEN now is (the absolute instant), while timezoneId on the context sets WHERE the browser is, controlling how that instant renders as wall-clock time.',
 tip:'Clock methods take no timezone argument. Prefer an ISO string with a trailing Z over new Date(y, m, d), which is parsed in the test runner host timezone and freezes a different instant on each machine. Freezing at noon keeps offsets from rolling the date past midnight.',
 docs:'https://playwright.dev/docs/emulation#locale--timezone',
 code:`// Pin the browser to New York local time
test.use({ timezoneId: 'America/New_York' });

test('shows 9am Eastern', async ({ page }) => {
  // Freeze the instant 14:00 UTC. In New York (UTC-5) that is 9:00 AM.
  await page.clock.setFixedTime(new Date('2025-01-15T14:00:00Z'));
  await page.goto('/dashboard');

  await expect(page.getByTestId('greeting')).toHaveText('Good morning, 9:00 AM');
});`},

{name:'DST change mid-session',
 level:'advanced',
 desc:'Simulates the wall clock shifting while the page stays open, such as a daylight-saving jump. setSystemTime() moves the clock to a new instant without firing timers, so you can assert how time-displaying UI re-renders.',
 tip:'Pick instants just before and after the DST boundary of the emulated timezoneId. To emulate a user changing their device timezone instead, create a new context with a different timezoneId; a context timezone is fixed for its lifetime.',
 docs:'https://playwright.dev/docs/api/class-clock#clock-set-system-time',
 code:`test.use({ timezoneId: 'Europe/London' });

test('clock survives the spring-forward jump', async ({ page }) => {
  // 00:30 GMT on 30 Mar 2025, just before the UK springs forward
  await page.clock.setFixedTime(new Date('2025-03-30T00:30:00Z'));
  await page.goto('/');
  await expect(page.getByTestId('local-time')).toHaveText('12:30 AM');

  // 01:30 GMT: London leaps 01:00 to 02:00 (BST), so it reads 02:30 local
  await page.clock.setSystemTime(new Date('2025-03-30T01:30:00Z'));
  await expect(page.getByTestId('local-time')).toHaveText('2:30 AM');
});`},
]};
