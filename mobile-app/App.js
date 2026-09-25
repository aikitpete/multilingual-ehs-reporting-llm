import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  ImageBackground,
  TextInput,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { LANGUAGES, LANGUAGE_CODES, t } from './src/i18n';
import { SEED_REPORTS, CATEGORIES, CATEGORY_ICON, CATEGORY_PHOTO, QUIZ_CATEGORIES, LOCATIONS, DEFAULT_LOCATION } from './src/data/seedReports';
const DEMO_SCENARIOS = require('./src/data/demoScenarios');

// Presenter-only quick-fill for the report form — flip off before handing
// the app to anyone outside the pitch. It only pre-fills draft state;
// submission still goes through the exact same submitReport() pipeline.
const DEMO_MODE = true;

// Generic placeholder for the mark-the-spot step, shown before the worker
// has picked a category — Training list thumbnails use the category-
// matched photo instead (see CATEGORY_PHOTO).
const SAMPLE_PHOTO = CATEGORY_PHOTO.falls;

const C = {
  bg: '#F2ECE0',
  card: '#FFFFFF',
  ink: '#242424',
  inkSoft: '#625F5A',
  muted: '#8C8983',
  accent: '#C97A1F',
  accentBg: '#FBE8D0',
  border: '#E3E0D8',
  high: '#C2402A',
  low: '#3D7A34',
};

const SEVERITIES = ['low', 'medium', 'high'];
const SEVERITY_COLOR = { low: C.low, medium: C.accent, high: C.high };

// Shared with the management dashboard, which polls this same server.
// Tunneled via a Cloudflare quick tunnel for the demo (see server/
// server.js and server/README.md) so it works on any WiFi, not just the
// local LAN. Update this if the tunnel is restarted — it gets a new
// random URL each time.
const SERVER_URL = 'https://teacher-achieved-encyclopedia-precipitation.trycloudflare.com';

