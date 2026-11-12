"""Clicks through every screen and pop-up and reports errors.
Serve the repo (python3 -m http.server 8765), then run: python3 tools/smoke_test.py [url] [chrome path]
Needs: pip install playwright"""
import json, traceback
from playwright.sync_api import sync_playwright
import sys
d=json.dumps({'v':3,'setupDone':True,'profile':{'currency':'MYR','lis':['caleb'],'trackStandard':False},'settings':{'theme':'light','autoIncome':False},'income':{'lastRun':'2026-01-01'},'entries':[{'id':'a','ts':1,'kind':'adjust','date':'2026-01-01','label':'Starting wishes','wishes':300}]})
URL=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8765/'
CHROME=sys.argv[2] if len(sys.argv)>2 else None
issues=[]
def note(m): issues.append(m); print("ISSUE:",m)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=CHROME) if CHROME else p.chromium.launch()
    ctx=b.new_context(viewport={"width":400,"height":850},device_scale_factor=1,accept_downloads=True)
    pg=ctx.new_page(); errs=[]
    pg.on("pageerror",lambda e:errs.append("pageerror: "+str(e)))
    pg.on("console",lambda m: errs.append("console "+m.type+": "+m.text) if m.type in("error","warning") else None)
    def step(name,fn):
        n=len(errs)
        try: fn()
        except Exception as e: note(f"{name}: {str(e).splitlines()[0][:200]}")
        for x in errs[n:]: note(f"{name}: {x[:200]}")
    W=lambda t=250: pg.wait_for_timeout(t)
    bal=lambda: pg.locator(".hbal .big").inner_text() if pg.locator(".hbal .big").count() else "?"
    # fresh start wizard
    pg.goto(URL); W(800)
    def wiz():
        assert pg.locator("#scrim").count()==1, "no welcome screen"
        txt=pg.locator(".sheet").inner_text(); print("WIZ:",txt[:200].replace("\n"," | "))
        for i in range(12):
            btn=pg.locator(".sheet [data-next], .sheet [data-ok], .sheet button.primary").last
            if pg.locator("#scrim").count()==0: break
            btn.click(); W(300)
        print("after wizard scrim:",pg.locator("#scrim").count(), "balance", bal())
    step("wizard",wiz)
    # load real data
    pg.evaluate("s=>{localStorage.setItem('wishbound-v2',s);localStorage.setItem('wishbound-meta',JSON.stringify({seen:'skip',tour:true}))}",d)
    pg.reload(); W(800); pg.evaluate("()=>{const m=JSON.parse(localStorage.getItem('wishbound-meta'));m.seen=CONFIG.version;localStorage.setItem('wishbound-meta',JSON.stringify(m))}"); pg.reload(); W(800)
    print("start balance",bal())
    for a in ["pull","gain","match"]:
        def f(a=a):
            pg.locator(f"[data-act={a}]").first.click(); W(); assert pg.locator("#scrim").count()==1,"no popup"
            pg.locator(".xclose").click(); W(); assert pg.locator("#scrim").count()==0,"X did not close"
        step("open "+a,f)
    # log wishes with a 5 star
    def logw():
        pg.locator("[data-act=pull]").first.click(); W()
        pg.select_option("#f_t","multi"); W()
        pg.fill("#f_p","30"); W()
        pg.get_by_text("+ 5★").click(); W()
        print("POPUP:",pg.locator(".sheet").inner_text()[:600].replace("\n"," | "))
        ats=pg.locator(".sheet input[type=number]")
        print("number inputs:",ats.count())
        pg.locator(".sheet [data-ok]").click(); W(500)
        print("after log balance",bal(), "scrim",pg.locator("#scrim").count())
        if pg.locator("#scrim").count(): print("STILL OPEN:",pg.locator(".sheet").inner_text()[:300]); pg.locator(".xclose").click()
    step("log wishes",logw)
    def undo():
        u=pg.locator(".toast button"); 
        if u.count(): u.first.click(); W(400); print("after undo",bal())
    step("undo",undo)
    def gain():
        pg.locator("[data-act=gain]").first.click(); W()
        print("GAIN:",pg.locator(".sheet").inner_text()[:400].replace("\n"," | "))
        inp=pg.locator(".sheet input[type=number]").first; inp.fill("5"); pg.locator(".sheet [data-ok]").click(); W(400); print("after gain",bal())
    step("gain",gain)
    def pity():
        pg.locator(".hstat[data-pity=limited]").click(); W()
        print("PITY:",pg.locator(".sheet").inner_text()[:300].replace("\n"," | "))
        pg.locator(".sheet input[type=number]").first.fill("23"); pg.locator(".sheet [data-ok]").click(); W(400)
        print("pity now", pg.locator(".hstat[data-pity=limited] .v").inner_text())
    step("pity",pity)
    # shop
    def shop():
        pg.locator("nav [data-go=shop]").click(); W()
        for v in ["passes","packs","budget","spend"]:
            pg.locator(f".seg [data-shop={v}]").click(); W()
        pg.locator(".seg [data-shop=packs]").click(); W()
        pg.locator("[data-pack]").first.click(); W()
        print("BUY:",pg.locator(".sheet").inner_text()[:500].replace("\n"," | "))
        b0=bal_hdr(); pg.locator(".sheet [data-ok]").click(); W(400); print("bought, header", b0,"->",bal_hdr())
    def bal_hdr():
        x=pg.locator("header .pill, header [data-go=home]"); return x.first.inner_text() if x.count() else "?"
    step("shop",shop)
    def plan():
        pg.locator(".seg [data-shop=budget]").click(); W()
        pg.locator("[data-act=newplan]").first.click(); W(); pg.fill("#f_name","Test plan"); pg.fill("#f_price","10"); pg.locator(".sheet [data-ok]").click(); W()
        pg.locator("[data-buyplan]").first.click(); W(); print("BUYPLAN:",pg.locator(".sheet").inner_text()[:300].replace("\n"," | ") if pg.locator("#scrim").count() else "no popup")
        if pg.locator("#scrim").count(): pg.locator(".sheet [data-ok]").click(); W()
    step("plan",plan)
    for v in ["banners","cards","history","settings"]:
        def f(v=v):
            sel=f"nav [data-go={v}]" if v!="settings" else "header [data-go=settings]"
            if pg.locator(sel).count()==0: sel=f"[data-go={v}]"
            pg.locator(sel).first.click(); W(400)
            pass
        step("tab "+v,f)
    def banners():
        pg.locator("nav [data-go=banners]").click(); W()
        pg.locator("[data-banner]").first.click(); W(); print("BANNER:",pg.locator(".sheet").inner_text()[:300].replace("\n"," | ")); pg.locator(".xclose").click(); W()
        pg.locator("details summary").first.click(); W()
        pg.locator("details [data-banner]").first.click(); W(); pg.locator(".xclose").click()
    step("banners",banners)
    def cards():
        pg.locator("nav [data-go=cards]").click(); W()
        h=pg.locator("[data-have]")
        print("memory tiles",h.count())
        if h.count(): h.first.click(); W(); pg.locator("[data-rankc]").first.click(); W()
    step("cards",cards)
    def hist():
        pg.locator("nav [data-go=history]").click(); W()
        pg.locator("input[type=search], .toolbar input").first.fill("Caleb"); W(400)
        print("history rows for Caleb", pg.locator("[data-edit]").count()); pg.locator("input[type=search], .toolbar input").first.fill(""); W(400)
        pg.locator("[data-edit]").first.click(); W(); print("EDIT:",pg.locator(".sheet h3").inner_text()); pg.locator(".xclose").click()
    step("history",hist)
    def settings():
        pg.locator("[data-go=settings]").first.click(); W()
        for a in ["lis","profile","income","estimate","budget","newbanner"]:
            l=pg.locator(f"[data-act={a}]")
            if l.count()==0: pg.locator("nav [data-go=banners]").click() if a=="newbanner" else None; W(); l=pg.locator(f"[data-act={a}]")
            l.first.click(); W(); 
            if pg.locator("#scrim").count()==0: note("settings "+a+": no popup")
            else: pg.locator(".xclose").click(); W()
            pg.locator("[data-go=settings]").first.click(); W()
        with pg.expect_download() as dl: pg.locator("[data-act=csv]").click()
        print("csv", dl.value.suggested_filename)
        with pg.expect_download() as dl: pg.locator("[data-act=backup]").click()
        print("backup", dl.value.suggested_filename)
    step("settings",settings)
    def theme():
        pg.locator("[data-act=theme]").first.click(); W(); print("theme", pg.evaluate("document.documentElement.dataset.theme"))
    step("theme",theme)
    print("\nTOTAL ISSUES:",len(issues))
    b.close()
