-- Migration: Create has_role function for RBAC
-- 20260209_create_has_role.sql

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role = _role
  );
END;
$$;js?key=AIzaSyAX0hUBgfK7FvWz6UTtaLzMGUEsKTcaKB4&libraries=places:1411  GET https://maps.googleapis.com/maps/api/mapsjs/gen_204?csp_test=true net::ERR_BLOCKED_BY_CLIENT
(anonymous) @ js?key=AIzaSyAX0hUBgfK7FvWz6UTtaLzMGUEsKTcaKB4&libraries=places:1411
xea @ js?key=AIzaSyAX0hUBgfK7FvWz6UTtaLzMGUEsKTcaKB4&libraries=places:1388
Aea @ js?key=AIzaSyAX0hUBgfK7FvWz6UTtaLzMGUEsKTcaKB4&libraries=places:1381
(anonymous) @ js?key=AIzaSyAX0hUBgfK7FvWz6UTtaLzMGUEsKTcaKB4&libraries=places:14
(anonymous) @ js?key=AIzaSyAX0hUBgfK7FvWz6UTtaLzMGUEsKTcaKB4&libraries=places:1684
(anonymous) @ js?key=AIzaSyAX0hUBgfK7FvWz6UTtaLzMGUEsKTcaKB4&libraries=places:1684
PendingScript
loadGoogleMaps @ App.tsx:69
(anonymous) @ App.tsx:72
commitHookEffectListMount @ chunk-TRNWTHID.js?v=1fad5edb:16915
commitPassiveMountOnFiber @ chunk-TRNWTHID.js?v=1fad5edb:18156
commitPassiveMountEffects_complete @ chunk-TRNWTHID.js?v=1fad5edb:18129
commitPassiveMountEffects_begin @ chunk-TRNWTHID.js?v=1fad5edb:18119
commitPassiveMountEffects @ chunk-TRNWTHID.js?v=1fad5edb:18109
flushPassiveEffectsImpl @ chunk-TRNWTHID.js?v=1fad5edb:19490
flushPassiveEffects @ chunk-TRNWTHID.js?v=1fad5edb:19447
performSyncWorkOnRoot @ chunk-TRNWTHID.js?v=1fad5edb:18868
flushSyncCallbacks @ chunk-TRNWTHID.js?v=1fad5edb:9119
commitRootImpl @ chunk-TRNWTHID.js?v=1fad5edb:19432
commitRoot @ chunk-TRNWTHID.js?v=1fad5edb:19277
finishConcurrentRender @ chunk-TRNWTHID.js?v=1fad5edb:18805
performConcurrentWorkOnRoot @ chunk-TRNWTHID.js?v=1fad5edb:18718
workLoop @ chunk-TRNWTHID.js?v=1fad5edb:197
flushWork @ chunk-TRNWTHID.js?v=1fad5edb:176
performWorkUntilDeadline @ chunk-TRNWTHID.js?v=1fad5edb:384
@supabase_supabase-js.js?v=1fad5edb:11111  GET https://zbztgavixjazldcuwdwq.supabase.co/rest/v1/leads?select=id%2Cclaimed_by%2Ccreated_by%2Ccategories%28name%29&status=eq.claimed&claimed_at=not.is.null&claimed_at=lt.2026-02-06T07%3A45%3A49.124Z&completed_at=is.null 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=1fad5edb:11111
(anonymous) @ @supabase_supabase-js.js?v=1fad5edb:11125
await in (anonymous)
then @ @supabase_supabase-js.js?v=1fad5edb:273
auto-rejection.ts:28 Error fetching expired leads: {code: '42703', details: null, hint: null, message: 'column leads.completed_at does not exist'}
checkExpiredLeads @ auto-rejection.ts:28
await in checkExpiredLeads
checkLeads @ App.tsx:37
(anonymous) @ App.tsx:43
commitHookEffectListMount @ chunk-TRNWTHID.js?v=1fad5edb:16915
commitPassiveMountOnFiber @ chunk-TRNWTHID.js?v=1fad5edb:18156
commitPassiveMountEffects_complete @ chunk-TRNWTHID.js?v=1fad5edb:18129
commitPassiveMountEffects_begin @ chunk-TRNWTHID.js?v=1fad5edb:18119
commitPassiveMountEffects @ chunk-TRNWTHID.js?v=1fad5edb:18109
flushPassiveEffectsImpl @ chunk-TRNWTHID.js?v=1fad5edb:19490
flushPassiveEffects @ chunk-TRNWTHID.js?v=1fad5edb:19447
performSyncWorkOnRoot @ chunk-TRNWTHID.js?v=1fad5edb:18868
flushSyncCallbacks @ chunk-TRNWTHID.js?v=1fad5edb:9119
commitRootImpl @ chunk-TRNWTHID.js?v=1fad5edb:19432
commitRoot @ chunk-TRNWTHID.js?v=1fad5edb:19277
finishConcurrentRender @ chunk-TRNWTHID.js?v=1fad5edb:18805
performConcurrentWorkOnRoot @ chunk-TRNWTHID.js?v=1fad5edb:18718
workLoop @ chunk-TRNWTHID.js?v=1fad5edb:197
flushWork @ chunk-TRNWTHID.js?v=1fad5edb:176
performWorkUntilDeadline @ chunk-TRNWTHID.js?v=1fad5edb:384
@supabase_supabase-js.js?v=1fad5edb:11111  GET https://zbztgavixjazldcuwdwq.supabase.co/rest/v1/app_settings?select=value&key=eq.whatsapp_auto_approve 404 (Not Found)
(anonymous) @ @supabase_supabase-js.js?v=1fad5edb:11111
(anonymous) @ @supabase_supabase-js.js?v=1fad5edb:11125
await in (anonymous)
then @ @supabase_supabase-js.js?v=1fad5edb:273
Admin.tsx:272 Error fetching auto-approve setting: {code: 'PGRST205', details: null, hint: "Perhaps you meant the table 'public.whatsapp_messages'", message: "Could not find the table 'public.app_settings' in the schema cache"}
fetchAutoApproveSetting @ Admin.tsx:272
await in fetchAutoApproveSetting
(anonymous) @ Admin.tsx:276
commitHookEffectListMount @ chunk-TRNWTHID.js?v=1fad5edb:16915
commitPassiveMountOnFiber @ chunk-TRNWTHID.js?v=1fad5edb:18156
commitPassiveMountEffects_complete @ chunk-TRNWTHID.js?v=1fad5edb:18129
commitPassiveMountEffects_begin @ chunk-TRNWTHID.js?v=1fad5edb:18119
commitPassiveMountEffects @ chunk-TRNWTHID.js?v=1fad5edb:18109
flushPassiveEffectsImpl @ chunk-TRNWTHID.js?v=1fad5edb:19490
flushPassiveEffects @ chunk-TRNWTHID.js?v=1fad5edb:19447
(anonymous) @ chunk-TRNWTHID.js?v=1fad5edb:19328
workLoop @ chunk-TRNWTHID.js?v=1fad5edb:197
flushWork @ chunk-TRNWTHID.js?v=1fad5edb:176
performWorkUntilDeadline @ chunk-TRNWTHID.js?v=1fad5edb:384
Admin.tsx:1318 Uncaught ReferenceError: Edit2 is not defined
    at Admin.tsx:1318:34
    at Array.map (<anonymous>)
    at Admin (Admin.tsx:1249:40)
    at renderWithHooks (chunk-TRNWTHID.js?v=1fad5edb:11548:26)
    at updateFunctionComponent (chunk-TRNWTHID.js?v=1fad5edb:14582:28)
    at beginWork (chunk-TRNWTHID.js?v=1fad5edb:15924:22)
    at HTMLUnknownElement.callCallback2 (chunk-TRNWTHID.js?v=1fad5edb:3674:22)
    at Object.invokeGuardedCallbackDev (chunk-TRNWTHID.js?v=1fad5edb:3699:24)
    at invokeGuardedCallback (chunk-TRNWTHID.js?v=1fad5edb:3733:39)
    at beginWork$1 (chunk-TRNWTHID.js?v=1fad5edb:19765:15)