function postReportToServer(report) {
  fetch(SERVER_URL + '/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  }).catch(() => {
    // Best-effort for the demo: the report still shows up locally in the
    // Training list even if the shared server is unreachable.
  });
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [showDemoSheet, setShowDemoSheet] = useState(false);
  const [screen, setScreen] = useState('welcome');
  const [sharedReports, setSharedReports] = useState([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [syncedMaterials, setSyncedMaterials] = useState([]);

  // Training screen shows every submitted hazard from the shared server
  // (same source the dashboards read from), plus the always-present seed
  // reports for demo content. Polled like syncedMaterials below.
  useEffect(() => {
    if (screen !== 'training_list') return;
    let cancelled = false;
    const poll = () => {
      fetch(SERVER_URL + '/reports')
        .then((r) => r.json())
        .then((list) => { if (!cancelled) setSharedReports(list); })
        .catch(() => {});
      fetch(SERVER_URL + '/training-materials')
        .then((r) => r.json())
        .then((list) => { if (!cancelled) setSyncedMaterials(list); })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 4000);
    return () => { cancelled = true; clearInterval(id); };
  }, [screen]);
  const [draft, setDraft] = useState(null);

  const tr = (key) => t(lang, key);

  function startReport() {
    setDraft({ photoUri: null, samplePhoto: false, pin: null, category: null, location: DEFAULT_LOCATION, severity: null, note: '', aiDescribe: null });
    setScreen('report_form');
  }

  // Demo-only: pre-fills the same draft startReport() would build, using a
  // preset scenario. The presenter still reviews the single report screen
  // and presses the real Submit button themselves. No part of this
  // touches postReportToServer / the report pipeline directly.
  function loadDemoScenario(scenario) {
    setDraft({
      photoUri: null,
      samplePhoto: CATEGORY_PHOTO[scenario.category] || null,
      pin: { xPct: 0.5, yPct: 0.45 },
      category: scenario.category,
      location: scenario.location,
      severity: scenario.severity,
      note: scenario.note,
      aiDescribe: null,
    });
    setScreen('report_form');
  }

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return pickSample('falls');
    const res = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: true });
    if (!res.canceled) {
      setDraft((d) => ({ ...d, photoUri: res.assets[0].uri, photoBase64: res.assets[0].base64, samplePhoto: false, sampleCategory: null }));
      requestAiDescribe({ base64: res.assets[0].base64 });
    }
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return pickSample('falls');
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: true });
    if (!res.canceled) {
      setDraft((d) => ({ ...d, photoUri: res.assets[0].uri, photoBase64: res.assets[0].base64, samplePhoto: false, sampleCategory: null }));
      requestAiDescribe({ base64: res.assets[0].base64 });
    }
  }

  function pickSample(key) {
    setDraft((d) => ({ ...d, photoUri: null, photoBase64: null, samplePhoto: CATEGORY_PHOTO[key], sampleCategory: key, aiDescribe: null }));
    requestAiDescribe({ category: key });
  }

  // Best-effort, non-blocking: attempts a real LLM call (server-side, see
  // server/server.js /ai-describe-photo) to draft a starting description in
  // the worker's own language -- vision from a real photo, or a text-only
  // generation from the category when it's a sample/demo photo with no real
  // bytes to send. Always resolves to either a draft or a blank, editable
  // field within a bounded time — never blocks the form.
  function requestAiDescribe({ base64, category }) {
    if (!base64 && !category) {
      console.warn('ai-describe-photo: no base64/category available, skipping');
      return;
    }
    setDraft((cur) => ({ ...cur, aiDescribe: { status: 'loading' } }));
    const controller = new AbortController();
    // Vision call + uploading the photo itself can take longer than a
    // plain text call, especially over a tunnel -- give it real headroom
    // so a slow-but-working call isn't mistaken for a dead one.
    const timer = setTimeout(() => controller.abort(), 14000);
    fetch(SERVER_URL + '/ai-describe-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64 || null, category: category || null, lang }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((res) => {
        if (res && res.description) {
          setDraft((cur) => ({ ...cur, note: res.description, aiDescribe: { status: 'done', ok: true } }));
        } else {
          console.warn('ai-describe-photo: no description in response', res);
          setDraft((cur) => ({ ...cur, aiDescribe: { status: 'done', ok: false } }));
        }
      })
      .catch((e) => {
        console.warn('ai-describe-photo: request failed', e.message);
        setDraft((cur) => ({ ...cur, aiDescribe: { status: 'done', ok: false } }));
      })
      .finally(() => clearTimeout(timer));
  }

  function submitReport() {
    postReportToServer({
      category: draft.category,
      categoryLabel: tr(`report.category.${draft.category}`),
      severity: draft.severity,
      severityLabel: tr(`report.severity.${draft.severity}`),
      location: draft.location,
      note: draft.note,
      lang,
      langLabel: LANGUAGES[lang]['lang.name'],
      // A real photo travels as its local file URI -- only meaningful on
      // this same device/session, which is fine for a single-phone demo.
      // A sample photo has no serializable form, so the training screen
      // falls back to CATEGORY_PHOTO[category] for those instead.
      photoUri: draft.photoUri || null,
      pin: draft.pin || null,
    });
    setScreen('report_submitted');
  }

  if (screen === 'welcome') {
    return (
      <SafeAreaView style={styles.safeWelcome}>
        <StatusBar style="light" />
        <WelcomeSequence lang={lang} onSelectLang={setLang} tr={tr} onFinish={() => setScreen('home')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <Header lang={lang} tr={tr} screen={screen} onLangPress={() => setShowLangSheet(true)} onBack={backFor(screen)} onBackPress={() => setScreen(backFor(screen))} />

      {screen === 'home' && (
        <Home
          tr={tr}
          lang={lang}
          onReport={startReport}
          onTraining={() => setScreen('training_list')}
          onLangPress={() => setShowLangSheet(true)}
          onReplayWelcome={() => setScreen('welcome')}
          checkedIn={checkedIn}
          onToggleCheckIn={() => setCheckedIn((v) => !v)}
          onMyReports={() => setScreen('my_reports')}
        />
      )}

      {screen === 'my_reports' && (
        <View style={styles.stepWrap}>
          <Text style={styles.stepTitle}>{tr('myReports.title')}</Text>
          <Text style={styles.stepHint}>{tr('myReports.body')}</Text>
          <PrimaryButton label={tr('nav.done')} onPress={() => setScreen('home')} />
        </View>
      )}

      {screen === 'report_form' && draft && (
        <ReportForm
          tr={tr}
          draft={draft}
          setDraft={setDraft}
          onCamera={pickFromCamera}
          onLibrary={pickFromLibrary}
          onSample={pickSample}
          onDemoData={() => setShowDemoSheet(true)}
          onGenerateDescription={() => requestAiDescribe({ base64: draft.photoBase64, category: draft.sampleCategory })}
          onSubmit={submitReport}
        />
      )}

      {screen === 'report_submitted' && draft && (
        <SubmittedStep tr={tr} draft={draft} onDone={() => setScreen('home')} />
      )}

      {screen === 'training_list' && (
        <TrainingList tr={tr} reports={[...SEED_REPORTS, ...sharedReports]} syncedMaterials={syncedMaterials} />
      )}

      <LangSheet visible={showLangSheet} tr={tr} lang={lang} onSelect={(code) => { setLang(code); setShowLangSheet(false); }} onClose={() => setShowLangSheet(false)} />
      {DEMO_MODE && (
        <DemoSheet
          visible={showDemoSheet}
          onSelect={(s) => { setShowDemoSheet(false); loadDemoScenario(s); }}
          onClose={() => setShowDemoSheet(false)}
        />
      )}
    </SafeAreaView>
  );
}

function backFor(screen) {
  const map = {
    report_form: 'home',
    training_list: 'home',
    my_reports: 'home',
  };
  return map[screen] || null;
}

const HEADER_SCREEN_TITLE_KEY = { report_form: 'home.report', training_list: 'home.training' };

function Header({ tr, screen, onLangPress, onBack, onBackPress }) {
  const titleKey = HEADER_SCREEN_TITLE_KEY[screen];
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBackPress} hitSlop={10} style={styles.headerSide}>
          <Text style={styles.headerBack}>‹ {tr('nav.back')}</Text>
        </Pressable>
      ) : (
        <View style={styles.headerSide} />
      )}
      <Text style={styles.headerTitle}>{titleKey ? tr(titleKey) : '안전톡'}</Text>
      <Pressable onPress={onLangPress} hitSlop={10} style={[styles.headerSide, { alignItems: 'flex-end' }]}>
        <Text style={styles.headerLang}>🌐</Text>
      </Pressable>
    </View>
  );
}

