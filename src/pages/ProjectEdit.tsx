import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Save, Check, Share2, Download, Settings2, Eye, Users, Plus, Pencil, Trash2, MapPin, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { saveProject } from '../lib/store'
import { useProject } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { calcTotalProgress, calcSectionProgress } from '../lib/progress'
import { SECTIONS, visibleGroups, visibleFields, makeArea, evalCompute } from '../data/schema'
import type { FieldValue, Project, Section, SurveyArea, Values, WorkType } from '../types/checklist'
import SectionNav from '../components/SectionNav'
import FieldRenderer from '../components/FieldRenderer'
import WorkTypeBadge from '../components/WorkTypeBadge'
import WorkTypePicker from '../components/WorkTypePicker'
import ShareDialog from '../components/ShareDialog'
import DateCalendar from '../components/DateCalendar'

type Phase = 'setup' | 'removal'

// ============================================================
// 現場の編集画面
// ------------------------------------------------------------
// 【保存方式：手動保存】
//   以前はオートセーブ（編集の 500ms 後に自動保存）でしたが、現在は
//   ユーザーが明示的に「保存」ボタンを押したときだけ保存する方式です。
//
//   - draft … 編集中の作業コピー。フィールドを編集すると draft だけが
//             書き換わり、ストア（Firestore / Dexie）にはまだ反映されない。
//   - dirty … draft に未保存の変更があるかのフラグ。各編集操作（patchValue /
//             patchMeta / エリア操作 / 工事種別変更 など）で true になり、
//             保存が完了すると false に戻る。
//   - handleSave() … draft をストアへ保存する。updatedAt（更新日）は
//             この保存時にだけ更新される（編集しただけでは変わらない）。
//
// 【未保存のまま離脱する操作の保護】
//   未保存（dirty=true）のまま画面を離れようとすると編集内容が失われるため、
//   以下の2経路で確認を挟む：
//   1. アプリ内の遷移（「現場一覧」へ戻る等）… tryLeave() が遷移をいったん
//      止め、pendingLeave をセットして UnsavedDialog（保存して移動 / 保存せず
//      移動 / キャンセル の3択）を表示する。
//   2. ブラウザの閉じる・リロード … beforeunload イベントで離脱警告を出す。
//
//   ※ 閲覧モード（isReadOnly）のときは編集できないため dirty にならず、
//     保存ボタンも表示されない。
// ============================================================
export default function ProjectEdit() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const auth = useAuth()
  const myEmail = auth.status === 'signed-in' ? auth.user.email : null

  // ライブ購読で初期値を読み込み
  const load = useProject(id)

  // ローカル編集中の状態（手動保存。保存するまで draft が先行する）
  const [draft, setDraft] = useState<Project | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  // 未保存の変更があるか
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  // 未保存のまま離脱しようとしたときの移動先（確認ダイアログ用）
  const [pendingLeave, setPendingLeave] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id)
  const [activeAreaId, setActiveAreaId] = useState<string>('')
  const [activePhase, setActivePhase] = useState<Phase>('setup')
  const [typePickerOpen, setTypePickerOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    if (load.state === 'loaded' && load.project && !draft) {
      setDraft(load.project)
    }
  }, [load, draft])

  // 未保存の変更があるときだけ、ブラウザの閉じる/リロード/タブ離脱を警告する。
  // （アプリ内の画面遷移は tryLeave() 側で確認ダイアログを出すので、ここは
  //   ブラウザ操作による離脱専用。dirty が変わるたびに登録/解除する）
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // 一部ブラウザで離脱確認を出すのに必要
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // 手動保存：draft をストアへ保存する。
  // ・閲覧モード / 保存中は何もしない（多重保存の防止）
  // ・updatedAt（更新日）と updatedBy は saveProject 内で保存時刻に更新される。
  //   その結果を画面（更新日表示など）にも反映するため setDraft(toSave) で戻す。
  // ・保存完了で dirty を解除し、savedAt に保存時刻を記録する。
  async function handleSave() {
    if (!draft || isReadOnly || saving) return
    setSaving(true)
    try {
      const toSave: Project = { ...draft }
      await saveProject(toSave) // saveProject 内で updatedAt / updatedBy を更新
      setDraft(toSave)
      setDirty(false)
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  // 画面遷移を試みる。
  // 未保存なら遷移を保留して pendingLeave をセット（→ UnsavedDialog 表示）。
  // 未保存がなければそのまま遷移する。
  function tryLeave(to: string) {
    if (dirty) {
      setPendingLeave(to)
      return
    }
    navigate(to)
  }

  const prog = useMemo(() => (draft ? calcTotalProgress(draft) : null), [draft])

  if (!draft) {
    return (
      <div className="grid place-items-center min-h-[60vh] text-ink-subtle">
        読み込み中...
      </div>
    )
  }

  const active: Section = SECTIONS.find(s => s.id === activeSection) ?? SECTIONS[0]
  const isTemporary = draft.workType === 'temporary'
  const isDualPhase = !!active.dualPhase && isTemporary
  const isPerArea = !!active.perArea
  const sameForBoth = draft.phaseSameAs?.[active.id] === true

  // 選択中エリア（無効な場合は先頭にフォールバック）
  const activeArea: SurveyArea =
    draft.areas.find(a => a.id === activeAreaId) ?? draft.areas[0]

  // 権限判定
  const isOwner = !!myEmail && draft.ownerEmail === myEmail
  const myShare = myEmail ? draft.sharedWith?.find(m => m.email === myEmail) : undefined
  // owner = 編集可、shared editor = 編集可、shared viewer = 閲覧のみ
  // ローカルモード (myEmail がない場合) は編集可
  const canEdit = !myEmail || isOwner || myShare?.role === 'editor'
  const isReadOnly = !canEdit

  // dualPhase で「同一条件」ONなら setup を有効フェーズに固定
  const effectivePhase: Phase = sameForBoth ? 'setup' : activePhase

  // 値の取得・更新（perArea / dualPhase / 通常 で分岐）
  function getValue(fieldId: string): FieldValue {
    if (isPerArea) return activeArea?.values[fieldId]
    if (isDualPhase) return draft!.phaseValues?.[effectivePhase]?.[fieldId]
    return draft!.values[fieldId]
  }

  // showWhen 条件判定や carrier_matrix の行数算出に使う、現在表示中の値セット
  const sectionValues: Values = isPerArea
    ? activeArea?.values ?? {}
    : isDualPhase
      ? draft.phaseValues?.[effectivePhase] ?? {}
      : draft.values

  function patchValue(fieldId: string, v: FieldValue) {
    if (isReadOnly) return
    setDirty(true)
    setDraft(prev => {
      if (!prev) return prev
      if (isPerArea) {
        const aid = activeArea?.id
        const areas = prev.areas.map(a =>
          a.id === aid ? { ...a, values: { ...a.values, [fieldId]: v } } : a,
        )
        return { ...prev, areas }
      }
      if (isDualPhase) {
        const pv = prev.phaseValues ?? { setup: {}, removal: {} }
        const next = {
          ...pv,
          [effectivePhase]: { ...pv[effectivePhase], [fieldId]: v },
        }
        return { ...prev, phaseValues: next }
      }
      const nextValues: Values = { ...prev.values, [fieldId]: v }
      return { ...prev, values: nextValues }
    })
  }

  // ---- エリア操作 ----
  function addArea() {
    if (isReadOnly) return
    setDirty(true)
    setDraft(prev => {
      if (!prev) return prev
      const area = makeArea(`エリア${prev.areas.length + 1}`)
      setActiveAreaId(area.id)
      return { ...prev, areas: [...prev.areas, area] }
    })
  }

  function renameArea(id: string, name: string) {
    if (isReadOnly) return
    setDirty(true)
    setDraft(prev =>
      prev
        ? { ...prev, areas: prev.areas.map(a => (a.id === id ? { ...a, name } : a)) }
        : prev,
    )
  }

  function deleteArea(id: string) {
    if (isReadOnly) return
    setDirty(true)
    setDraft(prev => {
      if (!prev || prev.areas.length <= 1) return prev
      const areas = prev.areas.filter(a => a.id !== id)
      if (activeAreaId === id) setActiveAreaId(areas[0].id)
      return { ...prev, areas }
    })
  }

  function patchMeta<K extends keyof Project>(key: K, v: Project[K]) {
    if (isReadOnly) return
    setDirty(true)
    setDraft(prev => (prev ? { ...prev, [key]: v } : prev))
  }

  function toggleSameForBoth() {
    if (isReadOnly) return
    setDirty(true)
    setDraft(prev => {
      if (!prev) return prev
      const cur = prev.phaseSameAs?.[active.id] === true
      const nextSame = !cur
      const phaseSameAs = { ...(prev.phaseSameAs ?? {}), [active.id]: nextSame }
      // 同一条件ON時、撤去フェーズに setup の値をコピーしておく（後でPDF出力等に使える）
      let phaseValues = prev.phaseValues ?? { setup: {}, removal: {} }
      if (nextSame) {
        phaseValues = { ...phaseValues, removal: { ...phaseValues.setup } }
      }
      return { ...prev, phaseSameAs, phaseValues }
    })
  }

  function changeWorkType(newType: WorkType) {
    if (isReadOnly) return
    setDirty(true)
    setDraft(prev => {
      if (!prev) return prev
      const next = { ...prev, workType: newType }
      // 仮設に切替時はphaseValuesを用意
      if (newType === 'temporary' && !next.phaseValues) {
        next.phaseValues = { setup: {}, removal: {} }
      }
      return next
    })
    setTypePickerOpen(false)
  }

  return (
    <div className="min-h-full flex flex-col lg:flex-row">
      {/* =================== サイドバー (lg以上) =================== */}
      <aside className="hidden lg:flex flex-col w-[300px] xl:w-[340px] border-r border-surface-border bg-surface shrink-0">
        <div className="p-4 border-b border-surface-border">
          <button onClick={() => tryLeave('/')} className="btn-ghost -ml-2">
            <ChevronLeft size={16} /> 現場一覧
          </button>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <WorkTypeBadge workType={draft.workType} />
            {!isReadOnly && (
              <button
                onClick={() => setTypePickerOpen(true)}
                className="text-xs text-ink-subtle hover:text-brand-700 inline-flex items-center gap-1"
              >
                <Settings2 size={11} /> 変更
              </button>
            )}
            {isReadOnly && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface border border-surface-border text-ink-muted">
                <Eye size={11} /> 閲覧モード
              </span>
            )}
            {(draft.sharedWith?.length ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700">
                <Users size={11} /> {draft.sharedWith?.length}人
              </span>
            )}
          </div>
          <h1 className="font-bold text-lg text-ink mt-2 truncate">
            {draft.siteName || '（無題の現場）'}
          </h1>
          <SaveStatus savedAt={savedAt} dirty={dirty} saving={saving} />
        </div>

        <div className="p-4 space-y-3 border-b border-surface-border">
          <MetaFields draft={draft} patchMeta={patchMeta} readOnly={isReadOnly} />
        </div>

        <div className="p-4 border-b border-surface-border">
          <ProgressBar prog={prog} />
        </div>

        <div className="p-3 flex-1 overflow-y-auto">
          <SectionNav
            variant="desktop"
            project={draft}
            activeId={activeSection}
            onChange={setActiveSection}
          />
        </div>

        <div className="p-3 border-t border-surface-border space-y-2">
          {!isReadOnly && (
            <button
              className="btn-primary w-full disabled:opacity-50"
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              <Save size={14} /> {saving ? '保存中…' : dirty ? '保存' : '保存済み'}
            </button>
          )}
          <button className="btn-outline w-full" onClick={() => setShareOpen(true)}>
            <Share2 size={14} /> 共有
          </button>
          <button className="btn-outline w-full" onClick={() => alert('PDF出力は v2 で実装予定')}>
            <Download size={14} /> PDF出力
          </button>
        </div>
      </aside>

      {/* =================== メイン =================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* スマホヘッダー */}
        <header
          className="lg:hidden sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-surface-border"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="px-3 h-12 flex items-center gap-2">
            <button onClick={() => tryLeave('/')} className="btn-ghost -ml-1 px-2">
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={draft.siteName}
                onChange={e => patchMeta('siteName', e.target.value)}
                placeholder="現場名を入力"
                disabled={isReadOnly}
                className="w-full bg-transparent font-semibold text-ink text-[15px]
                           focus:outline-none placeholder:text-ink-subtle disabled:opacity-80"
              />
              {isReadOnly && (
                <div className="text-[10px] text-ink-subtle leading-none mt-0.5">
                  <Eye size={9} className="inline mr-0.5" />閲覧モード
                </div>
              )}
            </div>
            <button
              onClick={() => isReadOnly ? null : setTypePickerOpen(true)}
              className="inline-flex items-center"
              aria-label="工事種別を変更"
              disabled={isReadOnly}
            >
              <WorkTypeBadge workType={draft.workType} />
            </button>
            <button
              onClick={() => setShareOpen(true)}
              className="p-1.5 text-ink-subtle hover:text-brand-700 rounded-md"
              aria-label="共有"
            >
              <Share2 size={16} />
            </button>
            {!isReadOnly ? (
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className={clsx(
                  'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition',
                  dirty
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'bg-surface border border-surface-border text-emerald-600',
                )}
              >
                {dirty ? <Save size={13} /> : <Check size={13} />}
                {saving ? '保存中' : dirty ? '保存' : '保存済'}
              </button>
            ) : (
              <SaveStatus savedAt={savedAt} dirty={dirty} saving={saving} compact />
            )}
          </div>
          {prog && <ThinProgress prog={prog} />}
        </header>

        {/* メタ情報 (スマホ) - 折りたたみ式 */}
        <div className="lg:hidden p-3">
          <details className="card p-3 [&_summary]:cursor-pointer">
            <summary className="font-semibold text-sm text-ink select-none">
              現場情報（作業開始日・担当者など）
            </summary>
            <div className="pt-3 space-y-3">
              <MetaFields draft={draft} patchMeta={patchMeta} readOnly={isReadOnly} />
            </div>
          </details>
        </div>

        {/* セクション本体 */}
        <div className="flex-1 px-3 sm:px-6 lg:px-10 py-4 lg:py-8 pb-32 lg:pb-12 max-w-3xl mx-auto w-full">
          <div className="flex items-baseline justify-between mb-4 gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-ink">{active.title}</h2>
            <SectionStatBadge
              sectionId={active.id}
              project={draft}
              areaId={isPerArea ? activeArea?.id : undefined}
            />
          </div>

          {/* エリア切替（perArea セクションのみ） */}
          {isPerArea && (
            <AreaSwitcher
              project={draft}
              sectionId={active.id}
              activeAreaId={activeArea?.id ?? ''}
              onSelect={setActiveAreaId}
              onAdd={addArea}
              onRename={renameArea}
              onDelete={deleteArea}
              readOnly={isReadOnly}
            />
          )}

          {/* 共通カテゴリの注記 */}
          {!isPerArea && !isDualPhase && (
            <p className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-subtle">
              <MapPin size={12} /> このカテゴリは現場全体で共通です
            </p>
          )}

          {/* 仮設フェーズ切替 + 同一条件スイッチ */}
          {isDualPhase && (
            <PhaseSwitcher
              activePhase={effectivePhase}
              onChange={setActivePhase}
              sameForBoth={sameForBoth}
              onToggleSame={toggleSameForBoth}
            />
          )}

          <div className="space-y-4">
            {visibleGroups(active, draft.workType, sectionValues).map(g => (
              <section key={g.id} className="card p-4 sm:p-5">
                {g.title && (
                  <h3 className="font-semibold text-[15px] text-ink mb-1.5">{g.title}</h3>
                )}
                {g.description && (
                  <p className="text-xs text-ink-muted mb-3">{g.description}</p>
                )}
                <div className="space-y-4 mt-3">
                  {visibleFields(g, draft.workType, sectionValues).map(f => {
                    const cnt = f.countFrom ? Number(sectionValues[f.countFrom]) || 0 : undefined
                    const computed = f.type === 'computed' ? evalCompute(f, sectionValues) : undefined
                    return (
                      <FieldRenderer
                        key={f.id}
                        field={f}
                        value={getValue(f.id)}
                        onChange={v => patchValue(f.id, v)}
                        readOnly={isReadOnly}
                        count={cnt}
                        computed={computed}
                        siteName={draft.siteName}
                        date={draft.date}
                      />
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* セクション間ナビ (前/次) */}
          <SectionPager activeId={activeSection} onChange={setActiveSection} />
        </div>

        {/* 下部固定タブ (スマホ) */}
        <div className="lg:hidden">
          <SectionNav
            variant="mobile"
            project={draft}
            activeId={activeSection}
            onChange={setActiveSection}
          />
        </div>
      </div>

      <WorkTypePicker
        open={typePickerOpen}
        title="工事種別を変更"
        current={draft.workType}
        onClose={() => setTypePickerOpen(false)}
        onPick={changeWorkType}
      />

      <ShareDialog
        open={shareOpen}
        project={draft}
        currentUserEmail={myEmail}
        onClose={() => setShareOpen(false)}
      />

      {/* 未保存のまま離脱しようとしたときの確認 */}
      {pendingLeave !== null && (
        <UnsavedDialog
          saving={saving}
          onSaveAndLeave={async () => {
            await handleSave()
            const to = pendingLeave
            setPendingLeave(null)
            navigate(to)
          }}
          onDiscard={() => {
            const to = pendingLeave
            setDirty(false)
            setPendingLeave(null)
            navigate(to)
          }}
          onCancel={() => setPendingLeave(null)}
        />
      )}
    </div>
  )
}

// ============================================================
// 未保存確認ダイアログ
// ------------------------------------------------------------
// 未保存のまま画面を離れようとしたときに表示する3択モーダル。
//   ・保存して移動  … onSaveAndLeave（保存してから遷移）
//   ・保存せず移動  … onDiscard（編集を破棄して遷移）
//   ・キャンセル    … onCancel（この画面に留まる。背景クリックも同じ）
// saving 中は誤操作防止のため全ボタンを無効化する。
// ============================================================
function UnsavedDialog({
  saving,
  onSaveAndLeave,
  onDiscard,
  onCancel,
}: {
  saving: boolean
  onSaveAndLeave: () => void
  onDiscard: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm card p-5 shadow-pop">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-amber-50 grid place-items-center">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-ink">保存していない変更があります</h2>
            <p className="text-sm text-ink-muted mt-1">
              この画面を離れると、保存していない編集内容は失われます。
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <button
            className="btn-primary w-full disabled:opacity-50"
            onClick={onSaveAndLeave}
            disabled={saving}
          >
            <Save size={14} /> {saving ? '保存中…' : '保存して移動'}
          </button>
          <button className="btn-outline w-full" onClick={onDiscard} disabled={saving}>
            保存せず移動
          </button>
          <button className="btn-ghost w-full" onClick={onCancel} disabled={saving}>
            キャンセル（この画面に留まる）
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// パーツ
// ============================================================
function MetaFields({
  draft,
  patchMeta,
  readOnly,
}: {
  draft: Project
  patchMeta: <K extends keyof Project>(k: K, v: Project[K]) => void
  readOnly?: boolean
}) {
  return (
    <>
      <div className="hidden lg:block">
        <label className="field-label">現場名</label>
        <input
          className="input mt-1"
          value={draft.siteName}
          onChange={e => patchMeta('siteName', e.target.value)}
          placeholder="〇〇ビル"
          disabled={readOnly}
        />
      </div>
      <div>
        <label className="field-label">プロジェクト名</label>
        <input
          className="input mt-1"
          value={draft.projectName ?? ''}
          onChange={e => patchMeta('projectName', e.target.value)}
          placeholder="現場一覧で表示する名称"
          disabled={readOnly}
        />
      </div>
      <div>
        <label className="field-label">作業開始日</label>
        <DateCalendar
          value={draft.date}
          onChange={v => patchMeta('date', v)}
          disabled={readOnly}
        />
      </div>
      <div>
        <label className="field-label">担当者</label>
        <input
          className="input mt-1"
          value={draft.inCharge}
          onChange={e => patchMeta('inCharge', e.target.value)}
          disabled={readOnly}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="field-label">作成日時</div>
          <div className="mt-1 text-ink-muted tabular-nums">{formatDateTime(draft.createdAt)}</div>
        </div>
        <div>
          <div className="field-label">更新日</div>
          <div className="mt-1 text-ink-muted tabular-nums">{formatDateTime(draft.updatedAt)}</div>
        </div>
      </div>
    </>
  )
}

/** タイムスタンプ(ms)を "YYYY/MM/DD HH:mm" で表示する */
function formatDateTime(ts: number): string {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function ProgressBar({ prog }: { prog: ReturnType<typeof calcTotalProgress> | null }) {
  if (!prog) return null
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
        <span className="font-medium">入力進捗</span>
        <span className="tabular-nums">
          {prog.filled}/{prog.total}（{Math.round(prog.ratio * 100)}%）
        </span>
      </div>
      <div className="h-2 bg-surface-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-500 to-brand-700 rounded-full transition-[width]"
          style={{ width: `${Math.max(prog.ratio * 100, 4)}%` }}
        />
      </div>
    </div>
  )
}

function ThinProgress({ prog }: { prog: ReturnType<typeof calcTotalProgress> }) {
  return (
    <div className="h-1 bg-surface-border">
      <div
        className="h-full bg-gradient-to-r from-brand-500 to-brand-700 transition-[width]"
        style={{ width: `${prog.ratio * 100}%` }}
      />
    </div>
  )
}

function SaveStatus({
  savedAt,
  dirty,
  saving,
  compact,
}: {
  savedAt: number | null
  dirty: boolean
  saving?: boolean
  compact?: boolean
}) {
  const base = clsx('inline-flex items-center gap-1 text-xs', compact ? '' : 'mt-1')
  if (saving) {
    return <span className={clsx(base, 'text-ink-subtle')}><Save size={12} /> 保存中…</span>
  }
  if (dirty) {
    return <span className={clsx(base, 'text-amber-600')}><Save size={12} /> 未保存の変更あり</span>
  }
  if (!savedAt) {
    return <span className={clsx(base, 'text-ink-subtle')}><Save size={12} /> 未保存</span>
  }
  return <span className={clsx(base, 'text-emerald-600')}><Check size={12} /> 保存済み</span>
}

function SectionStatBadge({
  sectionId,
  project,
  areaId,
}: {
  sectionId: string
  project: Project
  areaId?: string
}) {
  const s = calcSectionProgress(sectionId, project, undefined, areaId)
  return (
    <span className="text-xs text-ink-subtle tabular-nums">
      {s.filled}/{s.total} 項目入力済み
    </span>
  )
}

function AreaSwitcher({
  project,
  sectionId,
  activeAreaId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  readOnly,
}: {
  project: Project
  sectionId: string
  activeAreaId: string
  onSelect: (id: string) => void
  onAdd: () => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  readOnly: boolean
}) {
  const [editing, setEditing] = useState(false)
  const canDelete = project.areas.length > 1

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-ink-muted inline-flex items-center gap-1">
          <MapPin size={12} /> エリア（このカテゴリはエリアごとに記録）
        </span>
        {!readOnly && (
          <button
            onClick={() => setEditing(e => !e)}
            className="text-xs text-ink-subtle hover:text-brand-700 inline-flex items-center gap-1"
          >
            <Pencil size={11} /> {editing ? '完了' : '編集'}
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {project.areas.map(area => {
          const prog = calcSectionProgress(sectionId, project, undefined, area.id)
          const isActive = area.id === activeAreaId
          if (editing) {
            return (
              <div
                key={area.id}
                className="shrink-0 snap-start flex items-center gap-1 rounded-xl border border-surface-border bg-surface px-2 py-1.5"
              >
                <input
                  value={area.name}
                  onChange={e => onRename(area.id, e.target.value)}
                  className="w-24 bg-transparent text-sm font-medium text-ink focus:outline-none"
                  aria-label="エリア名"
                />
                <button
                  onClick={() => canDelete && onDelete(area.id)}
                  disabled={!canDelete}
                  className="text-ink-subtle hover:text-red-600 disabled:opacity-30"
                  aria-label="エリアを削除"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          }
          return (
            <button
              key={area.id}
              onClick={() => onSelect(area.id)}
              className={clsx(
                'shrink-0 snap-start flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2 transition text-left min-w-[6rem]',
                isActive
                  ? 'bg-brand-700 border-brand-700 text-white shadow-sm'
                  : 'bg-surface border-surface-border text-ink-muted hover:border-brand-200 hover:bg-brand-50',
              )}
            >
              <span className="text-sm font-semibold truncate max-w-[9rem]">{area.name}</span>
              <span
                className={clsx(
                  'badge tabular-nums',
                  isActive
                    ? 'bg-white/20 text-white'
                    : prog.status === 'done'
                      ? 'badge-done'
                      : prog.status === 'partial'
                        ? 'badge-partial'
                        : 'badge-empty',
                )}
              >
                {prog.filled}/{prog.total}
              </span>
            </button>
          )
        })}

        {!readOnly && !editing && (
          <button
            onClick={onAdd}
            className="shrink-0 snap-start grid place-items-center rounded-xl border border-dashed border-surface-border text-ink-subtle hover:border-brand-400 hover:text-brand-700 px-3 min-w-[3rem]"
            aria-label="エリアを追加"
          >
            <Plus size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

function PhaseSwitcher({
  activePhase,
  onChange,
  sameForBoth,
  onToggleSame,
}: {
  activePhase: Phase
  onChange: (p: Phase) => void
  sameForBoth: boolean
  onToggleSame: () => void
}) {
  return (
    <div className="mb-4 card p-3 sm:p-4 bg-brand-50/40 border-brand-200">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="text-xs sm:text-sm text-ink-muted">
          仮設は<strong className="text-ink mx-0.5">設置時</strong>と
          <strong className="text-ink mx-0.5">撤去時</strong>でそれぞれ確認します
        </div>
        {/* 同一条件スイッチ */}
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <span className="text-xs sm:text-sm text-ink-muted">設置=撤去で同一条件</span>
          <span
            className={clsx(
              'relative inline-block w-9 h-5 rounded-full transition',
              sameForBoth ? 'bg-brand-700' : 'bg-surface-border',
            )}
            onClick={onToggleSame}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                sameForBoth ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
              )}
            />
          </span>
        </label>
      </div>
      {!sameForBoth && (
        <div className="mt-3 grid grid-cols-2 gap-1.5 p-1 bg-surface rounded-xl border border-surface-border">
          <PhaseTab label="設置時" value="setup"   active={activePhase} onClick={onChange} />
          <PhaseTab label="撤去時" value="removal" active={activePhase} onClick={onChange} />
        </div>
      )}
      {sameForBoth && (
        <p className="mt-2 text-xs text-ink-subtle">
          ※ 設置時の入力内容が撤去時にもそのまま使われます
        </p>
      )}
    </div>
  )
}

function PhaseTab({
  label,
  value,
  active,
  onClick,
}: {
  label: string
  value: Phase
  active: Phase
  onClick: (p: Phase) => void
}) {
  const isActive = value === active
  return (
    <button
      onClick={() => onClick(value)}
      className={clsx(
        'py-2 rounded-lg text-sm font-medium transition',
        isActive ? 'bg-brand-700 text-white shadow-sm' : 'text-ink-muted hover:bg-brand-50',
      )}
    >
      {label}
    </button>
  )
}

function SectionPager({ activeId, onChange }: { activeId: string; onChange: (id: string) => void }) {
  const idx = SECTIONS.findIndex(s => s.id === activeId)
  const prev = idx > 0 ? SECTIONS[idx - 1] : null
  const next = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <button
        className="btn-outline disabled:invisible"
        disabled={!prev}
        onClick={() => prev && onChange(prev.id)}
      >
        <ChevronLeft size={14} />
        <span className="truncate max-w-[10rem]">{prev?.title ?? ''}</span>
      </button>
      <button
        className="btn-primary disabled:invisible"
        disabled={!next}
        onClick={() => next && onChange(next.id)}
      >
        <span className="truncate max-w-[10rem]">{next?.title ?? ''}</span>
        <ChevronLeft size={14} className="rotate-180" />
      </button>
    </div>
  )
}
