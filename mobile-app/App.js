import React, { useState } from 'react';
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
import { SEED_REPORTS, CATEGORIES, CATEGORY_ICON, QUIZ_CATEGORIES } from './src/data/seedReports';

const SAMPLE_PHOTO = require('./assets/hazards/sample.jpg');

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
const SERVER_URL = 'https://gently-roland-begun-programmer.trycloudflare.com';

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

function buildQuiz(lang, category) {
  return [1, 2].map((n) => ({
    type: 'choice',
    question: t(lang, `quiz.${category}.q${n}`),
    options: [1, 2, 3].map((a) => t(lang, `quiz.${category}.q${n}.a${a}`)),
    correctIndex: 0,
  })).concat([{ type: 'text', question: t(lang, `quiz.${category}.q3`) }]);
}

export default function App() {
  const [lang, setLang] = useState('en');
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [screen, setScreen] = useState('welcome');
  const [reports, setReports] = useState(SEED_REPORTS);
  const [draft, setDraft] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [quiz, setQuiz] = useState(null); // { questions, qIndex, correct, textAnswer }

  const tr = (key) => t(lang, key);

  function startReport() {
    setDraft({ photoUri: null, samplePhoto: false, pin: null, category: null, severity: null, note: '' });
    setScreen('report_photo');
  }

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return pickSample();
    const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (!res.canceled) {
      setDraft((d) => ({ ...d, photoUri: res.assets[0].uri, samplePhoto: false }));
      setScreen('report_mark');
    }
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return pickSample();
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.6 });
    if (!res.canceled) {
      setDraft((d) => ({ ...d, photoUri: res.assets[0].uri, samplePhoto: false }));
      setScreen('report_mark');
    }
  }

  function pickSample() {
    setDraft((d) => ({ ...d, photoUri: null, samplePhoto: true }));
    setScreen('report_mark');
  }

  function submitReport() {
    const newReport = {
      id: 'r' + Date.now(),
      category: draft.category,
      severity: draft.severity,
      note: draft.note,
      photoUri: draft.photoUri,
      samplePhoto: draft.samplePhoto,
      color: '#556270',
      icon: CATEGORY_ICON[draft.category],
    };
    setReports((prev) => [newReport, ...prev]);
    postReportToServer({
      category: draft.category,
      categoryLabel: tr(`report.category.${draft.category}`),
      severity: draft.severity,
      severityLabel: tr(`report.severity.${draft.severity}`),
      note: draft.note,
      lang,
      langLabel: LANGUAGES[lang]['lang.name'],
    });
    setScreen('report_submitted');
  }

  function startTraining(report) {
    setActiveReport(report);
    if (!QUIZ_CATEGORIES.includes(report.category)) {
      setScreen('training_nogen');
      return;
    }
    setQuiz({ questions: buildQuiz(lang, report.category), qIndex: 0, correct: 0, textAnswer: '' });
    setScreen('training_quiz');
  }

  function answerChoice(optionIndex) {
    const q = quiz.questions[quiz.qIndex];
    const isCorrect = optionIndex === q.correctIndex;
    advanceQuiz(isCorrect ? 1 : 0);
  }

  function submitTextAnswer() {
    advanceQuiz(1);
  }

  function advanceQuiz(scoreDelta) {
    setQuiz((q) => {
      const correct = q.correct + scoreDelta;
      const nextIndex = q.qIndex + 1;
      if (nextIndex >= q.questions.length) {
        setScreen('training_result');
        return { ...q, correct, qIndex: nextIndex };
      }
      return { ...q, correct, qIndex: nextIndex, textAnswer: '' };
    });
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
      <Header lang={lang} tr={tr} onLangPress={() => setShowLangSheet(true)} onBack={backFor(screen)} onBackPress={() => setScreen(backFor(screen))} />

      {screen === 'home' && (
        <Home tr={tr} lang={lang} onReport={startReport} onTraining={() => setScreen('training_list')} onLangPress={() => setShowLangSheet(true)} onReplayWelcome={() => setScreen('welcome')} />
      )}

      {screen === 'report_photo' && (
        <PhotoStep tr={tr} onCamera={pickFromCamera} onLibrary={pickFromLibrary} onSample={pickSample} />
      )}

      {screen === 'report_mark' && draft && (
        <MarkStep
          tr={tr}
          draft={draft}
          onMark={(pin) => setDraft((d) => ({ ...d, pin }))}
          onContinue={() => setScreen('report_category')}
        />
      )}

      {screen === 'report_category' && (
        <CategoryStep
          tr={tr}
          selected={draft?.category}
          onSelect={(cat) => setDraft((d) => ({ ...d, category: cat }))}
          onContinue={() => setScreen('report_severity')}
        />
      )}

      {screen === 'report_severity' && (
        <SeverityStep
          tr={tr}
          draft={draft}
          onSelect={(sev) => setDraft((d) => ({ ...d, severity: sev }))}
          onNote={(note) => setDraft((d) => ({ ...d, note }))}
          onSubmit={submitReport}
        />
      )}

      {screen === 'report_submitted' && draft && (
        <SubmittedStep tr={tr} draft={draft} onDone={() => setScreen('home')} />
      )}

      {screen === 'training_list' && (
        <TrainingList tr={tr} reports={reports} onStart={startTraining} />
      )}

      {screen === 'training_nogen' && (
        <NoQuizStep tr={tr} onDone={() => setScreen('training_list')} />
      )}

      {screen === 'training_quiz' && quiz && (
        <QuizStep
          tr={tr}
          quiz={quiz}
          onChoice={answerChoice}
          onTextChange={(v) => setQuiz((q) => ({ ...q, textAnswer: v }))}
          onTextSubmit={submitTextAnswer}
        />
      )}

      {screen === 'training_result' && quiz && (
        <ResultStep tr={tr} quiz={quiz} onDone={() => setScreen('training_list')} />
      )}

      <LangSheet visible={showLangSheet} tr={tr} lang={lang} onSelect={(code) => { setLang(code); setShowLangSheet(false); }} onClose={() => setShowLangSheet(false)} />
    </SafeAreaView>
  );
}