const WELCOME_SLIDES = ['welcome.s0', 'welcome.s1', 'welcome.s2', 'welcome.s3'];
const WELCOME_SLIDE_MS = 1600;

function WelcomeSequence({ lang, onSelectLang, tr, onFinish }) {
  const [step, setStep] = React.useState('lang');
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (step !== 'slides') return;
    if (index >= WELCOME_SLIDES.length) {
      onFinish();
      return;
    }
    const timer = setTimeout(() => setIndex((i) => i + 1), WELCOME_SLIDE_MS);
    return () => clearTimeout(timer);
  }, [step, index]);

  function selectLang(code) {
    onSelectLang(code);
    setStep('slides');
  }

  if (step === 'lang') {
    // Language-neutral by design — we don't know the worker's language yet,
    // so each option is shown only in its own native name (no instructional
    // text to read), over a real jobsite photo for a visual, non-verbal cue.
    return (
      <ImageBackground source={SAMPLE_PHOTO} style={styles.welcomeLangBg} imageStyle={{ opacity: 0.4 }}>
        <View style={styles.welcomeLangOverlay}>
          <Text style={styles.welcomeLangTitle}>안전톡</Text>
          <View style={styles.welcomeLangGrid}>
            {LANGUAGE_CODES.map((code) => (
              <Pressable key={code} style={styles.welcomeLangCard} onPress={() => selectLang(code)}>
                <Text style={styles.welcomeLangCardLabel}>{LANGUAGES[code]['lang.name']}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {/* Presenter-only skip, deliberately invisible so the audience never sees a "Skip" affordance */}
        <Pressable style={styles.hiddenHotspot} onPress={onFinish} />
      </ImageBackground>
    );
  }

  const key = WELCOME_SLIDES[Math.min(index, WELCOME_SLIDES.length - 1)];
  const isBrand = key === 'welcome.s0';

  return (
    <View style={styles.welcomeWrap}>
      <Text style={isBrand ? styles.welcomeBrand : styles.welcomeLine}>{tr(key)}</Text>
      <Pressable style={styles.hiddenHotspot} onPress={onFinish} />
    </View>
  );
}

function Home({ tr, lang, onReport, onTraining, onLangPress, onReplayWelcome, checkedIn, onToggleCheckIn, onMyReports }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.homeWrap}>
      {/* Presenter-only hotspot to replay the welcome sequence on demand — deliberately invisible, not a demo affordance */}
      <Pressable style={styles.hiddenHotspot} onPress={onReplayWelcome} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable style={styles.langPill} onPress={onLangPress}>
          <Text style={styles.langPillLabel}>🌐 {LANGUAGES[lang]['lang.name']}</Text>
        </Pressable>
      </View>
      <Text style={styles.homeTitle}>{tr('home.title')}</Text>
      <Text style={styles.homeSubtitle}>{tr('home.subtitle')}</Text>

      {/* Site-wide electronic attendance tracking (OSH Act amendment) — worker's own check-in */}
      <Pressable style={[styles.checkinPill, checkedIn && styles.checkinPillActive]} onPress={onToggleCheckIn}>
        <Text style={[styles.checkinPillLabel, checkedIn && styles.checkinPillLabelActive]}>
          {checkedIn ? tr('home.checkedin') : tr('home.checkin')}
        </Text>
      </Pressable>

      <Pressable style={[styles.bigCard, { backgroundColor: C.ink }]} onPress={onReport}>
        <Text style={styles.bigCardIcon}>⚠️</Text>
        <Text style={styles.bigCardTitle}>{tr('home.report')}</Text>
        <Text style={styles.bigCardSub}>{tr('home.reportSub')}</Text>
      </Pressable>

      <Pressable style={[styles.bigCard, { backgroundColor: C.accent }]} onPress={onTraining}>
        <Text style={styles.bigCardIcon}>🎓</Text>
        <Text style={styles.bigCardTitle}>{tr('home.training')}</Text>
        <Text style={styles.bigCardSub}>{tr('home.trainingSub')}</Text>
      </Pressable>

      <Pressable style={styles.myReportsLink} onPress={onMyReports}>
        <Text style={styles.myReportsLinkLabel}>{tr('home.myReports')}</Text>
      </Pressable>
    </ScrollView>
  );
}