(anonymous) @ Admin.tsx:1318
Admin @ Admin.tsx:1249
renderWithHooks @ chunk-TRNWTHID.js?v=1fad5edb:11548
updateFunctionComponent @ chunk-TRNWTHID.js?v=1fad5edb:14582
beginWork @ chunk-TRNWTHID.js?v=1fad5edb:15924
callCallback2 @ chunk-TRNWTHID.js?v=1fad5edb:3674
invokeGuardedCallbackDev @ chunk-TRNWTHID.js?v=1fad5edb:3699
invokeGuardedCallback @ chunk-TRNWTHID.js?v=1fad5edb:3733
beginWork$1 @ chunk-TRNWTHID.js?v=1fad5edb:19765
performUnitOfWork @ chunk-TRNWTHID.js?v=1fad5edb:19198
workLoopSync @ chunk-TRNWTHID.js?v=1fad5edb:19137
renderRootSync @ chunk-TRNWTHID.js?v=1fad5edb:19116
performConcurrentWorkOnRoot @ chunk-TRNWTHID.js?v=1fad5edb:18678
workLoop @ chunk-TRNWTHID.js?v=1fad5edb:197
flushWork @ chunk-TRNWTHID.js?v=1fad5edb:176
performWorkUntilDeadline @ chunk-TRNWTHID.js?v=1fad5edb:384
Admin.tsx:1318 Uncaught ReferenceError: Edit2 is not defined
    at Admin.tsx:1318:34
    at Array.map (<anonymous>)
    at Admin (Admin.tsx:1249:40)
    at renderWithHooks (chunk-TRNWTHID.js?v=1fad5edb:11548:26)
    at updateFunctionComponent (chunk-TRNWTHID.js?v=1fad5edb:14582:28)
    at beginWork (chunk-TRNWTHID.js?v=1fad5edb:15924:22)
    at HTMLUnknownElement.callCallback2 (chunk-TRNWTHID.js?v=1fad5edb:3674:22)
    at Object.invokeGuardedCallbackDev (chunk-TRNWTHID.js?v=1fad5edb:3699:24)
    at invokeGuardedCallback (chunk-TRNWTHID.js?v=1fad5edb:3733:39)
    at beginWork$1 (chunk-TRNWTHID.js?v=1fad5edb:19765:15)