function backFor(screen) {
  const map = {
    report_photo: 'home',
    report_mark: 'report_photo',
    report_category: 'report_mark',
    report_severity: 'report_category',
    training_list: 'home',
    training_quiz: 'training_list',
    training_nogen: 'training_list',
  };
  return map[screen] || null;
}

function Header({ tr, onLangPress, onBack, onBackPress }) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable onPress={onBackPress} hitSlop={10} style={styles.headerSide}>
          <Text style={styles.headerBack}>‹ {tr('nav.back')}</Text>
        </Pressable>
      ) : (
        <View style={styles.headerSide} />
      )}
      <Text style={styles.headerTitle}>안전톡</Text>
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

function Home({ tr, lang, onReport, onTraining, onLangPress, onReplayWelcome }) {
  return (
    <ScrollView contentContainerStyle={styles.homeWrap}>
      {/* Presenter-only hotspot to replay the welcome sequence on demand — deliberately invisible, not a demo affordance */}
      <Pressable style={styles.hiddenHotspot} onPress={onReplayWelcome} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Pressable style={styles.langPill} onPress={onLangPress}>
          <Text style={styles.langPillLabel}>🌐 {LANGUAGES[lang]['lang.name']}</Text>
        </Pressable>
      </View>
      <Text style={styles.homeTitle}>{tr('home.title')}</Text>
      <Text style={styles.homeSubtitle}>{tr('home.subtitle')}</Text>

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
    </ScrollView>
  );
}

function PhotoStep({ tr, onCamera, onLibrary, onSample }) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>{tr('report.photo.title')}</Text>
      <Text style={styles.stepHint}>{tr('report.photo.hint')}</Text>
      <View style={styles.cameraPreview}>
        <Text style={{ fontSize: 56 }}>📷</Text>
      </View>
      <PrimaryButton label={tr('report.photo.camera')} onPress={onCamera} />
      <SecondaryButton label={tr('report.photo.library')} onPress={onLibrary} />
      <SecondaryButton label={tr('report.photo.sample')} onPress={onSample} />
    </View>
  );
}

