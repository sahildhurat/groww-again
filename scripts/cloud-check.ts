// Cloud storage check (R36, written by Claude; R40, 7 Nov 2026: SIP Passbook; R41: settings check first). Run: npm run cloud:check
// Tests the app's own CloudStore against the real Supabase project in .env.local, the way a signed-in
// investor uses it: sign-up, consent, "Start from the demo SIP", uploads, Life Markers (migration 003), signed URLs,
// Future Thread and the passbook name, export, delete, and that one account can never read another's rows or files.
// It creates two throwaway accounts (cloudcheck-...@example.com) and deletes them, and their files, at the end.
// It never prints a key or any part of one.
import { loadEnvConfig } from "@next/env";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import JSZip from "jszip";
import { CloudStore } from "../lib/store";
import seed from "../data/demo-seed.json";

loadEnvConfig(process.cwd());
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let pass = 0;
let fail = 0;
const ok = (label: string, cond: boolean, detail = "") => {
  if (cond) pass++;
  else fail++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${detail ? `  (${detail})` : ""}`);
};
const throws = async (fn: () => Promise<unknown>) => {
  try {
    await fn();
    return "";
  } catch (e: any) {
    return String(e?.message || e) || "error";
  }
};

// R41 (Claude): check the three settings before any request, without printing them. The first owner run failed with
// "Invalid path specified in request URL", which Supabase returns when the project URL has a path after the host.
function jwtRole(key: string): { role?: string; ref?: string } {
  try {
    const part = key.split(".")[1];
    const json = JSON.parse(Buffer.from(part.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8"));
    return { role: json.role, ref: json.ref };
  } catch {
    return {};
  }
}
function keyKind(key: string): { kind: string; role?: string; ref?: string } {
  if (key.startsWith("sb_publishable_")) return { kind: "publishable", role: "anon" };
  if (key.startsWith("sb_secret_")) return { kind: "secret", role: "service_role" };
  if (key.startsWith("eyJ")) return { kind: "legacy", ...jwtRole(key) };
  return { kind: "unknown" };
}
function checkSettings(): string[] {
  const problems: string[] = [];
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (raw !== raw.trim()) problems.push("NEXT_PUBLIC_SUPABASE_URL has a space before or after it. Remove it.");
  if (/^["']|["']$/.test(raw.trim())) problems.push("NEXT_PUBLIC_SUPABASE_URL is wrapped in quotes. Remove the quotes.");
  let ref = "";
  try {
    const u = new URL(raw.trim().replace(/^["']|["']$/g, ""));
    if (/(^|\.)supabase\.com$/i.test(u.hostname)) {
      problems.push("NEXT_PUBLIC_SUPABASE_URL is a dashboard link (supabase.com). Use the Project URL instead: https://<project-ref>.supabase.co (Project Settings → Data API, or the Connect button).");
    } else {
      if (u.protocol !== "https:") problems.push("NEXT_PUBLIC_SUPABASE_URL must start with https://");
      if (!/\.supabase\.co$/i.test(u.hostname)) problems.push("NEXT_PUBLIC_SUPABASE_URL should end in .supabase.co");
      else ref = u.hostname.split(".")[0];
      if (u.pathname !== "/" && u.pathname !== "") {
        problems.push(`NEXT_PUBLIC_SUPABASE_URL has "${u.pathname}" after .supabase.co. Delete that part, so the line ends in .supabase.co`);
      }
      if (u.search || u.hash) problems.push("NEXT_PUBLIC_SUPABASE_URL has ? or # after the address. Delete everything after .supabase.co");
    }
  } catch {
    problems.push("NEXT_PUBLIC_SUPABASE_URL is not a web address. It should look like https://<project-ref>.supabase.co");
  }
  const anon = keyKind(ANON.trim());
  const svc = keyKind(SERVICE.trim());
  if (ANON !== ANON.trim() || SERVICE !== SERVICE.trim()) problems.push("A key has a space before or after it. Remove it.");
  if (/^["']/.test(ANON.trim()) || /^["']/.test(SERVICE.trim())) problems.push("A key is wrapped in quotes. Remove the quotes.");
  console.log(`Key types: anon value = ${anon.kind}${anon.role ? ` (${anon.role})` : ""}; service-role value = ${svc.kind}${svc.role ? ` (${svc.role})` : ""}`);
  if (anon.role === "service_role") {
    problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY holds the service_role/secret key. Swap the two keys: this one is sent to every browser.");
  } else if (anon.kind === "unknown" || (anon.kind === "legacy" && anon.role !== "anon")) {
    problems.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is not an anon or publishable key (Project Settings → API Keys).");
  }
  if (svc.role === "anon") problems.push("SUPABASE_SERVICE_ROLE_KEY holds the anon/publishable key. Use the service_role (or secret) key.");
  else if (svc.kind === "unknown" || (svc.kind === "legacy" && svc.role !== "service_role")) {
    problems.push("SUPABASE_SERVICE_ROLE_KEY is not a service_role or secret key (Project Settings → API Keys).");
  }
  for (const [name, k] of [["anon", anon], ["service-role", svc]] as const) {
    if (ref && k.kind === "legacy" && k.ref && k.ref !== ref) problems.push(`The ${name} key belongs to a different Supabase project than the URL.`);
  }
  return problems;
}

async function main() {
  console.log(`NEXT_PUBLIC_SUPABASE_URL set: ${URL_ ? "yes" : "NO"}; anon key set: ${ANON ? "yes" : "NO"}; service-role key set: ${SERVICE ? "yes" : "NO"}`);
  if (!URL_ || !ANON || !SERVICE) {
    console.log("Add the three Supabase values to .env.local, then run this again.");
    process.exitCode = 1;
    return;
  }
  const problems = checkSettings();
  if (problems.length) {
    for (const p of problems) console.log(`FAIL  settings: ${p}`);
    console.log("\nFix these in .env.local, save, and run npm run cloud:check again. No accounts were created.");
    process.exitCode = 1;
    return;
  }
  console.log("PASS  settings: the URL and both keys look right");
  const admin = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
  const tag = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const pw = `Cc-${tag}-${Math.random().toString(36).slice(2)}!`;
  const emailA = `cloudcheck-a-${tag}@example.com`;
  const emailB = `cloudcheck-b-${tag}@example.com`;
  const userIds: string[] = [];

  try {
    // 1. Sign-up the way the app does it. With "Confirm email" off, sign-up returns a session at once.
    const a: SupabaseClient = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
    const su = await a.auth.signUp({ email: emailA, password: pw });
    if (su.data.user) userIds.push(su.data.user.id);
    ok("sign-up works", !su.error, su.error?.message);
    if (su.error) throw new Error(`sign-up failed, so nothing else can be checked: ${su.error.message}`);
    ok('sign-up returns a session ("Confirm email" is off)', Boolean(su.data.session), su.data.session ? "" : "no session: turn Confirm email off in Authentication > Providers > Email");
    if (!su.data.session) {
      const si = await a.auth.signInWithPassword({ email: emailA, password: pw });
      if (si.error) throw new Error(`cannot sign in account A: ${si.error.message}`);
    }
    const uidA = (await a.auth.getUser()).data.user!.id;

    const cb = await admin.auth.admin.createUser({ email: emailB, password: pw, email_confirm: true });
    if (cb.data.user) userIds.push(cb.data.user.id);
    const b: SupabaseClient = createClient(URL_, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
    const sib = await b.auth.signInWithPassword({ email: emailB, password: pw });
    if (sib.error) throw new Error(`cannot sign in account B: ${sib.error.message}`);
    const uidB = (await b.auth.getUser()).data.user!.id;

    const A = new CloudStore(a);

    // 2. Consent comes first.
    const before = await throws(() => A.startFromDemo());
    ok("a write before consent is refused", /consent/i.test(before), before.slice(0, 80));
    const rc = await throws(() => A.recordConsent("cloud-check"));
    ok("consent is recorded (consents table from migration 002 exists)", rc === "", rc.slice(0, 120));
    ok("consent is read back", await A.isConsented());

    // 3. Start from the demo SIP.
    const sd = await throws(() => A.startFromDemo());
    ok("Start from the demo SIP", sd === "", sd.slice(0, 120));
    const sip = await A.getSip();
    const insts = await A.getInstalments();
    ok("the SIP is in the account", Boolean(sip?.id) && sip?.name === (seed as any).sip.name);
    ok(`all ${(seed as any).instalments.length} instalments are copied`, insts.length === (seed as any).instalments.length, `got ${insts.length}`);
    const unitsOk = insts.every((i) => (i.nav ? Math.abs((i.units ?? 0) - Math.round((i.amount / i.nav) * 1000) / 1000) < 0.0006 : i.units === null));
    ok("units equal amount / NAV, rounded to 3 decimals", unitsOk);
    ok("the promise is NOT shown at cancel unless the investor opts in", sip?.show_promise_at_cancel === false);

    // 4. Photo and voice uploads (the voice type is what Chrome reports, with a codecs parameter).
    const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0, 4, 1, 2, 0xff, 0xd9])], { type: "image/jpeg" });
    const voice = new Blob([new Uint8Array(2048).fill(7)], { type: "audio/webm;codecs=opus" });
    let photoPath = "";
    let voicePath = "";
    const up1 = await throws(async () => (photoPath = await A.uploadMedia(jpeg, "memory-photo.jpg")));
    ok("photo upload into the investor's own folder", up1 === "" && photoPath.startsWith(`${uidA}/`), up1.slice(0, 120));
    const up2 = await throws(async () => (voicePath = await A.uploadMedia(voice, "memory-voice.webm")));
    ok('voice upload labelled "audio/webm;codecs=opus"', up2 === "" && voicePath.startsWith(`${uidA}/`), up2.slice(0, 120));
    const big = await a.storage.from("memories").upload(`${uidA}/x/big.jpg`, new Blob([new Uint8Array(6 * 1024 * 1024)], { type: "image/jpeg" }), { contentType: "image/jpeg" });
    ok("a file over 5 MB is refused (bucket limit)", Boolean(big.error), big.error ? "" : "accepted: run migration 002");
    const txt = await a.storage.from("memories").upload(`${uidA}/x/note.txt`, new Blob(["hello"], { type: "text/plain" }), { contentType: "text/plain" });
    ok("a file type outside the list is refused", Boolean(txt.error), txt.error ? "" : "accepted: run migration 002");

    // 5. Life Markers (SPEC-07 §7, migration 003): photo, voice and text on any month, files under <user>/markers/.
    const mPhoto = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0, 4, 9, 9, 0xff, 0xd9])], { type: "image/jpeg" });
    let markerPhotoPath = "";
    const um = await throws(async () => (markerPhotoPath = await A.uploadMedia(mPhoto, "marker.jpg", "markers")));
    ok("a Life Marker photo goes into the investor's markers folder", um === "" && markerPhotoPath.startsWith(`${uidA}/markers/`), um.slice(0, 120));
    let idPhoto = "", idVoice = "", idText = "";
    const sm = await throws(async () => {
      idPhoto = await A.saveMarker({ month: "2025-10", kind: "photo", caption: "cloud check photo", storage_path: markerPhotoPath });
      idVoice = await A.saveMarker({ month: "2026-07", kind: "voice", caption: "cloud check voice", storage_path: voicePath });
      idText = await A.saveMarker({ month: "2026-12", kind: "text", caption: "cloud check text" });
    });
    ok("photo, voice and text markers are saved (life_markers table from migration 003 exists)", sm === "" && !!idPhoto && !!idVoice && !!idText, sm.slice(0, 160));
    const listed = await A.listMarkers();
    ok("the three markers read back with their months", listed.length === 3 && ["2025-10", "2026-07", "2026-12"].every((m) => listed.some((x) => x.month === m)), `got ${listed.length}`);
    const mUrl = await A.getMediaUrl(markerPhotoPath);
    const mGot = mUrl ? await fetch(mUrl) : null;
    ok("the marker photo opens through a signed URL", Boolean(mGot?.ok) && (await mGot!.arrayBuffer()).byteLength === 10);
    const ec = await throws(() => A.updateMarker(idText, { caption: "edited caption" }));
    ok("a marker's caption can be edited", ec === "" && (await A.listMarkers()).find((x) => x.id === idText)?.caption === "edited caption", ec.slice(0, 120));
    // Replacing a marker's photo removes the old file.
    let newPhotoPath = "";
    await throws(async () => (newPhotoPath = await A.uploadMedia(mPhoto, "marker2.jpg", "markers")));
    const rp = await throws(() => A.updateMarker(idPhoto, { storage_path: newPhotoPath }));
    const oldGone = await admin.storage.from("memories").download(markerPhotoPath);
    ok("replacing a marker photo deletes the old file", rp === "" && Boolean(oldGone.error), rp.slice(0, 120));
    // Deleting a marker removes the row and its file.
    const dm = await throws(() => A.deleteMarker(idPhoto));
    const rowGone = await admin.from("life_markers").select("id").eq("id", idPhoto);
    const fileGone = await admin.storage.from("memories").download(newPhotoPath);
    ok("deleting a marker removes its row and its file", dm === "" && (rowGone.data ?? []).length === 0 && Boolean(fileGone.error), dm.slice(0, 120));

    // 6. Future Thread and the passbook name.
    const sp = await throws(() => A.savePromise({ text: "For my bike.", oneLine: "For my bike.", goal: "bike", forWhom: "me", horizon: "", audioPath: voicePath, showAtCancel: false }));
    const sd2 = await throws(() => A.saveDedication("For my first bike"));
    const sip2 = await A.getSip();
    ok("the Future Thread and its voice note are saved", sp === "" && sip2?.promise_audio_path === voicePath, sp.slice(0, 120));
    ok("the passbook name is saved on the SIP", sd2 === "" && sip2?.dedication === "For my first bike", sd2.slice(0, 120));

    // 7. Another account sees none of it.
    const bRows = await b.from("sips").select("id").eq("user_id", uidA);
    ok("account B cannot read account A's SIP", (bRows.data ?? []).length === 0);
    const bMk = await b.from("life_markers").select("id").eq("user_id", uidA);
    ok("account B cannot read account A's Life Markers", (bMk.data ?? []).length === 0);
    const bDl = await b.storage.from("memories").download(voicePath);
    ok("account B cannot download account A's voice note", Boolean(bDl.error) || !bDl.data);
    const bUrl = await b.storage.from("memories").createSignedUrl(voicePath, 60);
    ok("account B cannot make a link to account A's files", Boolean(bUrl.error) || !bUrl.data?.signedUrl);
    await b.from("life_markers").update({ caption: "changed by B" }).eq("user_id", uidA);
    ok("account B cannot change account A's markers", (await A.listMarkers()).every((x) => x.caption !== "changed by B"));
    const bIns = await b.from("life_markers").insert({ user_id: uidA, month: "2026-01", kind: "text", caption: "planted by B" });
    ok("account B cannot add a marker to account A", Boolean(bIns.error));
    await b.from("sips").update({ name: "changed by B" }).eq("user_id", uidA);
    ok("account B cannot change account A's SIP", (await A.getSip())?.name === (seed as any).sip.name);
    const gl = await a.from("gate_log").insert({ route: "x", result: "pass", latency_ms: 1 });
    ok("a signed-in visitor cannot write the gate log (policy dropped in 002)", Boolean(gl.error));

    // 8. Export: the printable passbook page, the data file and the marker files (version B).
    const zipBlob = await A.exportLocker("running", "B");
    const zip = await JSZip.loadAsync(await zipBlob.arrayBuffer());
    const names = Object.keys(zip.files);
    ok("export has passbook.json and passbook.html", names.includes("passbook.json") && names.includes("passbook.html"), names.filter((n) => !n.startsWith("media/")).join(", "));
    const page = names.includes("passbook.html") ? await zip.file("passbook.html")!.async("string") : "";
    ok('the printable page says "Personal record. Not an official statement."', page.includes("Personal record. Not an official statement."));
    ok("export includes the marker voice file", names.some((n) => n.startsWith("media/") && !n.endsWith("/")), names.filter((n) => n.startsWith("media/")).join(", "));

    // 9. Delete everything (the app also calls /api/account/delete to remove the login itself; that route needs the
    // running app, so this script removes the login at the end instead).
    await A.deleteEverything();
    const left = await admin.from("sips").select("id").eq("user_id", uidA);
    const leftMem = await admin.from("memories").select("id").eq("user_id", uidA);
    const leftCons = await admin.from("consents").select("id").eq("user_id", uidA);
    const leftMk = await admin.from("life_markers").select("id").eq("user_id", uidA);
    ok("Delete everything removes every row", (left.data ?? []).length === 0 && (leftMem.data ?? []).length === 0 && (leftCons.data ?? []).length === 0 && (leftMk.data ?? []).length === 0);
    const top = await admin.storage.from("memories").list(uidA);
    let files = 0;
    for (const f of top.data ?? []) files += ((await admin.storage.from("memories").list(`${uidA}/${f.name}`)).data ?? []).length;
    ok("Delete everything removes every file", files === 0, `${files} left`);
  } catch (e: any) {
    ok("the check ran to the end", false, String(e?.message || e).slice(0, 200));
  } finally {
    for (const id of userIds) {
      const top = await admin.storage.from("memories").list(id);
      const paths: string[] = [];
      for (const f of top.data ?? []) {
        const sub = await admin.storage.from("memories").list(`${id}/${f.name}`);
        for (const s of sub.data ?? []) paths.push(`${id}/${f.name}/${s.name}`);
        paths.push(`${id}/${f.name}`);
      }
      if (paths.length) await admin.storage.from("memories").remove(paths);
      await admin.auth.admin.deleteUser(id);
    }
    console.log(`\n${pass} passed, ${fail} failed. The test accounts and their files were deleted.`);
    // R41: exitCode instead of process.exit(), which crashed Node on Windows ("UV_HANDLE_CLOSING") while requests closed.
    process.exitCode = fail ? 1 : 0;
  }
}

main();
