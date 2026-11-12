"""Builds js/catalog.js (wish pools and 5-star Memories).
Edit the lists below, then run: python3 tools/catalog.py
Banner line: start|end|name|type|love interests|rerun|approx  (approx = dates not confirmed)"""
import json
B = """2024-01-18|2024-01-27|Everlasting Dream|solo|X
2024-01-27|2024-02-04|Twilight Serenity|solo|R
2024-02-05|2024-02-19|Veiled Whispers|multi|X,Z,R
2024-02-21|2024-02-29|Before Dawn|solo|Z
2024-03-01|2024-03-08|Special Embrace|bday|R
2024-03-11|2024-03-23|Lingering Gaze|multi|X,Z,R
2024-04-03|2024-04-17|When Tides Echo|myth|R
2024-04-19|2024-04-29|Heating Up|solo|X
2024-04-30|2024-05-10|Double Kiss|solo|Z
2024-05-13|2024-05-27|Shimmering Moonlight|myth|X
2024-05-28|2024-06-07|Dawn's Embrace|solo|R
2024-06-07|2024-06-21|Trace Of Divinity|myth|Z
2024-06-25|2024-07-10|Entwined Shadows|multi|X,Z,R
2024-07-15|2024-08-01|Pulse Hunter|special|X,Z,R,S
2024-07-15|2024-08-01|No Defense Zone|solo|S
2024-08-07|2024-08-27|Misty Invasion|multi|X,Z,R,S
2024-08-31|2024-09-07|Destined Reunion|bday|Z
2024-09-10|2024-09-20|Into The Canvas|solo|R
2024-09-23|2024-10-09|Wander In Wonder|multi|X,Z,R,S
2024-10-11|2024-10-18|Galaxy Dance|bday|X
2024-10-20|2024-10-30|Radiant Brilliance|solo|S
2024-10-31|2024-11-10|Heartstring Notes|solo|Z
2024-11-12|2024-11-30|Yes, Cat Caretaker|multi|X,Z,R,S
2024-12-02|2024-12-16|Where Drakeshadows Fall|myth|S
2024-12-18|2024-12-28|Silvery Polyphony|solo|X
2024-12-31|2025-01-20|Nightly Rendezvous|multi|X,Z,R,S
2025-01-22|2025-02-08|Sky's Embrace|special|X,Z,R,S,C
2025-01-22|2025-02-08|Painful Signal|solo|C
2025-02-10|2025-02-27|Tomorrow's Catch-22|multi|X,Z,R,S,C
2025-03-01|2025-03-08|Boundless Seas|bday|R
2025-03-01|2025-03-08|Special Embrace|bday|R|rerun
2025-03-09|2025-03-18|Everlasting Wish|solo|Z
2025-03-20|2025-03-27|When Tides Echo|myth|R|rerun
2025-03-28|2025-04-11|Fallen Cosmos|myth|C
2025-04-13|2025-04-20|Where Hearts Live|bday|S
2025-04-21|2025-04-28|Shimmering Moonlight|myth|X|rerun
2025-04-30|2025-05-18|Spring and Flowers|multi|X,Z,R,S,C
2025-05-19|2025-05-26|Trace Of Divinity|myth|Z|rerun
2025-05-29|2025-06-07|Feverish Attempts|solo|X
2025-06-08|2025-06-15|No-Return Night|bday|C
2025-06-17|2025-07-01|Submerged Eclipse|myth|R
2025-07-03|2025-07-22|Witnessed By Deepspace|multi|X,Z,R,S,C
2025-07-25|2025-08-08|Fallen Crown|myth|X
2025-08-12|2025-08-31|You And Midsummer|multi|X,Z,R,S,C
2025-08-31|2025-09-07|Destined Reunion|bday|Z|rerun
2025-08-31|2025-09-07|Dawnbreak Promise|bday|Z
2025-09-09|2025-09-18|Passionate Appraisal|solo|S
2025-09-19|2025-09-27|Veiled Whispers|multi|X,Z,R|rerun
2025-09-25|2025-10-09|Edge Of Continuum|myth|Z
2025-10-11|2025-10-18|Between Stars|bday|X
2025-10-11|2025-10-18|Galaxy Dance|bday|X|rerun
2025-10-20|2025-10-27|Where Drakeshadows Fall|myth|S|rerun
2025-10-29|2025-11-18|Heartbeats Ablaze|multi|X,Z,R,S,C
2025-11-13|2025-11-20|Everlasting Dream|solo|X|rerun
2025-11-21|2025-11-30|Sweet Overdrive|solo|R
2025-12-02|2025-12-16|Where Silverwings Rest|myth|S
2025-12-11|2025-12-18|Twilight Serenity|solo|R|rerun
2025-12-18|2025-12-27|Indulgent Scheme|solo|C
2025-12-25|2025-12-31|Before Dawn|solo|Z|rerun
2025-12-31|2026-01-21|Throne of Eros|multi|X,Z,R,S,C
2026-01-12|2026-01-21|Heart Compass|special|X,Z,R,S,C
2026-01-23|2026-02-01|Secret's Kiss|solo|Z
2026-02-02|2026-02-09|Fallen Cosmos|myth|C|rerun
2026-02-10|2026-02-27|Mortality's Tenderness|multi|X,Z,R,S,C
2026-03-01|2026-03-08|Duskbright Steps|bday|R
2026-03-01|2026-03-08|Boundless Seas|bday|R|rerun
2026-03-09|2026-03-18|Tranquil Moments|solo|X
2026-03-19|2026-03-27|Lingering Gaze|multi|X,Z,R|rerun
2026-03-28|2026-04-11|Ghosts' Final March|myth|C
2026-04-06|2026-04-13|Heating Up|solo|X|rerun
2026-04-13|2026-04-20|Rainlit Night|bday|S
2026-04-13|2026-04-20|Where Hearts Live|bday|S|rerun
2026-04-21|2026-04-28|Submerged Eclipse|myth|R|rerun
2026-04-30|2026-05-15|Lingering Lust|multi|X,Z,R,S,C
2026-05-08|2026-05-15|Double Kiss|solo|Z|rerun
2026-05-15|2026-05-22|Fallen Crown|myth|X|rerun
2026-05-22|2026-05-31|Kitten Included|solo|S
2026-05-31|2026-06-08|Entwined Shadows|multi|X,Z,R|rerun
2026-06-08|2026-06-15|Your Skyblue|bday|C
2026-06-08|2026-06-15|No-Return Night|bday|C|rerun
2026-06-17|2026-07-02|Once Upon a Frame|multi|X,Z,R,S,C
2026-06-25|2026-07-02|Dawn's Embrace|solo|R|rerun
2026-07-02|2026-07-09|Edge Of Continuum|myth|Z|rerun
2026-07-09|2026-07-17|Wander In Wonder|multi|X,Z,R,S|rerun
2026-07-09|2026-07-24|Radiant Fantasia|special|X,Z,R,S,C
2026-08-05|2026-08-14|Summer Surge|solo|C
2026-08-17|2026-08-31|Po Zhen Zi|myth|R
2026-08-24|2026-08-31|No Defense Zone|solo|S|rerun|approx
2026-08-31|2026-09-07|When Embers Rise|bday|Z
2026-09-08|2026-09-15|Where Silverwings Rest|myth|S|rerun
2026-09-22|2026-10-10|A Night That Never Ends|multi|X,Z,R,S,C
2026-10-03|2026-10-10|Into The Canvas|solo|R|rerun
2026-10-10|2026-10-18|Lingering Light|bday|X
2026-10-19|2026-10-27|Misty Invasion|multi|X,Z,R,S|rerun
2026-10-28|2026-11-05|Nightly Overflow|solo|R|approx
2026-11-06|2026-11-24|Rebooting Dreams|multi|X,Z,R,S,C"""
LI={'X':'xavier','Z':'zayne','R':'rafayel','S':'sylus','C':'caleb'}
cards = {
'caleb': """Oneiric Protocol|Rebooting Dreams
Spoils of Night|A Night That Never Ends
Trajectory Astray|Voyage Anew
Summer Surge|Summer Surge
Up Close|Once Upon a Frame
Your Skyblue|Your Skyblue
Vinesurge Instinct|Lingering Lust
Nether Parting|Ghosts' Final March
Nether Yearning|Ghosts' Final March
Clearday Return|Mortality's Tenderness
Imperial Thronesong|Throne of Eros
Indulgent Scheme|Indulgent Scheme
Passionate Overload|Heartbeats Ablaze
Clearwind Glide|You And Midsummer
Yearly Nostalgia|Heartfelt Gift
Wayward Wonderland|Witnessed By Deepspace
No-Return Night|No-Return Night
Floating Floraletter|Spring and Flowers
Loneroad Together|Fallen Cosmos
Loneroad Unreturned|Fallen Cosmos
Tainted Cuts|Tomorrow's Catch-22
Exclusive Aftertaste|Xspace Echo
Endless Summer|Xspace Echo
Hidden Waves|Xspace Echo
Farspace Bloomfall|Xspace Echo
Farspace Deprivation|Xspace Echo
Painful Signal|Painful Signal""",
'xavier': """Program Fallacy|Rebooting Dreams
Lingering Light|Lingering Light
Bound by Starlight|A Night That Never Ends
Runaway Hearts|Once Upon a Frame
Sunken Glow|Lingering Lust
Tranquil Moments|Tranquil Moments
Blades with Blossoms|Mortality's Tenderness
Eulogy of Light|Throne of Eros
Precious Moment|Heartfelt Gift
Offbeat Track|Heartbeats Ablaze
Between Stars|Between Stars
Coolsplash Soak|You And Midsummer
Nightvow Requiem|Fallen Crown
Nightvow Mooncurse|Fallen Crown
Starfall Sanctuary|Witnessed By Deepspace
Feverish Attempts|Feverish Attempts
Inflorescence Imprints|Spring and Flowers
Deluded Fiction|Tomorrow's Catch-22
Misty Silhouette|Nightly Rendezvous
Silvery Polyphony|Silvery Polyphony
Outcast's Voyage|Campus Mystery
Floof Attack|Yes, Cat Caretaker
Celestial Message|Galaxy Dance
Floral Blessing|Wander In Wonder
No Restraint|Misty Invasion
21 Days|Entwined Shadows
Midnight Rainfall|Shimmering Moonlight
Midnight Whispers|Shimmering Moonlight
Faint Sensation|Heating Up
Unique Aftertaste|Heartfelt Gift
Romantic Afternoon|Lingering Gaze
Tender Night|Veiled Whispers
Heartstring Symphony|Everlasting Dream
Fragment Of Time|Xspace Echo
Precious Bonfire|Xspace Echo
Fluffy Trap|Xspace Echo
Lightseeking Shadowrend|Xspace Echo
Lightseeking Obsession|Xspace Echo""",
'zayne': """Shattered Simulacrum|Rebooting Dreams
Past Midnight|A Night That Never Ends
When Embers Rise|When Embers Rise
Framed Dusk|Heartfelt Gift
Dawn and Devotion|Once Upon a Frame
Silent Underflow|Lingering Lust
Entwined Kites|Mortality's Tenderness
Secret's Kiss|Secret's Kiss
Aeon's Canon|Throne of Eros
Chilling Crescendo|Heartbeats Ablaze
Diviner's Stillness|Edge Of Continuum
Diviner's Hymn|Edge Of Continuum
Dawnbreak Promise|Dawnbreak Promise
Runaway Waves|You And Midsummer
Iceborn Warmth|Witnessed By Deepspace
Fragrant Possession|Spring and Flowers
Everlasting Wish|Everlasting Wish
Immediate Disorder|Tomorrow's Catch-22
Absolute Zeal|Nightly Rendezvous
Engraved Affection|Heartfelt Gift
Fluffy Treatment|Yes, Cat Caretaker
Heartstring Notes|Heartstring Notes
Frozen Nightfall|Chansia Journey
Moonlit Dream|Wander In Wonder
Eternal Attachment|Destined Reunion
Hidden Motive|Misty Invasion
Snowy Serenity|Entwined Shadows
Snowfall Embrace|Trace Of Divinity
Snowfall Encounter|Trace Of Divinity
Exclusive Tutorial|Double Kiss
Heart Within Reach|Lingering Gaze
Medical Rescue|Before Dawn
Drunken Intimacy|Veiled Whispers
Business Trip|Xspace Echo
Gentle Twilight|Xspace Echo
Cozy Afternoon|Xspace Echo
Forever Sealed|Xspace Echo
Promise Everlasting|Xspace Echo""",
'rafayel': """Synced Drowning|Rebooting Dreams
Nightly Overflow|Nightly Overflow
Alluring Hues|A Night That Never Ends
Masked Radiance|Po Zhen Zi
Masked Dissolution|Po Zhen Zi
Sunset on Canvas|Once Upon a Frame
Rippling Blossoms|Lingering Lust
Rising Tides|Heartfelt Gift
Duskbright Steps|Duskbright Steps
Carved Gemheart|Mortality's Tenderness
Fires of Devotion|Throne of Eros
Sweet Overdrive|Sweet Overdrive
Ignited Echoes|Heartbeats Ablaze
Heatwave Torrent|You And Midsummer
Destined Dawntide|Witnessed By Deepspace
Mistsea Lament|Submerged Eclipse
Mistsea Descent|Submerged Eclipse
Wisteria Waltz|Spring and Flowers
Boundless Seas|Boundless Seas
Extreme Dose|Tomorrow's Catch-22
Intertidal Zone|Nightly Rendezvous
Tailwag Moment|Yes, Cat Caretaker
Seething Flames|Island Secrets
Gem Affection|Wander In Wonder
Into The Canvas|Into The Canvas
Omnipotent Perception|Misty Invasion
Sparkling Traces|Heartfelt Gift
Floral Promise|Entwined Shadows
Private Trip|Dawn's Embrace
Temple's Promise|When Tides Echo
Temple's Sunset|When Tides Echo
Whispers|Lingering Gaze
Unforgettable Adventure|Special Embrace
Tipsy Invitation|Veiled Whispers
Fireworks Vow|Twilight Serenity
Your Fragrance|Xspace Echo
Blossoms|Xspace Echo
Before Sunrise|Xspace Echo
Deep Sea Promise|Xspace Echo
Deep Sea Riches|Xspace Echo""",
'sylus': """Paradox Vector|Rebooting Dreams
Nightly Duet|A Night That Never Ends
Finale Undone|Once Upon a Frame
Kitten Included|Kitten Included
Darkbound Souls|Lingering Lust
Rainlit Night|Rainlit Night
Shared Lanterns|Mortality's Tenderness
Primordial Chaos|Throne of Eros
Crimson Rapture|Where Silverwings Rest
Crimson Departure|Where Silverwings Rest
Improvised Flow|Heartbeats Ablaze
Passionate Appraisal|Passionate Appraisal
Lovespeed Ride|You And Midsummer
Alternative Darkborne|Witnessed By Deepspace
Valleydream Bloom|Spring and Flowers
Where Hearts Live|Where Hearts Live
Magnum Opus|Heartfelt Gift
Innocent Birdcage|Tomorrow's Catch-22
Abyssal Mark|Where Drakeshadows Fall
Abyssal Blossom|Where Drakeshadows Fall
Goodcat Code|Yes, Cat Caretaker
Radiant Brilliance|Radiant Brilliance
Grassland Romance|Wander In Wonder
Lost Oasis|Misty Invasion
Night Of Secrecy|Nightly Rendezvous
Immobilized|Xspace Echo
Nightplumes|Xspace Echo
Within Reach|Xspace Echo
Captivating Lesson|Xspace Echo
Captivating Flavor|Xspace Echo
No Defense Zone|No Defense Zone"""}
banners=[]; names=set()
for line in B.split("\n"):
    p=line.split("|"); s,e,n,t,l=p[:5]; rr="rerun" in p[5:]; ap="approx" in p[5:]
    names.add(n)
    banners.append({"id":("r-" if rr else "")+n.lower().replace("'","").replace(",","").replace(" ","-")+"-"+s[:4],"name":n,"start":s,"end":e,"type":t,"rerun":rr,"lis":[LI[x] for x in l.split(",")],**({"approx":True} if ap else {})})
cat=[]
for li,txt in cards.items():
    for line in txt.split("\n"):
        n,src=line.split("|")
        kind="permanent" if src=="Xspace Echo" else ("pool" if src in names else "event")
        cat.append({"id":li[:2]+"-"+n.lower().replace("'","").replace(" ","-"),"li":li,"name":n,"src":src,"kind":kind})
# pairs: myth banners have 2 cards same li
out="/* Wishbound game data: wish pools and 5-star Memories.\n   Source: Love and Deepspace Wiki (loveanddeepspace.wiki.gg), checked Nov 2026.\n   To add a new banner, add a line to BANNERS; new Memories go in MEMORIES. */\n\"use strict\";\n"
out+="const BANNERS = "+json.dumps(banners,ensure_ascii=False,indent=0).replace("\n","")+";\n"
out+="const MEMORIES = "+json.dumps(cat,ensure_ascii=False,indent=0).replace("\n","")+";\n"
# make lines readable: one object per line
out=out.replace("}, {","},\n{").replace("[{","[\n{")
import os
open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "js", "catalog.js"), "w").write(out)
print(len(banners),"banners",len(cat),"memories", sum(1 for c in cat if c['kind']=='event'),"event")
print([c['src'] for c in cat if c['kind']=='event'])