function MarkStep({ tr, draft, onMark, onContinue }) {
  const size = Math.min(Dimensions.get('window').width - 48, 340);
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>{tr('report.mark.title')}</Text>
      <Text style={styles.stepHint}>{tr('report.mark.hint')}</Text>
      <Pressable
        style={[styles.markPhoto, { width: size, height: size, backgroundColor: '#333' }]}
        onPress={(e) => onMark({ x: e.nativeEvent.locationX, y: e.nativeEvent.locationY })}
      >
        {draft.photoUri && <Image source={{ uri: draft.photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        {draft.samplePhoto && <Image source={SAMPLE_PHOTO} style={StyleSheet.absoluteFill} resizeMode="cover" />}
        {draft.pin && (
          <View style={[styles.pin, { left: draft.pin.x - 16, top: draft.pin.y - 16 }]}>
            <Text style={{ fontSize: 22 }}>📍</Text>
          </View>
        )}
      </Pressable>
      {draft.pin && <Text style={styles.markedLabel}>✓ {tr('report.mark.marked')}</Text>}
      <PrimaryButton label={tr('nav.continue')} onPress={onContinue} disabled={!draft.pin} />
    </View>
  );
}

function CategoryStep({ tr, selected, onSelect, onContinue }) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>{tr('report.category.title')}</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.catCard, selected === cat && styles.catCardActive]}
            onPress={() => onSelect(cat)}
          >
            <Text style={{ fontSize: 30 }}>{CATEGORY_ICON[cat]}</Text>
            <Text style={[styles.catLabel, selected === cat && { color: C.accent }]}>{tr(`report.category.${cat}`)}</Text>
          </Pressable>
        ))}
      </View>
      <PrimaryButton label={tr('nav.continue')} onPress={onContinue} disabled={!selected} />
    </View>
  );
}