// Single scrollable report screen. Sections reveal progressively in the
// requested order (description -> photo -> mark -> category -> location
// -> severity -> AI check) so the form never dumps everything on the
// worker at once, while still being one screen/one scroll, not a wizard.
function ReportForm({ tr, draft, setDraft, onCamera, onLibrary, onSample, onDemoData, onGenerateDescription, onSubmit }) {
  const [showSamples, setShowSamples] = React.useState(false);
  const markSize = Math.min(Dimensions.get('window').width - 72, 300);

  const hasPhoto = !!(draft.photoUri || draft.samplePhoto);
  const showDescription = hasPhoto;
  const showMark = showDescription;
  const showCategory = showMark && !!draft.pin;
  const showLocation = showCategory && !!draft.category;
  const showSeverity = showLocation && !!draft.location;
  const canSubmit = showSeverity && !!draft.severity;

  const aiDescribing = draft.aiDescribe && draft.aiDescribe.status === 'loading';

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.stepTitle}>{tr('home.report')}</Text>

      <Text style={[styles.sectionLabel, { marginTop: 0 }]}>{tr('report.photo.title')}</Text>
      <Text style={styles.stepHint}>{tr('report.photo.hint')}</Text>
      {hasPhoto ? (
        <View style={[styles.markPhoto, { width: markSize, height: markSize, alignSelf: 'center', backgroundColor: '#333' }]}>
          {draft.photoUri && <Image source={{ uri: draft.photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
          {draft.samplePhoto && <Image source={draft.samplePhoto} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        </View>
      ) : (
        <View style={styles.cameraPreview}>
          <Text style={{ fontSize: 56 }}>📷</Text>
        </View>
      )}
      <PrimaryButton label={hasPhoto ? tr('report.photo.retake') : tr('report.photo.camera')} onPress={onCamera} />
      <SecondaryButton label={tr('report.photo.library')} onPress={onLibrary} />
      <Pressable style={styles.sampleToggle} onPress={() => setShowSamples((v) => !v)}>
        <Text style={styles.sampleToggleLabel}>{tr('report.photo.sample')}</Text>
      </Pressable>
      {showSamples && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sampleGrid}>
          {Object.keys(CATEGORY_PHOTO).map((key) => (
            <Pressable key={key} style={styles.sampleThumbWrap} onPress={() => onSample(key)}>
              <Image source={CATEGORY_PHOTO[key]} style={styles.sampleThumb} resizeMode="cover" />
              <Text style={styles.sampleThumbLabel}>{tr(`report.category.${key}`)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {showDescription && (
        <>
          <Text style={styles.sectionLabel}>{tr('report.description.title')}</Text>
          <Text style={styles.stepHint}>{tr('report.description.hint')}</Text>

          {(!!draft.photoBase64 || !!draft.sampleCategory) && (
            <>
              <Pressable
                style={[styles.aiGenerateBtn, aiDescribing && styles.aiGenerateBtnBusy]}
                onPress={onGenerateDescription}
                disabled={aiDescribing}
              >
                <Text style={styles.aiGenerateBtnLabel}>
                  {aiDescribing ? tr('report.ai.checking') + '…' : '✨ ' + tr('report.ai.generateBtn')}
                </Text>
              </Pressable>
              {!aiDescribing && draft.aiDescribe && draft.aiDescribe.status === 'done' && (
                <Text style={draft.aiDescribe.ok === false ? styles.aiStatusBad : styles.aiStatusGood}>
                  {draft.aiDescribe.ok === false ? tr('report.ai.unavailable') : tr('report.ai.success')}
                </Text>
              )}
            </>
          )}

          <TextInput
            style={styles.noteInput}
            placeholder={tr('report.description.placeholder')}
            placeholderTextColor={C.muted}
            multiline
            editable={!aiDescribing}
            value={draft.note}
            onChangeText={(note) => setDraft((d) => ({ ...d, note }))}
          />
          <Pressable style={styles.demoDataBar} onPress={onDemoData}>
            <Text style={styles.demoDataBarLabel}>Demo data</Text>
          </Pressable>
        </>
      )}

      {showMark && (
        <>
          <Text style={styles.sectionLabel}>{tr('report.mark.title')}</Text>
          <Text style={styles.stepHint}>{tr('report.mark.hint')}</Text>
          <Pressable
            style={[styles.markPhoto, { width: markSize, height: markSize, alignSelf: 'center', backgroundColor: '#333' }]}
            onPress={(e) => setDraft((d) => ({
              ...d,
              // Stored as a fraction of the marking square, not raw pixels,
              // so the same pin lands in the right spot later on the
              // training screen's differently-sized/shaped hazard photo.
              pin: { xPct: e.nativeEvent.locationX / markSize, yPct: e.nativeEvent.locationY / markSize },
            }))}
          >
            {draft.photoUri && <Image source={{ uri: draft.photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
            {draft.samplePhoto && <Image source={draft.samplePhoto} style={StyleSheet.absoluteFill} resizeMode="cover" />}
            {draft.pin && (
              <View style={[styles.pin, { left: draft.pin.xPct * markSize - 16, top: draft.pin.yPct * markSize - 16 }]}>
                <Text style={{ fontSize: 22 }}>📍</Text>
              </View>
            )}
          </Pressable>
          {draft.pin && <Text style={styles.markedLabel}>✓ {tr('report.mark.marked')}</Text>}
        </>
      )}

      {showCategory && (
        <>
          <Text style={styles.sectionLabel}>{tr('report.category.title')}</Text>
          <View style={styles.grid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={[styles.catCard, draft.category === cat && styles.catCardActive]}
                onPress={() => setDraft((d) => ({ ...d, category: cat }))}
              >
                <Text style={{ fontSize: 30 }}>{CATEGORY_ICON[cat]}</Text>
                <Text style={[styles.catLabel, draft.category === cat && { color: C.accent }]}>{tr(`report.category.${cat}`)}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {showLocation && (
        <>
          <Text style={styles.sectionLabel}>{tr('report.location.title')}</Text>
          <Text style={styles.stepHint}>{tr('report.location.hint')}</Text>
          <View style={{ gap: 10 }}>
            {LOCATIONS.map((loc) => (
              <Pressable
                key={loc}
                style={[styles.locationRow, draft.location === loc && styles.locationRowActive]}
                onPress={() => setDraft((d) => ({ ...d, location: loc }))}
              >
                <Text style={[styles.locationRowLabel, draft.location === loc && { color: C.accent }]}>{loc}</Text>
                {draft.location === loc && <Text style={{ color: C.accent, fontWeight: '800' }}>✓</Text>}
              </Pressable>
            ))}
          </View>
        </>
      )}

      {showSeverity && (
        <>
          <Text style={styles.sectionLabel}>{tr('report.severity.title')}</Text>
          <View style={styles.severityRow}>
            {SEVERITIES.map((sev) => (
              <Pressable
                key={sev}
                style={[
                  styles.sevPill,
                  { borderColor: SEVERITY_COLOR[sev] },
                  draft.severity === sev && { backgroundColor: SEVERITY_COLOR[sev] },
                ]}
                onPress={() => setDraft((d) => ({ ...d, severity: sev }))}
              >
                <Text style={[styles.sevLabel, draft.severity === sev && { color: '#fff' }, draft.severity !== sev && { color: SEVERITY_COLOR[sev] }]}>
                  {tr(`report.severity.${sev}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <PrimaryButton label={tr('nav.submit')} onPress={onSubmit} disabled={!canSubmit} />
    </ScrollView>
  );
}

function SubmittedStep({ tr, draft, onDone }) {
  return (
    <View style={styles.stepWrap}>
      <View style={styles.checkCircle}>
        <Text style={{ fontSize: 40 }}>✓</Text>
      </View>
      <Text style={styles.stepTitle}>{tr('report.submitted.title')}</Text>
      <Text style={styles.stepHint}>{tr('report.submitted.body')}</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{tr('report.submitted.summary')}</Text>
        <Text style={styles.summaryRow}>{CATEGORY_ICON[draft.category]}  {tr(`report.category.${draft.category}`)} · {tr(`report.severity.${draft.severity}`)}</Text>
        {!!draft.location && <Text style={styles.summaryNote}>📍 {draft.location}</Text>}
        {!!draft.note && <Text style={styles.summaryNote}>{draft.note}</Text>}
      </View>

      <PrimaryButton label={tr('nav.done')} onPress={onDone} />
    </View>
  );
}

// For each hazard type present among submitted reports: one multiple-choice
// safety question (from the existing quiz.<category>.q1 content, only
// categories that have it), then every confirmed hazard of that type with
// a large photo and its marked coordinate, so it's easy to see what and
// where the hazard is.
function TrainingList({ tr, reports, syncedMaterials }) {
  const [answers, setAnswers] = useState({});

  const grouped = {};
  reports.forEach((r) => {
    (grouped[r.category] = grouped[r.category] || []).push(r);
  });
  const categoriesPresent = CATEGORIES.filter((c) => grouped[c] && grouped[c].length);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.stepTitle}>{tr('training.list.title')}</Text>

      {categoriesPresent.length === 0 && <Text style={styles.stepHint}>{tr('training.list.empty')}</Text>}

      {categoriesPresent.map((cat) => {
        const selected = answers[cat];
        const hazards = grouped[cat];
        return (
          <View key={cat} style={styles.trainingSection}>
            <Text style={styles.sectionLabel}>{CATEGORY_ICON[cat]} {tr(`report.category.${cat}`)}</Text>

            {QUIZ_CATEGORIES.includes(cat) && (
              <View style={styles.quizCard}>
                <Text style={styles.quizKicker}>{tr('training.quiz.kicker')}</Text>
                <Text style={styles.quizQuestion}>{tr(`quiz.${cat}.q1`)}</Text>
                {[1, 2, 3].map((n, i) => (
                  <Pressable
                    key={n}
                    style={[
                      styles.optionCard,
                      selected === i && (i === 0 ? styles.optionCardCorrect : styles.optionCardWrong),
                    ]}
                    onPress={() => setAnswers((a) => ({ ...a, [cat]: i }))}
                  >
                    <Text style={styles.optionLabel}>{tr(`quiz.${cat}.q1.a${n}`)}</Text>
                  </Pressable>
                ))}
                {selected != null && (
                  <Text style={selected === 0 ? styles.quizFeedbackGood : styles.quizFeedbackBad}>
                    {tr(selected === 0 ? 'training.quiz.correct' : 'training.quiz.incorrect')}
                  </Text>
                )}
              </View>
            )}

            <Text style={styles.hazardListHeader}>{tr('training.cases.header')} ({hazards.length})</Text>
            {hazards.map((r, i) => (
              <View key={r.id} style={styles.hazardCard}>
                <View style={styles.hazardPhotoLarge}>
                  {r.photoUri ? (
                    <Image source={{ uri: r.photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : CATEGORY_PHOTO[cat] ? (
                    <Image source={CATEGORY_PHOTO[cat]} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <Text style={{ fontSize: 40 }}>{CATEGORY_ICON[cat]}</Text>
                  )}
                  {/* A pin only means something on the actual photo it was
                      placed on. A generic category stock photo (no real
                      photoUri) is shared by every report of that type, so
                      overlaying a pin on it would point at an arbitrary spot
                      in an unrelated image -- looks like a bug, not a hazard. */}
                  {r.pin && r.photoUri && (
                    <View style={[styles.pin, { left: `${r.pin.xPct * 100}%`, top: `${r.pin.yPct * 100}%`, marginLeft: -16, marginTop: -16 }]}>
                      <Text style={{ fontSize: 26 }}>📍</Text>
                    </View>
                  )}
                  {!r.photoUri && (
                    <View style={styles.examplePhotoBadge}>
                      <Text style={styles.examplePhotoBadgeText}>{tr('training.examplePhoto')}</Text>
                    </View>
                  )}
                </View>
                <View style={{ gap: 2 }}>
                  <Text style={styles.hazardCardIndex}>{tr('training.cases.item')} {i + 1}</Text>
                  <Text style={styles.reportSeverity}>{tr(`report.severity.${r.severity}`)}</Text>
                  {!!r.location && <Text style={styles.reportCategory}>📍 {r.location}</Text>}
                  {!!r.note && <Text style={styles.stepHint}>{r.note}</Text>}
                </View>
              </View>
            ))}
          </View>
        );
      })}

      {!!(syncedMaterials && syncedMaterials.length) && (
        <>
          <Text style={[styles.stepTitle, { fontSize: 18, marginTop: 12 }]}>{tr('training.synced.title')}</Text>
          {syncedMaterials.map((m) => (
            <View key={m.reportId} style={styles.syncedCard}>
              <Text style={styles.syncedCardTitle}>{m.titleEn}</Text>
              {!!m.captionKo && <Text style={styles.syncedCardCaption}>{m.captionKo}</Text>}
              {!!(m.quiz && m.quiz.q) && <Text style={styles.syncedCardQuiz}>❓ {m.quiz.q}</Text>}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function LangSheet({ visible, tr, lang, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.sheetTitle}>{tr('lang.picker.title')}</Text>
          {LANGUAGE_CODES.map((code) => (
            <Pressable key={code} style={styles.sheetRow} onPress={() => onSelect(code)}>
              <Text style={[styles.sheetRowLabel, code === lang && { color: C.accent, fontWeight: '700' }]}>
                {LANGUAGES[code]['lang.name']}
              </Text>
              {code === lang && <Text style={{ color: C.accent }}>✓</Text>}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function DemoSheet({ visible, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <Text style={styles.sheetTitle}>Demo data</Text>
          <Text style={{ fontSize: 12.5, color: C.muted, marginBottom: 6 }}>Fills the form — Submit still sends a real report.</Text>
          {DEMO_SCENARIOS.map((s) => (
            <Pressable key={s.id} style={styles.sheetRow} onPress={() => onSelect(s)}>
              <Text style={styles.sheetRowLabel}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function PrimaryButton({ label, onPress, disabled }) {
  return (
    <Pressable style={[styles.primaryBtn, disabled && styles.btnDisabled]} onPress={disabled ? undefined : onPress}>
      <Text style={styles.primaryBtnLabel}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }) {
  return (
    <Pressable style={styles.secondaryBtn} onPress={onPress}>
      <Text style={styles.secondaryBtnLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  safeWelcome: { flex: 1, backgroundColor: C.ink },
  welcomeWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  welcomeBrand: { fontSize: 56, fontWeight: '800', color: '#fff' },
  welcomeLine: { fontSize: 24, fontWeight: '700', color: '#fff', textAlign: 'center' },
  welcomeLangBg: { flex: 1 },
  welcomeLangOverlay: { flex: 1, backgroundColor: 'rgba(15,15,15,0.6)', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 28 },
  welcomeLangTitle: { fontSize: 48, fontWeight: '800', color: '#fff' },
  welcomeLangGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 },
  welcomeLangCard: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 16, paddingVertical: 18, paddingHorizontal: 24, minWidth: 130, alignItems: 'center' },
  welcomeLangCardLabel: { fontSize: 18, fontWeight: '800', color: C.ink },
  // Zero visual footprint on purpose — a presenter-only control the
  // audience should never notice, per the demo's requirements.
  hiddenHotspot: { position: 'absolute', top: 0, left: 0, width: 64, height: 64, zIndex: 50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerSide: { width: 60 },
  headerBack: { color: C.accent, fontWeight: '600', fontSize: 15 },
  headerLang: { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.ink },

  homeWrap: { padding: 20, gap: 16 },
  langPill: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  langPillLabel: { fontSize: 13, fontWeight: '700', color: C.ink },
  checkinPill: { alignSelf: 'flex-start', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 4 },
  checkinPillActive: { backgroundColor: C.low, borderColor: C.low },
  checkinPillLabel: { fontSize: 13, fontWeight: '700', color: C.ink },
  checkinPillLabelActive: { color: '#fff' },
  myReportsLink: { alignItems: 'center', paddingVertical: 14 },
  myReportsLinkLabel: { fontSize: 14, fontWeight: '700', color: C.inkSoft, textDecorationLine: 'underline' },
  demoDataLink: { alignItems: 'center', paddingVertical: 6 },
  demoDataLinkLabel: { fontSize: 11.5, fontWeight: '600', color: C.muted },
  homeTitle: { fontSize: 42, fontWeight: '800', color: C.ink, marginTop: 12 },
  homeSubtitle: { fontSize: 16, color: C.inkSoft, marginBottom: 12 },
  bigCard: { borderRadius: 20, padding: 24, gap: 4 },
  bigCardIcon: { fontSize: 30, marginBottom: 6 },
  bigCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  bigCardSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  stepWrap: { flex: 1, padding: 20, gap: 14 },
  // ScrollView contentContainerStyle must NOT have flex:1 -- that pins the
  // content's height to the viewport instead of letting it grow with
  // content, which is what silently breaks scrolling. Use this for any
  // ScrollView's contentContainerStyle; keep stepWrap for plain Views.
  scrollContent: { padding: 20, gap: 14 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: C.ink },
  stepHint: { fontSize: 14, color: C.inkSoft, marginBottom: 4 },
  sectionLabel: { fontSize: 18, fontWeight: '800', color: C.ink, marginTop: 22 },
  demoDataBar: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 8, marginTop: 2, opacity: 0.4 },
  demoDataBarLabel: { fontSize: 13, color: C.muted },

  aiGenerateBtn: { backgroundColor: C.accentBg, borderRadius: 12, paddingVertical: 12, alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 16 },
  aiGenerateBtnBusy: { opacity: 0.6 },
  aiGenerateBtnLabel: { color: C.accent, fontWeight: '700', fontSize: 13.5 },
  aiStatusGood: { color: C.low, fontWeight: '600', fontSize: 13 },
  aiStatusBad: { color: C.high, fontWeight: '600', fontSize: 13 },

  cameraPreview: {
    height: 220, borderRadius: 18, backgroundColor: '#1c1c1c',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  markPhoto: { borderRadius: 18, alignSelf: 'center', overflow: 'hidden' },
  pin: { position: 'absolute' },
  sampleToggle: { alignSelf: 'center', paddingVertical: 10, marginTop: 4 },
  sampleToggleLabel: { fontSize: 12.5, color: C.muted, textDecorationLine: 'underline' },
  sampleGrid: { flexDirection: 'row', gap: 10, marginTop: 4 },
  sampleThumbWrap: { width: 92, alignItems: 'center', gap: 4 },
  sampleThumb: { width: 92, height: 92, borderRadius: 12, backgroundColor: '#333' },
  sampleThumbLabel: { fontSize: 11, fontWeight: '700', color: C.inkSoft },
  syncedCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border, gap: 4 },
  syncedCardTitle: { fontWeight: '800', color: C.ink, fontSize: 14 },
  syncedCardCaption: { color: C.inkSoft, fontSize: 13 },
  syncedCardQuiz: { color: C.accent, fontSize: 12.5, fontWeight: '600', marginTop: 2 },
  markedLabel: { textAlign: 'center', color: C.low, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: {
    width: '31%', aspectRatio: 1, borderRadius: 16, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  catCardActive: { borderColor: C.accent, backgroundColor: C.accentBg },
  catLabel: { fontSize: 12, fontWeight: '700', color: C.ink },

  locationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  locationRowActive: { borderColor: C.accent, backgroundColor: C.accentBg },
  locationRowLabel: { fontSize: 15, fontWeight: '600', color: C.ink },

  severityRow: { flexDirection: 'row', gap: 10 },
  sevPill: { flex: 1, borderWidth: 2, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  sevLabel: { fontWeight: '800', fontSize: 14 },

  noteInput: {
    borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14,
    minHeight: 90, backgroundColor: C.card, color: C.ink, fontSize: 14, textAlignVertical: 'top',
  },

  checkCircle: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: C.accentBg,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 4,
  },
  summaryCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border, gap: 6 },
  summaryLabel: { fontSize: 11, fontWeight: '800', color: C.muted, letterSpacing: 1 },
  summaryRow: { fontSize: 16, fontWeight: '700', color: C.ink },
  summaryNote: { fontSize: 14, color: C.inkSoft },

  reportCategory: { fontWeight: '800', color: C.ink, fontSize: 15 },
  reportSeverity: { color: C.inkSoft, fontSize: 13 },

  trainingSection: { gap: 10, marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  quizCard: { backgroundColor: C.accentBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border, gap: 8 },
  quizKicker: { fontSize: 11, fontWeight: '800', color: C.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  quizQuestion: { fontSize: 15, fontWeight: '700', color: C.ink },
  optionCard: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 14, padding: 16 },
  optionLabel: { fontSize: 15, color: C.ink, fontWeight: '600' },
  optionCardCorrect: { borderColor: C.low, backgroundColor: '#EAF3E8' },
  optionCardWrong: { borderColor: C.high, backgroundColor: '#F7E9E6' },
  quizFeedbackGood: { color: C.low, fontWeight: '700', fontSize: 13.5 },
  quizFeedbackBad: { color: C.high, fontWeight: '700', fontSize: 13.5 },

  hazardListHeader: { fontSize: 12.5, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 4 },
  hazardCardIndex: { fontSize: 11, fontWeight: '800', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  hazardCard: { backgroundColor: C.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border, gap: 10 },
  hazardPhotoLarge: { width: '100%', aspectRatio: 4 / 3, borderRadius: 14, overflow: 'hidden', backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' },
  examplePhotoBadge: { position: 'absolute', right: 8, top: 8, backgroundColor: 'rgba(36,36,36,0.72)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  examplePhotoBadgeText: { color: '#fff', fontSize: 10.5, fontWeight: '700' },

  primaryBtn: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 'auto' },
  primaryBtnLabel: { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled: { opacity: 0.4 },
  secondaryBtn: { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  secondaryBtnLabel: { color: C.ink, fontWeight: '700', fontSize: 15 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 4 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: C.ink, marginBottom: 8 },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  sheetRowLabel: { fontSize: 16, color: C.ink },
});
