WPR MENU BOARD (Wentzville Pizza Ranch)
==========================
The TV's built-in browser opens ONE web address. The page reads schedule.json and shows the right
price slides, with a Pizza Ranch ad between every price slide (price, ad, price, ad...).
Hosted on GitHub Pages; the TV just opens the site address. Images/videos come from the old Displai My Library.

WHAT PLAYS WHEN (same order and times as the Wentzville Displai playlist; the first match wins)
  1. Holiday dates (list in schedule.json), 10:00-22:00  -> holiday prices
  2. Menu full-board image (30s, no ads): Sun-Thu 8:25-9:00 PM, Fri 8:25-11:00 PM, Sat 8:55-9:30 PM
  3. Dinner Mon-Wed 4:00-8:25 PM
  4. Lunch Mon-Fri 9:00 AM-4:00 PM
  5. Weekend Sat-Sun 9:00 AM-8:55 PM
  6. Weekend prices on Thu & Fri nights 4:00-8:55 PM
  7. Non-open times, daily 9:00-10:30 PM -> menu image plus ads
  Outside all of those: blank black screen ("outsideWindows": "blank"; or put a deck name there).
Times use the TV's own clock and time zone.

WHAT IS IN THE ROTATION NOW
  Price slides (10 s each): lunch, dinner, weekend, holiday = slides/<deck>-2024-12-23.jpg
  Menu (30 s): slides/menu-2025-02-13.jpg  (the menu and non-open decks)
  Ads: ONE shared list ("ads" in schedule.json) used by Lunch, Dinner, Weekend, Holiday and Non-Open
  (the Menu deck has no ads). One ad plays after every price slide, in list order, 10 s each
  (pictures), videos play to their end. The list order mixes FZ, food, deals and videos.
  An ad is skipped automatically when it is switched off or outside its dates (see below).

AD ON/OFF AND DATE WINDOWS (all optional, per ad line in the "ads" list)
  "enabled": false          parks the ad (stays in the list, never plays). Remove it or set true to turn on.
  "start": "11-27", "end": "12-25"
                            plays only from that month-day through that month-day, every year, by the
                            TV's own date. A window may wrap over New Year (e.g. "12-15" to "01-05").
                            Give both start and end, or neither.
  "seconds": 5              overrides the length for that ad (the Wristband ad uses 5).
  Example: { "file": "ads/christmas.jpg", "start": "11-27", "end": "12-25" }

SEASONAL / MANAGED ADS (currently in the list)
  Christmas                      11-27 to 12-25 (dated)
  Gift Cards Tis the Season      11-27 to 12-24 (dated)
  Father's Day 2                 06-01 to 06-21 (approximate window - Father's Day moves each year; adjust)
  July 4th                       06-25 to 07-04 (dated)
  Easter                         OFF ("enabled": false) - Easter moves every year; turn on by hand, then off
  Baseball (Always a Hit, Grand Slam Savings)  OFF - Cardinals season over; turn on in baseball season
  Football (Fan Favorite, Game Day)            ON  - check monthly
  Basketball For the Win         ON  - check monthly
  Volleyball Dig our Buffet      ON  - check monthly
  Parked (OFF, old/dated): Buffet Day Raydiant (unclear what it is for - Joel to confirm)
  Everything else in the list is on all year, including Locally Owned Wentzville, the Community
  Impact promo and video, the Buffet video, Wing Nite 1 and 2, FZ ads, Now Hiring and the gift card ad.

HOW TO UPDATE (plain language)
  Everything is edited in the GitHub repo (add/replace files, edit schedule.json, commit). GitHub
  Pages republishes in about a minute and the TV picks it up within about 5 minutes.
  Change a price slide: upload a new 1920x1080 .jpg/.png to slides/ (same file name replaces it, or
                        use a new name and change that deck's "file" in schedule.json; "seconds": 10).
  Add an ad:            upload the picture (.jpg/.png) or video (.mp4/.webm) to ads/ (lowercase,
                        hyphens, no spaces/symbols in the name), then add a line to the "ads" list in
                        schedule.json:   { "file": "ads/new-ad.jpg" },
                        Ads play in list order, one after each price slide.
  Remove an ad:         delete its line from the "ads" list, or set "enabled": false to park it.
  Ad length:            default "adSeconds": 10 for pictures. Videos with no "seconds" play to their end.
                        Give any ad its own time:  { "file": "ads/x.jpg", "seconds": 20 }
  Ads by deck:          every deck with "ads": true uses the shared list; "ads": false shows no ads (menu deck).
                        (A deck may also have its own "extraAds" list; none do now.)
  Add a holiday:        add a line to "holidays":
                        { "date": "2027-07-04", "name": "4th of July", "from": "10:00", "to": "22:00", "deck": "holiday" }
                        Holidays override every other rule.
  Change times/days:    edit the matching line in "rules" (24-hour times; days 1=Mon ... 7=Sun).
  Pattern:              "adEvery": 1 means price, ad, price, ad...
  Keep the commas and quotes exactly; one missing comma stops the file from loading and the board
  keeps using the last good copy until it is fixed.

TESTING THE SCHEDULE (no TV needed)
  Local:  python3 -m http.server 8080  in this folder, then http://localhost:8080/
  Fake the time: ?test=YYYY-MM-DDTHH:MM   e.g. ?test=2027-01-01T12:00    (add &speed=30 to run 30x faster)
  On the real site: https://jumpman64ds.github.io/wpr-menuboard/?test=2027-01-01T12:00&speed=30
  Add &debug=1 (test mode shows it automatically) for the green box with the simulated time and deck.

TV COMPATIBILITY
  Plain old-style JavaScript, no libraries; the picture scales to fill any screen size (pictures that
  are not 16:9 are fitted with black bars, never stretched).
  The offline cache (sw.js) is optional. The page remembers the last good schedule.json and reloads at ~4 AM.
  It must be served from a web address (http/https), not opened as a file.

FILE NAMES: library files were renamed to lowercase-with-hyphens (e.g. "Wing Nite 1.jpg" -> ads/wing-nite-1.jpg).
Pictures are JPEG (about q88 or the original).