function SeverityStep({ tr, draft, onSelect, onNote, onSubmit }) {
  return (
    <ScrollView contentContainerStyle={styles.stepWrap}>
      <Text style={styles.stepTitle}>{tr('report.severity.title')}</Text>
      <View style={styles.severityRow}>
        {SEVERITIES.map((sev) => (
          <Pressable
            key={sev}
            style={[
              styles.sevPill,
              { borderColor: SEVERITY_COLOR[sev] },
              draft?.severity === sev && { backgroundColor: SEVERITY_COLOR[sev] },
            ]}
            onPress={() => onSelect(sev)}
          >
            <Text style={[styles.sevLabel, draft?.severity === sev && { color: '#fff' }, draft?.severity !== sev && { color: SEVERITY_COLOR[sev] }]}>
              {tr(`report.severity.${sev}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.stepTitle, { fontSize: 16, marginTop: 24 }]}>
        {tr('report.note.title')} <Text style={{ color: C.muted, fontWeight: '400' }}>{tr('report.note.optional')}</Text>
      </Text>
      <TextInput
        style={styles.noteInput}
        placeholder={tr('report.note.placeholder')}
        placeholderTextColor={C.muted}
        multiline
        value={draft?.note}
        onChangeText={onNote}
      />

      <PrimaryButton label={tr('nav.submit')} onPress={onSubmit} disabled={!draft?.severity} />
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
        {!!draft.note && <Text style={styles.summaryNote}>{draft.note}</Text>}
      </View>

      <PrimaryButton label={tr('nav.done')} onPress={onDone} />
    </View>
  );
}

function TrainingList({ tr, reports, onStart }) {
  return (
    <ScrollView contentContainerStyle={styles.stepWrap}>
      <Text style={styles.stepTitle}>{tr('training.list.title')}</Text>
      {reports.map((r) => (
        <View key={r.id} style={styles.reportCard}>
          <View style={[styles.reportThumb, { backgroundColor: r.color }]}>
            {r.photoUri ? (
              <Image source={{ uri: r.photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : r.samplePhoto ? (
              <Image source={SAMPLE_PHOTO} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 26 }}>{r.icon}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportCategory}>{tr(`report.category.${r.category}`)}</Text>
            <Text style={styles.reportSeverity}>{tr(`report.severity.${r.severity}`)}</Text>
          </View>
          <Pressable style={styles.ctaBtn} onPress={() => onStart(r)}>
            <Text style={styles.ctaBtnLabel}>{tr('training.card.cta')}</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function NoQuizStep({ tr, onDone }) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepTitle}>{tr('training.result.title')}</Text>
      <Text style={styles.stepHint}>{tr('training.result.body')}</Text>
      <PrimaryButton label={tr('nav.done')} onPress={onDone} />
    </View>
  );
}

function QuizStep({ tr, quiz, onChoice, onTextChange, onTextSubmit }) {
  const q = quiz.questions[quiz.qIndex];
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepHint}>{tr('training.quiz.title')} · {tr('training.quiz.question')} {quiz.qIndex + 1} {tr('training.quiz.of')} {quiz.questions.length}</Text>
      <Text style={styles.stepTitle}>{q.question}</Text>

      {q.type === 'choice' ? (
        q.options.map((opt, i) => (
          <Pressable key={i} style={styles.optionCard} onPress={() => onChoice(i)}>
            <Text style={styles.optionLabel}>{opt}</Text>
          </Pressable>
        ))
      ) : (
        <>
          <TextInput
            style={styles.noteInput}
            placeholder={tr('training.quiz.otherPlaceholder')}
            placeholderTextColor={C.muted}
            multiline
            value={quiz.textAnswer}
            onChangeText={onTextChange}
          />
          <PrimaryButton label={tr('nav.submit')} onPress={onTextSubmit} />
        </>
      )}
    </View>
  );
}

function ResultStep({ tr, quiz, onDone }) {
  const scored = quiz.questions.filter((q) => q.type === 'choice').length;
  return (
    <View style={styles.stepWrap}>
      <View style={styles.checkCircle}>
        <Text style={{ fontSize: 40 }}>🎉</Text>
      </View>
      <Text style={styles.stepTitle}>{tr('training.result.title')}</Text>
      <Text style={styles.stepHint}>{tr('training.result.body')}</Text>
      <Text style={styles.scoreText}>{quiz.correct}/{scored} {tr('training.result.score')}</Text>
      <PrimaryButton label={tr('nav.done')} onPress={onDone} />
    </View>
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
  homeTitle: { fontSize: 42, fontWeight: '800', color: C.ink, marginTop: 12 },
  homeSubtitle: { fontSize: 16, color: C.inkSoft, marginBottom: 12 },
  bigCard: { borderRadius: 20, padding: 24, gap: 4 },
  bigCardIcon: { fontSize: 30, marginBottom: 6 },
  bigCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  bigCardSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },

  stepWrap: { flex: 1, padding: 20, gap: 14 },
  stepTitle: { fontSize: 22, fontWeight: '800', color: C.ink },
  stepHint: { fontSize: 14, color: C.inkSoft, marginBottom: 4 },

  cameraPreview: {
    height: 220, borderRadius: 18, backgroundColor: '#1c1c1c',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  markPhoto: { borderRadius: 18, alignSelf: 'center', overflow: 'hidden' },
  pin: { position: 'absolute' },
  markedLabel: { textAlign: 'center', color: C.low, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: {
    width: '31%', aspectRatio: 1, borderRadius: 16, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  catCardActive: { borderColor: C.accent, backgroundColor: C.accentBg },
  catLabel: { fontSize: 12, fontWeight: '700', color: C.ink },

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

  reportCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card,
    borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.border,
  },
  reportThumb: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  reportCategory: { fontWeight: '800', color: C.ink, fontSize: 15 },
  reportSeverity: { color: C.inkSoft, fontSize: 13 },
  ctaBtn: { backgroundColor: C.ink, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  ctaBtnLabel: { color: '#fff', fontWeight: '700', fontSize: 12 },

  optionCard: { borderWidth: 1, borderColor: C.border, backgroundColor: C.card, borderRadius: 14, padding: 16 },
  optionLabel: { fontSize: 15, color: C.ink, fontWeight: '600' },
  scoreText: { fontSize: 28, fontWeight: '800', color: C.accent, textAlign: 'center' },

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