(anonymous) @ Admin.tsx:1318
Admin @ Admin.tsx:1249
renderWithHooks @ chunk-TRNWTHID.js?v=1fad5edb:11548
updateFunctionComponent @ chunk-TRNWTHID.js?v=1fad5edb:14582
beginWork @ chunk-TRNWTHID.js?v=1fad5edb:15924
callCallback2 @ chunk-TRNWTHID.js?v=1fad5edb:3674
invokeGuardedCallbackDev @ chunk-TRNWTHID.js?v=1fad5edb:3699
invokeGuardedCallback @ chunk-TRNWTHID.js?v=1fad5edb:3733
beginWork$1 @ chunk-TRNWTHID.js?v=1fad5edb:19765
performUnitOfWork @ chunk-TRNWTHID.js?v=1fad5edb:19198
workLoopSync @ chunk-TRNWTHID.js?v=1fad5edb:19137
renderRootSync @ chunk-TRNWTHID.js?v=1fad5edb:19116
recoverFromConcurrentError @ chunk-TRNWTHID.js?v=1fad5edb:18736
performConcurrentWorkOnRoot @ chunk-TRNWTHID.js?v=1fad5edb:18684
workLoop @ chunk-TRNWTHID.js?v=1fad5edb:197
flushWork @ chunk-TRNWTHID.js?v=1fad5edb:176
performWorkUntilDeadline @ chunk-TRNWTHID.js?v=1fad5edb:384
chunk-TRNWTHID.js?v=1fad5edb:14032 The above error occurred in the <Admin> component:

    at Admin (http://localhost:8080/src/pages/Admin.tsx?t=1770622967534:43:22)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=1fad5edb:4131:5)
    at Outlet (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=1fad5edb:4537:26)
    at AdminRoute (http://localhost:8080/src/components/AdminRoute.tsx:29:44)
    at RenderedRoute (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=1fad5edb:4131:5)
    at Routes (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=1fad5edb:4601:5)
    at Router (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=1fad5edb:4544:15)
    at BrowserRouter (http://localhost:8080/node_modules/.vite/deps/react-router-dom.js?v=1fad5edb:5290:5)
    at AppContent (http://localhost:8080/src/App.tsx?t=1770622967534:54:5)
    at Provider (http://localhost:8080/node_modules/.vite/deps/chunk-BRIYNGNQ.js?v=1fad5edb:44:15)
    at TooltipProvider (http://localhost:8080/node_modules/.vite/deps/@radix-ui_react-tooltip.js?v=1fad5edb:155:5)
    at AuthProvider (http://localhost:8080/src/contexts/AuthContext.tsx:25:32)
    at LanguageProvider (http://localhost:8080/src/contexts/LanguageContext.tsx:409:36)
    at QueryClientProvider (http://localhost:8080/node_modules/.vite/deps/@tanstack_react-query.js?v=1fad5edb:3168:3)
    at App

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://reactjs.org/link/error-boundaries to learn more about error boundaries.
logCapturedError @ chunk-TRNWTHID.js?v=1fad5edb:14032
update.callback @ chunk-TRNWTHID.js?v=1fad5edb:14052
callCallback @ chunk-TRNWTHID.js?v=1fad5edb:11248
commitUpdateQueue @ chunk-TRNWTHID.js?v=1fad5edb:11265
commitLayoutEffectOnFiber @ chunk-TRNWTHID.js?v=1fad5edb:17093
commitLayoutMountEffects_complete @ chunk-TRNWTHID.js?v=1fad5edb:17980
commitLayoutEffects_begin @ chunk-TRNWTHID.js?v=1fad5edb:17969
commitLayoutEffects @ chunk-TRNWTHID.js?v=1fad5edb:17920
commitRootImpl @ chunk-TRNWTHID.js?v=1fad5edb:19353
commitRoot @ chunk-TRNWTHID.js?v=1fad5edb:19277
finishConcurrentRender @ chunk-TRNWTHID.js?v=1fad5edb:18760
performConcurrentWorkOnRoot @ chunk-TRNWTHID.js?v=1fad5edb:18718
workLoop @ chunk-TRNWTHID.js?v=1fad5edb:197
flushWork @ chunk-TRNWTHID.js?v=1fad5edb:176
performWorkUntilDeadline @ chunk-TRNWTHID.js?v=1fad5edb:384
chunk-TRNWTHID.js?v=1fad5edb:19413 Uncaught ReferenceError: Edit2 is not defined
    at Admin.tsx:1318:34
    at Array.map (<anonymous>)
    at Admin (Admin.tsx:1249:40)
    at renderWithHooks (chunk-TRNWTHID.js?v=1fad5edb:11548:26)
    at updateFunctionComponent (chunk-TRNWTHID.js?v=1fad5edb:14582:28)
    at beginWork (chunk-TRNWTHID.js?v=1fad5edb:15924:22)
    at beginWork$1 (chunk-TRNWTHID.js?v=1fad5edb:19753:22)
    at performUnitOfWork (chunk-TRNWTHID.js?v=1fad5edb:19198:20)
    at workLoopSync (chunk-TRNWTHID.js?v=1fad5edb:19137:13)
    at renderRootSync (chunk-TRNWTHID.js?v=1fad5edb:19116:15)
(anonymous) @ Admin.tsx:1318
Admin @ Admin.tsx:1249
renderWithHooks @ chunk-TRNWTHID.js?v=1fad5edb:11548
updateFunctionComponent @ chunk-TRNWTHID.js?v=1fad5edb:14582
beginWork @ chunk-TRNWTHID.js?v=1fad5edb:15924
beginWork$1 @ chunk-TRNWTHID.js?v=1fad5edb:19753
performUnitOfWork @ chunk-TRNWTHID.js?v=1fad5edb:19198
workLoopSync @ chunk-TRNWTHID.js?v=1fad5edb:19137
renderRootSync @ chunk-TRNWTHID.js?v=1fad5edb:19116
recoverFromConcurrentError @ chunk-TRNWTHID.js?v=1fad5edb:18736
performConcurrentWorkOnRoot @ chunk-TRNWTHID.js?v=1fad5edb:18684
workLoop @ chunk-TRNWTHID.js?v=1fad5edb:197
flushWork @ chunk-TRNWTHID.js?v=1fad5edb:176
performWorkUntilDeadline @ chunk-TRNWTHID.js?v=1fad5edb:384
Admin.tsx:348 WebSocket connection to 'wss://zbztgavixjazldcuwdwq.supabase.co/realtime/v1/websocket?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpienRnYXZpeGphemxkY3V3ZHdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNjYyNTcsImV4cCI6MjA4NTk0MjI1N30.5u5H2hlZnULI0Ph_1yno3PpYdIQ1ZPsAg4aPQzYmig0&vsn=2.0.0' failed: WebSocket is closed before the connection is established.
disconnect @ @supabase_supabase-js.js?v=1fad5edb:2988
removeChannel @ @supabase_supabase-js.js?v=1fad5edb:3009
await in removeChannel
removeChannel @ @supabase_supabase-js.js?v=1fad5edb:11307
(anonymous) @ Admin.tsx:348
safelyCallDestroy @ chunk-TRNWTHID.js?v=1fad5edb:16748
commitHookEffectListUnmount @ chunk-TRNWTHID.js?v=1fad5edb:16875
commitPassiveUnmountInsideDeletedTreeOnFiber @ chunk-TRNWTHID.js?v=1fad5edb:18283
commitPassiveUnmountEffectsInsideOfDeletedTree_begin @ chunk-TRNWTHID.js?v=1fad5edb:18245
commitPassiveUnmountEffects_begin @ chunk-TRNWTHID.js?v=1fad5edb:18181
commitPassiveUnmountEffects @ chunk-TRNWTHID.js?v=1fad5edb:18169
flushPassiveEffectsImpl @ chunk-TRNWTHID.js?v=1fad5edb:19489
flushPassiveEffects @ chunk-TRNWTHID.js?v=1fad5edb:19447
performSyncWorkOnRoot @ chunk-TRNWTHID.js?v=1fad5edb:18868
flushSyncCallbacks @ chunk-TRNWTHID.js?v=1fad5edb:9119
(anonymous) @ chunk-TRNWTHID.js?v=1fad5edb:18627
@supabase_supabase-js.js?v=1fad5edb:11111  GET https://zbztgavixjazldcuwdwq.supabase.co/rest/v1/leads?select=id%2Ccustomer_name%2Ccustomer_phone%2Clocation_address%2Cservice_type%2Cimport_confidence%2Craw_message%2Ccreated_at%2Cstatus%2Csource%2Clead_generator_name&source=in.%28whatsapp%2Cwhatsapp_group%2Cwhatsapp_forwarded%2Cmsg91%29&order=created_at.desc&limit=50 400 (Bad Request)
(anonymous) @ @supabase_supabase-js.js?v=1fad5edb:11111
(anonymous) @ @supabase_supabase-js.js?v=1fad5edb:11125
await in (anonymous)
then @ @supabase_supabase-js.js?v=1fad5edb:273
Admin.tsx:296 Error fetching WhatsApp leads: {code: '42703', details: null, hint: null, message: 'column leads.service_type does not exist'}