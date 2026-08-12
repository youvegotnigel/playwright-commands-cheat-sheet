/** @type {import('./index.js').Category} */
export default {
  cat: 'Media & Audio',
  cls: 'media',
  color: '#f43f5e',
  items: [
    {
      name: 'Assert audio is playing',
      level: 'intermediate',
      desc: 'Verifies an HTMLMediaElement is actually playing by checking paused, ended, and readyState together rather than trusting a play button click.',
      tip: 'A click on a play button is not proof of playback. readyState >= 3 (HAVE_FUTURE_DATA) means the browser has buffered enough to keep playing, so all three checks together are what distinguish real playback from a stalled or errored element.',
      docs: 'https://playwright.dev/docs/test-assertions#expectpoll',
      code: `import { test, expect } from '@playwright/test';

test('the track starts playing', async ({ page }) => {
  await page.goto('/player');
  const audio = page.locator('audio#track');
  await expect(audio).toBeAttached();

  await page.getByRole('button', { name: 'Play' }).click();

  // Playing means: not paused, not ended, and enough data buffered.
  // expect.poll retries until it passes, so no waitForTimeout is needed.
  await expect
    .poll(() =>
      audio.evaluate(
        (el: HTMLMediaElement) => !el.paused && !el.ended && el.readyState >= 3
      )
    )
    .toBe(true);
});`,
    },

    {
      name: 'audio.currentTime advances',
      level: 'intermediate',
      desc: 'Proves playback is genuinely progressing by polling currentTime until the playhead moves past where it started.',
      tip: 'paused === false only says the element intends to play. A stalled network or a decode error can leave currentTime frozen while paused stays false, so assert the playhead actually moves before calling the test green.',
      docs: 'https://playwright.dev/docs/test-assertions#expectpoll',
      code: `import { test, expect } from '@playwright/test';

test('playback progresses', async ({ page }) => {
  await page.goto('/player');
  const audio = page.locator('audio#track');

  await page.getByRole('button', { name: 'Play' }).click();
  const startedAt = await audio.evaluate((el: HTMLMediaElement) => el.currentTime);

  // Poll the playhead instead of sleeping. This fails fast on a stalled
  // stream and passes as soon as real progress is observed.
  await expect
    .poll(() => audio.evaluate((el: HTMLMediaElement) => el.currentTime), {
      timeout: 5000,
      message: 'currentTime never advanced, playback is stalled',
    })
    .toBeGreaterThan(startedAt + 0.5);
});`,
    },

    {
      name: 'Assert audio is muted',
      level: 'intermediate',
      desc: 'Checks the muted flag and the volume level, which are independent properties on an HTMLMediaElement.',
      tip: 'muted and volume are separate. Muting does not reset volume to 0, and setting volume to 0 does not set muted to true. Assert whichever one your UI control actually changes, or both if the control does both.',
      docs: 'https://playwright.dev/docs/api/class-locator#locator-evaluate',
      code: `import { test, expect } from '@playwright/test';

test('the mute button silences the track', async ({ page }) => {
  await page.goto('/player');
  const audio = page.locator('audio#track');

  await page.getByRole('button', { name: 'Mute' }).click();

  await expect
    .poll(() => audio.evaluate((el: HTMLMediaElement) => el.muted))
    .toBe(true);

  // volume is untouched by muting, it still holds its previous value
  await expect
    .poll(() => audio.evaluate((el: HTMLMediaElement) => el.volume))
    .toBe(1);
});`,
    },

    {
      name: 'AnalyserNode peak amplitude',
      level: 'advanced',
      desc: 'Measures the real output level with a Web Audio AnalyserNode, catching a track that reports as playing but emits silence.',
      tip: 'This is the only check that proves sound is actually being produced. createMediaElementSource() can be called once per element and it reroutes output, so reconnect the analyser to ctx.destination or the audio goes silent for the rest of the test.',
      docs: 'https://playwright.dev/docs/api/class-page#page-evaluate',
      code: `import { test, expect } from '@playwright/test';

test('the track emits audible sound', async ({ page }) => {
  await page.goto('/player');
  await page.getByRole('button', { name: 'Play' }).click();

  const peak = await page.evaluate(async () => {
    const el = document.querySelector('audio') as HTMLMediaElement;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();

    // Reconnect to destination, otherwise the element goes silent
    ctx.createMediaElementSource(el).connect(analyser);
    analyser.connect(ctx.destination);

    const buf = new Float32Array(analyser.fftSize);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    analyser.getFloatTimeDomainData(buf);

    return Math.max(...Array.from(buf, Math.abs));
  });

  expect(peak).toBeGreaterThan(0.01); // above the noise floor
});`,
    },

    {
      name: 'WebRTC audio via getStats()',
      level: 'advanced',
      desc: 'Reads totalAudioEnergy from the inbound-rtp audio stats of an RTCPeerConnection to prove a remote participant is being heard.',
      tip: 'totalAudioEnergy is cumulative and only grows while audible samples arrive, so a rising value proves real speech rather than a connected but silent track. Divide by totalSamplesDuration if you need an average level instead of a total.',
      docs: 'https://playwright.dev/docs/api/class-page#page-evaluate',
      code: `import { test, expect } from '@playwright/test';

test('the remote participant is audible', async ({ page }) => {
  await page.goto('/call');
  await page.getByRole('button', { name: 'Join' }).click();

  const audioEnergy = () =>
    page.evaluate(async () => {
      const pc = (window as any).peerConnection as RTCPeerConnection;
      const report = await pc.getStats();

      let energy = 0;
      report.forEach((stat: any) => {
        if (stat.type === 'inbound-rtp' && stat.kind === 'audio') {
          energy += stat.totalAudioEnergy ?? 0;
        }
      });
      return energy;
    });

  const before = await audioEnergy();

  // Energy only accumulates while audible audio arrives
  await expect.poll(audioEnergy, { timeout: 10000 }).toBeGreaterThan(before);
});`,
    },
  ],
};
